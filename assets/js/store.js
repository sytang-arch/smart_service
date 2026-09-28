/* ==========================================================================
   数据层 + 售后状态机
   --------------------------------------------------------------------------
   · 优先从静态 API（api/**.json）读取，与 Dify Agent 吃同一份数据
   · 读取失败（例如用 file:// 直接打开）自动回落到内置数据包 data.bundle.js
   · 售后写操作在前端做本地状态机，写入 localStorage，刷新不丢；
     真实生产环境应把这些动作换成后端接口 —— 接口契约见 dify/tools/customer-service-api.openapi.yaml
   ========================================================================== */
(function () {
  "use strict";

  var LS_KEY = "cs_demo_overrides_v1";

  var CSStore = {
    meta: null,
    customers: [],
    products: [],
    orders: [],
    kb: null,
    source: "unknown",          // "api" | "bundle"
    rebasedDays: 0,             // 数据被顺延了多少天（0 = 本来就是今天的）
    currentCustomerId: null,
    selectedOrderId: null,
    overrides: {},

    /* ---------------- 加载 ---------------- */
    load: function () {
      var self = this;
      try {
        this.overrides = JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {};
      } catch (e) { this.overrides = {}; }

      return fetchJSON("api/meta.json")
        .then(function (meta) {
          return Promise.all([
            fetchJSON("api/customers.json"),
            fetchJSON("api/products.json"),
            fetchJSON("api/orders.json"),
            fetchJSON("api/kb.json"),
          ]).then(function (r) {
            self._ingest(meta, r[0], r[1], r[2], r[3], "api");
          });
        })
        .catch(function () {
          var b = window.CS_DATA;
          if (!b) {
            throw new Error("既读不到静态接口 api/*.json，也没有内置数据包 data.bundle.js");
          }
          self._ingest(b.meta, b.customers, b.products, b.orders, b.kb, "bundle");
        })
        .then(function () {
          self.currentCustomerId = self.customers[0] && self.customers[0].customer_id;
        });
    },

    _ingest: function (meta, customers, products, orders, kb, source) {
      // 先把整份数据里的日期顺延到"今天" —— 静态托管的数据是某一天生成的，
      // 不顺延的话，分享出去的链接放几周就会自相矛盾（详见文件末尾 rebase 段）。
      var shift = rebaseStartDate(meta);
      if (shift) {
        meta = shiftValue(meta, shift.days);
        customers = shiftValue(customers, shift.days);
        products = shiftValue(products, shift.days);
        orders = shiftValue(orders, shift.days);
        kb = shiftValue(kb, shift.days);
      }
      this.rebasedDays = shift ? shift.days : 0;

      this.meta = meta;
      this.customers = customers || [];
      this.products = products || [];
      this.kb = kb;
      this.source = source;
      var ov = this.overrides;
      // 原始数据 + localStorage 里的本地改动 = 当前展示状态
      this.orders = (orders || []).map(function (o) {
        var clean = JSON.parse(JSON.stringify(o));
        clean.__base = JSON.parse(JSON.stringify(o));
        return applyOverride(clean, ov[o.order_id]);
      });
    },

    /* ---------------- 查询 ---------------- */
    getCustomer: function (id) {
      for (var i = 0; i < this.customers.length; i++) {
        if (this.customers[i].customer_id === id) return this.customers[i];
      }
      return null;
    },

    getOrder: function (orderId) {
      for (var i = 0; i < this.orders.length; i++) {
        if (this.orders[i].order_id === orderId) return this.orders[i];
      }
      return null;
    },

    ordersOf: function (customerId) {
      return this.orders.filter(function (o) { return o.customer_id === customerId; });
    },

    currentCustomer: function () { return this.getCustomer(this.currentCustomerId); },

    kbText: function () {
      if (!this.kb) return "";
      return this.kb.policies.map(function (p) {
        return "- 【" + p.title + "】" + p.content;
      }).join("\n");
    },

    /* ---------------- 售后状态机（demo 版本） ---------------- */
    /**
     * @param {string} orderId
     * @param {string} action  见 meta.action_legend
     * @returns {{ok:boolean, level:string, message:string, order?:object}}
     */
    applyAction: function (orderId, action) {
      var order = this.getOrder(orderId);
      if (!order) {
        return { ok: false, level: "danger", message: "找不到订单 " + orderId };
      }
      if (order.available_actions.indexOf(action) === -1) {
        return {
          ok: false, level: "warn",
          message: "订单当前状态为「" + order.status_label + "」，不支持该操作。",
        };
      }
      if (action === "cancel_order" && order.status === "in_transit") {
        return { ok: false, level: "warn", message: "已发货订单无法取消，可在签收后 7 天内申请退货。" };
      }

      var ov = this.overrides[orderId] || {};
      var now = nowStr();
      var res;

      switch (action) {
        case "cancel_order":
          ov.status = "cancelled";
          ov.after_sale = { ticket_id: "AS" + orderId.slice(-8), type: "取消订单", status: "已完成", reason: "客服代客取消", applied_at: now.slice(0, 10), refund_amount: order.amount, expect: "款项原路退回，1-3 个工作日到账" };
          res = { ok: true, level: "ok", message: "订单已取消，退款 " + money(order.amount) + " 元，1-3 个工作日原路到账。" };
          break;

        case "apply_refund":
          ov.status = "after_sale";
          ov.after_sale = { ticket_id: "AS" + orderId.slice(-8), type: "退款", status: "审核中", reason: "7 天无理由退货", applied_at: now.slice(0, 10), refund_amount: order.amount, expect: "审核通过后 1-3 个工作日退款到账，请保持商品与包装完好" };
          res = { ok: true, level: "ok", message: "退款申请已提交（单号 AS" + orderId.slice(-8) + "），审核通过后 1-3 个工作日到账。" };
          break;

        case "apply_exchange":
          ov.status = "after_sale";
          ov.after_sale = { ticket_id: "AS" + orderId.slice(-8), type: "换货", status: "待寄回", reason: "商品质量问题", applied_at: now.slice(0, 10), refund_amount: null, expect: "请在 48 小时内寄回，运费由平台承担；收到后 24 小时内寄出换新机" };
          res = { ok: true, level: "ok", message: "换货申请已提交，请在 48 小时内寄回，往返运费平台承担。" };
          break;

        case "apply_repair":
          ov.status = "after_sale";
          ov.after_sale = { ticket_id: "AS" + orderId.slice(-8), type: "维修", status: "已受理", reason: "质保期内故障", applied_at: now.slice(0, 10), refund_amount: null, expect: "顺丰到付寄修，7-15 个工作日完成" };
          res = { ok: true, level: "ok", message: "维修工单已受理，可在质保期内顺丰到付寄修。" };
          break;

        case "urge_shipping":
          res = { ok: true, level: "ok", message: "已提交催发货工单，仓库将在 24 小时内优先处理。" };
          break;
        case "report_logistics_exception":
          res = { ok: true, level: "warn", message: "已发起物流异常核查，承运商承诺 24 小时内反馈。" };
          break;
        case "invoice_query":
          res = { ok: true, level: "ok", message: "电子发票已重新推送至下单邮箱（" + (this.currentCustomer() ? this.currentCustomer().phone : "") + " 绑定邮箱）。" };
          break;
        case "pay_reminder":
          res = { ok: true, level: "ok", message: "支付链接已重新发送，24 小时内完成支付即可保留订单。" };
          break;
        case "track_logistics":
          res = { ok: true, level: "ok", message: order.tracking_no ? ("最新物流：" + lastLogistics(order)) : "该订单暂无物流信息。" };
          break;
        case "query_after_sale":
          res = { ok: true, level: "ok", message: order.after_sale ? ("售后单 " + order.after_sale.ticket_id + " 当前状态：" + order.after_sale.status + "。" + order.after_sale.expect) : "该订单没有进行中的售后。" };
          break;
        case "reorder":
          res = { ok: true, level: "ok", message: "已为您生成同款商品订单草稿，可去购物车确认。" };
          break;
        default:
          res = { ok: true, level: "ok", message: "操作已受理。" };
      }

      ov.timelineExtra = (ov.timelineExtra || []).concat([
        { at: now, text: "【客服操作】" + (this.meta.action_legend[action] || action) + " —— " + res.message, type: res.level === "warn" ? "warn" : "ok" }
      ]);

      this.overrides[orderId] = ov;
      this._persist();
      this._refreshOrder(orderId);

      var fresh = this.getOrder(orderId);
      return { ok: res.ok, level: res.level, message: res.message, order: fresh };
    },

    resetDemo: function () {
      this.overrides = {};
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
      location.reload();
    },

    _persist: function () {
      try { localStorage.setItem(LS_KEY, JSON.stringify(this.overrides)); } catch (e) {}
    },

    _refreshOrder: function (orderId) {
      for (var i = 0; i < this.orders.length; i++) {
        if (this.orders[i].order_id === orderId) {
          // 用原始数据 + override 重算
          var base = this.orders[i].__base;
          if (!base) { base = this.orders[i].__base = stripVolatile(this.orders[i]); }
          this.orders[i] = applyOverride(JSON.parse(JSON.stringify(base)), this.overrides[orderId]);
          return;
        }
      }
    },
  };

  /* ---------------- 工具 ---------------- */
  function fetchJSON(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url + " -> HTTP " + r.status);
      return r.json();
    });
  }

  function stripVolatile(o) {
    var c = JSON.parse(JSON.stringify(o));
    delete c.__base;
    return c;
  }

  function applyOverride(o, ov) {
    if (!ov) return o;
    if (ov.status) {
      o.status = ov.status;
      o.status_label = (window.CS_DATA && window.CS_DATA.meta.status_legend[ov.status]) || o.status_label;
    }
    if (ov.after_sale) o.after_sale = ov.after_sale;
    if (ov.timelineExtra && ov.timelineExtra.length) {
      o.timeline = o.timeline.concat(ov.timelineExtra);
    }
    if (ov.status === "cancelled") {
      o.available_actions = ["reorder"];
      o.available_action_labels = ["再次购买"];
      o.refund_eligible = false;
      o.refund_note = "订单已取消";
    }
    if (ov.status === "after_sale" && o.available_actions.indexOf("query_after_sale") === -1) {
      o.available_actions = ["query_after_sale", "track_logistics"];
      o.available_action_labels = ["查看售后进度", "查询物流"];
    }
    return o;
  }

  function lastLogistics(order) {
    for (var i = order.timeline.length - 1; i >= 0; i--) {
      if (order.timeline[i].type === "ship" || order.timeline[i].type === "ok") {
        return order.timeline[i].text + "（" + order.timeline[i].at + "）";
      }
    }
    return "暂无更新";
  }

  function money(n) {
    return Number(n).toFixed(2).replace(/\.00$/, "");
  }

  function nowStr() {
    var d = new Date();
    function p(x) { return (x < 10 ? "0" : "") + x; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  /* ========================================================================
     日期顺延 —— 让静态数据"永不过期"
     ------------------------------------------------------------------------
     问题：数据是由 tools/generate_data.py 在**某一天**生成的，生成完就固化在
     文件里。分享链接放几周之后，页面会出现「预计送达 9-27、今天已经 10-08」
     「签收 4 天前、7 天无理由期早就过了」这类自相矛盾 —— 一眼就假。
     重新生成只能解决"生成那天"的问题：用户不会为了发个链接去重跑脚本。

     做法：数据里带着生成日 meta.data_as_of，加载时算出差值 N 天，把整份数据
     里的**所有日期串整体平移 N 天**。相对关系（签收后第 4 天、还剩 3 天可退）
     全部不变，任何一天打开看起来都像"刚发生的事"。
     顺延是幂等的：平移后 data_as_of 变成今天，再算差值为 0，不会叠加。

     为什么用正则扫字符串、而不是逐字段改：
     日期散落在 order_id / tracking_no / created_at / timeline[].at /
     refund_deadline / since / 备注文案里，枚举字段既易漏也易随数据演进失效。
     数据集里形如日期的串**只有两类**（已全量扫描确认无歧义）：
       · YYYY-MM-DD（含时间后缀）  例 2026-09-21 12:21
       · YYYYMMDD（其它 ID 的数字段） 例 O202609210903、ZTO202609160904
     第二类必须先验月/日合法再平移，否则可能误伤同形的业务数字。
     ======================================================================== */
  var RE_HAS_YEAR = /(19|20)\d{2}/;
  var RE_DASH = /(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])/g;
  var RE_COMPACT = /(19|20)\d{6}/g;

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  /** 「yyyy-mm-dd」→ 平移后的「yyyy-mm-dd」。取 12:00 为基准时刻，
   *  避免某些时区在午夜做夏令时切换时把日期推错一天。 */
  function shiftDash(whole, days) {
    var t = new Date(+whole.slice(0, 4), +whole.slice(5, 7) - 1, +whole.slice(8, 10), 12);
    t.setDate(t.getDate() + days);
    return t.getFullYear() + "-" + pad2(t.getMonth() + 1) + "-" + pad2(t.getDate());
  }

  /** 从 meta 里取基准日，算出要顺延的天数；不需要顺延则返回 null。 */
  function rebaseStartDate(meta) {
    var anchor = (meta && (meta.data_as_of || meta.generated_as_of)) || "";
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(anchor);
    if (!m) return null;
    var a = new Date(+m[1], +m[2] - 1, +m[3]);
    if (isNaN(a.getTime())) return null;
    var n = new Date();
    var today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    var days = Math.round((today - a) / 86400000);
    if (!isFinite(days) || days <= 0) return null;   // 基准日就是今天或更晚，不动
    if (days > 3650) return null;                    // 差得离谱（时钟错乱）宁可不改
    return { days: days };
  }

  function shiftString(s, days) {
    if (!RE_HAS_YEAR.test(s)) return s;              // 快路径：不含年份直接放过
    return s
      .replace(RE_DASH, function (whole) { return shiftDash(whole, days); })
      .replace(RE_COMPACT, function (whole) {
        var mo = +whole.slice(4, 6), d = +whole.slice(6, 8);
        if (mo < 1 || mo > 12 || d < 1 || d > 31) return whole;  // 不是日期，原样保留
        var t = new Date(+whole.slice(0, 4), mo - 1, d, 12);
        t.setDate(t.getDate() + days);
        return t.getFullYear() + pad2(t.getMonth() + 1) + pad2(t.getDate());
      });
  }

  /** 深拷贝 + 顺延；返回新对象，不改动传入的数据（data.bundle.js 是全局的）。 */
  function shiftValue(v, days) {
    if (typeof v === "string") return shiftString(v, days);
    if (typeof v !== "object" || v === null) return v;
    if (Array.isArray(v)) {
      var arr = [];
      for (var i = 0; i < v.length; i++) arr.push(shiftValue(v[i], days));
      return arr;
    }
    var out = {};
    for (var k in v) {
      if (Object.prototype.hasOwnProperty.call(v, k)) out[k] = shiftValue(v[k], days);
    }
    return out;
  }

  CSStore.money = money;
  CSStore.nowStr = nowStr;
  CSStore.lastLogistics = lastLogistics;
  CSStore._shiftString = shiftString;      // 供自测／与 Dify 侧对齐用
  CSStore._shiftValue = shiftValue;
  CSStore._rebaseStartDate = rebaseStartDate;
  window.CSStore = CSStore;
})();
