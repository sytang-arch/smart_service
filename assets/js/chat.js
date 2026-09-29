/* ==========================================================================
   AI 客服对话模块
   --------------------------------------------------------------------------
   通道 1：自建聊天 UI → 自建代理 → Dify Agent（API Key 只在代理里）
   通道 2：自建聊天 UI → Dify 官方 Web 接口直连（零后端，浏览器自己等结果）
   兜底  ：都不通时进入"规则兜底模式"，用前端规则回答常见问题，
           保证页面被分享出去后点开永远有反应（会明确标注当前模式）。
   自动选择顺序：自建代理 → 官方 Web 接口直连 → 规则兜底。

   ★ 状态变更类请求（取消 / 退款 / 换货 / 维修 / 催发货）不走上面任何一条，
     一律由前端规则引擎执行并落库 —— 见下面「状态变更类请求」一节。
     实测过：对话里只说一句"取消订单"，Agent 会自己挑一笔订单、回一句
     "您的订单已取消成功（售后单号 AS09280902-CANC）"，而页面数据纹丝不动。
     订单数据是 GitHub Pages 上的静态 JSON，Agent 写不回去。所以边界必须划清：
     改数据这件事由前端的状态机负责，大模型负责理解与问答。
   ========================================================================== */
(function () {
  "use strict";

  var cfg = window.CS_CONFIG || {};

  var el = {};
  var state = {
    mode: "unknown",            // "dify" | "offline"
    transport: "",              // "proxy"（自建代理）| "webapp"（Dify 官方 Web 接口直连）
    base: "",                   // 代理基地址（"" = 同源）
    conversationId: "",
    sending: false,
    customer: null,
    order: null,
    webapp: null,               // { api, code, sid, passport }
  };

  /** 代理基地址：配置了用配置的，没配就用同源（页面本身由代理托管时即为此情况） */
  function baseURL() {
    return (cfg.API_BASE || "").replace(/\/+$/, "");
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** 金额格式化（复用数据层的实现，保证前后端口径一致） */
  function money(n) {
    return window.CSStore ? window.CSStore.money(n) : Number(n).toFixed(2);
  }

  /** 剥掉模型泄露出来的思考段。
      回复节点若用了带思维链的模型，Dify 会把 <think>…</think>（内含
      <!--dify-deepseek-reasoning--> 标记）和正式回答一起塞进 answer，
      不剥掉的话用户看到的是模型的内心独白。 */
  function stripThink(text) {
    var t = String(text == null ? "" : text);
    t = t.replace(/<!--[\s\S]*?-->/g, "");
    t = t.replace(/<think(?:ing)?[^>]*>[\s\S]*?<\/think(?:ing)?\s*>/gi, "");
    t = t.replace(/<think(?:ing)?[^>]*>[\s\S]*$/gi, "");   // 流式过程中还没闭合的
    return t.replace(/^\s+/, "");
  }

  /** 极简 Markdown 渲染（先剥思考段、再转义，避免 XSS） */
  function md(text) {
    var t = esc(stripThink(text));
    t = t.replace(/```([\s\S]*?)```/g, function (_, code) { return "<pre><code>" + code.trim() + "</code></pre>"; });
    t = t.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    t = t.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    var lines = t.split("\n"), out = [], list = null;
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      var m = /^\s*[-*]\s+(.*)$/.exec(ln);
      var m2 = /^\s*\d+[.)]\s+(.*)$/.exec(ln);
      if (m || m2) {
        var tag = m ? "ul" : "ol";
        if (list && list !== tag) { out.push("</" + list + ">"); list = null; }
        if (!list) { out.push("<" + tag + ">"); list = tag; }
        out.push("<li>" + (m ? m[1] : m2[1]) + "</li>");
      } else {
        if (list) { out.push("</" + list + ">"); list = null; }
        if (ln.trim() === "") { out.push(""); }
        else { out.push("<p>" + ln + "</p>"); }
      }
    }
    if (list) out.push("</" + list + ">");
    return out.join("");
  }

  /* ---------------- 状态变更类请求：交给前端规则引擎 ----------------
     为什么不让 Agent 直接"办"这件事（实测结论）：
       Agent 的意图节点能把"取消订单"识别成 cancel_order，代码节点随即自己挑一笔
       订单判定成功，回复里连售后单号都编好了 —— 但订单数据是 GitHub Pages 上的
       静态 JSON，Agent 写不回去。于是访客看到的是「对话说已取消、左侧列表没变」，
       第一反应是"这 AI 在幻觉"。更糟的是它挑的那笔未必是用户想动的那笔。
     所以把边界划清楚：
       · 要改数据的请求（取消 / 退款 / 换货 / 维修 / 催发货）→ 前端规则引擎执行，
         与左侧按钮共用同一个 applyAction 状态机，成功就落库并重绘工作台、
         失败就明确失败；
       · 其余（查订单、查物流、政策、口语化问答）→ 交给 Agent，发挥大模型的理解力。
     实测过"退款多久能到账""耳机拆过了还能退吗"，意图节点判为 policy、不触发写
     操作，所以政策类问句一律放行给 Agent。
     ---------------------------------------------------------------------- */

  /** 动作词 → 状态机动作（口径与 store.js 的 applyAction、Dify 代码节点一致） */
  var ACTION_RULES = [
    [/取消/, "cancel_order"],
    [/退款|退货|退掉|退换|无理由/, "apply_refund"],
    [/换货|换新|换一台/, "apply_exchange"],
    [/维修|保修|质保|故障|坏了/, "apply_repair"],
    [/催发货|催单|催一下|尽快发|什么时候发/, "urge_shipping"],
  ];

  /** 在问"规则 / 时效 / 条件"，不是要办某笔订单 —— 这类交给 Agent 与知识库 */
  var POLICY_ASK = /多久|几天|到账|时效|周期|规则|条件|政策|流程|需要什么|是什么|怎么算|为什么|运费|谁出|规定|条款/;

  /** 疑问句式：要办但拿不准 → 本地只给判定结论，绝不动数据 */
  var ASK_FORM = /[?？]|吗[。！!]?$|呢[。！!]?$|吧[。！!]?$|可以吗|能不能|行不行/;

  /** 明确的祈使句 */
  var IMPERATIVE = /帮我|给我|我要|请|麻烦|直接|现在就|立刻|马上/;

  /** 操作类回复的标注前缀（与"规则兜底"区分开，避免误以为没连上 Agent） */
  var ACT_META = "对话内操作 · 前端规则引擎";

  /** 这句话里的动作意图（没有则 null） */
  function actionIntent(text) {
    var t = String(text == null ? "" : text);
    for (var i = 0; i < ACTION_RULES.length; i++) {
      if (ACTION_RULES[i][0].test(t)) return ACTION_RULES[i][1];
    }
    return null;
  }

  /**
   * 要不要由前端规则引擎处理（而不是交给 Agent）？
   *   点名了订单号        → 一定本地处理（问句形态也只给结论，不执行）
   *   问的是规则/时效     → 交给 Agent（实测意图节点归为 policy，不会写数据）
   *   其余带动作词的话    → 本地处理：有选中订单就办它，没有就列出候选让用户点单
   */
  function isLocalAction(text) {
    if (!actionIntent(text)) return false;
    if (extractOrderId(text)) return true;
    if (POLICY_ASK.test(text)) return false;
    return true;
  }

  /** 「订单不存在」与「订单不属于你」必须回同一句话 —— 只要措辞不同，
      对方就能用返回文案反推出"这个单号在系统里是存在的"。
      与 Dify 代码节点的 _scope_fail() 逐字一致。 */
  function scopeFail(oid) {
    return "您的账户下没有找到订单 **" + oid + "**。请核对订单号，或者告诉我您要处理哪一笔，我把您的订单列给您。\n\n"
      + "> 为了保护账户隐私，我不会查询或操作他人订单。";
  }

  /** 把探测到的通道状态写回界面 */
  function applyModeHint() {
    if (state.mode === "dify" && state.transport === "webapp") {
      setStatus("Dify Agent 已连接（浏览器直连官方 Web 接口）", "ok");
    } else if (state.mode === "dify") {
      setStatus("Dify Agent 已连接" + (state.appName ? " · " + state.appName : ""), "ok");
    } else if (state.difyConfigured === true) {
      setStatus("代理已连，但 Dify Key 未配置", "warn");
    } else {
      setStatus("规则兜底模式 · 回答由前端规则生成", "warn");
    }
  }

  /* ---------------- DOM ---------------- */
  function addMsg(role, text, meta) {
    var wrap = document.createElement("div");
    wrap.className = "msg msg-" + (role === "user" ? "user" : "ai");
    var av = document.createElement("div");
    av.className = "msg-avatar";
    av.textContent = role === "user" ? "我" : "AI";
    var bub = document.createElement("div");
    bub.className = "msg-bubble";
    bub.innerHTML = md(text) + (meta ? '<div class="msg-meta">' + esc(meta) + "</div>" : "");
    wrap.appendChild(av);
    wrap.appendChild(bub);
    el.body.appendChild(wrap);
    el.body.scrollTop = el.body.scrollHeight;
    return bub;
  }

  function addTyping() {
    var wrap = document.createElement("div");
    wrap.className = "msg msg-ai";
    wrap.id = "typing";
    wrap.innerHTML = '<div class="msg-avatar">AI</div><div class="msg-bubble typing"><span></span><span></span><span></span></div>';
    el.body.appendChild(wrap);
    el.body.scrollTop = el.body.scrollHeight;
    return wrap;
  }

  function removeTyping() {
    var t = document.getElementById("typing");
    if (t && t.parentNode) t.parentNode.removeChild(t);
  }

  function setStatus(txt, level) {
    el.status.textContent = txt;
    el.status.style.color = level === "ok" ? "var(--ok)" : level === "warn" ? "var(--warn)" : "var(--text-3)";
  }

  /* ---------------- 身份 ---------------- */
  function setIdentity(customer, order) {
    state.customer = customer;
    state.order = order || null;
    if (!el.ctx) return;
    el.ctx.innerHTML =
      '<span class="pill pill-ok">身份已注入</span>' +
      "<span>customer_id = <code>" + esc(customer.customer_id) + "</code></span>" +
      "<span>· " + esc(customer.name) + " / " + esc(customer.level) + "</span>" +
      (state.order ? '<span>· 当前订单 <code>' + esc(state.order.order_id) + "</code></span>" : "");
  }

  /* ---------------- 发送 ---------------- */
  function send(text) {
    if (state.sending || !text.trim()) return;
    state.sending = true;
    el.send.disabled = true;
    var q = text.trim();
    addMsg("user", q);
    el.text.value = "";
    el.text.style.height = "auto";

    var typing = addTyping();

    /* 路由：要改数据的请求一律走本地状态机，其余按探测结果交给 Agent / 规则兜底。
       ACT_META 让回复里能一眼看出"这次到底动没动数据"。
       要动数据但没点名单号时，用工作台里正选中的那笔 —— 与 Agent 的
       current_order_id 语义一致，也避免"明明选中了还得把单号再抄一遍"。 */
    var localAct = isLocalAction(q) ? actionIntent(q) : null;
    var localQ = q;
    if (localAct && !extractOrderId(q) && state.order) {
      localQ = q + " " + state.order.order_id;
    }
    var route;
    if (localAct) {
      route = function (t) { return callOffline(t, ACT_META); };
    } else if (state.mode !== "dify") {
      route = callOffline;
    } else {
      route = state.transport === "webapp" ? callWebApp : callDify;
    }

    route(localQ)
      .then(function (r) {
        removeTyping();
        /* 流式通道已经在气泡里逐字渲染完了，resolve 出来的是 null，不能再 addMsg 一次 */
        if (!r) return;
        var meta = r.meta;
        /* 操作类回复：统一标注数据到底动没动，不让"已执行/未执行"含糊过去 */
        if (localAct && meta && !/已执行|已拦截|未执行/.test(meta)) {
          meta += " · 未执行";
        }
        addMsg("ai", r.answer, meta);
      })
      .catch(function (err) {
        removeTyping();
        addMsg("ai", "抱歉，对话服务暂时不可用：" + err.message + "\n\n可以稍后重试；若持续失败，检查 `assets/js/config.js` 里的 `DIFY_WEBAPP_URL` / `API_BASE` 是否填对。", "错误");
      })
      .then(function () {
        state.sending = false;
        el.send.disabled = false;
        /* 窄屏上自动聚焦会立刻弹出软键盘、挡住刚返回的回复，交给用户自己点 */
        var narrow = window.matchMedia && window.matchMedia("(max-width: 900px)").matches;
        if (!narrow) el.text.focus();
      });
  }

  /* ---------------- Dify 官方 Web 接口（浏览器直连，零后端） ----------------
     依据 Dify 官方给「嵌入式 Web 应用」提供的 Web API（api/openapi/markdown/
     web-openapi.md，以及官方 WebApp 前端自身的实现），流程就两步：
       1) GET  {origin}/api/passport?user_id=<会话ID>    头：X-App-Code
          → 换一枚匿名 access_token（share code 本身是公开的）
       2) POST {origin}/api/chat-messages
          头：X-App-Code + X-App-Passport（就是刚换到的 token）
          → 事件格式与 Service API 完全一致（SSE / blocking），同样支持 inputs
     用它当线上主通道的理由：等结果这件事由浏览器自己承担，不经过任何后端，
     所以不受云函数超时（腾讯云免费版固定 3 秒）之类的限制。
     ---------------------------------------------------------------------- */
  function webappConfig() {
    var url = String(cfg.DIFY_WEBAPP_URL || "").trim();
    if (!url) return null;
    var m = /^(https?:\/\/[^/]+)\/(?:chat|chatbot)\/([^/?#]+)/i.exec(url);
    if (!m) return null;
    return { api: m[1] + "/api", code: m[2] };
  }

  /** 匿名会话 ID：换票据时要用，同一浏览器保持一致才能延续同一段会话 */
  function webAppSessionId() {
    var k = "cs-webapp-sid", v = "";
    try { v = localStorage.getItem(k) || ""; } catch (e) { v = ""; }
    if (!v) {
      v = "web-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
      try { localStorage.setItem(k, v); } catch (e) { /* 隐私模式：退化成每次新建，功能不受影响 */ }
    }
    return v;
  }

  /** 换票据（缓存复用；force=true 用于票据失效后重换） */
  function ensurePassport(force) {
    var wa = state.webapp;
    if (!wa) return Promise.reject(new Error("未配置 DIFY_WEBAPP_URL"));
    if (wa.passport && !force) return Promise.resolve(wa.passport);
    return fetch(wa.api + "/passport?user_id=" + encodeURIComponent(wa.sid), {
      headers: { "X-App-Code": wa.code },
      cache: "no-store",
    }).then(function (r) {
      if (!r.ok) throw new Error("换票据失败 HTTP " + r.status);
      return r.json();
    }).then(function (j) {
      if (!j || !j.access_token) throw new Error("票据响应里没有 access_token");
      wa.passport = j.access_token;
      return wa.passport;
    });
  }

  /* ---------------- 通道 A：自建代理 ---------------- */
  function callDify(query) {
    var payload = {
      query: query,
      customer_id: state.customer ? state.customer.customer_id : "",
      customer_name: state.customer ? state.customer.name : "",
      order_id: state.order ? state.order.order_id : "",
      conversation_id: state.conversationId,
      stream: true,
    };

    return fetch(state.base + "/api/dify/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (t) { throw new Error("代理返回 HTTP " + resp.status + " " + t.slice(0, 160)); });
      }
      var ct = resp.headers.get("content-type") || "";
      if (ct.indexOf("text/event-stream") === -1 || !resp.body) {
        return resp.json().then(function (j) {
          if (j.conversation_id) state.conversationId = j.conversation_id;
          return { answer: j.answer || "(空回复)", meta: "Dify Agent（代理）" };
        });
      }
      return streamSSE(resp, "Dify Agent（代理）");
    });
  }

  /* ---------------- 通道 A2：Dify 官方 Web 接口直连 ---------------- */
  function callWebApp(query) {
    var wa = state.webapp;
    var payload = {
      inputs: {
        customer_id: state.customer ? state.customer.customer_id : "",
        customer_name: state.customer ? state.customer.name : "",
        order_id: state.order ? state.order.order_id : "",
      },
      query: query,
      response_mode: "streaming",
      conversation_id: state.conversationId || "",
      user: wa.sid,
    };

    function attempt(force) {
      return ensurePassport(force).then(function (tok) {
        return fetch(wa.api + "/chat-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-App-Code": wa.code,
            "X-App-Passport": tok,
          },
          body: JSON.stringify(payload),
        });
      });
    }

    return attempt(false)
      .then(function (resp) {
        if (resp.status === 401) {
          /* 票据可能过期：清掉缓存重换一次再试 */
          wa.passport = "";
          return attempt(true);
        }
        return resp;
      })
      .then(function (resp) {
        if (!resp.ok) {
          return resp.text().then(function (t) {
            throw new Error("Dify Web 接口返回 HTTP " + resp.status + " " + String(t).slice(0, 160));
          });
        }
        var ct = resp.headers.get("content-type") || "";
        if (ct.indexOf("text/event-stream") === -1 || !resp.body) {
          return resp.json().then(function (j) {
            if (j.conversation_id) state.conversationId = j.conversation_id;
            return { answer: j.answer || "(空回复)", meta: "Dify Agent · 官方 Web 接口" };
          });
        }
        return streamSSE(resp, "Dify Agent · 官方 Web 接口");
      });
  }

  /** 把 Dify 返回的 SSE 流逐字渲染进气泡（代理通道与直连通道共用同一份解析） */
  function streamSSE(resp, meta) {
    var bub = addMsg("ai", "");
    var reader = resp.body.getReader();
    var dec = new TextDecoder("utf-8");
    var buf = "", acc = "", cid = "";

    function paint() {
      bub.innerHTML = md(acc) + '<div class="msg-meta">' + esc(meta) + "</div>";
      el.body.scrollTop = el.body.scrollHeight;
    }

    return new Promise(function (resolve, reject) {
      function pump() {
        reader.read().then(function (r) {
          if (r.done) {
            removeTyping();
            if (acc) paint();
            resolve(null);
            return;
          }
          buf += dec.decode(r.value, { stream: true });
          var parts = buf.split("\n\n");
          buf = parts.pop();
          parts.forEach(function (block) {
            block.split("\n").forEach(function (line) {
              if (line.indexOf("data:") !== 0) return;
              var raw = line.slice(5).trim();
              if (!raw || raw === "[DONE]") return;
              var ev;
              try { ev = JSON.parse(raw); } catch (e) { return; }
              if (ev.conversation_id) cid = ev.conversation_id;
              if (ev.event === "message" || ev.event === "agent_message") {
                acc += ev.answer || "";
                removeTyping();
                paint();
              } else if (ev.event === "error") {
                acc += "\n\n[Agent 报错：" + (ev.message || ev.code) + "]";
                paint();
              }
            });
          });
          pump();
        }).catch(reject);
      }
      pump();
    }).then(function () { if (cid) state.conversationId = cid; return null; });
  }

  /* ---------------- 通道 B：规则兜底 ----------------
     metaPrefix 允许调用方改写回复的标注：状态变更类请求走同一条规则链路，
     但标注要说清"这是对话内执行的操作"，而不是"没连上 Dify"。 */
  function callOffline(query, metaPrefix) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(offlineAnswer(query, metaPrefix));
      }, 380);
    });
  }

  function offlineAnswer(q, metaPrefix) {
    var S = window.CSStore;
    var me = state.customer;
    var ql = q.toLowerCase();
    var meta = metaPrefix || "规则兜底模式 · 未连接 Dify Agent";

    // 0) 身份越权检查（最重要的一条）
    var oid = extractOrderId(q);
    if (oid) {
      var o = S.getOrder(oid);
      // 「订单不存在」与「订单不属于当前账户」回同一句话：措辞一旦不同，对方就能
      // 用返回文案反推出"这个单号在系统里是存在的"。口径与 Dify 侧 _scope_fail 一致。
      if (!o || o.customer_id !== me.customer_id) {
        return { answer: scopeFail(oid), meta: meta + " · 未执行" };
      }
      // 想对这笔订单做什么（宽口径，"还能退吗"这类问法也算）
      var want = /取消/.test(q) ? "cancel_order"
        : /退款|退货|退掉|退换|能退|退吗|不想要|无理由/.test(q) ? "apply_refund"
        : /换货|换新/.test(q) ? "apply_exchange"
        : /维修|保修|坏了|故障/.test(q) ? "apply_repair"
        : /物流|快递|到哪|几天到|发货/.test(q) ? "track_logistics"
        : "";
      // 问句形态（"这笔还能退吗？"）：只回答能不能，绝不动数据
      if (want && want !== "track_logistics" && ASK_FORM.test(q) && !IMPERATIVE.test(q)) {
        return assess(o, want, meta);
      }
      if (want) return act(o, want, meta);
      return { answer: detailText(o), meta: meta };
    }

    // 1) 物流 / 到哪了
    if (/物流|快递|到哪|到货|几天到|运输|包裹|什么时候到/.test(q)) {
      var rank = { in_transit: 0, shipped: 1, paid: 2, pending_payment: 3 };
      var moving = S.ordersOf(me.customer_id)
        .filter(function (x) { return rank[x.status] !== undefined; })
        .sort(function (a, b) { return rank[a.status] - rank[b.status]; });
      if (!moving.length) {
        var last = S.ordersOf(me.customer_id)[0];
        return { answer: "您当前没有在途或待发货订单。最近一笔是 **" + last.items[0].name + "**（`" + last.order_id + "`，" + last.status_label + "）。", meta: meta };
      }
      var o2 = moving[0];
      var a2 = moving.length > 1
        ? "\n\n您名下还有 " + (moving.length - 1) + " 笔订单处于在途/待发货状态，需要一起看吗？"
        : "";
      var stale = /物流停滞|停滞/.test(o2.internal_note || "")
        ? "\n\n⚠️ 这笔订单物流已超过 72 小时无更新，属于异常件。我可以帮您发起物流核查或申请全额退款。"
        : "";
      return {
        answer: "为您查到 **" + o2.items[0].name + "**（订单 `" + o2.order_id + "`）当前状态：**" + o2.status_label + "**\n\n" +
                (o2.tracking_no
                  ? ("承运商：" + o2.carrier + "，运单号 `" + o2.tracking_no + "`\n最新物流：" + S.lastLogistics(o2) + (o2.estimated_delivery ? "\n预计送达：" + o2.estimated_delivery : ""))
                  : "该订单尚未发货，仓库正在处理。") + stale + a2,
        meta: meta,
      };
    }

    // 2) 退款 / 退货（"还能退吗"这类不含"退款"二字的问题也要命中）
    if (/退款|退货|退掉|还能退|不想要|无理由|退换/.test(q)) {
      // 先答"政策类"问题，避免用订单信息冲淡规则回答
      if (/多久|几天|到账|时效|周期/.test(q)) {
        return { answer: policyLine("退款时效") + "\n\n" + policyLine("取消订单规则"), meta: meta + " · 知识库" };
      }
      var cands = S.ordersOf(me.customer_id).filter(function (x) { return x.refund_eligible; });
      if (/拆|拆过|开封|用过|激活|用过/.test(q)) {
        return {
          answer:
            "拆封本身不影响 7 天无理由退货，**前提是商品不影响二次销售**：外观无划痕、配件与包装齐全（含赠品与说明书）。已激活的软件授权、定制商品、已拆封的卫生类商品不适用。\n\n" +
            policyLine("7 天无理由退货") + "\n\n" +
            (cands.length
              ? ("您当前有 " + cands.length + " 笔订单仍在退货期内：" + cands.map(function (c) {
                  return "`" + c.order_id + "`（" + c.items[0].name + "，" + c.refund_note + "）";
                }).join("；") + "。需要我帮您提交退货吗？")
              : "您当前没有处于 7 天无理由退货期内的订单；如果是质量问题，15 天内可换货，1 年内可走质保维修。"),
          meta: meta,
        };
      }
      if (!cands.length) {
        var closed = S.ordersOf(me.customer_id).filter(function (x) { return x.status === "completed" || x.status === "delivered"; });
        return {
          answer: "您名下订单目前都不在 7 天无理由退货期内。\n\n" +
            (closed.length
              ? ("最近一笔已签收订单 `" + closed[0].order_id + "`：" + closed[0].refund_note + "。若是质量问题，可走 15 天换货或 1 年质保维修，需要我帮您申请吗？")
              : ""),
          meta: meta,
        };
      }
      var c0 = cands[0];
      return {
        answer: "可以退。**" + c0.items[0].name + "**（订单 `" + c0.order_id + "`）" + c0.refund_note + "，退款金额 **" + money(c0.amount) + " 元**。\n\n" +
                policyLine("退款时效") + "\n\n需要我现在帮您提交退款申请吗？回复「申请退款 `" + c0.order_id + "`」即可。",
        meta: meta,
      };
    }

    // 3) 取消订单
    if (/取消/.test(q)) {
      var cc = S.ordersOf(me.customer_id).filter(function (x) { return x.available_actions.indexOf("cancel_order") > -1; });
      if (!cc.length) return { answer: "您当前没有可取消的订单（已发货订单无法取消，可在签收后 7 天内退货）。", meta: meta };
      return {
        answer: "您有 " + cc.length + " 笔订单可以取消：\n" + cc.map(function (c) { return "- `" + c.order_id + "` " + c.items[0].name + " · " + c.status_label + " · " + money(c.amount) + " 元"; }).join("\n") + "\n\n回复「取消 `" + cc[0].order_id + "`」我来帮您处理。",
        meta: meta,
      };
    }

    // 4) 催发货
    if (/催|尽快|什么时候发|发货/.test(q)) {
      var p = S.ordersOf(me.customer_id).filter(function (x) { return x.status === "paid"; });
      if (!p.length) return { answer: "您当前没有待发货订单需要催单。", meta: meta };
      return act(p[0], "urge_shipping", meta);
    }

    // 5) 订单列表
    if (/订单|买了|我买|下单记录/.test(q)) {
      var mine = S.ordersOf(me.customer_id);
      return {
        answer: "**" + me.name + "**（`" + me.customer_id + "`）名下共 " + mine.length + " 笔订单：\n" +
          mine.map(function (m) { return "- `" + m.order_id + "` " + m.items[0].name + " × " + m.items[0].qty + " · **" + m.status_label + "** · " + money(m.amount) + " 元 · " + m.created_at.slice(0, 10); }).join("\n"),
        meta: meta,
      };
    }

    // 6) 政策类
    var pol = matchPolicy(q);
    if (pol) return { answer: "**" + pol.title + "**\n\n" + pol.content, meta: meta + " · 知识库" };
    if (/会员|等级|权益|折扣/.test(q)) {
      var ben = S.kb.member_benefits[me.level];
      return { answer: "您是 **" + me.level + "**：\n- 折扣：" + ben.discount + "\n- 发货：" + ben.ship + "\n- 服务：" + ben.service, meta: meta + " · 知识库" };
    }
    if (/发票/.test(q)) return { answer: policyLine("发票与售后凭证"), meta: meta + " · 知识库" };
    if (/客服|人工|电话|热线/.test(q)) return { answer: "在线客服服务时间：" + S.kb.service_hours + "\n客服热线：" + S.kb.hotline + "（7×24）\n\n需要我帮您登记回电吗？", meta: meta };
    if (/你好|您好|hi|hello|在吗/.test(ql)) {
      return { answer: "您好，我是" + (cfg.ASSISTANT_NAME || "在线客服") + "。当前身份：**" + me.name + "**（" + me.level + "）。\n\n我可以帮您：查订单、看物流、取消订单、申请退款/换货、核对售后进度。请直接描述问题～", meta: meta };
    }

    // 兜底话术里的示例订单号必须取自当前身份的真实订单 ——
    // 数据是按天生成的，写死一个订单号过几天就成了不存在的单号。
    var cancelable = S.ordersOf(me.customer_id).filter(function (x) {
      return x.available_actions.indexOf("cancel_order") > -1;
    });
    return {
      answer: "我没太理解您的意思。可以试试这样问：\n- 「我的订单到哪了？」\n- 「"
        + (cancelable.length ? "帮我取消 " + cancelable[0].order_id : "我最近买了什么") + "」\n"
        + "- 「耳机拆过了还能退吗？」\n- 「退款多久到账？」\n\n"
        + "（当前处于规则兜底模式，回答由前端规则生成；连接 Dify Agent 后由大模型处理开放式问题。）",
      meta: meta,
    };
  }

  var ACT_LABEL = {
    cancel_order: "取消订单", apply_refund: "申请退款",
    apply_exchange: "申请换货", apply_repair: "申请维修", urge_shipping: "催发货",
  };
  var ACT_SUGGEST = {
    cancel_order: "已发货订单无法取消。您可以在签收后 7 天内申请无理由退货，或在派送时选择拒收。",
    apply_refund: "已超出 7 天无理由退货期。如果是质量问题，15 天内可申请换货，1 年内可走质保维修。",
    apply_exchange: "当前状态不支持换货。如果是运输破损请先申请退款；如已超 15 天可走 1 年质保维修。",
    apply_repair: "该订单不在可维修状态，或已超出 1 年质保期。可联系人工客服进一步核实。",
  };

  /** 只回答"这笔能不能办"，绝不落库 —— 用于"还能退吗"这类问句形态 */
  function assess(o, action, meta) {
    var can = o.available_actions.indexOf(action) > -1;
    var label = ACT_LABEL[action] || action;
    return {
      answer: "订单 `" + o.order_id + "`（" + o.items[0].name + "）当前状态 **" + o.status_label + "**。\n\n"
        + (can ? "这一笔可以「" + label + "」。" : "这一笔不能「" + label + "」。" + (ACT_SUGGEST[action] || ""))
        + (o.refund_note ? "\n\n> " + o.refund_note : "")
        + (can ? "\n\n需要我帮您提交吗？回复「" + label + " `" + o.order_id + "`」我就办。" : ""),
      meta: meta + " · 未执行",
    };
  }

  function act(o, action, meta) {
    var r = window.CSStore.applyAction(o.order_id, action);
    /* 状态真的变了就立刻重绘工作台 —— «对话里说改了，左侧列表马上变» 的关键一环。
       少了这一步就会出现"AI 满口答应、列表纹丝不动"的不一致。 */
    if (r.ok && window.CSApp && window.CSApp.refresh) window.CSApp.refresh();
    var extra = "";
    if (r.ok && (action === "track_logistics")) {
      extra = "\n\n" + window.CSStore.lastLogistics(o);
      if (o.estimated_delivery) extra += "\n预计送达：" + o.estimated_delivery;
    }
    if (r.ok && action === "cancel_order") extra = "\n\n" + policyLine("退款时效");
    if (!r.ok) extra = "";
    return { answer: r.message + extra, meta: meta + (r.ok ? " · 已执行" : " · 已拦截") };
  }

  function detailText(o) {
    return "**订单 `" + o.order_id + "`**\n" +
      "- 商品：" + o.items.map(function (i) { return i.name + " × " + i.qty; }).join("、") + "\n" +
      "- 金额：" + money(o.amount) + " 元\n" +
      "- 状态：" + o.status_label + "\n" +
      "- 下单时间：" + o.created_at + "\n" +
      (o.tracking_no ? ("- 物流：" + o.carrier + " `" + o.tracking_no + "`，最新：" + window.CSStore.lastLogistics(o) + "\n") : "") +
      (o.after_sale ? ("- 售后：" + o.after_sale.ticket_id + " " + o.after_sale.status + "\n") : "") +
      "\n可执行操作：" + (o.available_action_labels.join("、") || "无");
  }

  function matchPolicy(q) {
    var S = window.CSStore;
    if (!S.kb) return null;
    var map = [
      [/无理由|7\s*天|七天/, "7 天无理由退货"],
      [/15\s*天|换货|质量/, "15 天质量换货"],
      [/保修|质保|维修|保多久/, "1 年质保维修"],
      [/退款.*(多久|几天|到账)|到账/, "退款时效"],
      [/取消.*规则|能取消吗/, "取消订单规则"],
      [/多久.*发|发货时效|时效/, "发货时效"],
      [/物流.*异常|停滞|不动/, "物流异常处理"],
      [/发票|凭证/, "发票与售后凭证"],
    ];
    for (var i = 0; i < map.length; i++) {
      if (map[i][0].test(q)) {
        for (var j = 0; j < S.kb.policies.length; j++) {
          if (S.kb.policies[j].title === map[i][1]) return S.kb.policies[j];
        }
      }
    }
    return null;
  }

  function policyLine(title) {
    var S = window.CSStore;
    if (!S.kb) return "";
    for (var i = 0; i < S.kb.policies.length; i++) {
      if (S.kb.policies[i].title === title) {
        return "> 依据《" + S.kb.policies[i].title + "》：" + S.kb.policies[i].content;
      }
    }
    return "";
  }

  function extractOrderId(t) {
    var m = /O\d{12}/i.exec(t) || /O\s*(\d{12})/.exec(t.replace(/\s/g, ""));
    if (m) return (m[0][0] === "O" ? m[0] : "O" + m[1]).toUpperCase();
    return null;
  }

  /* ---------------- 探测后端 ---------------- */
  /**
   * 探测顺序：配置的 API_BASE → 同源 /api/health
   * 这样本地 `node server/index.js` 打开页面即自动连上，零配置；
   * 托管在 GitHub Pages 而没有代理时，探测失败自动进入规则兜底模式。
   */
  function detectMode() {
    var candidates = [];
    var b = baseURL();
    if (b) candidates.push(b);
    candidates.push("");  // 同源

    var tried = 0;
    function next() {
      if (tried >= candidates.length) return Promise.resolve(false);
      var base = candidates[tried++];
      return fetch(base + "/api/health", { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (j) {
          state.base = base;
          state.appName = (j && j.app_name) || "";
          state.difyConfigured = !!(j && j.dify_configured);
          state.transport = "proxy";
          state.mode = state.difyConfigured ? "dify" : "offline";
          applyModeHint();
          return true;
        })
        .catch(function () { return next(); });
    }

    /* 没有代理时退到第二条通道：Dify 官方 Web 接口直连。
       拿「能不能换到票据」当健康检查 —— 票据换得到，消息就一定发得出去。 */
    function tryWebApp() {
      var wa = webappConfig();
      if (!wa) return Promise.resolve(false);
      state.webapp = { api: wa.api, code: wa.code, sid: webAppSessionId(), passport: "" };
      return ensurePassport(false)
        .then(function () {
          state.transport = "webapp";
          state.mode = "dify";
          state.difyConfigured = true;
          applyModeHint();
          return true;
        })
        .catch(function () {
          state.webapp = null;
          return false;
        });
    }

    return next()
      .then(function (ok) { return ok ? true : tryWebApp(); })
      .then(function (ok) {
        if (ok) return;
        state.mode = "offline";
        state.difyConfigured = false;
        applyModeHint();
      });
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    el.body = document.getElementById("chat-body");
    el.text = document.getElementById("chat-text");
    el.send = document.getElementById("chat-send");
    el.status = document.getElementById("chat-status");
    el.ctx = document.getElementById("chat-context");

    document.getElementById("chat-form").addEventListener("submit", function (e) {
      e.preventDefault();
      send(el.text.value);
    });
    el.text.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send(el.text.value);
      }
    });
    el.text.addEventListener("input", function () {
      el.text.style.height = "auto";
      el.text.style.height = Math.min(el.text.scrollHeight, 120) + "px";
    });

    // 快捷提问
    var quick = [
      ["我的订单到哪了", "我的订单到哪了？"],
      ["帮我查所有订单", "帮我查一下我的所有订单"],
      ["取消订单", "帮我取消订单"],
      ["退款多久到账", "退款多久能到账？"],
      ["无理由退货条件", "7 天无理由退货有什么条件？"],
      ["我是会员有什么权益", "我的会员等级有什么权益？"],
    ];
    var qbox = document.getElementById("chat-quick");
    quick.forEach(function (q) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = q[0];
      b.addEventListener("click", function () { send(q[1]); });
      qbox.appendChild(b);
    });

    addMsg("ai",
      "您好，我是" + (cfg.ASSISTANT_NAME || "在线客服") + "。\n\n" +
      "可以帮您查订单、看物流、取消订单、申请退款与换货，请直接描述问题。");

    return detectMode().then(function () {
      /* 连不上 Dify 时明确标注，但不影响使用：查订单、政策问答、取消与售后
         这几条链路都不依赖大模型（订单数据本来就在本地）。 */
      if (state.mode === "offline") {
        addMsg("ai",
          "暂时没能连上 Dify，已回落到规则兜底模式：查订单、看物流、政策问答与取消/售后操作仍可正常使用。",
          "模式提示");
      }
    });
  }

  window.CSChat = {
    init: init,
    send: send,
    setIdentity: setIdentity,
    getMode: function () { return state.mode; },
    /** 暴露给自动化测试与调试用，正常流程不会调用 */
    _offlineAnswer: offlineAnswer,
    _extractOrderId: extractOrderId,
    _actionIntent: actionIntent,
    _isLocalAction: isLocalAction,
    _webappConfig: webappConfig,
    _state: state,
  };
})();
