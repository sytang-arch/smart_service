#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能客服工作台 Demo —— 模拟数据生成器
================================================
一次运行产出四份互相一致的产物：

1. data/          前端读取的完整数据集（人可读，便于面试时讲解）
2. api/           静态 REST 风格接口切片（供 Dify 自定义工具直接调用）
                  GitHub Pages 会原样托管这个目录，形如
                  https://<user>.github.io/<repo>/api/orders/by-customer/C1001.json
3. assets/js/data.bundle.js
                  离线兜底数据包（file:// 直接打开网页也能跑）
4. dify/kb/customer-service-policy.md
                  知识库文档，从 kb.json 渲染而来，用于上传到 Dify

★ 时间基准：所有日期都是「相对今天」的偏移
  订单表里的日期一律写成「距生成日 N 天」，生成时按当天倒推。
  这样分享链接放一个月再打开，订单依然是「签收 4 天前、7 天无理由还剩 3 天」，
  不会出现「预计送达已经过去一周、状态却还是运输中」这类自相矛盾的数据。

  需要复现 / 检查某个日期的效果：
      python tools/generate_data.py --as-of 2026-11-01
  生成完会自检（见 verify / verify_integrity），任何硬矛盾都直接报错退出。
"""

import argparse
import json
import os
from datetime import date, datetime, time, timedelta

# --------------------------------------------------------------------------
# 0. 路径与时间基准
# --------------------------------------------------------------------------
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
API_DIR = os.path.join(ROOT, "api")
JS_DIR = os.path.join(ROOT, "assets", "js")
KB_DIR = os.path.join(ROOT, "dify", "kb")


def _resolve_today():
    ap = argparse.ArgumentParser(add_help=False)
    ap.add_argument("--as-of", dest="as_of", default=None,
                    help="按指定日期生成（YYYY-MM-DD），用于复现或检查未来某天的数据")
    args, _ = ap.parse_known_args()
    return date.fromisoformat(args.as_of) if args.as_of else date.today()


# 演示「今天」。所有可操作判断（退货期、物流时效）都以这一天为基准。
TODAY = _resolve_today()
# 演示「此刻」。用来保证时间线里不会出现比现在更晚的节点。
# --as-of 指定日期时取当天 21:00，保证同一输入永远得到同一份输出。
NOW = (datetime.now() if TODAY == date.today()
       else datetime.combine(TODAY, time(21, 0)))

# 售后规则阈值（与 api/kb.json 中的政策保持一致）
NO_REASON_RETURN_DAYS = 7      # 7 天无理由退货
QUALITY_EXCHANGE_DAYS = 15     # 15 天质量问题换货
WARRANTY_MONTHS = 12           # 1 年保修

# 履约时间模型（相对偏移，保证各时间戳先后关系永远成立）
SHIP_LEAD = timedelta(days=1, hours=2)      # 下单 → 揽收
TRANSIT_STOPS = [                            # 揽收之后的物流节点
    (timedelta(hours=5), "已从【发货仓】发出"),
    (timedelta(days=1, hours=5), "到达【区域分拨中心】"),
    (timedelta(days=2, hours=5), "到达【城市转运中心】"),
    (timedelta(days=3, hours=5), "派送中，配送员正在为您派送"),
]
TRANSIT_EST_DAYS = 5        # 预计送达 = 下单 + 5 天（对在途订单必定晚于「今天」）
AFTER_SALE_LEAD = timedelta(days=5)          # 下单 → 售后受理 / 退款完成


# --------------------------------------------------------------------------
# 1. 基础档案
# --------------------------------------------------------------------------
CUSTOMERS = [
    {
        "customer_id": "C1001", "name": "张伟", "gender": "男", "phone": "138****1111",
        "level": "普通会员", "city": "上海", "since": "2023-04-18",
        "address": "上海市浦东新区张江路 88 号 3 号楼 502",
        "tags": ["价格敏感", "近期活跃"],
    },
    {
        "customer_id": "C1002", "name": "李娜", "gender": "女", "phone": "139****2222",
        "level": "白金会员", "city": "北京", "since": "2021-11-02",
        "address": "北京市海淀区中关村大街 27 号 A 座 1801",
        "tags": ["高价值客户", "偏好顺丰", "曾发起质量投诉"],
    },
    {
        "customer_id": "C1003", "name": "王强", "gender": "男", "phone": "137****3333",
        "level": "普通会员", "city": "广州", "since": "2024-01-09",
        "address": "广州市天河区体育西路 103 号 2201",
        "tags": ["退换货频次偏高"],
    },
    {
        "customer_id": "C1004", "name": "刘敏", "gender": "女", "phone": "136****4444",
        "level": "黄金会员", "city": "成都", "since": "2022-07-25",
        "address": "成都市武侯区天府大道北段 1480 号 9 栋 1103",
        "tags": ["长期客户", "对物流时效敏感"],
    },
    {
        "customer_id": "C1005", "name": "陈杰", "gender": "男", "phone": "135****5555",
        "level": "普通会员", "city": "深圳", "since": "2025-03-14",
        "address": "深圳市南山区科苑南路 2666 号 5 栋 801",
        "tags": ["企业采购意向"],
    },
    {
        "customer_id": "C1006", "name": "赵雪", "gender": "女", "phone": "133****6666",
        "level": "钻石会员", "city": "杭州", "since": "2020-09-30",
        "address": "杭州市西湖区文三路 259 号 2 幢 1602",
        "tags": ["钻石会员", "享专属客服", "复购率高"],
    },
]

PRODUCTS = [
    {"sku": "SKU-A001", "name": "星耀 X1 Pro 智能手机 256GB", "price": 4999.00, "category": "手机"},
    {"sku": "SKU-A002", "name": "星耀 X1 智能手机 128GB", "price": 3299.00, "category": "手机"},
    {"sku": "SKU-B001", "name": "声动 Air 真无线降噪耳机", "price": 799.00, "category": "音频"},
    {"sku": "SKU-B002", "name": "声动 Studio 头戴式降噪耳机", "price": 1299.00, "category": "音频"},
    {"sku": "SKU-C001", "name": "云阅 11 英寸平板电脑", "price": 2699.00, "category": "平板"},
    {"sku": "SKU-C002", "name": "云阅平板磁吸键盘保护套", "price": 399.00, "category": "配件"},
    {"sku": "SKU-D001", "name": "轻风 14 英寸轻薄笔记本", "price": 5499.00, "category": "电脑"},
    {"sku": "SKU-E001", "name": "极速 65W 氮化镓充电器", "price": 149.00, "category": "配件"},
    {"sku": "SKU-E002", "name": "耐力 20000mAh 移动电源", "price": 219.00, "category": "配件"},
    {"sku": "SKU-F001", "name": "律动 Watch S2 智能手表", "price": 1099.00, "category": "穿戴"},
    {"sku": "SKU-G001", "name": "穿墙 AX3000 双频路由器", "price": 329.00, "category": "网络"},
    {"sku": "SKU-H001", "name": "视界 27 英寸 2K 显示器", "price": 1399.00, "category": "显示"},
]
PRODUCT_MAP = {p["sku"]: p for p in PRODUCTS}

CARRIERS = {
    "顺丰速运": {"code": "SF", "phone": "95338"},
    "京东物流": {"code": "JD", "phone": "950616"},
    "中通快递": {"code": "ZTO", "phone": "95311"},
}

# 会员权益
LEVEL_BENEFITS = {
    "普通会员": {"discount": "无专属折扣", "ship": "标准发货时效 48 小时", "service": "在线客服 9:00-21:00"},
    "黄金会员": {"discount": "全场 98 折", "ship": "优先发货", "service": "在线客服 8:00-22:00"},
    "白金会员": {"discount": "全场 95 折", "ship": "优先发货 + 顺丰包邮", "service": "专属客服通道"},
    "钻石会员": {"discount": "全场 92 折", "ship": "当日发货 + 顺丰包邮", "service": "1 对 1 专属客服 + 延保 6 个月"},
}


# --------------------------------------------------------------------------
# 2. 订单表
# --------------------------------------------------------------------------
# 字段：编号后缀, 客户, 下单于（N 天前）, 状态, [(SKU, 数量)], 承运商, 签收于（N 天前）, 备注
#
# 编排原则（改数据时请一并守住，generate 时会自检）：
#   · 待付款 / 待发货：只能是 1 天前下的单 —— 否则与「24 小时未付款自动关闭」
#     「48 小时内发货」两条政策自相矛盾；
#   · 运输中：下单 3~4 天前，预计送达 = 下单 + 5 天，必定晚于今天；
#   · 已签收：签收日比下单日晚 4 天（履约链路走得通），且签收日不能是未来；
#   · 已完成：下单 1 个月以上。
#
# 演示重点（这几笔是给面试官看的，改动时别破坏）：
#   · 0904 张伟：签收 4 天前 → 7 天无理由窗口还开着（"拆过了还能退吗"）
#   · 0903 张伟：运输中 → 物流时间线可查
#   · 0902 张伟：已付款待发货 → 取消订单 / 退款时效
#   · 0913 王强的已签收耳机、0912 王强的在途手机 → 越权拦截对照
ORDER_SEED = [
    # ---- C1001 张伟（普通会员 / 上海）----
    ("0901", "C1001", 1, "pending_payment", [("SKU-B001", 1)], None, None, ""),
    ("0902", "C1001", 1, "paid", [("SKU-A001", 1)], None, None, ""),
    ("0903", "C1001", 3, "in_transit", [("SKU-E001", 2)], "顺丰速运", None, ""),
    ("0904", "C1001", 8, "delivered", [("SKU-F001", 1)], "中通快递", 4, ""),
    ("0905", "C1001", 104, "completed", [("SKU-C001", 1)], "京东物流", 100, ""),

    # ---- C1002 李娜（白金会员 / 北京）----
    ("0906", "C1002", 1, "paid", [("SKU-D001", 1)], None, None, ""),
    ("0907", "C1002", 4, "in_transit", [("SKU-B002", 1)], "顺丰速运", None, ""),
    ("0908", "C1002", 17, "delivered", [("SKU-C002", 1)], "京东物流", 13, ""),
    ("0909", "C1002", 62, "after_sale", [("SKU-A002", 1)], "顺丰速运", None,
     "质量问题退款审核中，已寄回（运单 SF1380029941）"),
    ("0910", "C1002", 115, "completed", [("SKU-G001", 1)], "中通快递", 111, ""),

    # ---- C1003 王强（普通会员 / 广州）----
    ("0911", "C1003", 1, "pending_payment", [("SKU-E002", 1)], None, None, ""),
    ("0912", "C1003", 3, "in_transit", [("SKU-A001", 1)], "京东物流", None, "高价值快件，需本人签收"),
    ("0913", "C1003", 12, "delivered", [("SKU-B001", 1)], "中通快递", 8, ""),
    ("0914", "C1003", 25, "refunded", [("SKU-F001", 1)], "中通快递", None, "物流破损，已全额退款 1099.00 元"),
    ("0915", "C1003", 160, "completed", [("SKU-H001", 1)], "顺丰速运", 156, ""),

    # ---- C1004 刘敏（黄金会员 / 成都）----
    ("0916", "C1004", 1, "pending_payment", [("SKU-C002", 1)], None, None, ""),
    ("0917", "C1004", 1, "paid", [("SKU-A002", 1)], None, None, ""),
    ("0918", "C1004", 4, "in_transit", [("SKU-E001", 1)], "中通快递", None, "物流停滞：长时间无新物流节点"),
    ("0919", "C1004", 20, "delivered", [("SKU-B002", 1)], "顺丰速运", 16, ""),
    ("0920", "C1004", 94, "cancelled", [("SKU-D001", 1)], None, None, "用户主动取消，未发货"),

    # ---- C1005 陈杰（普通会员 / 深圳）----
    ("0921", "C1005", 1, "paid", [("SKU-F001", 2)], None, None, ""),
    ("0922", "C1005", 3, "in_transit", [("SKU-C001", 1)], "京东物流", None, ""),
    ("0923", "C1005", 13, "delivered", [("SKU-E001", 3)], "中通快递", 9, ""),
    ("0924", "C1005", 42, "after_sale", [("SKU-A001", 1)], "京东物流", None, "屏幕亮点，换货申请中"),
    ("0925", "C1005", 201, "completed", [("SKU-B001", 1)], "顺丰速运", 197,
     "在保（保修至 {warranty_until}）"),

    # ---- C1006 赵雪（钻石会员 / 杭州）----
    ("0926", "C1006", 1, "pending_payment", [("SKU-H001", 1)], None, None, ""),
    ("0927", "C1006", 1, "paid", [("SKU-B001", 2)], None, None, ""),
    ("0928", "C1006", 4, "in_transit", [("SKU-D001", 1)], "顺丰速运", None, ""),
    ("0929", "C1006", 6, "delivered", [("SKU-A002", 1)], "顺丰速运", 2, ""),
    ("0930", "C1006", 83, "completed", [("SKU-C002", 1)], "京东物流", 79, ""),
]

STATUS_LABEL = {
    "pending_payment": "待付款",
    "paid": "待发货（已付款）",
    "shipped": "已发货",
    "in_transit": "运输中",
    "delivered": "已签收",
    "completed": "已完成",
    "cancelled": "已取消",
    "after_sale": "售后处理中",
    "refunded": "已退款",
}

# 状态 -> 允许的售后动作（前端按钮与 Dify 代码节点共用这份口径）
STATUS_ACTIONS = {
    "pending_payment": ["cancel_order", "pay_reminder"],
    "paid": ["cancel_order", "urge_shipping"],
    "shipped": ["track_logistics", "urge_shipping"],
    "in_transit": ["track_logistics", "report_logistics_exception"],
    "delivered": ["apply_refund", "track_logistics", "apply_exchange"],
    "completed": ["apply_repair", "apply_exchange", "invoice_query"],
    "cancelled": ["reorder"],
    "after_sale": ["query_after_sale"],
    "refunded": ["query_after_sale", "reorder"],
}

ACTION_LABEL = {
    "cancel_order": "取消订单",
    "pay_reminder": "获取支付链接",
    "urge_shipping": "催发货",
    "track_logistics": "查询物流",
    "report_logistics_exception": "申报物流异常",
    "apply_refund": "申请退款",
    "apply_exchange": "申请换货",
    "apply_repair": "申请维修",
    "invoice_query": "查询发票",
    "reorder": "再次购买",
    "query_after_sale": "查看售后进度",
}


# --------------------------------------------------------------------------
# 3. 工具
# --------------------------------------------------------------------------
def _fmt(dt):
    return dt.strftime("%Y-%m-%d %H:%M")


def _created_at(days_ago, suffix):
    """下单时间：由「N 天前」倒推，小时/分钟由编号决定，保证可复现。

    只有当订单是今天下单时，算出来的时刻才可能晚于「此刻」，
    这时统一拉回到 40 分钟前 —— 数据里绝不出现未来时间。
    """
    day = TODAY - timedelta(days=days_ago)
    dt = datetime(day.year, day.month, day.day, 9 + (int(suffix) % 9), (int(suffix) * 7) % 60)
    if dt > NOW:
        dt = NOW - timedelta(minutes=40)
    return dt


def _add_months(d, months):
    """加 N 个月（不依赖 dateutil）。"""
    m = d.month - 1 + months
    y = d.year + m // 12
    m = m % 12 + 1
    day = min(d.day, [31, 29 if (y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)) else 28,
                      31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1])
    return date(y, m, day)


def build_timeline(status, created, carrier, tracking_no, signed_on):
    """按状态推导物流轨迹与订单时间线。

    时间戳必须严格递增 —— 这是最容易出硬伤的地方（早前版本就出现过
    「派送中 22:28」后面跟着「已签收 14:32」这种倒挂）。
    现在把节点锚定在「签收时间」上倒推，先后关系就是构造出来的，不会错。
    """
    tl = [{"at": _fmt(created), "text": "订单创建，等待付款", "type": "order"}]

    if status == "pending_payment":
        tl.append({"at": _fmt(created + timedelta(hours=2)),
                   "text": "已发送付款提醒，24 小时内未付款将自动关闭订单", "type": "warn"})
        return tl

    tl.append({"at": _fmt(created + timedelta(minutes=12)), "text": "支付成功", "type": "order"})

    if status == "cancelled":
        tl.append({"at": _fmt(created + timedelta(hours=6)),
                   "text": "订单已取消（未发货），款项原路退回", "type": "warn"})
        return tl

    if status == "paid":
        tl.append({"at": _fmt(created + timedelta(hours=2)),
                   "text": "仓库已接单，正在拣货打包", "type": "info"})
        return tl

    if signed_on is not None:
        # 已签收 / 已完成：节点均匀铺在「揽收 → 签收」这段真实区间里。
        # 这样先后关系是构造出来的，不可能倒挂；改任何一个日期都不会破。
        ship = created + SHIP_LEAD
        signed = datetime(signed_on.year, signed_on.month, signed_on.day, 14, 32)
        span = signed - ship
        if span <= timedelta(hours=2):
            raise SystemExit("订单 %s 的下单日与签收日相隔太近，履约链路走不通" % tracking_no)
        tl.append({"at": _fmt(ship),
                   "text": "%s 已揽收，运单号 %s" % (carrier, tracking_no), "type": "ship"})
        for frac, (_, text) in zip((0.15, 0.40, 0.65, 0.90), TRANSIT_STOPS):
            tl.append({"at": _fmt(ship + span * frac), "text": text, "type": "ship"})
        tl.append({"at": _fmt(signed), "text": "已签收，感谢使用", "type": "ok"})
        if status == "completed":
            done = signed + timedelta(days=NO_REASON_RETURN_DAYS + 1)
            tl.append({"at": _fmt(datetime(done.year, done.month, done.day, 0, 0)),
                       "text": "订单完成（已过售后期）", "type": "ok"})
        return tl

    # 在途 / 售后中 / 已退款：节点从揽收时间往后推，只展示「已经发生」的
    ship = created + SHIP_LEAD
    tl.append({"at": _fmt(ship),
               "text": "%s 已揽收，运单号 %s" % (carrier, tracking_no), "type": "ship"})
    limit = 2 if status == "shipped" else len(TRANSIT_STOPS)
    for delta, text in TRANSIT_STOPS[:limit]:
        at = ship + delta
        if at > NOW:
            break
        tl.append({"at": _fmt(at), "text": text, "type": "ship"})

    if status == "after_sale":
        tl.append({"at": _fmt(created + AFTER_SALE_LEAD),
                   "text": "售后单已受理，等待检测/审核", "type": "warn"})
    if status == "refunded":
        tl.append({"at": _fmt(created + AFTER_SALE_LEAD),
                   "text": "退款已原路退回，预计 1-3 个工作日到账", "type": "ok"})
    return tl


def build_after_sale(status, note, oid, amount, created):
    if status == "after_sale":
        kind = "换货" if "换货" in note else "退款"
        return {
            "ticket_id": "AS" + oid[-8:],
            "type": kind,
            "status": "审核中" if kind == "退款" else "待寄回",
            "reason": "商品质量问题（屏幕亮点）" if "亮点" in note else "商品质量问题",
            "applied_at": (created + AFTER_SALE_LEAD).strftime("%Y-%m-%d"),
            "refund_amount": amount if kind == "退款" else None,
            "expect": "审核通过后 1-3 个工作日退款到账" if kind == "退款" else "审核通过后 24 小时内寄出换新机",
        }
    if status == "refunded":
        return {
            "ticket_id": "AS" + oid[-8:],
            "type": "退款",
            "status": "已完成",
            "reason": "物流破损",
            "applied_at": (created + AFTER_SALE_LEAD).strftime("%Y-%m-%d"),
            "refund_amount": amount,
            "expect": "已退款",
        }
    return None


def build_orders():
    orders = []
    for suffix, cust, days_ago, status, items, carrier, signed_days_ago, note in ORDER_SEED:
        created = _created_at(days_ago, suffix)
        order_id = "O" + created.strftime("%Y%m%d") + suffix
        signed_on = (TODAY - timedelta(days=signed_days_ago)) if signed_days_ago is not None else None

        # 备注里可能带相对日期占位符（如保修截止日），在这里渲染
        if "{warranty_until}" in note:
            note = note.replace("{warranty_until}",
                                _add_months(created.date(), WARRANTY_MONTHS).isoformat())

        line_items, total = [], 0.0
        for sku, qty in items:
            p = PRODUCT_MAP[sku]
            line_items.append({"sku": sku, "name": p["name"], "price": p["price"], "qty": qty,
                               "subtotal": round(p["price"] * qty, 2)})
            total += p["price"] * qty
        total = round(total, 2)

        tracking_no = ""
        carrier_name = carrier
        if carrier:
            tracking_no = CARRIERS[carrier]["code"] + created.strftime("%Y%m%d") + suffix

        shipped_at = _fmt(created + SHIP_LEAD) if carrier else None
        signed_at = None
        if signed_on is not None:
            signed_at = _fmt(datetime(signed_on.year, signed_on.month, signed_on.day, 14, 32))

        est = None
        if status in ("shipped", "in_transit"):
            est = (created + timedelta(days=TRANSIT_EST_DAYS)).strftime("%Y-%m-%d")

        # 退货资格（以 TODAY 为基准；数据是相对今天的，所以结论长期稳定）
        refund_deadline, refund_eligible, refund_reason = None, False, ""
        if status == "delivered" and signed_on:
            deadline = signed_on + timedelta(days=NO_REASON_RETURN_DAYS)
            refund_deadline = deadline.isoformat()
            if deadline >= TODAY:
                refund_eligible = True
                refund_reason = "签收后 %d 天内，可享 7 天无理由退货" % (TODAY - signed_on).days
            else:
                refund_eligible = False
                refund_reason = "已超出 7 天无理由退货期（签收 %s）" % signed_on.isoformat()
        elif status == "paid":
            refund_eligible, refund_reason = True, "未发货订单可直接取消并全额退款"

        actions = list(STATUS_ACTIONS.get(status, []))
        if status == "delivered" and not refund_eligible and "apply_refund" in actions:
            actions.remove("apply_refund")

        completed_at = None
        if status == "completed" and signed_on:
            completed_at = _fmt(datetime(signed_on.year, signed_on.month, signed_on.day, 0, 0)
                                + timedelta(days=NO_REASON_RETURN_DAYS + 1))

        orders.append({
            "order_id": order_id,
            "customer_id": cust,
            "status": status,
            "status_label": STATUS_LABEL[status],
            "created_at": _fmt(created),
            "paid_at": None if status == "pending_payment" else _fmt(created + timedelta(minutes=12)),
            "shipped_at": shipped_at,
            "signed_at": signed_at,
            "completed_at": completed_at,
            "amount": total,
            "currency": "CNY",
            "pay_method": "在线支付（微信）" if int(suffix) % 2 else "在线支付（支付宝）",
            "items": line_items,
            "carrier": carrier_name,
            "carrier_phone": CARRIERS[carrier_name]["phone"] if carrier_name else None,
            "tracking_no": tracking_no or None,
            "estimated_delivery": est,
            "address": next(c for c in CUSTOMERS if c["customer_id"] == cust)["address"],
            "timeline": build_timeline(status, created, carrier_name, tracking_no, signed_on),
            "after_sale": build_after_sale(status, note, order_id, total, created),
            "refund_eligible": refund_eligible,
            "refund_deadline": refund_deadline,
            "refund_note": refund_reason,
            "available_actions": actions,
            "available_action_labels": [ACTION_LABEL[a] for a in actions],
            "internal_note": note,
        })
    return orders


def build_kb():
    """客服政策知识库。

    每条政策都带 common_questions —— 这是给检索用的「同义说法」。
    知识库里写的是书面语（「拆封本身不影响退货资格」），用户问的是口语
    （「拆过还能退吗」），两边关键词没有交集，向量检索就召回不到。
    补上常见问法后，口语提问也能命中对应政策。
    """
    return {
        "brand": "官方商城",
        "service_hours": "9:00-21:00（黄金及以上会员 8:00-22:00，钻石会员 7×24）",
        "hotline": "400-820-9900",
        "policies": [
            {
                "id": "POL-01", "title": "7 天无理由退货",
                "content": "自签收次日起 7 个自然日内，商品不影响二次销售（外观无划痕、配件包装齐全、赠品一并退回）可申请无理由退货。拆开包装查验本身不影响退货资格，但需保证不影响二次销售。不适用：定制商品、已激活的软件授权、已拆封的贴身卫生类商品。",
                "common_questions": [
                    "拆过了还能退吗", "拆开包装了还能退吗", "已经开封了能退吗",
                    "不喜欢可以退吗", "买贵了能退吗", "七天无理由是怎么算的",
                    "包装扔了还能退吗", "试用过还能退货吗", "退货要满足什么条件",
                ],
            },
            {
                "id": "POL-02", "title": "15 天质量换货",
                "content": "自签收次日起 15 个自然日内出现非人为质量问题，可申请换货，往返运费由平台承担，并可使用运费险。",
                "common_questions": [
                    "坏了能换吗", "质量有问题怎么办", "换货要自己付运费吗",
                    "用了半个月坏了", "有瑕疵能换新吗", "质量问题找谁",
                ],
            },
            {
                "id": "POL-03", "title": "1 年质保维修",
                "content": "整机质保 1 年（自签收起算），钻石会员额外延长 6 个月。人为损坏、进水、私自拆机不在质保范围。",
                "common_questions": [
                    "保修多久", "过保了还能修吗", "自己拆过还能保修吗",
                    "进水了保修吗", "屏幕碎了保修吗", "怎么申请维修",
                ],
            },
            {
                "id": "POL-04", "title": "退款时效",
                "content": "退款按原支付路径退回：微信/支付宝 1-3 个工作日；银行卡 3-7 个工作日；已开具纸质发票的需先寄回发票。",
                "common_questions": [
                    "退款多久到账", "钱什么时候退回来", "退款退到哪里",
                    "退到银行卡要几天", "退款怎么还没到", "退回原支付方式吗",
                ],
            },
            {
                "id": "POL-05", "title": "取消订单规则",
                "content": "待付款订单可直接取消；已付款未发货订单可取消并全额退款；已发货订单无法取消，可选择拒收或在签收后 7 天内申请退货。",
                "common_questions": [
                    "刚下的单能取消吗", "已经付款了能取消吗", "发货了还能取消吗",
                    "不想要了怎么取消", "拍错了能退吗", "下单后反悔了",
                ],
            },
            {
                "id": "POL-06", "title": "发货时效",
                "content": "普通会员 48 小时内发货；黄金/白金会员优先发货；钻石会员当日发货。大促期间顺延 1-2 天。",
                "common_questions": [
                    "什么时候发货", "怎么还没发货", "几天能发出",
                    "催一下发货", "今天能发吗",
                ],
            },
            {
                "id": "POL-07", "title": "物流异常处理",
                "content": "物流超过 72 小时无更新视为异常件，客服可发起催件；超过 7 天未送达可申请全额退款或补发。",
                "common_questions": [
                    "快递不动了怎么办", "物流好几天没更新", "一直不派送",
                    "包裹丢件了怎么办", "快递卡住了", "能不能催一下快递",
                ],
            },
            {
                "id": "POL-08", "title": "发票与售后凭证",
                "content": "电子发票订单完成后自动推送至下单邮箱，可重新索取；维修保修需提供订单号与故障视频/照片。",
                "common_questions": [
                    "怎么开发票", "发票丢了能补吗", "电子发票在哪",
                    "维修要准备什么材料", "能开纸质发票吗",
                ],
            },
        ],
        "member_benefits": LEVEL_BENEFITS,
        "carriers": [{"name": k, "phone": v["phone"]} for k, v in CARRIERS.items()],
        "handoff_rules": [
            "金额争议与赔付", "投诉升级", "要求提供他人信息",
            "工具连续两次无法解决", "涉及法律与监管问题",
        ],
        "faq": [
            {"q": "订单什么时候能发货？", "a": "普通会员付款后 48 小时内，黄金及以上会员优先发货，钻石会员当日发货。"},
            {"q": "怎么查询物流？", "a": "提供订单号或下单手机号，我可以帮您查询最新物流节点。"},
            {"q": "想退货需要什么条件？", "a": "签收次日起 7 天内、商品与外包装完好可申请无理由退货；拆开包装查验不影响资格。15 天内质量问题可换货。"},
            {"q": "退款多久到账？", "a": "微信/支付宝 1-3 个工作日，银行卡 3-7 个工作日。"},
            {"q": "发票怎么开？", "a": "订单完成后电子发票会自动发送到下单邮箱，也可以让我为您重新推送。"},
        ],
    }


def render_kb_markdown(kb):
    """把 kb.json 渲染成 Dify 知识库文档。

    从前 markdown 是手写的，和 kb.json 各改各的，已经漂移过一次
    （markdown 里有「拆封本身不影响退货资格」，kb.json 里没有）。
    现在统一由这里渲染 —— 只有一个事实源。
    """
    L = []
    L.append("# 智能客服工作台 · 客服政策知识库")
    L.append("")
    L.append("> 由 `tools/generate_data.py` 从 `api/kb.json` 渲染生成，请勿手工编辑。")
    L.append("> 与 `api/kb.json` 同一事实源，避免「Agent 说的」与「页面显示的」不一致。")
    L.append("")

    L.append("## 一、售后政策")
    L.append("")
    for p in kb["policies"]:
        L.append("### %s %s" % (p["id"], p["title"]))
        L.append(p["content"])
        if p.get("common_questions"):
            L.append("")
            L.append("常见问法（用户通常这么说）：" + " / ".join(p["common_questions"]))
        L.append("")

    L.append("## 二、会员权益")
    L.append("")
    L.append("| 等级 | 折扣 | 发货 | 服务 |")
    L.append("| --- | --- | --- | --- |")
    for lv, b in kb["member_benefits"].items():
        L.append("| %s | %s | %s | %s |" % (lv, b["discount"], b["ship"], b["service"]))
    L.append("")

    L.append("## 三、服务信息")
    L.append("")
    L.append("- 在线客服：%s" % kb["service_hours"])
    L.append("- 客服热线：%s（7×24）" % kb["hotline"])
    L.append("- 承运商：" + "、".join("%s（%s）" % (c["name"], c["phone"]) for c in kb["carriers"]))
    L.append("")

    L.append("## 四、常见问答")
    L.append("")
    for f in kb["faq"]:
        L.append("**Q：%s**" % f["q"])
        L.append("A：%s" % f["a"])
        L.append("")

    L.append("## 五、转人工规则")
    L.append("")
    L.append("以下情况转人工：" + "、".join(kb["handoff_rules"]) + "。")
    L.append("")
    return "\n".join(L)


# --------------------------------------------------------------------------
# 4. 输出
# --------------------------------------------------------------------------
def wjson(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    customers, products, orders = CUSTOMERS, PRODUCTS, build_orders()
    kb = build_kb()

    meta = {
        "demo_name": "智能客服工作台 · Dify Agent Demo",
        "scenario": "数码 3C 电商在线客服",
        "data_as_of": TODAY.isoformat(),
        "data_basis": "所有日期都是「距生成日 N 天」的相对偏移，随生成日滚动，不会过期",
        "customers": len(customers),
        "orders": len(orders),
        "products": len(products),
        "status_legend": STATUS_LABEL,
        "action_legend": ACTION_LABEL,
        "rules": {
            "no_reason_return_days": NO_REASON_RETURN_DAYS,
            "quality_exchange_days": QUALITY_EXCHANGE_DAYS,
            "warranty_months": WARRANTY_MONTHS,
        },
    }

    # --- 4.1 完整数据集（人可读）---
    wjson(os.path.join(DATA_DIR, "meta.json"), meta)
    wjson(os.path.join(DATA_DIR, "customers.json"), customers)
    wjson(os.path.join(DATA_DIR, "products.json"), products)
    wjson(os.path.join(DATA_DIR, "orders.json"), orders)
    wjson(os.path.join(DATA_DIR, "kb.json"), kb)

    # --- 4.2 静态 API 切片（供 Dify 调用）---
    wjson(os.path.join(API_DIR, "manifest.json"), {
        "name": "智能客服 Demo 静态数据接口",
        "version": "1.1.0",
        "note": "只读静态接口。由 GitHub Pages / 任意静态托管直接提供，Dify 自定义工具可原样调用。",
        "endpoints": [
            {"method": "GET", "path": "/api/customers.json", "desc": "全部客户档案"},
            {"method": "GET", "path": "/api/orders.json", "desc": "全部订单（演示规模下可整体返回）"},
            {"method": "GET", "path": "/api/products.json", "desc": "全部商品"},
            {"method": "GET", "path": "/api/customers/{customer_id}.json", "desc": "单个客户档案与会员权益"},
            {"method": "GET", "path": "/api/orders/by-customer/{customer_id}.json", "desc": "某客户的全部订单（含物流时间线与可执行动作）"},
            {"method": "GET", "path": "/api/orders/{order_id}.json", "desc": "单个订单详情"},
            {"method": "GET", "path": "/api/kb.json", "desc": "客服政策知识库"},
        ],
        "limitation": "静态托管不提供写接口。取消订单 / 申请退款等写操作由 Dify 代码节点状态机在会话内完成，生产环境应替换为真实后端。",
    })
    wjson(os.path.join(API_DIR, "meta.json"), meta)
    wjson(os.path.join(API_DIR, "customers.json"), customers)
    wjson(os.path.join(API_DIR, "orders.json"), orders)
    wjson(os.path.join(API_DIR, "products.json"), products)

    # 订单号里带下单日期，日期一滚动文件名就变了。不清理的话，每次重新生成
    # 都会在 api/orders/ 里堆一层旧日期的死文件 —— 既不指向任何真实订单，
    # 也会让"这个单号到底存不存在"变得说不清。
    #
    # 清理是「尽力而为」：一次删太多可能触发宿主的批量删除保护，那不该让整个
    # 生成流程失败（仓库侧由 push_smart_service.py 再过滤一道）。
    MAX_CLEAN_PER_RUN = 40
    stale = sorted(n for n in os.listdir(os.path.join(API_DIR, "orders"))
                   if n.endswith(".json") and n[:-5] not in {o["order_id"] for o in orders})
    removed = 0
    for n in stale[:MAX_CLEAN_PER_RUN]:
        try:
            os.remove(os.path.join(API_DIR, "orders", n))
            removed += 1
        except BaseException:
            break
    if removed < len(stale):
        print("提示：api/orders/ 还有 %d 个历史残留文件未清理（本次清掉 %d 个）。"
              % (len(stale) - removed, removed))
        print("      它们不会进仓库、也不影响页面，重新运行几次即可逐步清空。")

    for c in customers:
        cid = c["customer_id"]
        wjson(os.path.join(API_DIR, "customers", cid + ".json"), {
            **c,
            "benefits": LEVEL_BENEFITS[c["level"]],
            "order_count": sum(1 for o in orders if o["customer_id"] == cid),
            "order_ids": [o["order_id"] for o in orders if o["customer_id"] == cid],
        })
        mine = [o for o in orders if o["customer_id"] == cid]
        wjson(os.path.join(API_DIR, "orders", "by-customer", cid + ".json"), {
            "customer_id": cid,
            "customer_name": c["name"],
            "data_as_of": TODAY.isoformat(),
            "count": len(mine),
            "orders": mine,
        })
    for o in orders:
        wjson(os.path.join(API_DIR, "orders", o["order_id"] + ".json"), o)
    wjson(os.path.join(API_DIR, "kb.json"), kb)

    # --- 4.3 离线兜底数据包 ---
    os.makedirs(JS_DIR, exist_ok=True)
    bundle = {"meta": meta, "customers": customers, "products": products,
              "orders": orders, "kb": kb, "generated_as_of": TODAY.isoformat()}
    with open(os.path.join(JS_DIR, "data.bundle.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("/* 由 tools/generate_data.py 自动生成，请勿手工编辑。\n")
        f.write("   用途：本地以 file:// 打开页面时的离线兜底数据。 */\n")
        f.write("window.CS_DATA = ")
        json.dump(bundle, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    # --- 4.4 知识库文档（上传到 Dify；本地渲染，不进仓库）---
    os.makedirs(KB_DIR, exist_ok=True)
    with open(os.path.join(KB_DIR, "customer-service-policy.md"), "w",
              encoding="utf-8", newline="\n") as f:
        f.write(render_kb_markdown(kb))

    print("基准日 TODAY=%s  NOW=%s" % (TODAY.isoformat(), _fmt(NOW)))
    print("OK customers=%d orders=%d products=%d policies=%d"
          % (len(customers), len(orders), len(products), len(kb["policies"])))
    print("api files written under api/")
    print("offline bundle written to assets/js/data.bundle.js")
    print("kb markdown written to dify/kb/customer-service-policy.md")
    verify()
    verify_integrity(orders, customers)


def verify():
    """自检：前端固定会请求这几个文件，缺一个就会静默回落到兜底数据包。

    曾经因为没有产出 api/meta.json，前端在"静态 API 模式"下其实一直走着兜底数据 ——
    页面看起来正常，但 API 链路从没跑通过。这类"静默降级"最难发现，所以加一道硬断言。
    """
    required = [
        "data/meta.json", "data/customers.json", "data/products.json",
        "data/orders.json", "data/kb.json",
        "api/meta.json", "api/manifest.json", "api/customers.json",
        "api/orders.json", "api/products.json", "api/kb.json",
        "api/customers/C1001.json", "api/customers/C1006.json",
        "api/orders/by-customer/C1001.json", "api/orders/by-customer/C1006.json",
        "assets/js/data.bundle.js",
    ]
    missing = [r for r in required if not os.path.isfile(os.path.join(ROOT, r.replace("/", os.sep)))]
    if missing:
        raise SystemExit("自检失败，以下文件未生成：\n  " + "\n  ".join(missing))

    bundle = open(os.path.join(JS_DIR, "data.bundle.js"), encoding="utf-8").read()
    if "window.CS_DATA" not in bundle:
        raise SystemExit("自检失败：离线数据包格式不对")
    print("自检通过：%d 个必需文件齐全，前端接口链路可完整跑通" % len(required))


def verify_integrity(orders, customers):
    """数据一致性硬断言 —— 把「一眼就能看出是假的」的矛盾挡在生成阶段。

    最早的数据集把「今天」写死成某一天，过几天就会出现
    「预计送达已经过去一周、状态还是运输中」这种自相矛盾；改相对偏移后，
    还得保证各字段之间的先后关系本身是对的（否则换成任何一天都是错的）。
    """
    errs = []

    def fail(msg):
        errs.append(msg)

    ids = [o["order_id"] for o in orders]
    if len(set(ids)) != len(ids):
        fail("订单号有重复")

    future_limit = NOW
    today_s = TODAY.isoformat()

    for o in orders:
        oid, st = o["order_id"], o["status"]

        # 1) 任何时间戳都不能晚于「此刻」
        for f in ("created_at", "paid_at", "shipped_at", "signed_at", "completed_at"):
            v = o[f]
            if v and datetime.strptime(v, "%Y-%m-%d %H:%M") > future_limit:
                fail("%s %s 是未来时间：%s" % (oid, f, v))
        for n in o["timeline"]:
            if datetime.strptime(n["at"], "%Y-%m-%d %H:%M") > future_limit:
                fail("%s 物流节点是未来时间：%s %s" % (oid, n["at"], n["text"]))

        # 2) 时间线必须严格递增（同一分钟内的多节点不算错，但不能倒挂）
        times = [datetime.strptime(n["at"], "%Y-%m-%d %H:%M") for n in o["timeline"]]
        for a, b in zip(times, times[1:]):
            if b < a:
                fail("%s 时间线倒挂：%s 之后是 %s" % (oid, a, b))

        # 3) 状态与时间的关系
        if st == "in_transit":
            if not o["estimated_delivery"] or o["estimated_delivery"] < today_s:
                fail("%s 运输中，但预计送达已过期：%s" % (oid, o["estimated_delivery"]))
        if st in ("pending_payment", "paid"):
            age = (TODAY - datetime.strptime(o["created_at"][:10], "%Y-%m-%d").date()).days
            if age > 2:
                fail("%s 状态为「%s」却已下单 %d 天，与时效政策矛盾"
                     % (oid, o["status_label"], age))
        if st in ("delivered", "completed"):
            if not o["signed_at"]:
                fail("%s 已签收/已完成却没有签收时间" % oid)
            elif o["signed_at"][:10] > today_s:
                fail("%s 签收时间是未来：%s" % (oid, o["signed_at"]))
        if st == "delivered":
            expect = (datetime.strptime(o["signed_at"][:10], "%Y-%m-%d").date()
                      + timedelta(days=NO_REASON_RETURN_DAYS)).isoformat()
            if o["refund_deadline"] != expect:
                fail("%s 退货截止日算错了：%s != %s" % (oid, o["refund_deadline"], expect))
            if o["refund_eligible"] != (expect >= today_s):
                fail("%s 退货资格判定与截止日不一致" % oid)
        if st == "completed" and (TODAY - datetime.strptime(o["created_at"][:10], "%Y-%m-%d").date()).days < 30:
            fail("%s 标成「已完成」但下单不足 30 天" % oid)

        # 4) 履约链路是否走得通：下单 → 揽收 → 签收
        if o["shipped_at"] and datetime.strptime(o["shipped_at"], "%Y-%m-%d %H:%M") <= \
                datetime.strptime(o["created_at"], "%Y-%m-%d %H:%M"):
            fail("%s 揽收时间早于下单时间" % oid)
        if o["signed_at"] and o["shipped_at"] and \
                o["signed_at"] <= o["shipped_at"]:
            fail("%s 签收时间早于揽收时间" % oid)

        # 5) 写操作是否落在允许集合里
        allowed = set(STATUS_ACTIONS.get(st, []))
        if not set(o["available_actions"]).issubset(allowed):
            fail("%s 出现了该状态不允许的操作" % oid)

    # 6) 演示关键用例必须一直在（这几笔撑着面试时的三个卖点）
    def find(cid, st):
        return [o for o in orders if o["customer_id"] == cid and o["status"] == st]

    if not any(o["refund_eligible"] for o in find("C1001", "delivered")):
        fail("张伟名下没有「仍在 7 天无理由期内」的已签收订单，退货演示会失效")
    if not find("C1001", "in_transit"):
        fail("张伟名下没有在途订单，物流演示会失效")
    if not [o for o in find("C1001", "paid") + find("C1001", "pending_payment")]:
        fail("张伟名下没有可取消订单，取消演示会失效")
    if not find("C1003", "in_transit") and not find("C1003", "delivered"):
        fail("王强名下没有订单，越权拦截对照会失效")
    if len(customers) < 6 or len(orders) < 20:
        fail("数据规模不足（需 ≥6 客户 / ≥20 订单）")

    # 7) api/orders/ 下残留的旧日期订单文件。这是卫生问题而非正确性问题
    #    （仓库侧还有一道过滤），所以只提示、不阻断生成。
    detail_dir = os.path.join(API_DIR, "orders")
    if os.path.isdir(detail_dir):
        cur = set(ids)
        stale = sorted(n for n in os.listdir(detail_dir)
                       if n.endswith(".json") and n[:-5] not in cur)
        if stale:
            print("提醒：api/orders/ 还有 %d 个非本次订单的历史文件（如 %s）。"
                  % (len(stale), ", ".join(stale[:2])))

    # 8) 前端兜底话术里不能再写死订单号（数据按天滚动，写死的迟早变幽灵单号）
    chat_js = open(os.path.join(JS_DIR, "chat.js"), encoding="utf-8").read()
    if "O2026" in chat_js:
        fail("assets/js/chat.js 里出现了写死的订单号，日期滚动后会失配")

    if errs:
        raise SystemExit("数据一致性自检失败：\n  - " + "\n  - ".join(errs))
    print("一致性自检通过：%d 笔订单无未来时间、无时间线倒挂、状态与时效政策自洽" % len(orders))


if __name__ == "__main__":
    main()
