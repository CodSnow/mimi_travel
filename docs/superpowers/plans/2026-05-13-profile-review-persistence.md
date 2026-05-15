# Phase 7: Profile and Review Persistence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将用户资料辅助数据、服务者入驻、评价和照护反馈补齐到 Python/PostgreSQL 主事实源，减少 H5 完整闭环中残留的 TS JSON 主写能力。

## Scope

- Python 新增地址创建、评价写入、评价列表、服务反馈写入和列表 API。
- TS BFF 将宠物、地址、入驻申请、评价、服务反馈路由切到 Python。
- H5 辅助页面展示真实宠物档案、地址、反馈数据，并能创建默认示例记录。
- 保留既有评价、反馈和服务者相关 `DomainStore` 兜底；新增宠物/地址写入以 Python/PostgreSQL 为准。
- 展示资源以 Phase 6 为准：只替换缺失 demo avatar URL，不改首页轮播图片资源。

## Tasks

- [x] Task 1: Python profile/review API completion
  - 增加 `POST /internal/profiles/addresses`。
  - 增加 `POST /internal/reviews/orders/{id}/reviews`、`GET /internal/reviews/providers/{id}/reviews`。
  - 增加 `POST /internal/reviews/orders/{id}/feedback`、`GET /internal/reviews/orders/{id}/feedback`。
  - 覆盖 Python API 测试。

- [x] Task 2: TS BFF switch
  - PythonClient 增加 profile/review 方法和 DTO。
  - `users` 路由补宠物、地址、入驻申请 Python-backed API。
  - `reviews` 路由切到 Python，DomainStore 仅兜底。

- [x] Task 3: H5 auxiliary screens
  - `mimiApi` 增加宠物/地址 API。
  - Controller 加载和创建宠物/地址。
  - `pets`、`addresses`、`care_feedback` 辅助页展示真实数据。

- [x] Task 4: Verification
  - Python compile 和 tests。
  - Server build、Client build。
  - 更新实施记录并推送分支。

## Acceptance Criteria

- 用户可以通过 H5/BFF 创建并读取宠物档案和常用地址。
- 服务者入驻申请写入 Python provider applications。
- 评价和服务反馈写入 Python/PostgreSQL，并能被订单详情和服务者评价摘要读取。
- 构建和测试通过。

## Verification Results

- 展示资源边界：通过，`HomePage.tsx`、`assets.ts`、`global.css` 对 Phase 6 无改动，首页轮播仍展示图片资源。
- Server build：通过，`pnpm --filter ./server run build`
- Client build：通过，`pnpm --filter ./client run build`
- Python build：通过，`docker compose build python-service`
- Python compile：通过，`docker compose run --rm python-service python -m compileall app migrations tests`
- Python tests：通过，`docker compose run --rm python-service python -m pytest tests -q`，62 passed
- 代码审查修复：刷新恢复登录时先恢复 `currentUserId` 再加载用户态数据；评价 reviewer 只能来自 operator；照护反馈要求订单 seller operator；重复评价并发冲突映射为 409。
