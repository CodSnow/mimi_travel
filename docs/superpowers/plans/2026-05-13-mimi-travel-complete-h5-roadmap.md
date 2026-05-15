# 咪咪出行 H5 完整实现总路线图

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将咪咪出行按“本地可验收完整实现”交付为 H5 优先的完整产品闭环，并继续推进真实三方服务和小程序完整闭环。

**Architecture:** 后端事实源先行，业务主数据进入 Python FastAPI + PostgreSQL。TypeScript BFF 作为前端唯一入口，H5 只消费 TS BFF API。支付、AI、地图、附件和通知先通过本地 provider 完成本地验收；真实支付宝/微信、真实 DeepSeek、真实地图 SDK 和小程序完整功能对齐均列为后续必须完成的真实闭环，不再仅作为可选替换边界。

**Tech Stack:** React 19、Rsbuild、Express 5、TypeScript、FastAPI、SQLAlchemy、Alembic、PostgreSQL、pnpm、Docker Compose。

---

## Scope Check

设计文档覆盖多个独立子系统，不能使用一个超大实施计划一次完成。按以下阶段拆分，每个阶段都产生可构建、可测试、可验收的软件增量。

## Plan Sequence

### Phase 1: Python Domain Foundation

**Plan:** [2026-05-13-python-domain-foundation.md](/Users/codsevita/Documents/GitHub/mimi_travel/docs/superpowers/plans/2026-05-13-python-domain-foundation.md)

**Goal:** 建立 Python/PostgreSQL 主事实源基础，补齐迁移、模型、仓储、服务层、统一错误、测试骨架。

**Exit Criteria:**

- Python 服务具备可测试的 session、用户、宠物、地址、服务者入驻申请基础能力。
- Alembic 迁移表达新表和关键字段。
- Python 测试框架可运行，至少覆盖状态机和仓储基础行为。

### Phase 2: Marketplace Flow

**Goal:** 实现需求、报价、推荐、选人、订单生成和订单状态机的 Python 主写链路，并让 TS BFF 切换到 Python。

**Exit Criteria:**

- H5 通过 TS BFF 发布需求，服务者报价，用户接受报价后生成订单。
- 其余报价自动失效。
- 订单状态机禁止非法跳转。
- 所有主数据写入 PostgreSQL。

### Phase 3: Payment, Refund, Messages, Navigation

**Goal:** 实现本地支付 provider、退款、消息、已读、位置上报和导航链接。

**Exit Criteria:**

- 本地支付宝/微信 provider 支持创建、查询、通知模拟、关闭、退款。
- 支付和退款写 `payment_events` 与 `order_events`。
- 会话、消息、已读、位置消息可轮询。
- 高德/百度/Web fallback 链接可验证。

### Phase 4: H5 Complete Screens

**Goal:** 补齐 H5 页面和用户流程，替换静态展示与 JSON demo 逻辑。

**Exit Criteria:**

- H5 覆盖登录、首页、需求大厅、发布需求、需求详情、服务者详情、订单确认、支付确认、支付结果、订单详情、导航、反馈、消息、政策、宠物档案、地址、收藏、支付记录、退款、争议、管理后台。
- 页面均通过 TS BFF 真实读写。
- 照护和出行两条主链路可端到端验收。

### Phase 5: Governance, Policy AI, Provider Boundaries

**Goal:** 补齐后台治理、投诉争议、政策收藏、材料 checklist、本地 RAG 和真实 provider 配置边界。

**Exit Criteria:**

- 管理员可审核服务者、处理投诉争议、查看订单退款、下架异常服务者。
- 政策页支持收藏、复制、材料 checklist、引用来源。
- `LocalRagProvider`、`DeepSeekProvider`、地图和支付 provider 边界清晰。

### Phase 6: End-to-End Verification and MP Compatibility Guard

**Goal:** 完成构建、测试、Docker Compose 联调、冒烟验收，并确保现有小程序演示能力不被破坏。

**Exit Criteria:**

- `pnpm --filter ./server run build` 通过。
- `pnpm --filter ./client run build` 通过。
- Python 测试在用户确认的 Python 环境或 Docker Compose 中通过。
- Docker Compose 全链路健康。
- 小程序现有 `/api/state`、`/api/knowledge`、`/api/ask` 演示链路保持可用。

### Phase 7: Profile and Review Persistence

**Goal:** 将宠物档案、常用地址、服务者入驻申请、评价和照护反馈接入 Python/PostgreSQL，并修复 H5 辅助页的真实读写链路。

**Exit Criteria:**

- 宠物档案和常用地址在 H5 可创建、读取，并写入 PostgreSQL。
- 服务者入驻申请、评价、照护反馈进入 Python/PostgreSQL 主事实源。
- 评价和反馈具备基本权限校验，防止非订单参与者写入。

### Phase 8: Real Provider Closures

**Goal:** 将此前本地 provider 验收能力升级为真实业务闭环。

**Exit Criteria:**

- 真实支付宝和微信支付闭环：商户配置、签名验签、预下单、同步查询、异步回调、关闭、退款、退款查询、幂等和回调重放防护可验收。
- 真实 DeepSeek 闭环：配置管理、超时、重试、降级、本地 RAG 引用融合、敏感信息过滤和请求日志脱敏可验收。
- 真实地图 SDK 闭环：高德/百度 SDK 初始化、定位授权、路线规划、导航唤起、Web fallback 和无权限降级可验收。
- 小程序完整功能对齐：登录、首页、需求、报价、订单、支付、消息、政策、宠物档案、地址、退款、投诉、服务者工作台、管理端必要能力与 H5 共用 TS BFF API。

## Known Unfinished Scope

- 服务者档期仍需补齐独立 `provider_schedules` 表、维护 API 和 H5 工作台入口。
- 宠物档案仍需补齐体型、默认携带方式等字段。
- 全额、订金、尾款支付场景需要在 H5 形成完整验收闭环。
- 退款申请页需要从争议入口升级为真实退款单申请和支付退款链路。
- H5 管理后台需要补齐审核、处理投诉争议、订单/退款明细、下架异常服务者等操作闭环。
- 服务者工作台和报价管理需要补齐服务者身份下的可接需求、报价、接单、服务反馈工作流。
- 办证/托运协助需要从泛化服务类型升级为材料、节点、状态跟踪和陪同确认闭环。
- 真实支付宝/微信、真实 DeepSeek、真实地图 SDK 和小程序完整功能对齐均未完成，后续必须作为正式交付范围实现。

## Execution Rules

- 每个 Phase 单独写详细计划并审阅后执行。
- 每个 Phase 执行前先确认隔离工作区策略；当前目录不是 Git 仓库时，在原目录工作并记录无法 commit。
- Python 命令执行前必须确认环境，或使用 Docker Compose 内的 Python 服务执行。
- 涉及依赖安装、Docker 构建、网络拉取和外部服务启动，执行前必须征得用户明确批准。
- 不继续扩展 `DomainStore` 作为主业务事实源；仅保留迁移期兼容。
