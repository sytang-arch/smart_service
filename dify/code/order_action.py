# =============================================================================
# Dify 代码节点：售后动作判定与执行
# =============================================================================
# 放在 Chatflow 的「代码节点」里，输入变量：
#   customer_id  string  系统注入的当前登录客户编号（不可来自用户口述）
#   action       string  来自意图识别节点，取值见 ACTIONS
#   order_json   string  上游「HTTP 请求节点」返回的单笔订单 JSON 文本
#   today        string  可选，演示基准日，默认 2026-09-22（与数据基准一致）
#
# 输出变量：
#   ok            bool    操作是否被允许
#   status_after  string  操作后的订单状态
#   ticket_id     string  生成的售后单号（无则空串）
#   message       string  给客户看的一句话结果
#   suggest       string  被拒时的替代方案
#   result_json   string  完整结构化结果，喂给下游「回复生成」LLM 节点
#
# 设计说明：静态数据接口是只读的，所以"写操作"不在数据侧落库，而是在这里
# 做一次真实的规则判定 + 生成售后单号，交给前端与 Agent 会话共同维护状态。
# 这就是 demo 的边界，也是替换成真实后端时唯一需要改的地方。
# =============================================================================

import json

NO_REASON_RETURN_DAYS = 7       # 7 天无理由退货
QUALITY_EXCHANGE_DAYS = 15      # 15 天质量问题换货
WARRANTY_MONTHS = 12            # 1 年质保

# 各订单状态允许的写操作
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

ACTIONS = [
    "cancel_order", "apply_refund", "apply_exchange", "apply_repair",
    "urge_shipping", "report_logistics_exception", "invoice_query", "query_after_sale",
]

# 与订单状态无关、任何状态都可执行的动作
ALWAYS_ALLOWED = ["invoice_query", "query_after_sale"]

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

# 被拒时的替代方案
SUGGEST = {
    "cancel_order": "已发货订单无法取消。您可以在签收后 7 天内申请无理由退货，或在派送时选择拒收。",
    "apply_refund": "已超出 7 天无理由退货期。如果是质量问题，15 天内可申请换货，1 年内可走质保维修。",
    "apply_exchange": "当前状态不支持换货。如果是运输破损请先申请退款；如已超 15 天可走 1 年质保维修。",
    "apply_repair": "该订单不在可维修状态，或已超出 1 年质保期。可联系人工客服进一步核实。",
}


def _mk_ticket(order_id, action):
    return "AS" + str(order_id)[-8:] + "-" + action[:4].upper()


def _fail(message, suggest=""):
    return {
        "ok": False,
        "status_after": "",
        "ticket_id": "",
        "message": message,
        "suggest": suggest,
        "result_json": json.dumps({
            "ok": False, "message": message, "suggest": suggest,
        }, ensure_ascii=False),
    }


