# 云栖数码 · 智能客服工作台（Dify Agent Demo）

一个用 **Dify Chatflow** 搭的电商智能客服 Agent，配一个自己写的客服工作台前端。
它按**当前登录客户身份**查订单、跟物流、处理售后，并把 AI 对话嵌进自建页面里。

> **在线体验：<https://sytang-arch.github.io/smart_service/>**
> 点开即用，无需登录、无需安装。页面顶部有「体验指引」按钮，访问者可自己走完全流程。
> 对话区有三条通道，页面会**自动选当前可用且最好的一条**（见下方「对话通道」）。

**这个 Demo 想证明的不是"能接上大模型"，而是"知道该在哪儿给大模型上锁"。**

---

## 对话通道（三选一，自适应）

| 通道 | 触发条件 | 体验 | 身份注入 |
| --- | --- | --- | --- |
| **工作台对话**（首选） | 配了 `API_BASE` 且代理在线 | 自建 UI，SSE 流式，样式统一 | ✅ 服务端注入 `customer_id`，Agent 不会认错人 |
| **Dify 原生对话** | 配了 `DIFY_WEBAPP_URL` | iframe 内嵌 Dify 官方 WebApp | ❌ iframe 拿不到登录态，需手动说明身份 |
| **规则兜底** | 两条都没配 | 前端规则引擎，页面明确标注模式 | —— |

页面加载时会探测 `/api/health`：**能连上代理就走首选通道；连不上但配了 WebApp 地址就自动切到 iframe**，
两条都不满足才落到规则兜底。切换标签只在配了 `DIFY_WEBAPP_URL` 时出现。

这样设计的原因：链接发给别人（面试官、HR）时，你无法控制对方的环境。
**任何情况下点开都要有反应**，但不能让对方误以为"这就是 AI Agent 的水平"——所以每条通道都会在界面上标明自己是谁。

---

## 它演示了什么

| 能力 | 说明 |
| --- | --- |
| 身份隔离 | Agent 只认系统注入的客户身份，跨账户订单**直接拒绝且不透露任何字段** |
| 真实数据链路 | 订单/物流/售后数据来自 REST 接口，模型没有编造空间 |
| 可执行售后 | 取消订单、申请退款、换货、催发货由**代码节点状态机**判定并执行 |
| 政策兜底 | 7 天无理由、15 天换货、退款时效等回答来自知识库，带出处 |
| 规则引擎 | 售后资格（签收日 + 7 天）在数据层就计算好，前端与 Agent 口径一致 |
| 优雅降级 | 未连接 Dify 时自动切换到前端规则模式，分享出去的链接永远有反应 |

### 三条最能说明问题的演示

1. 选 **张伟 (C1001)** 问「我的订单到哪了」→ 返回真实运单号与物流节点。
2. 问「取消 O202609140903」→ **被拒**（运输中不可取消），给替代方案。
3. 切到 **王强 (C1003)**，仍问订单 `O202609190902` → **被拒，且商品名都不给**。

---

## 架构

```
表现层  客服工作台（静态，GitHub Pages）
          │  ① 读数据 api/*.json          │  ② 对话 POST /api/dify/chat
          ▼                                ▼
数据层  静态只读 API              接入层  轻量代理（持 API Key、注入身份）
(GitHub Pages 托管)                        │
                                           ▼
                                 智能层  Dify Chatflow
                                 意图识别 → HTTP 查订单 → 代码节点（身份+状态机）
                                          → 回复生成 / 知识检索
```

**模型只负责"理解"和"表达"，所有判断都在代码里。**
详细说明见 [`docs/architecture.md`](docs/architecture.md)。

---

## 快速开始

### 方式一：只看页面（30 秒）

```bash
git clone https://github.com/sytang-arch/smart_service.git
cd smart_service
node server/index.js
# 打开 http://localhost:8787
```

此时 AI 对话处于**规则兜底模式**（页面会明确标注），订单、物流、售后流程都可正常体验。

### 方式二：接上真正的 Dify Agent（约 40 分钟）

```bash
# 1. 按指引在 Dify 建应用（首次配置约 40 分钟）
#    完整步骤见 docs/dify-setup.md

# 2. 配置 API Key
cp .env.example .env
#    编辑 .env，填入 DIFY_API_KEY=app-xxxxxxxx

# 3. 启动
node server/index.js
# 打开 http://localhost:8787 —— 右下角会显示「Dify Agent 已连接」
```

> ⚠️ **API Key 只放在 `.env`（已被 .gitignore 排除）**，永远不会进入前端代码或仓库。
> 浏览器只访问同源的 `/api/dify/chat`，由代理转发给 Dify。

### 方式三：部署成可分享的链接

| 部分 | 部署方式 | 效果 |
| --- | --- | --- |
| 前端 + 静态数据 | GitHub Pages（Settings → Pages → main / root） | 页面与静态 API 上线 |
| 对话：零部署方案 | 在 `config.js` 填 `DIFY_WEBAPP_URL`（Dify 应用 → 概览 → WebApp 链接） | 真 Agent，但是官方 UI，且不注入身份 |
| 对话：完整体验 | 部署对话代理（Cloudflare Worker，见 [`server/wrangler.toml.example`](server/wrangler.toml.example)），把地址填进 `API_BASE` | 自建 UI + 真 Agent + 身份注入 |

**只想尽快发链接**：Pages 上线 + 填 `DIFY_WEBAPP_URL`，10 分钟内可完成，不需要服务器。
**想展示架构能力**：再加一个 Worker 代理，把 `API_BASE` 指过去，这样"Key 不进前端"这条设计才真正成立。

