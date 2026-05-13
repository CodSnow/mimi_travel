# Phase 4: H5 Complete Screens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补齐 H5 页面和用户流程，替换静态展示与 JSON demo 逻辑，让照护和出行两条主链路可通过 TS BFF 真实读写验收。

**Architecture:** 继续保持 `H5 React -> TypeScript BFF -> Python FastAPI -> PostgreSQL`。H5 不直连 Python，不引入大型路由库；在现有 tab 状态基础上扩展 `screen + params` 的轻量页面状态。

**Branch / Worktree:** `phase-4-h5-complete-screens` at `.worktrees/phase-4-h5-complete-screens`，基于 `phase-3-payment-messages-navigation`。

## Scope

### In Scope

- 修复 Phase 3 后 H5 API 调用缺少 `userId/operatorUserId/senderUserId` 的问题。
- 扩展 H5 轻量 screen 状态，支持列表页、详情页、流程页和管理页在同一 H5 壳内切换。
- 补齐或显式呈现以下页面入口：登录、首页、附近服务者、需求大厅、发布需求、需求详情、服务者详情、司机详情、闲人入驻、服务者工作台、报价管理、订单确认、支付确认、支付结果、订单详情、导航、照护服务反馈、会话、政策、政策详情、宠物档案、地址管理、收藏夹、支付记录、退款申请、争议/投诉、管理后台。
- 页面读取真实 TS BFF API；暂未具备后端主写接口的治理类页面使用清晰的本地占位状态，不能伪装成已完成后台真实处理。
- 保持移动端 H5 优先，不引入新的路由库。

### Out of Scope

- 新增 Python 后台治理、投诉争议主写模型和真实审核闭环；留给 Phase 5。
- 小程序完整对齐；留给后续阶段。
- 真实第三方支付、地图 SDK、短信或站外通知。

## Tasks

- [ ] Task 1: H5 API 契约修复
  - API 封装支持当前用户 ID。
  - 订单查询、订单状态推进、支付、退款、消息、位置上报传入必要操作者。
  - 保持现有页面调用方尽量少改。

- [ ] Task 2: 轻量 screen 状态与导航入口
  - 增加 `screen` / `screenParams` 状态。
  - 保留底部 tab；详情/流程页在当前 tab 内展示。
  - TopBar 支持返回主 tab。

- [ ] Task 3: H5 主链路页面补齐
  - 需求大厅、需求详情、服务者详情、订单确认、支付确认、支付结果、订单详情、导航、会话页。
  - 照护与出行链路均能从首页/发布页进入并完成下单支付。

- [ ] Task 4: 我的与辅助页面补齐
  - 宠物档案、地址管理、收藏夹、支付记录、退款申请、争议/投诉、闲人入驻、服务者工作台、报价管理、管理后台。
  - 后端未完全具备的能力标注为“待 Phase 5 接入”，但保留表单和状态展示。

- [ ] Task 5: 样式与移动端验收
  - 避免页面文字溢出和控件重排。
  - 补齐紧凑页面、详情页、流程页样式。
  - 保持现有视觉系统，不新增大面积单色调。

- [ ] Task 6: 构建、浏览器验证、记录、提交和推送
  - `pnpm --filter ./server run build`
  - `pnpm --filter ./client run build`
  - 必要时通过本地浏览器检查 H5 首屏和主流程。
  - 更新 `当前实施计划.md` Phase 4 验证结果。
  - 推送 `phase-4-h5-complete-screens`。

## Acceptance Criteria

- H5 登录后不再因缺少 `userId/operatorUserId` 导致核心 API 失败。
- 照护需求和出行需求都能：发布需求 -> 查看推荐/报价 -> 接受报价生成订单 -> 支付 -> 查看订单详情与消息。
- H5 页面入口覆盖需求文档列出的首期页面。
- 所有已具备后端能力的页面通过 TS BFF 真实读写。
- Client build 和 Server build 通过。
