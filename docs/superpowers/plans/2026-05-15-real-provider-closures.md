# Phase 8 Real Provider Closures

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`.

**Goal:** 将 Phase 1-7 的本地 provider 与演示兼容能力升级为真实闭环：真实支付宝/微信、真实 DeepSeek、真实地图 SDK、小程序完整功能对齐。

**Architecture:** 保持 `H5 / MP -> TypeScript BFF -> Python FastAPI -> PostgreSQL`。Python 继续作为支付订单事实源；TS BFF 负责对外 provider 编排、签名验签、SDK 配置下发和客户端统一 API；H5 与小程序共用 BFF API。

**Important Constraints:**

- 不在仓库提交真实密钥、证书、商户号或私钥。
- 没有真实商户/平台密钥时，真实 provider 必须明确返回 `not_configured` 或降级到本地 provider，不能伪装成真实成功。
- 所有外部网络调用必须有 timeout、错误映射和日志脱敏。
- 支付回调必须做签名验签、幂等和回调重放防护。
- 小程序必须使用现有 TS BFF API，不新增独立后端事实源。

## Task 1: Real Payment Provider Closure

**Owner Scope:** `python-service/app/services/payments/**`, `python-service/app/config/**`, `python-service/app/schemas/payments.py`, `python-service/tests/**`。

**Requirements:**

- 在 Python 支付服务中增加 provider 选择：`local`、`alipay`、`wechat_pay`。
- 支持真实 provider 配置项，但配置缺失时返回清晰错误，不落入假成功。
- 支持真实支付生命周期的服务层接口形态：创建支付、查询支付、关闭支付、退款、退款查询、通知验签结果承接。
- 不提交真实密钥。配置只从环境变量读取。
- 保留现有本地 provider 测试和兼容行为。
- 增加测试覆盖：未配置真实 provider、幂等创建、本地 provider 兼容、退款金额边界。

**Exit Criteria:**

- Python tests 通过。
- H5 现有订金支付不被破坏。
- 真实 provider 没配置时不会伪造成功。

## Task 2: Real DeepSeek Provider Closure

**Owner Scope:** `server/src/services/policy-providers.ts`, `server/src/modules/policy/routes.ts`, `server/src/config/env.ts`, `server/src/engine.ts`, `server/src/internal-dto/**` if needed。

**Requirements:**

- 将 `DeepSeekProvider` 从占位实现升级为真实 HTTP 调用 provider。
- 使用官方 OpenAI-compatible `/chat/completions` 形态，支持 `DEEPSEEK_API_KEY`、base URL、model、timeout。
- 请求中融合本地 RAG contexts，返回 answer、checklist、citations、contexts。
- API Key 和敏感请求内容不得进入响应或普通日志。
- DeepSeek 超时、429、5xx、响应结构异常时降级到 LocalRagProvider，并在 `mode` 中明确原因。
- 不新增三方 SDK；优先使用 Node 运行时 fetch/AbortController。

**Exit Criteria:**

- `pnpm --filter ./server run build` 通过。
- 未配置 key 时继续使用本地 RAG。
- 配置 key 时会真实请求 DeepSeek，并保留引用来源。

## Task 3: Real Map SDK Closure

**Owner Scope:** `server/src/services/navigation-service.ts`, `server/src/modules/navigation/routes.ts`, `server/src/config/env.ts`, `client/src/features/mimi-dashboard/**`, `client/src/pages/flow/ui/FlowScreen.tsx`, `client/src/pages/orders/ui/OrdersPage.tsx`, `client/src/shared/api/mimiApi.ts`, `client/src/app/styles/global.css`。

**Requirements:**

- BFF 暴露地图 SDK 配置接口，支持 AMap/Baidu key、enabled 状态和 Web fallback。
- H5 导航页在有 SDK key 时加载真实地图 SDK 并展示路线/导航入口；无 key 时保留 Web fallback。
- 处理定位授权失败、SDK 加载失败、订单缺少起终点等状态。
- 不提交真实地图 key。
- 保留现有高德/百度 URI 生成能力。

**Exit Criteria:**

- `pnpm --filter ./client run build` 和 server build 通过。
- 无 SDK key 时 H5 不报错，有清晰降级。
- 导航页不再只有一个 Web 链接，具备 SDK 配置闭环。

## Task 4: Mini Program Full API Alignment

**Owner Scope:** `mp/**` only.

**Requirements:**

- 将小程序从演示兼容升级为使用 TS BFF API 的完整主流程客户端。
- 覆盖登录、首页、需求、报价、订单、支付、消息、政策、宠物档案、地址、退款、投诉、服务者工作台的最小可用页面或入口。
- 所有业务数据从 BFF API 读取或写入，不维护独立事实源。
- 保留现有小程序构建方式和 Taro 项目结构。
- 未实现的高风险能力必须在 UI 上以真实 API 状态显示，不能用静态成功假象替代。

**Exit Criteria:**

- 小程序构建通过。
- 小程序能通过配置的 BFF base URL 调用核心 API。
- `/api/state`、`/api/knowledge`、`/api/ask` 演示兼容不被破坏。

## Integration Checklist

- [x] 四个任务各自完成并自评。
- [x] 规格符合性评审完成，并补齐退款查询、支付通知不变量校验、H5 类型错误、MP WeApp 构建依赖缺口。
- [x] 代码质量评审完成，并修复 H5 类型检查和支付通知误标成功风险。
- [x] Python compile 和 tests 通过。
- [x] Server build 通过。
- [x] Client build 通过。
- [x] MP H5 和 WeApp build 通过。
- [x] `当前实施计划.md` 记录 Phase 8 验证结果。

## Remaining Production Gate

- 真实支付宝/微信网关 HTTP 适配仍需要真实商户号、证书、私钥、公钥、回调域名和签名算法适配；当前代码已确保配置缺失或 adapter 未完成时返回明确错误，不伪造真实成功。