> 部署完记得确认：Dify 应用里点过 **发布**，否则 API 会返回
> `{"code":"invalid_param","message":"Workflow not published"}`。

---

## 目录结构

```
smart_service/
├── index.html                  客服工作台（单页）
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── config.js           ★ 唯一需要你填配置的文件
│       ├── store.js            数据层 + 售后状态机 + localStorage
│       ├── chat.js             对话模块（SSE 流式 + 规则兜底引擎）
│       ├── app.js              工作台 UI
│       └── data.bundle.js      离线兜底数据（自动生成，勿手改）
├── data/                       完整数据集（人可读）
├── api/                        静态只读接口（供 Dify 调用）
├── dify/
│   ├── prompts/                三个节点的提示词（可直接粘贴）
│   ├── code/order_action.py    代码节点：身份校验 + 售后状态机
│   ├── tools/                  OpenAPI 自定义工具定义
│   └── kb/                     客服政策知识库文档
├── server/
│   ├── index.js                本地代理 + 静态托管（零依赖）
│   └── worker.js               Cloudflare Worker 版代理
├── docs/
│   ├── dify-setup.md           ★ Dify 从零配置的详细指引
│   ├── architecture.md         架构、接口契约、设计取舍
│   └── interview-notes.md      讲解要点（给自己看的）
└── tools/generate_data.py      数据生成器
```

---

## 数据接口

静态托管于 GitHub Pages，Dify 自定义工具可直接调用。
完整定义见 [`dify/tools/customer-service-api.openapi.yaml`](dify/tools/customer-service-api.openapi.yaml)。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/customers.json` | 全部客户档案 |
| GET | `/api/orders.json` | 全部订单 |
| GET | `/api/products.json` | 全部商品 |
| GET | `/api/customers/{customer_id}.json` | 客户档案与会员权益 |
| GET | `/api/orders/by-customer/{customer_id}.json` | 某客户全部订单 |
| GET | `/api/orders/{order_id}.json` | 单笔订单详情 |
| GET | `/api/kb.json` | 政策知识库 |
| GET | `/api/manifest.json` | 接口清单与限制 |

前端读 `api/*.json`；读取失败（例如直接以 `file://` 打开页面）会自动回落到
`assets/js/data.bundle.js`，离线也能完整演示。

> 给 Dify 的 OpenAPI 工具定义里**只暴露 5 个细粒度端点**（按客户查、按订单查、客户档案、政策、清单），
> 不暴露"全量订单"这类粗接口 —— 给 Agent 的工具应该少而准，不是越多越好。

**模拟数据规模**：6 位客户（4 个会员等级全覆盖）/ 30 笔订单（8 种状态全覆盖）/ 12 个商品 / 8 条政策。

重新生成数据：

```bash
python tools/generate_data.py
```

一次产出三份互相一致的产物：`data/`（人可读）、`api/`（接口切片）、`assets/js/data.bundle.js`（离线兜底）。

---

## 已知限制（说清楚比藏起来好）

| 限制 | 原因 | 生产方案 |
| --- | --- | --- |
| 数据是静态快照，不实时 | GitHub Pages 是静态托管 | 换成真实后端，只改一个 Base URL |
| 取消/退款不落库 | 静态托管没有写接口 | 把代码节点换成调用真实售后 API 的 HTTP 节点 |
| 公开页没配代理时用规则引擎 | 保证分享出去的链接可用 | 配 `DIFY_WEBAPP_URL` 或部署代理 |
| iframe 通道拿不到登录身份 | 跨域 iframe 无法共享会话 | 用代理通道，身份由服务端注入 |
| 没有用户登录鉴权 | Demo 用左侧"切换身份"模拟登录 | 接入真实登录态，`customer_id` 从会话取 |

---

## 排障速查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 对话返回 `Workflow not published` | Dify 应用只存了草稿，没点发布 | 在 Dify 应用右上角点「发布」 |
| 页面显示"规则兜底（未连接 Dify）" | `API_BASE` 为空或代理没起 | 启动 `node server/index.js`，或填 Worker 地址 |
| 页面显示"代理已连，但 Dify Key 未配置" | 代理起来了但 `.env` 没填 Key | 填 `DIFY_API_KEY` 后重启代理 |
| 代理启动日志提示"未配置" | `.env` 不在项目根目录 | 必须是 `smart_service/.env`，文件名没有前缀 |
| iframe 一片空白 | Dify 应用未公开 / 浏览器拦截第三方 Cookie | 在 Dify 把应用设为公开；换 Chrome 无痕窗口再试 |

---

## 技术栈

- **前端**：原生 HTML / CSS / JavaScript，**零依赖、零构建**（离线可用、静态托管友好）
- **对话**：Dify Chat API + SSE 流式渲染
- **后端**：Node.js 内置 `http` 模块（无需 `npm install`）；Cloudflare Worker 版同构
- **数据**：Python 3 生成器
- **Agent**：Dify Chatflow（LLM 节点 × 2 + HTTP 节点 + 代码节点 + 知识检索）

---

## 相关文档

- 从零配置 Dify Agent → [`docs/dify-setup.md`](docs/dify-setup.md)
- 架构与接口契约 → [`docs/architecture.md`](docs/architecture.md)
- 讲解要点与高频追问 → [`docs/interview-notes.md`](docs/interview-notes.md)

---

演示用数据，非真实客户与订单信息。
