# =============================================================================
# Dify 代码节点「售后判定」   文件位置：dify/code/order_action.py
# -----------------------------------------------------------------------------
# 输入变量（共 4 个，变量名必须与下面 main() 的参数逐字一致）：
#   customer_id       String  来自「开始」节点 —— 服务端注入的登录身份
#   action            String  来自「意图识别」节点 —— 整段意图 JSON 文本
#   orders_json       String  来自「查询客户订单」HTTP 节点 —— 该客户的订单列表
#   current_order_id  String  来自「开始」节点 —— 页面上正在查看的订单（可为空）
#
# 为什么没有"日期"变量：Dify 的输入变量取值只能从变量选择器里选（上游输出 /
# 系统变量 / 会话变量），不能手填字面量，所以"填个常量当日基准"这条路本身走不通。
# 而本节点也真的不需要它 —— 退货资格是数据里自带的（refund_eligible），
# 执行时间戳在代码内部取。别为了凑一个变量去多接一个节点。
#
# 输出变量（共 6 个，必须在节点里逐个声明）：
#   ok / status_after / ticket_id / message / suggest / result_json
#
# 设计要点：
#   1. 订单只在「该客户自己的订单集合」里查找 —— 越权在数据边界上就不可能发生。
#      函数内仍会再校验一次 customer_id，作为第二道闸（纵深防御）。
#   2. 写操作不落库（静态托管不提供写接口），由本节点做真实的规则判定并生成售后单号。
#      替换成真实后端时，只需把这一步换成 HTTP 调用，其余节点不用动。
#   3. 状态机口径与 tools/generate_data.py 的 STATUS_ACTIONS 保持一致
#      （只读动作如 track_logistics / pay_reminder / reorder 不在此列）。
# =============================================================================

import json

try:                                    # Dify 沙箱只放行有限的库，取不到就降级
    from datetime import datetime as _datetime, timedelta as _timedelta, timezone as _timezone
except Exception:
    _datetime = _timedelta = _timezone = None

# 退货 / 换货 / 质保的资格结论（refund_eligible / refund_note）由数据接口直接给出，
# 口径写在 tools/generate_data.py 的生成逻辑里（签收日 + 7 天等）。
# 换成真实后端时，这个判断应该由后端算好再返回 —— 业务规则不该散落在流程节点里。

# 各订单状态允许的写操作 —— 这是本项目最核心的一张表
ALLOWED = {
    "pending_payment": ["cancel_order"],
    "paid": ["cancel_order", "urge_shipping"],
    "shipped": ["urge_shipping"],
    "in_transit": ["report_logistics_exception"],
    "delivered": ["apply_refund", "apply_exchange"],
    "completed": ["apply_exchange", "apply_repair"],
    "cancelled": [],
    "after_sale": [],
    "refunded": [],
}

# 可以直接作为 action 传入的枚举值
ACTIONS = [
    "cancel_order", "apply_refund", "apply_exchange", "apply_repair",
    "urge_shipping", "report_logistics_exception", "invoice_query", "query_after_sale",
]

# 与订单状态无关、任何状态都可执行的只读动作
ALWAYS_ALLOWED = ["invoice_query", "query_after_sale"]

# 两个只读查询在内部使用的伪动作
LIST = "__list__"
LOGISTICS = "__logistics__"

# 意图节点输出的 intent -> 本节点的 action
# 两边枚举故意不同：intent 描述"用户想干什么"，action 描述"系统要执行什么"。
# 这份映射内建在代码里，所以不需要在 Dify 里做任何额外处理。
INTENT_TO_ACTION = {
    "cancel_order": "cancel_order",
    "refund": "apply_refund",
    "exchange": "apply_exchange",
    "repair": "apply_repair",
    "urge_shipping": "urge_shipping",
    "logistics_exception": "report_logistics_exception",
    "invoice": "invoice_query",
    "after_sale": "query_after_sale",
    "query_order": LIST,
    "query_logistics": LOGISTICS,
}

