/* ==========================================================================
   工作台 UI：身份切换 / 订单列表 / 订单详情 / 售后操作
   ========================================================================== */
(function () {
  "use strict";

  var S = window.CSStore;
  var cfg = window.CS_CONFIG || {};

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function toast(msg, level) {
    var wrap = $("toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "toast-wrap";
      document.body.appendChild(wrap);
    }
    var t = document.createElement("div");
    t.className = "toast" + (level ? " toast-" + level : "");
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .3s";
      t.style.opacity = "0";
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
    }, 2600);
  }

  /* ======================================================================
     移动端（≤900px）：底部 Tab 切换 + 面板高度自适应
     桌面端三栏同屏，这套逻辑不参与（isMobile() 为 false 时全部空转）
     ====================================================================== */
  var mq = window.matchMedia ? window.matchMedia("(max-width: 900px)") : null;

  function isMobile() { return mq ? mq.matches : window.innerWidth <= 900; }

  /** 真实可视高度：键盘弹起时 innerHeight 不变，visualViewport 才准 */
  function viewportH() {
    return (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  }

  function elVisible(n) {
    if (!n) return false;
    var cs = window.getComputedStyle(n);
    return cs.display !== "none" && cs.visibility !== "hidden";
  }

  function tabbarH() {
    var tb = $("tabbar");
    return elVisible(tb) ? tb.offsetHeight : 0;
  }

  /** 切换移动端面板；桌面端调用无副作用（属性不被任何桌面样式读取） */
  function showPanel(name) {
    if (["identity", "orders", "chat"].indexOf(name) === -1) return;
    document.body.setAttribute("data-panel", name);
    Array.prototype.forEach.call(document.querySelectorAll(".tab-item"), function (b) {
      var on = b.getAttribute("data-panel") === name;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    window.scrollTo(0, 0);
    syncMobileMetrics();
  }

  /** 把底部导航真实高度与对话面板高度写回 CSS 变量 */
  function syncMobileMetrics() {
    var tb = tabbarH();
    document.documentElement.style.setProperty("--tabbar-h-real", tb + "px");

    var col = document.querySelector(".col-chat");
    if (!col) return;
    if (!isMobile() || document.body.getAttribute("data-panel") !== "chat") {
      col.style.removeProperty("--chat-h");
      return;
    }
    var top = 0;
    var bar = document.querySelector(".topbar");
    if (bar) top += bar.offsetHeight;         // sticky 顶栏仍占文档流位置
    if (elVisible($("guidebar"))) top += $("guidebar").offsetHeight;
    top += 10;                                 // .layout 的 padding-top
    var h = Math.max(280, Math.round(viewportH() - top - tb - 8));
    col.style.setProperty("--chat-h", h + "px");
  }

  var metricRaf = null;
  function scheduleMetrics() {
    if (metricRaf) return;
    metricRaf = window.requestAnimationFrame(function () {
      metricRaf = null;
      syncMobileMetrics();
    });
  }

  function setupMobile() {
    var tabbar = $("tabbar");
    if (tabbar) {
      tabbar.addEventListener("click", function (e) {
        var t = e.target;
        while (t && t !== tabbar && !t.getAttribute("data-panel")) t = t.parentNode;
        if (t && t !== tabbar) showPanel(t.getAttribute("data-panel"));
      });
    }
    showPanel(document.body.getAttribute("data-panel") || "chat");

    window.addEventListener("resize", scheduleMetrics);
    window.addEventListener("orientationchange", scheduleMetrics);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", scheduleMetrics);
      window.visualViewport.addEventListener("scroll", scheduleMetrics);
    }
    if (mq && mq.addEventListener) mq.addEventListener("change", scheduleMetrics);
    window.setTimeout(scheduleMetrics, 150);   // 等首次布局稳定
  }

  /* ---------------- 左栏 ---------------- */
  function renderIdentity() {
    var me = S.currentCustomer();
    $("identity-current").innerHTML =
      '<div class="id-card">' +
        '<div class="id-name">' + esc(me.name) + '<span class="tag tag-level">' + esc(me.level) + "</span></div>" +
        '<div class="id-meta"><code>' + esc(me.customer_id) + "</code> · " + esc(me.phone) + " · " + esc(me.city) + "</div>" +
        '<div class="id-addr">收货地址：' + esc(me.address) + "</div>" +
        '<div class="id-tags">' + me.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" +
      "</div>" +
      /* 仅窄屏显示：手机上「身份」与「订单」是两个面板，给一个明确的去路 */
      '<button type="button" class="btn btn-primary btn-goto-orders" id="btn-goto-orders">' +
        "查看该客户订单（" + S.ordersOf(me.customer_id).length + " 笔）→</button>";

    $("identity-list").innerHTML = S.customers.map(function (c) {
      return '<button class="id-item' + (c.customer_id === S.currentCustomerId ? " active" : "") + '" data-cid="' + c.customer_id + '">' +
        '<span class="id-avatar">' + esc(c.name.charAt(0)) + "</span>" +
        '<span class="id-l"><strong>' + esc(c.name) + "</strong><span>" + esc(c.level) + " · " + esc(c.city) + "</span></span>" +
        '<span class="id-r">' + S.ordersOf(c.customer_id).length + " 单</span>" +
      "</button>";
    }).join("");

    Array.prototype.forEach.call(document.querySelectorAll(".id-item"), function (b) {
      b.addEventListener("click", function () { switchCustomer(b.getAttribute("data-cid")); });
    });

    var go = $("btn-goto-orders");
    if (go) go.addEventListener("click", function () { showPanel("orders"); });
  }

  function switchCustomer(cid) {
    S.currentCustomerId = cid;
    S.selectedOrderId = null;
    renderIdentity();
    renderOrders();
    renderDetail();
    window.CSChat.setIdentity(S.currentCustomer(), null);
    toast("已切换身份：" + S.currentCustomer().name + "（" + cid + "）", "ok");
  }

  /* ---------------- 中栏：订单列表 ---------------- */
  function renderOrders() {
    var list = S.ordersOf(S.currentCustomerId);
    $("orders-count").textContent = list.length + " 笔 · 数据基准 " + (S.meta ? S.meta.data_as_of : "");
    $("order-list").innerHTML = list.map(function (o) {
      return '<button class="order-item' + (o.order_id === S.selectedOrderId ? " active" : "") + '" data-oid="' + o.order_id + '">' +
        '<span class="oi-main">' +
          '<span class="oi-title">' + esc(o.items.map(function (i) { return i.name + " ×" + i.qty; }).join("、")) + "</span>" +
          '<span class="oi-sub">' + esc(o.order_id) + "</span>" +
        "</span>" +
        '<span class="oi-right">' +
          '<span class="badge badge-' + o.status + '">' + esc(o.status_label) + "</span>" +
          '<div class="oi-amount">￥' + S.money(o.amount) + "</div>" +
          '<div class="oi-date">' + esc(o.created_at.slice(0, 10)) + "</div>" +
        "</span>" +
      "</button>";
    }).join("");

    Array.prototype.forEach.call(document.querySelectorAll(".order-item"), function (b) {
      b.addEventListener("click", function () { selectOrder(b.getAttribute("data-oid")); });
    });
  }

  function selectOrder(oid) {
    S.selectedOrderId = oid;
    renderOrders();
    renderDetail();
    window.CSChat.setIdentity(S.currentCustomer(), S.getOrder(oid));
    // 窄屏下列表与详情同处一个面板，选中后需要把详情带到眼前
    if (isMobile()) {
      var d = $("detail");
      if (d && d.scrollIntoView) d.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /* ---------------- 中栏：订单详情 ---------------- */
  function renderDetail() {
    var box = $("detail");
    var o = S.selectedOrderId ? S.getOrder(S.selectedOrderId) : null;
    if (!o) {
      box.innerHTML = '<div class="detail-empty">← 从上方选择一笔订单查看详情</div>';
      return;
    }

    var fields = [
      ["订单号", "<code>" + esc(o.order_id) + "</code>"],
      ["订单状态", '<span class="badge badge-' + o.status + '">' + esc(o.status_label) + "</span>"],
      ["下单时间", esc(o.created_at)],
      ["支付方式", esc(o.pay_method)],
      ["订单金额", "<b>￥" + S.money(o.amount) + "</b>"],
      ["承运商", o.carrier ? esc(o.carrier) + (o.carrier_phone ? "（" + o.carrier_phone + "）" : "") : "—"],
      ["运单号", o.tracking_no ? "<code>" + esc(o.tracking_no) + "</code>" : "—"],
      ["预计送达", esc(o.estimated_delivery || "—")],
      ["收货地址", esc(o.address)],
      ["内部备注", esc(o.internal_note || "—")],
    ];

    var html = "";
    html += '<div class="detail-title"><h3>' + esc(o.order_id) + '</h3>' +
            '<span class="badge badge-' + o.status + '">' + esc(o.status_label) + "</span></div>";

    html += '<div class="detail-grid">' + fields.map(function (f) {
      return '<div class="field"><label>' + esc(f[0]) + "</label><div>" + f[1] + "</div></div>";
    }).join("") + "</div>";

    // 商品
    html += '<div class="section-title">商品明细</div>';
    html += '<table class="items-table"><thead><tr><th>商品</th><th>SKU</th><th class="num">单价</th><th class="num">数量</th><th class="num">小计</th></tr></thead><tbody>' +
      o.items.map(function (i) {
        return "<tr><td>" + esc(i.name) + "</td><td><code>" + esc(i.sku) + "</code></td>" +
               '<td class="num">￥' + S.money(i.price) + '</td><td class="num">' + i.qty + '</td><td class="num">￥' + S.money(i.subtotal) + "</td></tr>";
      }).join("") +
      '<tr><td colspan="4" class="num"><b>合计</b></td><td class="num"><b>￥' + S.money(o.amount) + "</b></td></tr>" +
      "</tbody></table>";

    // 售后资格
    var cls = o.refund_eligible ? "notice-ok" : (o.status === "completed" || o.status === "delivered" ? "notice-warn" : "");
    html += '<div class="section-title">售后资格判定（规则引擎）</div>';
    html += '<div class="notice ' + cls + '">' + esc(o.refund_note || "该状态暂无退货资格判定") +
            (o.refund_deadline ? "（退货截止 " + esc(o.refund_deadline) + "）" : "") + "</div>";

    // 售后单
    if (o.after_sale) {
      var a = o.after_sale;
      html += '<div class="section-title">售后单</div>';
      html += '<div class="notice' + (a.status === "已完成" ? " notice-ok" : " notice-warn") + '">' +
        "<b>" + esc(a.ticket_id) + "</b> · " + esc(a.type) + " · " + esc(a.status) + "<br>" +
        "原因：" + esc(a.reason) + " · 申请日：" + esc(a.applied_at) +
        (a.refund_amount ? " · 退款金额 ￥" + S.money(a.refund_amount) : "") + "<br>" +
        esc(a.expect) + "</div>";
    }

    // 时间线
    html += '<div class="section-title">订单与物流时间线</div>';
    html += '<ul class="timeline">' + o.timeline.map(function (t) {
      return '<li class="t-' + esc(t.type) + '"><div class="tl-time">' + esc(t.at) + '</div><div class="tl-text">' + esc(t.text) + "</div></li>";
    }).join("") + "</ul>";

    // 操作
    html += '<div class="section-title">可执行操作</div>';
    if (o.available_actions.length) {
      html += '<div class="actions">' + o.available_actions.map(function (a, i) {
        var cls = "btn btn-sm";
        if (a === "cancel_order" || a === "apply_refund") cls += " btn-danger";
        else if (a === "urge_shipping" || a === "apply_exchange") cls += " btn-ok";
        return '<button class="' + cls + '" data-act="' + a + '">' + esc(o.available_action_labels[i]) + "</button>";
      }).join("") + "</div>";
    } else {
      html += '<div class="notice">当前状态无可用操作。</div>';
    }
    html += '<div class="actions" style="margin-top:10px">' +
      '<button class="btn btn-sm" id="btn-ask-ai">让 AI 客服处理这笔订单</button></div>';

    box.innerHTML = html;

    Array.prototype.forEach.call(box.querySelectorAll("[data-act]"), function (b) {
      b.addEventListener("click", function () { doAction(o.order_id, b.getAttribute("data-act")); });
    });
    var ask = $("btn-ask-ai");
    if (ask) {
      ask.addEventListener("click", function () {
        // 手机上对话在另一个面板，先切过去，否则点了看不到反应
        if (isMobile()) showPanel("chat");
        window.CSChat.send("请帮我看一下订单 " + o.order_id + " 现在是什么情况，可以怎么处理？");
      });
    }
  }

  function doAction(oid, action) {
    var r = S.applyAction(oid, action);
    toast(r.message, r.ok ? "ok" : "warn");
    renderOrders();
    renderDetail();
    var fresh = S.getOrder(oid);
    window.CSChat.setIdentity(S.currentCustomer(), fresh);
  }

  /* ---------------- 接口面板 ---------------- */
  function renderEndpoints() {
    var base = (cfg.SITE_BASE || "").replace(/\/+$/, "");
    var me = S.currentCustomerId;
    var rows = [
      ["ep-orders", base + "/api/orders/by-customer/" + me + ".json", "GET 该客户全部订单"],
      ["ep-customer", base + "/api/customers/" + me + ".json", "GET 客户档案与会员权益"],
      ["ep-kb", base + "/api/kb.json", "GET 客服政策知识库"],
    ];
    rows.forEach(function (r) {
      var a = $(r[0]);
      a.href = r[1];
      a.textContent = r[1].replace(base, "");
      a.title = r[2] + " —— " + r[1];
    });
  }

  /* ---------------- 引导 ---------------- */
  function bindChrome() {
    var modal = $("guide-modal");
    $("btn-guide").addEventListener("click", function () { modal.hidden = false; });
    Array.prototype.forEach.call(modal.querySelectorAll("[data-close]"), function (b) {
      b.addEventListener("click", function () { modal.hidden = true; });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") modal.hidden = true;
    });
    $("btn-reset").addEventListener("click", function () {
      if (confirm("重置所有本地售后操作，恢复初始演示数据？")) S.resetDemo();
    });
    /* 窄屏：指引条默认折叠（首屏留给对话区），按钮在「展开 / 收起」间切换；
       宽屏：维持原行为（点一下整条收起）。 */
    var gbBtn = $("guidebar-close");
    if (isMobile()) {
      document.body.classList.add("guide-collapsed");
      gbBtn.textContent = "展开";
    }
    gbBtn.addEventListener("click", function () {
      if (isMobile()) {
        var collapsed = document.body.classList.toggle("guide-collapsed");
        gbBtn.textContent = collapsed ? "展开" : "收起";
      } else {
        $("guidebar").style.display = "none";
      }
      scheduleMetrics();   // 高度变了，重算对话面板
    });

    // 首次访问自动弹出指引
    try {
      if (!localStorage.getItem("cs_guide_seen")) {
        modal.hidden = false;
        localStorage.setItem("cs_guide_seen", "1");
      }
    } catch (e) {}
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    bindChrome();
    setupMobile();
    S.load().then(function () {
      var pill = $("data-source-pill");
      pill.textContent = S.source === "api"
        ? "静态 API 已加载（api/*.json）"
        : "本地数据包已加载（data.bundle.js 兜底）";
      pill.className = "pill " + (S.source === "api" ? "pill-ok" : "pill-warn");

      $("asof").textContent = S.meta ? S.meta.data_as_of : "—";
      renderIdentity();
      renderOrders();
      renderDetail();
      renderEndpoints();
      scheduleMetrics();   // 数据渲染完成后重算一次高度

      return window.CSChat.init().then(function () {
        window.CSChat.setIdentity(S.currentCustomer(), null);
        if (S.currentCustomer()) {
          toast("已载入 " + S.customers.length + " 位客户 / " + S.orders.length + " 笔订单", "ok");
        }
      });
    }).catch(function (err) {
      document.body.innerHTML = '<div style="padding:48px;font:15px/1.7 sans-serif;max-width:720px;margin:0 auto">' +
        "<h2>数据加载失败</h2><p>" + esc(err.message) + "</p>" +
        "<p>请通过 HTTP 访问本页面（例如在项目根目录执行 <code>node server/index.js</code>），" +
        "而不是直接双击打开 HTML 文件。</p></div>";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
