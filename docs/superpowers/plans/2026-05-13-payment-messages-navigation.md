# Phase 3: Payment, Refund, Messages, Navigation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现本地支付 provider、退款、消息、已读、位置上报和导航链接，让 H5 经 TS BFF 使用 Python/PostgreSQL 主事实源完成支付与沟通闭环。

**Architecture:** 保持 `H5 React -> TypeScript BFF -> Python FastAPI -> PostgreSQL`。支付、退款、消息和位置主写入 Python；TS BFF 只做参数校验、DTO 转换和通知签名校验兼容。

**Branch / Worktree:** `phase-3-payment-messages-navigation` at `.worktrees/phase-3-payment-messages-navigation`，基于 `phase-2-marketplace-flow`。

## Scope

### In Scope

- Python 数据模型补齐 `payment_events` 与 `message_reads`，并增强消息 payload/业务引用字段。
- Python 支付仓储与服务：创建支付、查询、模拟通知/标记支付、关闭、退款、支付事件、订单事件。
- Python 消息仓储与服务：会话列表、会话详情、发送消息、标记已读、位置消息。
- Python 位置仓储与服务：位置上报、订单最新位置查询。
- Python 内部 API：`/internal/payments`、`/internal/messages`、`/internal/locations`。
- TS BFF 切换 `/api/payments`、`/api/messages`、`/api/locations/report` 到 Python。
- 保留现有 `/api/navigation/link` 高德/百度/Web fallback 链接生成，并补参数验收。
- 增加 Python 单元/API 测试和 TS 构建验证。

### Out of Scope

- 真实支付宝/微信商户接入和线上回调域名。
- WebSocket/SSE 实时消息。
- 地图 SDK、真实路径规划、坐标系真实转换。
- H5 页面补齐，留到 Phase 4。
- 后台争议治理和政策 AI 增强，留到 Phase 5。

## Tasks

- [ ] Task 1: 数据模型与迁移
  - 新增 `PaymentEvent`、`MessageRead` 模型。
  - 增强 `Payment` 幂等键/查询次数/事件摘要字段。
  - 增强 `Message` payload、订单引用、客户端消息 ID 字段。
  - 新增 Alembic migration `0005_payment_messages_navigation.py`。

- [ ] Task 2: Python 支付退款链路
  - 新增 `PaymentRepository`。
  - 新增 `PaymentService`，封装 `LocalPaymentProvider`。
  - 支持创建、查询、通知模拟、关闭、退款。
  - 支付和退款写入 `payment_events` 与 `order_events`，同步订单 `payment_status/refund_status/status`。

- [ ] Task 3: Python 消息与位置链路
  - 新增 `MessageRepository`、`LocationRepository`。
  - 新增消息服务与位置服务。
  - 支持会话轮询、消息轮询、发送消息、已读、位置上报、位置消息。

- [ ] Task 4: Python 内部 API
  - 新增 schema：payments、messages、locations。
  - 新增 internal routers 并挂载到 `app/api/router.py`。
  - 覆盖 API 测试。

- [ ] Task 5: TS BFF 切换
  - 新增 internal DTO。
  - 扩展 `PythonClient`。
  - `/api/payments`、`/api/messages`、`/api/locations/report` 改用 Python。
  - `/api/navigation/link` 保持本地生成并确保参数清晰。

- [ ] Task 6: 验证、记录、提交和推送
  - Python compile。
  - Python tests。
  - Server build。
  - Client build。
  - 更新 `当前实施计划.md` Phase 3 验证结果。
  - 推送 `phase-3-payment-messages-navigation`。

## Acceptance Criteria

- 本地支付宝/微信 provider 可创建、查询、模拟通知、关闭、退款。
- 支付成功后订单从 `pending_payment` 推进到 `paid`，并写订单事件。
- 退款成功后退款记录、支付事件、订单退款状态一致。
- 会话、消息、已读和位置消息可通过 TS BFF 轮询。
- 位置上报写 PostgreSQL，订单参与方可查询相关位置消息。
- 高德/百度/Web fallback 链接可验证。
- 现有小程序兼容接口不被破坏。
