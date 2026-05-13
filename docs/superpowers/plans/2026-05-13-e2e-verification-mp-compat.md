# Phase 6: End-to-End Verification and MP Compatibility Guard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成 H5 本地可验收链路的端到端验证，并确保小程序演示依赖的 `/api/state`、`/api/knowledge`、`/api/ask` 不被破坏。

**Architecture:** React H5 -> TS BFF -> Python FastAPI -> PostgreSQL。Compose 启动空库后必须能通过 BFF 完成登录、服务者读取、需求、报价、接单、支付、会话和政策兼容接口冒烟。

## Scope

- 修复 Compose 空库下 H5 主链路断裂问题：登录用户和可报价服务者必须存在于 Python/PostgreSQL。
- 补齐 TS BFF 对 Python 身份、服务者公开列表/详情的读取。
- 增加可重复执行的 Compose 冒烟脚本。
- 执行 Python、Server、Client 和 Docker Compose 全链路验证。
- 记录 Phase 6 验证结果。

## Tasks

- [x] Task 1: Python provider seed and provider read API
  - 在 Python 启动时确保示例服务者写入 PostgreSQL。
  - 提供内部服务者列表/详情 API，返回 H5 所需 provider bundle。
  - 覆盖最小测试，确认种子服务者可被外键引用。

- [x] Task 2: TS BFF identity and provider switch
  - `/api/auth/login` 调用 Python identity，返回 H5 兼容 session。
  - `/api/auth/me` 和 `/api/users/me` 返回最近登录用户。
  - `/api/providers`、`/api/providers/:userId` 切换到 Python，避免报价服务者和 Python users 表不一致。

- [x] Task 3: Compose smoke guard
  - 增加脚本验证 `/health`、`/api/state`、`/api/knowledge`、`/api/ask`。
  - 通过 BFF 跑登录、服务者列表、发布需求、报价、接受报价、支付创建/查询、会话创建。
  - 脚本失败时输出明确失败接口和响应状态。

- [x] Task 4: Full verification
  - `docker compose build python-service`
  - `docker compose run --rm python-service python -m compileall app migrations`
  - `docker compose run --rm python-service python -m pytest tests -q`
  - `pnpm --filter ./server run build`
  - `pnpm --filter ./client run build`
  - `docker compose up -d --build`
  - 运行 Compose smoke guard。

- [x] Task 5: Record and push
  - 更新 `当前实施计划.md`。
  - 提交 Phase 6 代码和验证记录。
  - 推送 `phase-6-e2e-verification`。

## Acceptance Criteria

- Compose 空库启动后，BFF 冒烟链路能创建 Python 用户、读取 Python 服务者、生成 Python 订单。
- 小程序演示兼容接口 `/api/state`、`/api/knowledge`、`/api/ask` 均返回有效 JSON。
- Python 测试、Server 构建、Client 构建均通过。
- 记录剩余风险：真实第三方支付/地图/AI 仍需生产密钥和回调域名。