def main(customer_id: str, action: str, order_json: str, today: str = "2026-09-22") -> dict:
    # ---- 0. 解析入参 ----------------------------------------------------
    action = (action or "").strip()
    try:
        order = json.loads(order_json) if order_json else {}
    except Exception:
        return _fail("查询接口返回的数据无法解析，请稍后重试。")

    if not order or not order.get("order_id"):
        return _fail("没有拿到订单信息。请先告诉我订单号，或者我按您的账户列出全部订单供您确认。")

    oid = order.get("order_id")
    status = order.get("status", "")

    # ---- 1. 身份校验：这是全流程最关键的一道闸 ---------------------------
    if order.get("customer_id") != customer_id:
        # 注意：不得回显该订单的任何业务字段
        return {
            "ok": False,
            "status_after": "",
            "ticket_id": "",
            "message": "抱歉，订单 %s 不属于当前账户，我无法查看或操作。" % oid,
            "suggest": "为了保护账户隐私，请不要尝试查询他人订单。如需处理您自己的订单，我可以按您的账户为您列出全部订单。",
            "result_json": json.dumps({
                "ok": False,
                "reason": "IDENTITY_MISMATCH",
                "message": "订单 %s 不属于当前账户，我无法查看或操作。" % oid,
                "suggest": "为了保护账户隐私，请不要尝试查询他人订单。",
                "leak_prevented": True,
            }, ensure_ascii=False),
        }

    if action not in ACTIONS:
        return _fail("没有识别出要执行的操作，请您再说明一下具体想做什么（取消 / 退款 / 换货 / 维修 / 催发货）。")

    # ---- 2. 状态机校验 --------------------------------------------------
    allowed = ALLOWED.get(status, [])
    label = ACTION_LABEL.get(action, action)

    if action not in allowed and action not in ALWAYS_ALLOWED:
        return _fail(
            "订单 %s（%s）当前状态为「%s」，不支持「%s」。" % (
                oid, (order.get("items") or [{}])[0].get("name", "商品"), order.get("status_label", status), label),
            SUGGEST.get(action, "建议联系人工客服进一步处理。"),
        )

    # ---- 3. 退货资格校验（只在申请退款时）--------------------------------
    if action == "apply_refund":
        if not order.get("refund_eligible"):
            return _fail(
                "订单 %s 的退货资格不满足：%s" % (oid, order.get("refund_note") or "已超出 7 天无理由退货期"),
                SUGGEST["apply_refund"],
            )

    # ---- 4. 生成执行结果 -------------------------------------------------
    amount = order.get("amount", 0)
    item_name = (order.get("items") or [{}])[0].get("name", "商品")
    ticket = _mk_ticket(oid, action)

    if action == "cancel_order":
        message = "订单 %s（%s，￥%s）已取消，退款 %s 元原路退回，微信/支付宝 1-3 个工作日、银行卡 3-7 个工作日到账。" % (
            oid, item_name, amount, amount)
        status_after = "cancelled"
        suggest = "如需重新购买，我可以为您生成同款订单草稿。"
    elif action == "apply_refund":
        message = "订单 %s（%s）的退款申请已提交，售后单号 %s，退款金额 %s 元，审核通过后 1-3 个工作日原路到账。" % (
            oid, item_name, ticket, amount)
        status_after = "after_sale"
        suggest = "请保持商品与包装完好，快递员上门取件时无需支付运费。"
    elif action == "apply_exchange":
        message = "订单 %s（%s）的换货申请已提交，售后单号 %s。请在 48 小时内寄回，往返运费由平台承担，收到后 24 小时内寄出换新机。" % (
            oid, item_name, ticket)
        status_after = "after_sale"
        suggest = "寄回时请附上故障描述，便于仓库快速检测。"
    elif action == "apply_repair":
        message = "订单 %s（%s）的维修申请已受理，售后单号 %s，可顺丰到付寄修，7-15 个工作日完成。" % (
            oid, item_name, ticket)
        status_after = "after_sale"
        suggest = "请提供故障视频或照片，便于工程师预判问题。"
    elif action == "urge_shipping":
        message = "已为订单 %s 提交催发货工单，仓库将在 24 小时内优先处理。" % oid
        status_after = status
        suggest = "普通会员 48 小时内发货，黄金及以上会员优先发货。"
    elif action == "report_logistics_exception":
        message = "已为订单 %s 发起物流异常核查，承运商承诺 24 小时内反馈结果。" % oid
        status_after = status
        suggest = "若承运商确认丢件，可选择全额退款或补发。"
    elif action == "invoice_query":
        message = "订单 %s 的电子发票已重新推送至您的下单邮箱。" % oid
        status_after = status
        suggest = "如未收到请检查垃圾邮件目录。"
    else:  # query_after_sale
        af = order.get("after_sale") or {}
        if af:
            message = "订单 %s 的售后单 %s 当前状态：%s。%s" % (oid, af.get("ticket_id"), af.get("status"), af.get("expect") or "")
        else:
            message = "订单 %s 当前没有进行中的售后单。" % oid
        status_after = status
        suggest = ""

    result = {
        "ok": True,
        "action": action,
        "action_label": label,
        "order_id": oid,
        "item_name": item_name,
        "amount": amount,
        "status_before": status,
        "status_after": status_after,
        "ticket_id": ticket,
        "message": message,
        "suggest": suggest,
        "executed_at": (today or "") ,
    }

    return {
        "ok": True,
        "status_after": status_after,
        "ticket_id": ticket,
        "message": message,
        "suggest": suggest,
        "result_json": json.dumps(result, ensure_ascii=False),
    }
