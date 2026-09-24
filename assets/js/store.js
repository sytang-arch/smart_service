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

  CSStore.money = money;
  CSStore.nowStr = nowStr;
  CSStore.lastLogistics = lastLogistics;
  window.CSStore = CSStore;
})();
