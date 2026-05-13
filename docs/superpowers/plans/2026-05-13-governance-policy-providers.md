# Phase 5: Governance, Policy AI, Provider Boundaries

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补齐后台治理、投诉争议、政策收藏、材料 checklist、本地 RAG 和真实 provider 配置边界，让 Phase 4 的 H5 治理入口具备真实 TS BFF/Python 数据支撑。

**Architecture:** 继续保持 `H5 React -> TypeScript BFF -> Python FastAPI -> PostgreSQL`。治理、政策收藏、投诉争议主写入 Python；政策知识库检索和 provider 编排留在 TS BFF，并明确 `LocalRagProvider` / `DeepSeekProvider`、地图和支付 provider 边界。

**Branch / Worktree:** `phase-5-governance-policy-providers` at `.worktrees/phase-5-governance-policy-providers`，基于 `phase-4-h5-complete-screens`。

## Scope

### In Scope

- Python 新增 `complaints`、`disputes`、`admin_audit_logs` 模型和迁移。
- Python 治理仓储/服务/API：服务者申请审核、投诉创建、争议创建和处理、管理员审计日志、订单/退款治理视图。
- Python 政策收藏 API：收藏、取消收藏、列表。
- TS BFF provider 边界：`LocalRagProvider`、`DeepSeekProvider` 占位边界，政策问答返回 checklist 和引用来源。
- TS BFF 接入 Python 治理和政策收藏 API。
- H5 管理后台、争议/投诉、收藏夹页面使用真实 API。
- 测试覆盖 Python 治理、政策收藏和 TS/Client 构建。

### Out of Scope

- 真实 DeepSeek 网络调用；没有 key 时只返回明确未启用状态。
- 真实支付/地图第三方 SDK 接入。
- 站外通知、短信、对象存储上传。

## Tasks

- [ ] Task 1: Phase 5 计划落盘并提交。
- [ ] Task 2: Python 治理模型、迁移、仓储与服务。
- [ ] Task 3: Python 内部 API 与测试。
- [ ] Task 4: TS BFF provider 边界与治理/收藏路由。
- [ ] Task 5: H5 治理、争议、收藏和政策 checklist 接入。
- [ ] Task 6: 构建、测试、记录、推送。

## Acceptance Criteria

- 管理员可审核服务者申请，操作写 `admin_audit_logs`。
- 用户可创建投诉和争议，管理员可处理争议。
- 管理员可查看订单与退款治理列表。
- 政策页可收藏/取消收藏，收藏夹真实读取。
- 政策问答返回材料 checklist 和引用来源。
- Provider 边界明确：本地 RAG 可用，DeepSeek 未配置时明确降级。
- `docker compose run --rm python-service python -m pytest tests -q` 通过。
- `pnpm --filter ./server run build` 和 `pnpm --filter ./client run build` 通过。
