/* 由 tools/generate_data.py 自动生成，请勿手工编辑。
   用途：本地以 file:// 打开页面时的离线兜底数据。 */
window.CS_DATA = {
  "meta": {
    "demo_name": "云栖数码 · 智能客服 Demo",
    "scenario": "数码 3C 电商在线客服",
    "data_as_of": "2026-09-22",
    "customers": 6,
    "orders": 30,
    "products": 12,
    "status_legend": {
      "pending_payment": "待付款",
      "paid": "待发货（已付款）",
      "shipped": "已发货",
      "in_transit": "运输中",
      "delivered": "已签收",
      "completed": "已完成",
      "cancelled": "已取消",
      "after_sale": "售后处理中",
      "refunded": "已退款"
    },
    "action_legend": {
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
      "query_after_sale": "查看售后进度"
    },
    "rules": {
      "no_reason_return_days": 7,
      "quality_exchange_days": 15,
      "warranty_months": 12
    }
  },
  "customers": [
    {
      "customer_id": "C1001",
      "name": "张伟",
      "gender": "男",
      "phone": "138****1111",
      "level": "普通会员",
      "city": "上海",
      "since": "2023-04-18",
      "address": "上海市浦东新区张江路 88 号 3 号楼 502",
      "tags": [
        "价格敏感",
        "近期活跃"
      ]
    },
    {
      "customer_id": "C1002",
      "name": "李娜",
      "gender": "女",
      "phone": "139****2222",
      "level": "白金会员",
      "city": "北京",
      "since": "2021-11-02",
      "address": "北京市海淀区中关村大街 27 号 A 座 1801",
      "tags": [
        "高价值客户",
        "偏好顺丰",
        "曾发起质量投诉"
      ]
    },
    {
      "customer_id": "C1003",
      "name": "王强",
      "gender": "男",
      "phone": "137****3333",
      "level": "普通会员",
      "city": "广州",
      "since": "2024-01-09",
      "address": "广州市天河区体育西路 103 号 2201",
      "tags": [
        "退换货频次偏高"
      ]
    },
    {
      "customer_id": "C1004",
      "name": "刘敏",
      "gender": "女",
      "phone": "136****4444",
      "level": "黄金会员",
      "city": "成都",
      "since": "2022-07-25",
      "address": "成都市武侯区天府大道北段 1480 号 9 栋 1103",
      "tags": [
        "长期客户",
        "对物流时效敏感"
      ]
    },
    {
      "customer_id": "C1005",
      "name": "陈杰",
      "gender": "男",
      "phone": "135****5555",
      "level": "普通会员",
      "city": "深圳",
      "since": "2025-03-14",
      "address": "深圳市南山区科苑南路 2666 号 5 栋 801",
      "tags": [
        "企业采购意向"
      ]
    },
    {
      "customer_id": "C1006",
      "name": "赵雪",
      "gender": "女",
      "phone": "133****6666",
      "level": "钻石会员",
      "city": "杭州",
      "since": "2020-09-30",
      "address": "杭州市西湖区文三路 259 号 2 幢 1602",
      "tags": [
        "钻石会员",
        "享专属客服",
        "复购率高"
      ]
    }
  ],
  "products": [
    {
      "sku": "SKU-A001",
      "name": "星耀 X1 Pro 智能手机 256GB",
      "price": 4999.0,
      "category": "手机"
    },
    {
      "sku": "SKU-A002",
      "name": "星耀 X1 智能手机 128GB",
      "price": 3299.0,
      "category": "手机"
    },
    {
      "sku": "SKU-B001",
      "name": "声动 Air 真无线降噪耳机",
      "price": 799.0,
      "category": "音频"
    },
    {
      "sku": "SKU-B002",
      "name": "声动 Studio 头戴式降噪耳机",
      "price": 1299.0,
      "category": "音频"
    },
    {
      "sku": "SKU-C001",
      "name": "云阅 11 英寸平板电脑",
      "price": 2699.0,
      "category": "平板"
    },
    {
      "sku": "SKU-C002",
      "name": "云阅平板磁吸键盘保护套",
      "price": 399.0,
      "category": "配件"
    },
    {
      "sku": "SKU-D001",
      "name": "轻风 14 英寸轻薄笔记本",
      "price": 5499.0,
      "category": "电脑"
    },
    {
      "sku": "SKU-E001",
      "name": "极速 65W 氮化镓充电器",
      "price": 149.0,
      "category": "配件"
    },
    {
      "sku": "SKU-E002",
      "name": "耐力 20000mAh 移动电源",
      "price": 219.0,
      "category": "配件"
    },
    {
      "sku": "SKU-F001",
      "name": "律动 Watch S2 智能手表",
      "price": 1099.0,
      "category": "穿戴"
    },
    {
      "sku": "SKU-G001",
      "name": "穿墙 AX3000 双频路由器",
      "price": 329.0,
      "category": "网络"
    },
    {
      "sku": "SKU-H001",
      "name": "视界 27 英寸 2K 显示器",
      "price": 1399.0,
      "category": "显示"
    }
  ],
  "orders": [
    {
      "order_id": "O202609210901",
      "customer_id": "C1001",
      "status": "pending_payment",
      "status_label": "待付款",
      "created_at": "2026-09-21 10:07",
      "paid_at": null,
      "shipped_at": null,
      "signed_at": null,
      "completed_at": null,
      "amount": 799.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-B001",
          "name": "声动 Air 真无线降噪耳机",
          "price": 799.0,
          "qty": 1,
          "subtotal": 799.0
        }
      ],
      "carrier": null,
      "carrier_phone": null,
      "tracking_no": null,
      "estimated_delivery": null,
      "address": "上海市浦东新区张江路 88 号 3 号楼 502",
      "timeline": [
        {
          "at": "2026-09-21 10:07",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-22 10:07",
          "text": "已发送付款提醒，24 小时内未付款将自动关闭订单",
          "type": "warn"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "cancel_order",
        "pay_reminder"
      ],
      "available_action_labels": [
        "取消订单",
        "获取支付链接"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609190902",
      "customer_id": "C1001",
      "status": "paid",
      "status_label": "待发货（已付款）",
      "created_at": "2026-09-19 11:14",
      "paid_at": "2026-09-19 11:26",
      "shipped_at": null,
      "signed_at": null,
      "completed_at": null,
      "amount": 4999.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-A001",
          "name": "星耀 X1 Pro 智能手机 256GB",
          "price": 4999.0,
          "qty": 1,
          "subtotal": 4999.0
        }
      ],
      "carrier": null,
      "carrier_phone": null,
      "tracking_no": null,
      "estimated_delivery": null,
      "address": "上海市浦东新区张江路 88 号 3 号楼 502",
      "timeline": [
        {
          "at": "2026-09-19 11:14",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-19 11:26",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-19 13:14",
          "text": "仓库已接单，正在拣货打包",
          "type": "info"
        }
      ],
      "after_sale": null,
      "refund_eligible": true,
      "refund_deadline": null,
      "refund_note": "未发货订单可直接取消并全额退款",
      "available_actions": [
        "cancel_order",
        "urge_shipping"
      ],
      "available_action_labels": [
        "取消订单",
        "催发货"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609140903",
      "customer_id": "C1001",
      "status": "in_transit",
      "status_label": "运输中",
      "created_at": "2026-09-14 12:21",
      "paid_at": "2026-09-14 12:33",
      "shipped_at": "2026-09-15 15:21",
      "signed_at": null,
      "completed_at": null,
      "amount": 298.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-E001",
          "name": "极速 65W 氮化镓充电器",
          "price": 149.0,
          "qty": 2,
          "subtotal": 298.0
        }
      ],
      "carrier": "顺丰速运",
      "carrier_phone": "95338",
      "tracking_no": "SF202609140903",
      "estimated_delivery": "2026-09-18",
      "address": "上海市浦东新区张江路 88 号 3 号楼 502",
      "timeline": [
        {
          "at": "2026-09-14 12:21",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-14 12:33",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-15 15:21",
          "text": "顺丰速运 已揽收，运单号 SF202609140903",
          "type": "ship"
        },
        {
          "at": "2026-09-15 21:21",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-09-16 21:21",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-17 21:21",
          "text": "到达【城市转运中心】",
          "type": "ship"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "track_logistics",
        "report_logistics_exception"
      ],
      "available_action_labels": [
        "查询物流",
        "申报物流异常"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609140904",
      "customer_id": "C1001",
      "status": "delivered",
      "status_label": "已签收",
      "created_at": "2026-09-14 13:28",
      "paid_at": "2026-09-14 13:40",
      "shipped_at": "2026-09-15 16:28",
      "signed_at": "2026-09-18 14:32",
      "completed_at": null,
      "amount": 1099.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-F001",
          "name": "律动 Watch S2 智能手表",
          "price": 1099.0,
          "qty": 1,
          "subtotal": 1099.0
        }
      ],
      "carrier": "中通快递",
      "carrier_phone": "95311",
      "tracking_no": "ZTO202609140904",
      "estimated_delivery": null,
      "address": "上海市浦东新区张江路 88 号 3 号楼 502",
      "timeline": [
        {
          "at": "2026-09-14 13:28",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-14 13:40",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-15 16:28",
          "text": "中通快递 已揽收，运单号 ZTO202609140904",
          "type": "ship"
        },
        {
          "at": "2026-09-15 22:28",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-09-16 22:28",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-17 22:28",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-18 22:28",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-09-18 14:32",
          "text": "已签收，感谢使用",
          "type": "ok"
        }
      ],
      "after_sale": null,
      "refund_eligible": true,
      "refund_deadline": "2026-09-25",
      "refund_note": "签收后 4 天内，可享 7 天无理由退货",
      "available_actions": [
        "apply_refund",
        "track_logistics",
        "apply_exchange"
      ],
      "available_action_labels": [
        "申请退款",
        "查询物流",
        "申请换货"
      ],
      "internal_note": "签收 2026-09-18"
    },
    {
      "order_id": "O202606100905",
      "customer_id": "C1001",
      "status": "completed",
      "status_label": "已完成",
      "created_at": "2026-06-10 14:35",
      "paid_at": "2026-06-10 14:47",
      "shipped_at": "2026-06-11 17:35",
      "signed_at": null,
      "completed_at": "2026-06-14 00:00",
      "amount": 2699.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-C001",
          "name": "云阅 11 英寸平板电脑",
          "price": 2699.0,
          "qty": 1,
          "subtotal": 2699.0
        }
      ],
      "carrier": "京东物流",
      "carrier_phone": "950616",
      "tracking_no": "JD202606100905",
      "estimated_delivery": null,
      "address": "上海市浦东新区张江路 88 号 3 号楼 502",
      "timeline": [
        {
          "at": "2026-06-10 14:35",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-06-10 14:47",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-06-11 17:35",
          "text": "京东物流 已揽收，运单号 JD202606100905",
          "type": "ship"
        },
        {
          "at": "2026-06-11 23:35",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-06-12 23:35",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-06-13 23:35",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-06-14 23:35",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-06-14 00:00",
          "text": "订单完成（已过售后期）",
          "type": "ok"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "apply_repair",
        "apply_exchange",
        "invoice_query"
      ],
      "available_action_labels": [
        "申请维修",
        "申请换货",
        "查询发票"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609200906",
      "customer_id": "C1002",
      "status": "paid",
      "status_label": "待发货（已付款）",
      "created_at": "2026-09-20 15:42",
      "paid_at": "2026-09-20 15:54",
      "shipped_at": null,
      "signed_at": null,
      "completed_at": null,
      "amount": 5499.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-D001",
          "name": "轻风 14 英寸轻薄笔记本",
          "price": 5499.0,
          "qty": 1,
          "subtotal": 5499.0
        }
      ],
      "carrier": null,
      "carrier_phone": null,
      "tracking_no": null,
      "estimated_delivery": null,
      "address": "北京市海淀区中关村大街 27 号 A 座 1801",
      "timeline": [
        {
          "at": "2026-09-20 15:42",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-20 15:54",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-20 17:42",
          "text": "仓库已接单，正在拣货打包",
          "type": "info"
        }
      ],
      "after_sale": null,
      "refund_eligible": true,
      "refund_deadline": null,
      "refund_note": "未发货订单可直接取消并全额退款",
      "available_actions": [
        "cancel_order",
        "urge_shipping"
      ],
      "available_action_labels": [
        "取消订单",
        "催发货"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609150907",
      "customer_id": "C1002",
      "status": "in_transit",
      "status_label": "运输中",
      "created_at": "2026-09-15 16:49",
      "paid_at": "2026-09-15 17:01",
      "shipped_at": "2026-09-16 19:49",
      "signed_at": null,
      "completed_at": null,
      "amount": 1299.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-B002",
          "name": "声动 Studio 头戴式降噪耳机",
          "price": 1299.0,
          "qty": 1,
          "subtotal": 1299.0
        }
      ],
      "carrier": "顺丰速运",
      "carrier_phone": "95338",
      "tracking_no": "SF202609150907",
      "estimated_delivery": "2026-09-19",
      "address": "北京市海淀区中关村大街 27 号 A 座 1801",
      "timeline": [
        {
          "at": "2026-09-15 16:49",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-15 17:01",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-16 19:49",
          "text": "顺丰速运 已揽收，运单号 SF202609150907",
          "type": "ship"
        },
        {
          "at": "2026-09-17 01:49",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-09-18 01:49",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-19 01:49",
          "text": "到达【城市转运中心】",
          "type": "ship"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "track_logistics",
        "report_logistics_exception"
      ],
      "available_action_labels": [
        "查询物流",
        "申报物流异常"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609050908",
      "customer_id": "C1002",
      "status": "delivered",
      "status_label": "已签收",
      "created_at": "2026-09-05 17:56",
      "paid_at": "2026-09-05 18:08",
      "shipped_at": "2026-09-06 20:56",
      "signed_at": "2026-09-08 14:32",
      "completed_at": null,
      "amount": 399.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-C002",
          "name": "云阅平板磁吸键盘保护套",
          "price": 399.0,
          "qty": 1,
          "subtotal": 399.0
        }
      ],
      "carrier": "京东物流",
      "carrier_phone": "950616",
      "tracking_no": "JD202609050908",
      "estimated_delivery": null,
      "address": "北京市海淀区中关村大街 27 号 A 座 1801",
      "timeline": [
        {
          "at": "2026-09-05 17:56",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-05 18:08",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-06 20:56",
          "text": "京东物流 已揽收，运单号 JD202609050908",
          "type": "ship"
        },
        {
          "at": "2026-09-07 02:56",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-09-08 02:56",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-09 02:56",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-10 02:56",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-09-08 14:32",
          "text": "已签收，感谢使用",
          "type": "ok"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": "2026-09-15",
      "refund_note": "已超出 7 天无理由退货期（签收 2026-09-08）",
      "available_actions": [
        "track_logistics",
        "apply_exchange"
      ],
      "available_action_labels": [
        "查询物流",
        "申请换货"
      ],
      "internal_note": "签收 2026-09-08"
    },
    {
      "order_id": "O202607220909",
      "customer_id": "C1002",
      "status": "after_sale",
      "status_label": "售后处理中",
      "created_at": "2026-07-22 09:03",
      "paid_at": "2026-07-22 09:15",
      "shipped_at": "2026-07-23 12:03",
      "signed_at": null,
      "completed_at": null,
      "amount": 3299.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-A002",
          "name": "星耀 X1 智能手机 128GB",
          "price": 3299.0,
          "qty": 1,
          "subtotal": 3299.0
        }
      ],
      "carrier": "顺丰速运",
      "carrier_phone": "95338",
      "tracking_no": "SF202607220909",
      "estimated_delivery": null,
      "address": "北京市海淀区中关村大街 27 号 A 座 1801",
      "timeline": [
        {
          "at": "2026-07-22 09:03",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-07-22 09:15",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-07-23 12:03",
          "text": "顺丰速运 已揽收，运单号 SF202607220909",
          "type": "ship"
        },
        {
          "at": "2026-07-23 18:03",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-07-24 18:03",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-07-25 18:03",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-07-26 18:03",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-07-25 09:03",
          "text": "售后单已受理，等待检测/审核",
          "type": "warn"
        }
      ],
      "after_sale": {
        "ticket_id": "AS07220909",
        "type": "退款",
        "status": "审核中",
        "reason": "商品质量问题",
        "applied_at": "2026-07-25",
        "refund_amount": 3299.0,
        "expect": "审核通过后 1-3 个工作日退款到账"
      },
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "query_after_sale"
      ],
      "available_action_labels": [
        "查看售后进度"
      ],
      "internal_note": "质量问题退款审核中，已寄回（运单 SF1380029941）"
    },
    {
      "order_id": "O202605300910",
      "customer_id": "C1002",
      "status": "completed",
      "status_label": "已完成",
      "created_at": "2026-05-30 10:10",
      "paid_at": "2026-05-30 10:22",
      "shipped_at": "2026-05-31 13:10",
      "signed_at": null,
      "completed_at": "2026-06-03 00:00",
      "amount": 329.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-G001",
          "name": "穿墙 AX3000 双频路由器",
          "price": 329.0,
          "qty": 1,
          "subtotal": 329.0
        }
      ],
      "carrier": "中通快递",
      "carrier_phone": "95311",
      "tracking_no": "ZTO202605300910",
      "estimated_delivery": null,
      "address": "北京市海淀区中关村大街 27 号 A 座 1801",
      "timeline": [
        {
          "at": "2026-05-30 10:10",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-05-30 10:22",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-05-31 13:10",
          "text": "中通快递 已揽收，运单号 ZTO202605300910",
          "type": "ship"
        },
        {
          "at": "2026-05-31 19:10",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-06-01 19:10",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-06-02 19:10",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-06-03 19:10",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-06-03 00:00",
          "text": "订单完成（已过售后期）",
          "type": "ok"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "apply_repair",
        "apply_exchange",
        "invoice_query"
      ],
      "available_action_labels": [
        "申请维修",
        "申请换货",
        "查询发票"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609220911",
      "customer_id": "C1003",
      "status": "pending_payment",
      "status_label": "待付款",
      "created_at": "2026-09-22 11:17",
      "paid_at": null,
      "shipped_at": null,
      "signed_at": null,
      "completed_at": null,
      "amount": 219.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-E002",
          "name": "耐力 20000mAh 移动电源",
          "price": 219.0,
          "qty": 1,
          "subtotal": 219.0
        }
      ],
      "carrier": null,
      "carrier_phone": null,
      "tracking_no": null,
      "estimated_delivery": null,
      "address": "广州市天河区体育西路 103 号 2201",
      "timeline": [
        {
          "at": "2026-09-22 11:17",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-23 11:17",
          "text": "已发送付款提醒，24 小时内未付款将自动关闭订单",
          "type": "warn"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "cancel_order",
        "pay_reminder"
      ],
      "available_action_labels": [
        "取消订单",
        "获取支付链接"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609170912",
      "customer_id": "C1003",
      "status": "in_transit",
      "status_label": "运输中",
      "created_at": "2026-09-17 12:24",
      "paid_at": "2026-09-17 12:36",
      "shipped_at": "2026-09-18 15:24",
      "signed_at": null,
      "completed_at": null,
      "amount": 4999.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-A001",
          "name": "星耀 X1 Pro 智能手机 256GB",
          "price": 4999.0,
          "qty": 1,
          "subtotal": 4999.0
        }
      ],
      "carrier": "京东物流",
      "carrier_phone": "950616",
      "tracking_no": "JD202609170912",
      "estimated_delivery": "2026-09-21",
      "address": "广州市天河区体育西路 103 号 2201",
      "timeline": [
        {
          "at": "2026-09-17 12:24",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-17 12:36",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-18 15:24",
          "text": "京东物流 已揽收，运单号 JD202609170912",
          "type": "ship"
        },
        {
          "at": "2026-09-18 21:24",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-09-19 21:24",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-20 21:24",
          "text": "到达【城市转运中心】",
          "type": "ship"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "track_logistics",
        "report_logistics_exception"
      ],
      "available_action_labels": [
        "查询物流",
        "申报物流异常"
      ],
      "internal_note": "高价值快件，需本人签收"
    },
    {
      "order_id": "O202609120913",
      "customer_id": "C1003",
      "status": "delivered",
      "status_label": "已签收",
      "created_at": "2026-09-12 13:31",
      "paid_at": "2026-09-12 13:43",
      "shipped_at": "2026-09-13 16:31",
      "signed_at": "2026-09-16 14:32",
      "completed_at": null,
      "amount": 799.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-B001",
          "name": "声动 Air 真无线降噪耳机",
          "price": 799.0,
          "qty": 1,
          "subtotal": 799.0
        }
      ],
      "carrier": "中通快递",
      "carrier_phone": "95311",
      "tracking_no": "ZTO202609120913",
      "estimated_delivery": null,
      "address": "广州市天河区体育西路 103 号 2201",
      "timeline": [
        {
          "at": "2026-09-12 13:31",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-12 13:43",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-13 16:31",
          "text": "中通快递 已揽收，运单号 ZTO202609120913",
          "type": "ship"
        },
        {
          "at": "2026-09-13 22:31",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-09-14 22:31",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-15 22:31",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-16 22:31",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-09-16 14:32",
          "text": "已签收，感谢使用",
          "type": "ok"
        }
      ],
      "after_sale": null,
      "refund_eligible": true,
      "refund_deadline": "2026-09-23",
      "refund_note": "签收后 6 天内，可享 7 天无理由退货",
      "available_actions": [
        "apply_refund",
        "track_logistics",
        "apply_exchange"
      ],
      "available_action_labels": [
        "申请退款",
        "查询物流",
        "申请换货"
      ],
      "internal_note": "签收 2026-09-16"
    },
    {
      "order_id": "O202608280914",
      "customer_id": "C1003",
      "status": "refunded",
      "status_label": "已退款",
      "created_at": "2026-08-28 14:38",
      "paid_at": "2026-08-28 14:50",
      "shipped_at": "2026-08-29 17:38",
      "signed_at": null,
      "completed_at": null,
      "amount": 1099.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-F001",
          "name": "律动 Watch S2 智能手表",
          "price": 1099.0,
          "qty": 1,
          "subtotal": 1099.0
        }
      ],
      "carrier": "中通快递",
      "carrier_phone": "95311",
      "tracking_no": "ZTO202608280914",
      "estimated_delivery": null,
      "address": "广州市天河区体育西路 103 号 2201",
      "timeline": [
        {
          "at": "2026-08-28 14:38",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-08-28 14:50",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-08-29 17:38",
          "text": "中通快递 已揽收，运单号 ZTO202608280914",
          "type": "ship"
        },
        {
          "at": "2026-08-29 23:38",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-08-30 23:38",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-08-31 23:38",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-01 23:38",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-08-31 14:38",
          "text": "退款已原路退回，预计 1-3 个工作日到账",
          "type": "ok"
        }
      ],
      "after_sale": {
        "ticket_id": "AS08280914",
        "type": "退款",
        "status": "已完成",
        "reason": "物流破损",
        "applied_at": "2026-08-29",
        "refund_amount": 1099.0,
        "expect": "已退款"
      },
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "query_after_sale",
        "reorder"
      ],
      "available_action_labels": [
        "查看售后进度",
        "再次购买"
      ],
      "internal_note": "物流破损，已全额退款 1099.00 元"
    },
    {
      "order_id": "O202604150915",
      "customer_id": "C1003",
      "status": "completed",
      "status_label": "已完成",
      "created_at": "2026-04-15 15:45",
      "paid_at": "2026-04-15 15:57",
      "shipped_at": "2026-04-16 18:45",
      "signed_at": null,
      "completed_at": "2026-04-19 00:00",
      "amount": 1399.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-H001",
          "name": "视界 27 英寸 2K 显示器",
          "price": 1399.0,
          "qty": 1,
          "subtotal": 1399.0
        }
      ],
      "carrier": "顺丰速运",
      "carrier_phone": "95338",
      "tracking_no": "SF202604150915",
      "estimated_delivery": null,
      "address": "广州市天河区体育西路 103 号 2201",
      "timeline": [
        {
          "at": "2026-04-15 15:45",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-04-15 15:57",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-04-16 18:45",
          "text": "顺丰速运 已揽收，运单号 SF202604150915",
          "type": "ship"
        },
        {
          "at": "2026-04-17 00:45",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-04-18 00:45",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-04-19 00:45",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-04-20 00:45",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-04-19 00:00",
          "text": "订单完成（已过售后期）",
          "type": "ok"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "apply_repair",
        "apply_exchange",
        "invoice_query"
      ],
      "available_action_labels": [
        "申请维修",
        "申请换货",
        "查询发票"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609210916",
      "customer_id": "C1004",
      "status": "pending_payment",
      "status_label": "待付款",
      "created_at": "2026-09-21 16:52",
      "paid_at": null,
      "shipped_at": null,
      "signed_at": null,
      "completed_at": null,
      "amount": 399.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-C002",
          "name": "云阅平板磁吸键盘保护套",
          "price": 399.0,
          "qty": 1,
          "subtotal": 399.0
        }
      ],
      "carrier": null,
      "carrier_phone": null,
      "tracking_no": null,
      "estimated_delivery": null,
      "address": "成都市武侯区天府大道北段 1480 号 9 栋 1103",
      "timeline": [
        {
          "at": "2026-09-21 16:52",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-22 16:52",
          "text": "已发送付款提醒，24 小时内未付款将自动关闭订单",
          "type": "warn"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "cancel_order",
        "pay_reminder"
      ],
      "available_action_labels": [
        "取消订单",
        "获取支付链接"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609180917",
      "customer_id": "C1004",
      "status": "paid",
      "status_label": "待发货（已付款）",
      "created_at": "2026-09-18 17:59",
      "paid_at": "2026-09-18 18:11",
      "shipped_at": null,
      "signed_at": null,
      "completed_at": null,
      "amount": 3299.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-A002",
          "name": "星耀 X1 智能手机 128GB",
          "price": 3299.0,
          "qty": 1,
          "subtotal": 3299.0
        }
      ],
      "carrier": null,
      "carrier_phone": null,
      "tracking_no": null,
      "estimated_delivery": null,
      "address": "成都市武侯区天府大道北段 1480 号 9 栋 1103",
      "timeline": [
        {
          "at": "2026-09-18 17:59",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-18 18:11",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-18 19:59",
          "text": "仓库已接单，正在拣货打包",
          "type": "info"
        }
      ],
      "after_sale": null,
      "refund_eligible": true,
      "refund_deadline": null,
      "refund_note": "未发货订单可直接取消并全额退款",
      "available_actions": [
        "cancel_order",
        "urge_shipping"
      ],
      "available_action_labels": [
        "取消订单",
        "催发货"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609130918",
      "customer_id": "C1004",
      "status": "in_transit",
      "status_label": "运输中",
      "created_at": "2026-09-13 09:06",
      "paid_at": "2026-09-13 09:18",
      "shipped_at": "2026-09-14 12:06",
      "signed_at": null,
      "completed_at": null,
      "amount": 149.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-E001",
          "name": "极速 65W 氮化镓充电器",
          "price": 149.0,
          "qty": 1,
          "subtotal": 149.0
        }
      ],
      "carrier": "中通快递",
      "carrier_phone": "95311",
      "tracking_no": "ZTO202609130918",
      "estimated_delivery": "2026-09-17",
      "address": "成都市武侯区天府大道北段 1480 号 9 栋 1103",
      "timeline": [
        {
          "at": "2026-09-13 09:06",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-13 09:18",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-14 12:06",
          "text": "中通快递 已揽收，运单号 ZTO202609130918",
          "type": "ship"
        },
        {
          "at": "2026-09-14 18:06",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-09-15 18:06",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-16 18:06",
          "text": "到达【城市转运中心】",
          "type": "ship"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "track_logistics",
        "report_logistics_exception"
      ],
      "available_action_labels": [
        "查询物流",
        "申报物流异常"
      ],
      "internal_note": "物流停滞：最后更新 2026-09-17"
    },
    {
      "order_id": "O202609020919",
      "customer_id": "C1004",
      "status": "delivered",
      "status_label": "已签收",
      "created_at": "2026-09-02 10:13",
      "paid_at": "2026-09-02 10:25",
      "shipped_at": "2026-09-03 13:13",
      "signed_at": "2026-09-06 14:32",
      "completed_at": null,
      "amount": 1299.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-B002",
          "name": "声动 Studio 头戴式降噪耳机",
          "price": 1299.0,
          "qty": 1,
          "subtotal": 1299.0
        }
      ],
      "carrier": "顺丰速运",
      "carrier_phone": "95338",
      "tracking_no": "SF202609020919",
      "estimated_delivery": null,
      "address": "成都市武侯区天府大道北段 1480 号 9 栋 1103",
      "timeline": [
        {
          "at": "2026-09-02 10:13",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-02 10:25",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-03 13:13",
          "text": "顺丰速运 已揽收，运单号 SF202609020919",
          "type": "ship"
        },
        {
          "at": "2026-09-03 19:13",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-09-04 19:13",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-05 19:13",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-06 19:13",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-09-06 14:32",
          "text": "已签收，感谢使用",
          "type": "ok"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": "2026-09-13",
      "refund_note": "已超出 7 天无理由退货期（签收 2026-09-06）",
      "available_actions": [
        "track_logistics",
        "apply_exchange"
      ],
      "available_action_labels": [
        "查询物流",
        "申请换货"
      ],
      "internal_note": "签收 2026-09-06"
    },
    {
      "order_id": "O202606200920",
      "customer_id": "C1004",
      "status": "cancelled",
      "status_label": "已取消",
      "created_at": "2026-06-20 11:20",
      "paid_at": "2026-06-20 11:32",
      "shipped_at": null,
      "signed_at": null,
      "completed_at": null,
      "amount": 5499.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-D001",
          "name": "轻风 14 英寸轻薄笔记本",
          "price": 5499.0,
          "qty": 1,
          "subtotal": 5499.0
        }
      ],
      "carrier": null,
      "carrier_phone": null,
      "tracking_no": null,
      "estimated_delivery": null,
      "address": "成都市武侯区天府大道北段 1480 号 9 栋 1103",
      "timeline": [
        {
          "at": "2026-06-20 11:20",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-06-20 11:32",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-06-20 17:20",
          "text": "订单已取消（未发货），款项原路退回",
          "type": "warn"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "reorder"
      ],
      "available_action_labels": [
        "再次购买"
      ],
      "internal_note": "用户主动取消，未发货"
    },
    {
      "order_id": "O202609190921",
      "customer_id": "C1005",
      "status": "paid",
      "status_label": "待发货（已付款）",
      "created_at": "2026-09-19 12:27",
      "paid_at": "2026-09-19 12:39",
      "shipped_at": null,
      "signed_at": null,
      "completed_at": null,
      "amount": 2198.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-F001",
          "name": "律动 Watch S2 智能手表",
          "price": 1099.0,
          "qty": 2,
          "subtotal": 2198.0
        }
      ],
      "carrier": null,
      "carrier_phone": null,
      "tracking_no": null,
      "estimated_delivery": null,
      "address": "深圳市南山区科苑南路 2666 号 5 栋 801",
      "timeline": [
        {
          "at": "2026-09-19 12:27",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-19 12:39",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-19 14:27",
          "text": "仓库已接单，正在拣货打包",
          "type": "info"
        }
      ],
      "after_sale": null,
      "refund_eligible": true,
      "refund_deadline": null,
      "refund_note": "未发货订单可直接取消并全额退款",
      "available_actions": [
        "cancel_order",
        "urge_shipping"
      ],
      "available_action_labels": [
        "取消订单",
        "催发货"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609160922",
      "customer_id": "C1005",
      "status": "in_transit",
      "status_label": "运输中",
      "created_at": "2026-09-16 13:34",
      "paid_at": "2026-09-16 13:46",
      "shipped_at": "2026-09-17 16:34",
      "signed_at": null,
      "completed_at": null,
      "amount": 2699.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-C001",
          "name": "云阅 11 英寸平板电脑",
          "price": 2699.0,
          "qty": 1,
          "subtotal": 2699.0
        }
      ],
      "carrier": "京东物流",
      "carrier_phone": "950616",
      "tracking_no": "JD202609160922",
      "estimated_delivery": "2026-09-20",
      "address": "深圳市南山区科苑南路 2666 号 5 栋 801",
      "timeline": [
        {
          "at": "2026-09-16 13:34",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-16 13:46",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-17 16:34",
          "text": "京东物流 已揽收，运单号 JD202609160922",
          "type": "ship"
        },
        {
          "at": "2026-09-17 22:34",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-09-18 22:34",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-19 22:34",
          "text": "到达【城市转运中心】",
          "type": "ship"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "track_logistics",
        "report_logistics_exception"
      ],
      "available_action_labels": [
        "查询物流",
        "申报物流异常"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609090923",
      "customer_id": "C1005",
      "status": "delivered",
      "status_label": "已签收",
      "created_at": "2026-09-09 14:41",
      "paid_at": "2026-09-09 14:53",
      "shipped_at": "2026-09-10 17:41",
      "signed_at": "2026-09-13 14:32",
      "completed_at": null,
      "amount": 447.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-E001",
          "name": "极速 65W 氮化镓充电器",
          "price": 149.0,
          "qty": 3,
          "subtotal": 447.0
        }
      ],
      "carrier": "中通快递",
      "carrier_phone": "95311",
      "tracking_no": "ZTO202609090923",
      "estimated_delivery": null,
      "address": "深圳市南山区科苑南路 2666 号 5 栋 801",
      "timeline": [
        {
          "at": "2026-09-09 14:41",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-09 14:53",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-10 17:41",
          "text": "中通快递 已揽收，运单号 ZTO202609090923",
          "type": "ship"
        },
        {
          "at": "2026-09-10 23:41",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-09-11 23:41",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-12 23:41",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-13 23:41",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-09-13 14:32",
          "text": "已签收，感谢使用",
          "type": "ok"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": "2026-09-20",
      "refund_note": "已超出 7 天无理由退货期（签收 2026-09-13）",
      "available_actions": [
        "track_logistics",
        "apply_exchange"
      ],
      "available_action_labels": [
        "查询物流",
        "申请换货"
      ],
      "internal_note": "签收 2026-09-13"
    },
    {
      "order_id": "O202608110924",
      "customer_id": "C1005",
      "status": "after_sale",
      "status_label": "售后处理中",
      "created_at": "2026-08-11 15:48",
      "paid_at": "2026-08-11 16:00",
      "shipped_at": "2026-08-12 18:48",
      "signed_at": null,
      "completed_at": null,
      "amount": 4999.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-A001",
          "name": "星耀 X1 Pro 智能手机 256GB",
          "price": 4999.0,
          "qty": 1,
          "subtotal": 4999.0
        }
      ],
      "carrier": "京东物流",
      "carrier_phone": "950616",
      "tracking_no": "JD202608110924",
      "estimated_delivery": null,
      "address": "深圳市南山区科苑南路 2666 号 5 栋 801",
      "timeline": [
        {
          "at": "2026-08-11 15:48",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-08-11 16:00",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-08-12 18:48",
          "text": "京东物流 已揽收，运单号 JD202608110924",
          "type": "ship"
        },
        {
          "at": "2026-08-13 00:48",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-08-14 00:48",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-08-15 00:48",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-08-16 00:48",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-08-14 15:48",
          "text": "售后单已受理，等待检测/审核",
          "type": "warn"
        }
      ],
      "after_sale": {
        "ticket_id": "AS08110924",
        "type": "换货",
        "status": "待寄回",
        "reason": "商品质量问题（屏幕亮点）",
        "applied_at": "2026-08-12",
        "refund_amount": null,
        "expect": "审核通过后 24 小时内寄出换新机"
      },
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "query_after_sale"
      ],
      "available_action_labels": [
        "查看售后进度"
      ],
      "internal_note": "屏幕亮点，换货申请中"
    },
    {
      "order_id": "O202603050925",
      "customer_id": "C1005",
      "status": "completed",
      "status_label": "已完成",
      "created_at": "2026-03-05 16:55",
      "paid_at": "2026-03-05 17:07",
      "shipped_at": "2026-03-06 19:55",
      "signed_at": null,
      "completed_at": "2026-03-09 00:00",
      "amount": 799.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-B001",
          "name": "声动 Air 真无线降噪耳机",
          "price": 799.0,
          "qty": 1,
          "subtotal": 799.0
        }
      ],
      "carrier": "顺丰速运",
      "carrier_phone": "95338",
      "tracking_no": "SF202603050925",
      "estimated_delivery": null,
      "address": "深圳市南山区科苑南路 2666 号 5 栋 801",
      "timeline": [
        {
          "at": "2026-03-05 16:55",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-03-05 17:07",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-03-06 19:55",
          "text": "顺丰速运 已揽收，运单号 SF202603050925",
          "type": "ship"
        },
        {
          "at": "2026-03-07 01:55",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-03-08 01:55",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-03-09 01:55",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-03-10 01:55",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-03-09 00:00",
          "text": "订单完成（已过售后期）",
          "type": "ok"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "apply_repair",
        "apply_exchange",
        "invoice_query"
      ],
      "available_action_labels": [
        "申请维修",
        "申请换货",
        "查询发票"
      ],
      "internal_note": "在保（保修至 2027-03-10）"
    },
    {
      "order_id": "O202609220926",
      "customer_id": "C1006",
      "status": "pending_payment",
      "status_label": "待付款",
      "created_at": "2026-09-22 17:02",
      "paid_at": null,
      "shipped_at": null,
      "signed_at": null,
      "completed_at": null,
      "amount": 1399.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-H001",
          "name": "视界 27 英寸 2K 显示器",
          "price": 1399.0,
          "qty": 1,
          "subtotal": 1399.0
        }
      ],
      "carrier": null,
      "carrier_phone": null,
      "tracking_no": null,
      "estimated_delivery": null,
      "address": "杭州市西湖区文三路 259 号 2 幢 1602",
      "timeline": [
        {
          "at": "2026-09-22 17:02",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-23 17:02",
          "text": "已发送付款提醒，24 小时内未付款将自动关闭订单",
          "type": "warn"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "cancel_order",
        "pay_reminder"
      ],
      "available_action_labels": [
        "取消订单",
        "获取支付链接"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609200927",
      "customer_id": "C1006",
      "status": "paid",
      "status_label": "待发货（已付款）",
      "created_at": "2026-09-20 09:09",
      "paid_at": "2026-09-20 09:21",
      "shipped_at": null,
      "signed_at": null,
      "completed_at": null,
      "amount": 1598.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-B001",
          "name": "声动 Air 真无线降噪耳机",
          "price": 799.0,
          "qty": 2,
          "subtotal": 1598.0
        }
      ],
      "carrier": null,
      "carrier_phone": null,
      "tracking_no": null,
      "estimated_delivery": null,
      "address": "杭州市西湖区文三路 259 号 2 幢 1602",
      "timeline": [
        {
          "at": "2026-09-20 09:09",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-20 09:21",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-20 11:09",
          "text": "仓库已接单，正在拣货打包",
          "type": "info"
        }
      ],
      "after_sale": null,
      "refund_eligible": true,
      "refund_deadline": null,
      "refund_note": "未发货订单可直接取消并全额退款",
      "available_actions": [
        "cancel_order",
        "urge_shipping"
      ],
      "available_action_labels": [
        "取消订单",
        "催发货"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609180928",
      "customer_id": "C1006",
      "status": "in_transit",
      "status_label": "运输中",
      "created_at": "2026-09-18 10:16",
      "paid_at": "2026-09-18 10:28",
      "shipped_at": "2026-09-19 13:16",
      "signed_at": null,
      "completed_at": null,
      "amount": 5499.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-D001",
          "name": "轻风 14 英寸轻薄笔记本",
          "price": 5499.0,
          "qty": 1,
          "subtotal": 5499.0
        }
      ],
      "carrier": "顺丰速运",
      "carrier_phone": "95338",
      "tracking_no": "SF202609180928",
      "estimated_delivery": "2026-09-22",
      "address": "杭州市西湖区文三路 259 号 2 幢 1602",
      "timeline": [
        {
          "at": "2026-09-18 10:16",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-18 10:28",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-19 13:16",
          "text": "顺丰速运 已揽收，运单号 SF202609180928",
          "type": "ship"
        },
        {
          "at": "2026-09-19 19:16",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-09-20 19:16",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-21 19:16",
          "text": "到达【城市转运中心】",
          "type": "ship"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "track_logistics",
        "report_logistics_exception"
      ],
      "available_action_labels": [
        "查询物流",
        "申报物流异常"
      ],
      "internal_note": ""
    },
    {
      "order_id": "O202609160929",
      "customer_id": "C1006",
      "status": "delivered",
      "status_label": "已签收",
      "created_at": "2026-09-16 11:23",
      "paid_at": "2026-09-16 11:35",
      "shipped_at": "2026-09-17 14:23",
      "signed_at": "2026-09-20 14:32",
      "completed_at": null,
      "amount": 3299.0,
      "currency": "CNY",
      "pay_method": "在线支付（微信）",
      "items": [
        {
          "sku": "SKU-A002",
          "name": "星耀 X1 智能手机 128GB",
          "price": 3299.0,
          "qty": 1,
          "subtotal": 3299.0
        }
      ],
      "carrier": "顺丰速运",
      "carrier_phone": "95338",
      "tracking_no": "SF202609160929",
      "estimated_delivery": null,
      "address": "杭州市西湖区文三路 259 号 2 幢 1602",
      "timeline": [
        {
          "at": "2026-09-16 11:23",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-09-16 11:35",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-09-17 14:23",
          "text": "顺丰速运 已揽收，运单号 SF202609160929",
          "type": "ship"
        },
        {
          "at": "2026-09-17 20:23",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-09-18 20:23",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-19 20:23",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-09-20 20:23",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-09-20 14:32",
          "text": "已签收，感谢使用",
          "type": "ok"
        }
      ],
      "after_sale": null,
      "refund_eligible": true,
      "refund_deadline": "2026-09-27",
      "refund_note": "签收后 2 天内，可享 7 天无理由退货",
      "available_actions": [
        "apply_refund",
        "track_logistics",
        "apply_exchange"
      ],
      "available_action_labels": [
        "申请退款",
        "查询物流",
        "申请换货"
      ],
      "internal_note": "签收 2026-09-20"
    },
    {
      "order_id": "O202607010930",
      "customer_id": "C1006",
      "status": "completed",
      "status_label": "已完成",
      "created_at": "2026-07-01 12:30",
      "paid_at": "2026-07-01 12:42",
      "shipped_at": "2026-07-02 15:30",
      "signed_at": null,
      "completed_at": "2026-07-05 00:00",
      "amount": 399.0,
      "currency": "CNY",
      "pay_method": "在线支付（支付宝）",
      "items": [
        {
          "sku": "SKU-C002",
          "name": "云阅平板磁吸键盘保护套",
          "price": 399.0,
          "qty": 1,
          "subtotal": 399.0
        }
      ],
      "carrier": "京东物流",
      "carrier_phone": "950616",
      "tracking_no": "JD202607010930",
      "estimated_delivery": null,
      "address": "杭州市西湖区文三路 259 号 2 幢 1602",
      "timeline": [
        {
          "at": "2026-07-01 12:30",
          "text": "订单创建，等待付款",
          "type": "order"
        },
        {
          "at": "2026-07-01 12:42",
          "text": "支付成功",
          "type": "order"
        },
        {
          "at": "2026-07-02 15:30",
          "text": "京东物流 已揽收，运单号 JD202607010930",
          "type": "ship"
        },
        {
          "at": "2026-07-02 21:30",
          "text": "已从【发货仓】发出",
          "type": "ship"
        },
        {
          "at": "2026-07-03 21:30",
          "text": "到达【区域分拨中心】",
          "type": "ship"
        },
        {
          "at": "2026-07-04 21:30",
          "text": "到达【城市转运中心】",
          "type": "ship"
        },
        {
          "at": "2026-07-05 21:30",
          "text": "派送中，配送员正在为您派送",
          "type": "ship"
        },
        {
          "at": "2026-07-05 00:00",
          "text": "订单完成（已过售后期）",
          "type": "ok"
        }
      ],
      "after_sale": null,
      "refund_eligible": false,
      "refund_deadline": null,
      "refund_note": "",
      "available_actions": [
        "apply_repair",
        "apply_exchange",
        "invoice_query"
      ],
      "available_action_labels": [
        "申请维修",
        "申请换货",
        "查询发票"
      ],
      "internal_note": ""
    }
  ],
  "kb": {
    "brand": "云栖数码官方商城",
    "service_hours": "在线客服 9:00-21:00（黄金及以上会员 8:00-22:00，钻石会员 7×24）",
    "hotline": "400-820-9900",
    "policies": [
      {
        "id": "POL-01",
        "title": "7 天无理由退货",
        "content": "自签收次日起 7 个自然日内，商品不影响二次销售（外观无划痕、配件包装齐全、赠品一并退回）可申请无理由退货。定制商品、已激活的软件授权、已拆封的卫生类商品不适用。"
      },
      {
        "id": "POL-02",
        "title": "15 天质量换货",
        "content": "自签收次日起 15 个自然日内出现非人为质量问题，可申请换货，往返运费由平台承担，并可使用运费险。"
      },
      {
        "id": "POL-03",
        "title": "1 年质保维修",
        "content": "整机质保 1 年（自签收起算），钻石会员额外延长 6 个月。人为损坏、进水、私自拆机不在质保范围。"
      },
      {
        "id": "POL-04",
        "title": "退款时效",
        "content": "退款按原支付路径退回：微信/支付宝 1-3 个工作日；银行卡 3-7 个工作日；已开具纸质发票的需先寄回发票。"
      },
      {
        "id": "POL-05",
        "title": "取消订单规则",
        "content": "待付款订单可直接取消；已付款未发货订单可取消并全额退款；已发货订单无法取消，可选择拒收或在签收后 7 天内申请退货。"
      },
      {
        "id": "POL-06",
        "title": "发货时效",
        "content": "普通会员 48 小时内发货；黄金/白金会员优先发货；钻石会员当日发货。大促期间顺延 1-2 天。"
      },
      {
        "id": "POL-07",
        "title": "物流异常处理",
        "content": "物流超过 72 小时无更新视为异常件，客服可发起催件；超过 7 天未送达可申请全额退款或补发。"
      },
      {
        "id": "POL-08",
        "title": "发票与售后凭证",
        "content": "电子发票订单完成后自动推送至下单邮箱，可重新索取；维修保修需提供订单号与故障视频/照片。"
      }
    ],
    "member_benefits": {
      "普通会员": {
        "discount": "无专属折扣",
        "ship": "标准发货时效 48 小时",
        "service": "在线客服 9:00-21:00"
      },
      "黄金会员": {
        "discount": "全场 98 折",
        "ship": "优先发货",
        "service": "在线客服 8:00-22:00"
      },
      "白金会员": {
        "discount": "全场 95 折",
        "ship": "优先发货 + 顺丰包邮",
        "service": "专属客服通道"
      },
      "钻石会员": {
        "discount": "全场 92 折",
        "ship": "当日发货 + 顺丰包邮",
        "service": "1 对 1 专属客服 + 延保 6 个月"
      }
    },
    "faq": [
      {
        "q": "订单什么时候能发货？",
        "a": "普通会员付款后 48 小时内，黄金及以上会员优先发货，钻石会员当日发货。"
      },
      {
        "q": "怎么查询物流？",
        "a": "提供订单号或下单手机号，我可以帮您查询最新物流节点。"
      },
      {
        "q": "想退货需要什么条件？",
        "a": "签收次日起 7 天内、商品与外包装完好可申请无理由退货；15 天内质量问题可换货。"
      },
      {
        "q": "退款多久到账？",
        "a": "微信/支付宝 1-3 个工作日，银行卡 3-7 个工作日。"
      },
      {
        "q": "发票怎么开？",
        "a": "订单完成后电子发票会自动发送到下单邮箱，也可以让我为您重新推送。"
      }
    ]
  },
  "generated_as_of": "2026-09-22"
};