# 兜底识别用的枚举表：长串优先，避免 "logistics_exception" 被 "query_logistics"
# 这类短串抢先命中。
_INTENT_KEYS = sorted(INTENT_TO_ACTION.keys(), key=len, reverse=True)

ACTION_LABEL = {
    "cancel_order": "取消订单",
    "apply_refund": "申请退款",
    "apply_exchange": "申请换货",
    "apply_repair": "申请维修",
    "urge_shipping": "催发货",
    "report_logistics_exception": "申报物流异常",
    "invoice_query": "查询发票",
    "query_after_sale": "查看售后进度",
}

# 被拒时给出的替代方案
SUGGEST = {
    "cancel_order": "已发货订单无法取消。您可以在签收后 7 天内申请无理由退货，或在派送时选择拒收。",
    "apply_refund": "已超出 7 天无理由退货期。如果是质量问题，15 天内可申请换货，1 年内可走质保维修。",
    "apply_exchange": "当前状态不支持换货。如果是运输破损请先申请退款；如已超 15 天可走 1 年质保维修。",
    "apply_repair": "该订单不在可维修状态，或已超出 1 年质保期。可联系人工客服进一步核实。",
}


# ------------------------------------------------------------------ 小工具 ----
def _name(o):
    items = o.get("items") or []
    return (items[0].get("name") if items else None) or "该商品"


def _brief(o):
    """列表视图只给必要字段，避免把地址、内部备注等无关信息塞给模型。"""
    return {
        "order_id": o.get("order_id"),
        "item": _name(o),
        "status_label": o.get("status_label"),
        "amount": o.get("amount"),
        "created_at": o.get("created_at"),
        "can_do": o.get("available_action_labels") or [],
    }


def _reply(ok, message, suggest="", status_after="", ticket_id="", extra=None):
    body = {"ok": ok, "message": message}
    if suggest:
        body["suggest"] = suggest
    if extra:
        body.update(extra)
    return {
        "ok": ok,
        "status_after": status_after,
        "ticket_id": ticket_id,
        "message": message,
        "suggest": suggest,
        "result_json": json.dumps(body, ensure_ascii=False),
    }


def _fail(message, suggest="", reason=""):
    return _reply(False, message, suggest, extra={"reason": reason} if reason else None)


def _now_stamp():
    """执行时间戳（北京时间）。只用于回显，不参与任何业务判定。

    Dify 的代码节点跑在 UTC 容器里，直接用 now() 会比北京时间早 8 小时 ——
    回显给用户就是"我下午三点操作，单子上写着早上七点半"，一眼穿帮。
    所以按 UTC+8 取值；沙箱里连 datetime 都取不到时，退回数据快照基准日。
    """
    if _datetime is not None:
        try:
            tz = _timezone(_timedelta(hours=8)) if (_timezone and _timedelta) else None
            return (_datetime.now(tz) if tz else _datetime.now()).strftime("%Y-%m-%d %H:%M")
        except Exception:
            pass
    return "2026-09-22"


def _locate(mine, want_oid, ok_status=None):
    """在客户自己的订单里定位目标订单；找不到返回 None。"""
    if want_oid:
        w = str(want_oid).strip().upper()
        for o in mine:
            if str(o.get("order_id", "")).upper() == w:
                return o
        return None
    for o in mine:
        if ok_status is None or o.get("status") in ok_status:
            return o
    return None


def _scope_fail(want_oid):
    """「订单不属于你」与「订单不存在」必须回同一句话。

    只要两种情况的措辞不同，攻击者就能用返回文案反推「这个单号在系统里存在」——
    这本身就是一条泄露。所以全流程共用这一个出口，别再各写各的。
    """
    return _fail(
        "您的账户下没有找到订单 %s。请核对订单号，或者告诉我您要处理哪一笔，"
        "我把您的订单列给您。" % want_oid,
        "为了保护账户隐私，我不会查询或操作他人订单。",
        reason="ORDER_NOT_IN_SCOPE",
    )


