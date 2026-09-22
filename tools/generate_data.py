#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
「云栖数码」智能客服 Demo —— 模拟数据生成器
================================================
一次运行产出三份互相一致的数据产物：

1. data/          前端读取的完整数据集（人可读，便于面试时讲解）
2. api/           静态 REST 风格接口切片（供 Dify 自定义工具直接调用）
                  GitHub Pages 会原样托管这个目录，形如
                  https://<user>.github.io/<repo>/api/orders/by-customer/C1001.json
3. assets/js/data.bundle.js
                  离线兜底数据包（file:// 直接打开网页也能跑）

数据口径固定、可复现：不依赖随机数，改完表格重跑即可。
"""

import json
import os
from datetime import date, datetime, timedelta

# --------------------------------------------------------------------------
# 0. 路径
# --------------------------------------------------------------------------
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
API_DIR = os.path.join(ROOT, "api")
JS_DIR = os.path.join(ROOT, "assets", "js")

# 演示「今天」：所有可操作判断都以这一天为基准，避免数据随时间失效
TODAY = date(2026, 9, 22)

# 售后规则阈值（与 api/kb.json 中的政策保持一致）
NO_REASON_RETURN_DAYS = 7      # 7 天无理由退货
QUALITY_EXCHANGE_DAYS = 15     # 15 天质量问题换货
WARRANTY_MONTHS = 12           # 1 年保修


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
# 字段：订单号后缀, 客户, 下单日, 状态, [(SKU, 数量)], 承运商, 备注
# 状态取值见 STATUS_LABEL
ORDER_SEED = [
    # ---- C1001 张伟（普通会员 / 上海）----
    ("0901", "C1001", "2026-09-21", "pending_payment", [("SKU-B001", 1)], None, ""),
    ("0902", "C1001", "2026-09-19", "paid", [("SKU-A001", 1)], None, ""),
    ("0903", "C1001", "2026-09-14", "in_transit", [("SKU-E001", 2)], "顺丰速运", ""),
    ("0904", "C1001", "2026-09-14", "delivered", [("SKU-F001", 1)], "中通快递", "签收 2026-09-18"),
    ("0905", "C1001", "2026-06-10", "completed", [("SKU-C001", 1)], "京东物流", ""),

    # ---- C1002 李娜（白金会员 / 北京）----
    ("0906", "C1002", "2026-09-20", "paid", [("SKU-D001", 1)], None, ""),
    ("0907", "C1002", "2026-09-15", "in_transit", [("SKU-B002", 1)], "顺丰速运", ""),
    ("0908", "C1002", "2026-09-05", "delivered", [("SKU-C002", 1)], "京东物流", "签收 2026-09-08"),
    ("0909", "C1002", "2026-07-22", "after_sale", [("SKU-A002", 1)], "顺丰速运",
     "质量问题退款审核中，已寄回（运单 SF1380029941）"),
    ("0910", "C1002", "2026-05-30", "completed", [("SKU-G001", 1)], "中通快递", ""),

    # ---- C1003 王强（普通会员 / 广州）----
    ("0911", "C1003", "2026-09-22", "pending_payment", [("SKU-E002", 1)], None, ""),
    ("0912", "C1003", "2026-09-17", "in_transit", [("SKU-A001", 1)], "京东物流", "高价值快件，需本人签收"),
    ("0913", "C1003", "2026-09-12", "delivered", [("SKU-B001", 1)], "中通快递", "签收 2026-09-16"),
    ("0914", "C1003", "2026-08-28", "refunded", [("SKU-F001", 1)], "中通快递", "物流破损，已全额退款 1099.00 元"),
    ("0915", "C1003", "2026-04-15", "completed", [("SKU-H001", 1)], "顺丰速运", ""),

    # ---- C1004 刘敏（黄金会员 / 成都）----
    ("0916", "C1004", "2026-09-21", "pending_payment", [("SKU-C002", 1)], None, ""),
    ("0917", "C1004", "2026-09-18", "paid", [("SKU-A002", 1)], None, ""),
    ("0918", "C1004", "2026-09-13", "in_transit", [("SKU-E001", 1)], "中通快递", "物流停滞：最后更新 2026-09-17"),
    ("0919", "C1004", "2026-09-02", "delivered", [("SKU-B002", 1)], "顺丰速运", "签收 2026-09-06"),
    ("0920", "C1004", "2026-06-20", "cancelled", [("SKU-D001", 1)], None, "用户主动取消，未发货"),

    # ---- C1005 陈杰（普通会员 / 深圳）----
    ("0921", "C1005", "2026-09-19", "paid", [("SKU-F001", 2)], None, ""),
    ("0922", "C1005", "2026-09-16", "in_transit", [("SKU-C001", 1)], "京东物流", ""),
    ("0923", "C1005", "2026-09-09", "delivered", [("SKU-E001", 3)], "中通快递", "签收 2026-09-13"),
    ("0924", "C1005", "2026-08-11", "after_sale", [("SKU-A001", 1)], "京东物流", "屏幕亮点，换货申请中"),
    ("0925", "C1005", "2026-03-05", "completed", [("SKU-B001", 1)], "顺丰速运", "在保（保修至 2027-03-10）"),

    # ---- C1006 赵雪（钻石会员 / 杭州）----
    ("0926", "C1006", "2026-09-22", "pending_payment", [("SKU-H001", 1)], None, ""),
    ("0927", "C1006", "2026-09-20", "paid", [("SKU-B001", 2)], None, ""),
    ("0928", "C1006", "2026-09-18", "in_transit", [("SKU-D001", 1)], "顺丰速运", ""),
    ("0929", "C1006", "2026-09-16", "delivered", [("SKU-A002", 1)], "顺丰速运", "签收 2026-09-20"),
    ("0930", "C1006", "2026-07-01", "completed", [("SKU-C002", 1)], "京东物流", ""),
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


def _dt(d: str, hh=10, mm=0) -> datetime:
    y, m, dd = (int(x) for x in d.split("-"))
    return datetime(y, m, dd, hh, mm)


def _parse_note_date(note: str):
    """从备注里抠出 '签收 YYYY-MM-DD'"""
    if "签收" in note:
        for tok in note.replace("：", ":").split():
            if tok.count("-") == 2 and tok[:2] == "20":
                y, m, d = (int(x) for x in tok.split("-"))
                return date(y, m, d)
    return None


def build_timeline(status, created: datetime, carrier, tracking_no, signed_on):
    """按状态推导物流轨迹与订单时间线"""
    tl = [{"at": created.strftime("%Y-%m-%d %H:%M"), "text": "订单创建，等待付款", "type": "order"}]
    if status == "pending_payment":
        tl.append({"at": (created + timedelta(days=1)).strftime("%Y-%m-%d %H:%M"),
                   "text": "已发送付款提醒，24 小时内未付款将自动关闭订单", "type": "warn"})
        return tl

    tl.append({"at": (created + timedelta(minutes=12)).strftime("%Y-%m-%d %H:%M"),
               "text": "支付成功", "type": "order"})

    if status == "cancelled":
        tl.append({"at": (created + timedelta(hours=6)).strftime("%Y-%m-%d %H:%M"),
                   "text": "订单已取消（未发货），款项原路退回", "type": "warn"})
        return tl

    if status == "paid":
        tl.append({"at": (created + timedelta(hours=2)).strftime("%Y-%m-%d %H:%M"),
                   "text": "仓库已接单，正在拣货打包", "type": "info"})
        return tl

    ship = created + timedelta(days=1, hours=3)
    tn = tracking_no
    tl.append({"at": ship.strftime("%Y-%m-%d %H:%M"),
               "text": "%s 已揽收，运单号 %s" % (carrier, tn), "type": "ship"})

    stops = [
        ("已从【发货仓】发出", 0),
        ("到达【区域分拨中心】", 1),
        ("到达【城市转运中心】", 2),
        ("派送中，配送员正在为您派送", 3),
    ]
    if status in ("shipped", "in_transit"):
        limit = 2 if status == "shipped" else 3
        for text, delta in stops[:limit]:
            tl.append({"at": (ship + timedelta(days=delta, hours=6)).strftime("%Y-%m-%d %H:%M"),
                       "text": text, "type": "ship"})
        return tl

    for text, delta in stops:
        tl.append({"at": (ship + timedelta(days=delta, hours=6)).strftime("%Y-%m-%d %H:%M"),
                   "text": text, "type": "ship"})

    if signed_on:
        tl.append({"at": datetime(signed_on.year, signed_on.month, signed_on.day, 14, 32).strftime("%Y-%m-%d %H:%M"),
                   "text": "已签收，感谢使用", "type": "ok"})
    if status == "completed":
        base = signed_on or (created + timedelta(days=4)).date()
        tl.append({"at": datetime(base.year, base.month, base.day, 0, 0).strftime("%Y-%m-%d %H:%M"),
                   "text": "订单完成（已过售后期）", "type": "ok"})
    if status == "after_sale":
        tl.append({"at": (created + timedelta(days=3)).strftime("%Y-%m-%d %H:%M"),
                   "text": "售后单已受理，等待检测/审核", "type": "warn"})
    if status == "refunded":
        tl.append({"at": (created + timedelta(days=3)).strftime("%Y-%m-%d %H:%M"),
                   "text": "退款已原路退回，预计 1-3 个工作日到账", "type": "ok"})
    return tl


def build_after_sale(status, note, oid, amount):
    if status == "after_sale":
        kind = "换货" if "换货" in note else "退款"
        return {
            "ticket_id": "AS" + oid[-8:],
            "type": kind,
            "status": "审核中" if "退款" in kind or kind == "退款" else "待寄回",
            "reason": "商品质量问题（屏幕亮点）" if "亮点" in note else "商品质量问题",
            "applied_at": "2026-08-12" if "换货" in note else "2026-07-25",
            "refund_amount": amount if kind == "退款" else None,
            "expect": "审核通过后 1-3 个工作日退款到账" if kind == "退款" else "审核通过后 24 小时内寄出换新机",
        }
    if status == "refunded":
        return {
            "ticket_id": "AS" + oid[-8:],
            "type": "退款",
            "status": "已完成",
            "reason": "物流破损",
            "applied_at": "2026-08-29",
            "refund_amount": amount,
            "expect": "已退款",
        }
    return None


def build_orders():
    orders = []
    for suffix, cust, created_s, status, items, carrier, note in ORDER_SEED:
        oid = "O2026" + created_s.replace("-", "")[:6] + suffix
        order_id = "O" + created_s.replace("-", "") + suffix
        created = _dt(created_s, 9 + (int(suffix) % 9), (int(suffix) * 7) % 60)
        signed_on = _parse_note_date(note)

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
            c = CARRIERS[carrier]
            tracking_no = c["code"] + "2026" + created_s.replace("-", "")[4:] + suffix.zfill(4)

        shipped_at = (created + timedelta(days=1, hours=3)).strftime("%Y-%m-%d %H:%M") if carrier else None
        signed_at = None
        if signed_on:
            signed_at = datetime(signed_on.year, signed_on.month, signed_on.day, 14, 32).strftime("%Y-%m-%d %H:%M")

        est = None
        if status in ("shipped", "in_transit"):
            est = (created + timedelta(days=4)).strftime("%Y-%m-%d")

        # 退货资格计算（以 TODAY 为基准，演示期内稳定）
        refund_deadline, refund_eligible, refund_reason = None, False, ""
        if status == "delivered" and signed_on:
            deadline = signed_on + timedelta(days=NO_REASON_RETURN_DAYS)
            refund_deadline = deadline.isoformat()
            if deadline >= TODAY:
                refund_eligible, refund_reason = True, "签收后 %d 天内，可享 7 天无理由退货" % (TODAY - signed_on).days
            else:
                refund_eligible, refund_reason = False, "已超出 7 天无理由退货期（签收 %s）" % signed_on.isoformat()
        elif status == "paid":
            refund_eligible, refund_reason = True, "未发货订单可直接取消并全额退款"

        actions = list(STATUS_ACTIONS.get(status, []))
        if status == "delivered" and not refund_eligible and "apply_refund" in actions:
            actions.remove("apply_refund")

        orders.append({
            "order_id": order_id,
            "customer_id": cust,
            "status": status,
            "status_label": STATUS_LABEL[status],
            "created_at": created.strftime("%Y-%m-%d %H:%M"),
            "paid_at": None if status == "pending_payment" else (created + timedelta(minutes=12)).strftime("%Y-%m-%d %H:%M"),
            "shipped_at": shipped_at,
            "signed_at": signed_at,
            "completed_at": (datetime((signed_on or (created + timedelta(days=4)).date()).year,
                                      (signed_on or (created + timedelta(days=4)).date()).month,
                                      (signed_on or (created + timedelta(days=4)).date()).day, 0, 0).strftime("%Y-%m-%d %H:%M")
                             if status == "completed" else None),
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
            "after_sale": build_after_sale(status, note, order_id, total),
            "refund_eligible": refund_eligible,
            "refund_deadline": refund_deadline,
            "refund_note": refund_reason,
            "available_actions": actions,
            "available_action_labels": [ACTION_LABEL[a] for a in actions],
            "internal_note": note,
        })
    return orders


def build_kb():
    return {
        "brand": "云栖数码官方商城",
        "service_hours": "在线客服 9:00-21:00（黄金及以上会员 8:00-22:00，钻石会员 7×24）",
        "hotline": "400-820-9900",
        "policies": [
            {"id": "POL-01", "title": "7 天无理由退货", "content": "自签收次日起 7 个自然日内，商品不影响二次销售（外观无划痕、配件包装齐全、赠品一并退回）可申请无理由退货。定制商品、已激活的软件授权、已拆封的卫生类商品不适用。"},
            {"id": "POL-02", "title": "15 天质量换货", "content": "自签收次日起 15 个自然日内出现非人为质量问题，可申请换货，往返运费由平台承担，并可使用运费险。"},
            {"id": "POL-03", "title": "1 年质保维修", "content": "整机质保 1 年（自签收起算），钻石会员额外延长 6 个月。人为损坏、进水、私自拆机不在质保范围。"},
            {"id": "POL-04", "title": "退款时效", "content": "退款按原支付路径退回：微信/支付宝 1-3 个工作日；银行卡 3-7 个工作日；已开具纸质发票的需先寄回发票。"},
            {"id": "POL-05", "title": "取消订单规则", "content": "待付款订单可直接取消；已付款未发货订单可取消并全额退款；已发货订单无法取消，可选择拒收或在签收后 7 天内申请退货。"},
            {"id": "POL-06", "title": "发货时效", "content": "普通会员 48 小时内发货；黄金/白金会员优先发货；钻石会员当日发货。大促期间顺延 1-2 天。"},
            {"id": "POL-07", "title": "物流异常处理", "content": "物流超过 72 小时无更新视为异常件，客服可发起催件；超过 7 天未送达可申请全额退款或补发。"},
            {"id": "POL-08", "title": "发票与售后凭证", "content": "电子发票订单完成后自动推送至下单邮箱，可重新索取；维修保修需提供订单号与故障视频/照片。"},
        ],
        "member_benefits": LEVEL_BENEFITS,
        "faq": [
            {"q": "订单什么时候能发货？", "a": "普通会员付款后 48 小时内，黄金及以上会员优先发货，钻石会员当日发货。"},
            {"q": "怎么查询物流？", "a": "提供订单号或下单手机号，我可以帮您查询最新物流节点。"},
            {"q": "想退货需要什么条件？", "a": "签收次日起 7 天内、商品与外包装完好可申请无理由退货；15 天内质量问题可换货。"},
            {"q": "退款多久到账？", "a": "微信/支付宝 1-3 个工作日，银行卡 3-7 个工作日。"},
            {"q": "发票怎么开？", "a": "订单完成后电子发票会自动发送到下单邮箱，也可以让我为您重新推送。"},
        ],
    }


# --------------------------------------------------------------------------
# 3. 输出
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
        "demo_name": "云栖数码 · 智能客服 Demo",
        "scenario": "数码 3C 电商在线客服",
        "data_as_of": TODAY.isoformat(),
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

    # --- 3.1 完整数据集（人可读）---
    wjson(os.path.join(DATA_DIR, "meta.json"), meta)
    wjson(os.path.join(DATA_DIR, "customers.json"), customers)
    wjson(os.path.join(DATA_DIR, "products.json"), products)
    wjson(os.path.join(DATA_DIR, "orders.json"), orders)
    wjson(os.path.join(DATA_DIR, "kb.json"), kb)

    # --- 3.2 静态 API 切片（供 Dify 调用）---
    wjson(os.path.join(API_DIR, "manifest.json"), {
        "name": "云栖数码客服 Demo 静态数据接口",
        "version": "1.0.0",
        "note": "只读静态接口。由 GitHub Pages / 任意静态托管直接提供，Dify 自定义工具可原样调用。",
        "endpoints": [
            {"method": "GET", "path": "/api/customers.json", "desc": "全部客户档案"},
            {"method": "GET", "path": "/api/customers/{customer_id}.json", "desc": "单个客户档案与会员权益"},
            {"method": "GET", "path": "/api/orders/by-customer/{customer_id}.json", "desc": "某客户的全部订单（含物流时间线与可执行动作）"},
            {"method": "GET", "path": "/api/orders/{order_id}.json", "desc": "单个订单详情"},
            {"method": "GET", "path": "/api/kb.json", "desc": "客服政策知识库"},
        ],
        "limitation": "静态托管不提供写接口。取消订单 / 申请退款等写操作由 Dify 代码节点状态机在会话内完成，生产环境应替换为真实后端。",
    })
    wjson(os.path.join(API_DIR, "customers.json"), customers)
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

    # --- 3.3 离线兜底数据包 ---
    os.makedirs(JS_DIR, exist_ok=True)
    bundle = {"meta": meta, "customers": customers, "products": products,
              "orders": orders, "kb": kb, "generated_as_of": TODAY.isoformat()}
    with open(os.path.join(JS_DIR, "data.bundle.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("/* 由 tools/generate_data.py 自动生成，请勿手工编辑。\n")
        f.write("   用途：本地以 file:// 打开页面时的离线兜底数据。 */\n")
        f.write("window.CS_DATA = ")
        json.dump(bundle, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print("OK customers=%d orders=%d products=%d" % (len(customers), len(orders), len(products)))
    print("api files written under api/")
    print("offline bundle written to assets/js/data.bundle.js")


if __name__ == "__main__":
    main()