def _strip_wrappers(raw):
    """剥掉意图节点输出常见的两层包裹：思考段与 markdown 代码围栏。

    意图节点很容易被配上带思维链的模型（deepseek-reasoner 之类），输出形如
        <think>用户在问物流，选 query_logistics</think>
        ```json
        {"intent": "query_logistics", ...}
        ```
    只要有一层没剥掉，"以 { 开头才 json.loads" 的判断就落空，
    整条链路会退化成 UNKNOWN_INTENT —— 模型明明答对了，用户却看到"我没太理解"。

    纯字符串实现，不依赖 re（Dify 沙箱对库的放行是有限的）。
    """
    t = raw or ""
    for tag in ("think", "thinking"):
        while True:
            low = t.lower()
            i = low.find("<" + tag)
            if i == -1:
                break
            close = "</" + tag + ">"
            j = low.find(close, i)
            if j == -1:
                break                # 未闭合：交给 _find_intent_json 从末尾回溯，
                                     # 直接把尾巴丢掉反而会把后面的 JSON 一起吞掉
            t = t[:i] + t[j + len(close):]
    for lang in ("json", "JSON", "Json", "python"):
        t = t.replace("```" + lang, "")
    return t.replace("```", "").strip()


def _find_intent_json(text):
    """从文本里取出意图 JSON。

    从最后一个花括号往前试，而不是"从第一个 { 到最后一个 }"：
    模型的最终答案总在末尾，这样思考段里的花括号、JSON 前后的说明文字
    都不会干扰；JSON 里若还有嵌套对象也能逐层往外找回来。
    """
    if not text:
        return {}
    fallback = {}
    end = text.rfind("}")
    for _ in range(8):
        if end == -1:
            break
        start = text.rfind("{", 0, end + 1)
        if start == -1:
            break
        try:
            loaded = json.loads(text[start:end + 1])
            if isinstance(loaded, dict):
                if "intent" in loaded:
                    return loaded
                if not fallback:
                    fallback = loaded
        except Exception:
            pass
        end = text.rfind("}", 0, start)
    return fallback


# ----------------------------------------------------------------- 主函数 ----
def main(customer_id: str, action: str, orders_json: str = "",
         current_order_id: str = "") -> dict:

    customer_id = (customer_id or "").strip()
    if not customer_id:
        return _fail("没有拿到您的账户信息，请刷新页面后重新发起对话。", reason="NO_IDENTITY")

    # ---- 0. 解析 action：吃下意图节点的各种真实输出形态 -----------------------
    # 期望是纯 JSON，但下面三种变形都要接住，否则整条链路退化成 UNKNOWN_INTENT：
    #   · ```json 代码块包裹
    #   · 推理模型加在前面的 <think>…</think> 思考段
    #   · JSON 前后多了一句说明文字（或被截断）
    raw = _strip_wrappers(action)
    intent = ""
    payload = _find_intent_json(raw)
    if payload:
        intent = str(payload.get("intent") or "").strip()
    if not intent and raw in INTENT_TO_ACTION:
        intent = raw                                   # 裸枚举，原样接受
    if not intent:
        low = raw.lower()                              # 最后兜底：在文本里认已知枚举
        for key in _INTENT_KEYS:
            if key in low:
                intent = key
                break
    if not intent:
        intent = raw                                   # 交给下面报 UNKNOWN_INTENT
    act = INTENT_TO_ACTION.get(intent, intent)

    # 目标订单号：用户当场说的（意图里抽出来的）优先，其次才是页面上正在看的那笔
    want_oid = str(payload.get("order_id") or "").strip() or (current_order_id or "").strip()

    # ---- 1. 解析订单集合 ----------------------------------------------------
    try:
        data = json.loads(orders_json) if orders_json else {}
    except Exception:
        return _fail("订单查询接口返回的数据无法解析，请稍后重试。", reason="BAD_PAYLOAD")

    rows = data.get("orders") if isinstance(data, dict) else data
    if not isinstance(rows, list):
        rows = []

    # 第一道闸：只在当前客户自己的订单里工作
    mine = [o for o in rows
            if isinstance(o, dict) and str(o.get("customer_id")) == customer_id]
    mine.sort(key=lambda o: str(o.get("created_at") or ""), reverse=True)

    if not mine:
        return _fail("您的账户下暂时没有订单记录。", reason="NO_ORDERS")

    # ---- 2. 只读意图：列出订单 / 查物流 -------------------------------------
    if act == LIST:
        # 用户点名了某一笔就只回那一笔。★ 这一步必须先过身份闸门：
        # 「帮我查一下 O2026xxxx0902」和「帮我查 O2026xxxx0902 到哪了」是同一件事，
        # 不能因为意图被分成 query_order / query_logistics 就让后者才拦、前者放行，
        # 否则越权拦截可以靠换个说法绕过。
        if want_oid:
            hit = _locate(mine, want_oid)
            if hit is None:
                return _scope_fail(want_oid)
            return _reply(True, "为您查到订单 %s（%s）。" % (
                hit.get("order_id"), _name(hit)), extra={
                "mode": "order_list",
                "count": 1,
                "orders": [_brief(hit)],
                "truncated": False,
            })
        n = len(mine)
        return _reply(True, "为您查到 %d 笔订单，按时间倒序。" % n, extra={
            "mode": "order_list",
            "count": n,
            "orders": [_brief(o) for o in mine[:5]],
            "truncated": n > 5,
        })

    if act == LOGISTICS:
        # 优先给真正"在路上"的那笔，其次才是已签收的，最后才兜底到任意一笔
        o = (_locate(mine, want_oid, ["shipped", "in_transit"])
             or _locate(mine, want_oid, ["delivered"])
             or _locate(mine, want_oid))
        if o is None:
            return _scope_fail(want_oid)
        tl = o.get("timeline") or []
        return _reply(True, "订单 %s（%s）当前状态：%s。" % (
            o.get("order_id"), _name(o), o.get("status_label")), extra={
            "mode": "logistics",
            "order_id": o.get("order_id"),
            "item_name": _name(o),
            "status_label": o.get("status_label"),
            "carrier": o.get("carrier"),
            "tracking_no": o.get("tracking_no"),
            "estimated_delivery": o.get("estimated_delivery"),
            "timeline": [{"at": t.get("at"), "text": t.get("text")} for t in tl[-5:]],
        })

    # ---- 3. 写操作：先定位订单 ----------------------------------------------
    if act not in ACTIONS:
        return _fail(
            "我还不太确定您想做什么。可以说得更具体一些：查订单 / 查物流 / 取消 / 退款 / "
            "换货 / 维修 / 催发货 / 发票 / 售后进度。",
            reason="UNKNOWN_INTENT",
        )

    if want_oid:
        order = _locate(mine, want_oid)
        if order is None:
            # 第二道闸。措辞与「订单不存在」完全一致 —— 见 _scope_fail 的说明。
            return _scope_fail(want_oid)
    else:
        order = _locate(mine, "", [s for s, acts in ALLOWED.items()
                                   if act in acts or act in ALWAYS_ALLOWED])
        if order is None:
            return _fail("您的账户下没有处于可执行「%s」状态的订单。"
                         % ACTION_LABEL.get(act, act), reason="NO_ELIGIBLE_ORDER")

    # 第三道闸：冗余身份校验。正常接线时永远走不到，防的是将来有人改了数据源
    if str(order.get("customer_id")) != customer_id:
        return _fail(
            "抱歉，这笔订单不属于当前账户，我无法查看或操作。",
            "为了保护账户隐私，请不要尝试查询他人订单。",
            reason="IDENTITY_MISMATCH",
        )

    oid = order.get("order_id")
    status = order.get("status", "")
    label = ACTION_LABEL.get(act, act)

    # ---- 4. 状态机校验 ------------------------------------------------------
    if act not in ALLOWED.get(status, []) and act not in ALWAYS_ALLOWED:
        return _fail(
            "订单 %s（%s）当前状态为「%s」，不支持「%s」。" % (
                oid, _name(order), order.get("status_label", status), label),
            SUGGEST.get(act, "建议联系人工客服进一步处理。"),
            reason="STATE_REJECTED",
        )

    # ---- 5. 退货资格校验（只在申请退款时）-----------------------------------
    if act == "apply_refund":
        elig = order.get("refund_eligible")
        if elig is None:
            # 数据源没给结论时不要默认拒绝 —— 那是把"不知道"当成了"不行"。
            return _fail(
                "订单 %s 的退货资格暂时无法自动判定，已为您转人工核实，"
                "一般 1 个工作日内会有客服联系您。" % oid,
                "您也可以在订单详情页自行提交退货申请。",
                reason="ELIGIBILITY_UNKNOWN",
            )
        if not elig:
            return _fail(
                "订单 %s 的退货资格不满足：%s"
                % (oid, order.get("refund_note") or "已超出 7 天无理由退货期"),
                SUGGEST["apply_refund"],
                reason="NOT_ELIGIBLE",
            )

    # ---- 6. 生成执行结果 ----------------------------------------------------
    amount = order.get("amount", 0)
    item = _name(order)
    ticket = "AS" + str(oid)[-8:] + "-" + act[:4].upper()
    status_after, suggest = status, ""

    if act == "cancel_order":
        message = ("订单 %s（%s，%s 元）已取消，款项原路退回：微信/支付宝 1-3 个工作日、"
                   "银行卡 3-7 个工作日到账。") % (oid, item, amount)
        status_after = "cancelled"
        suggest = "如需重新购买，我可以为您生成同款订单。"
    elif act == "apply_refund":
        message = ("订单 %s（%s）的退款申请已提交，售后单号 %s，退款金额 %s 元，"
                   "审核通过后 1-3 个工作日原路到账。") % (oid, item, ticket, amount)
        status_after = "after_sale"
        suggest = "请保持商品与包装完好，快递员上门取件时无需支付运费。"
    elif act == "apply_exchange":
        message = ("订单 %s（%s）的换货申请已提交，售后单号 %s。请在 48 小时内寄回，"
                   "往返运费由平台承担，收到后 24 小时内寄出换新机。") % (oid, item, ticket)
        status_after = "after_sale"
        suggest = "寄回时请附上故障描述，便于仓库快速检测。"
    elif act == "apply_repair":
        message = ("订单 %s（%s）的维修申请已受理，售后单号 %s，可顺丰到付寄修，"
                   "7-15 个工作日完成。") % (oid, item, ticket)
        status_after = "after_sale"
        suggest = "请提供故障视频或照片，便于工程师预判问题。"
    elif act == "urge_shipping":
        message = "已为订单 %s 提交催发货工单，仓库将在 24 小时内优先处理。" % oid
        suggest = "普通会员 48 小时内发货，黄金及以上会员优先发货。"
    elif act == "report_logistics_exception":
        message = "已为订单 %s 发起物流异常核查，承运商承诺 24 小时内反馈结果。" % oid
        suggest = "若承运商确认丢件，可选择全额退款或补发。"
    elif act == "invoice_query":
        message = "订单 %s 的电子发票已重新推送至您的下单邮箱。" % oid
        suggest = "如未收到请检查垃圾邮件目录。"
    else:  # query_after_sale
        af = order.get("after_sale") or {}
        if af:
            message = "订单 %s 的售后单 %s 当前状态：%s。%s" % (
                oid, af.get("ticket_id"), af.get("status"), af.get("expect") or "")
        else:
            message = "订单 %s 当前没有进行中的售后单。" % oid

    return _reply(True, message, suggest, status_after, ticket, {
        "action": act,
        "action_label": label,
        "order_id": oid,
        "item_name": item,
        "amount": amount,
        "status_before": status,
        "status_after": status_after,
        "ticket_id": ticket,
        "executed_at": _now_stamp(),
    })
