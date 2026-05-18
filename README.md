# 咪咪出行

咪咪出行是面向宠物出行、照护、办证和托运协助的本地可验收全链路项目。当前主线采用 H5 优先交付，同时保留小程序客户端对同一套 BFF API 的功能对齐。

## 项目架构

核心链路：

```text
H5 / 小程序 -> TypeScript BFF -> Python FastAPI -> PostgreSQL
```

主要模块：

- `client`：React H5 客户端，覆盖首页、需求、订单、支付、消息、政策、我的和流程页。
- `mp`：Taro 小程序客户端，使用 TS BFF API，不维护独立事实源。
- `server`：TypeScript BFF / API Gateway，负责前端 API、DTO 转换、provider 编排和兼容接口。
- `python-service`：FastAPI 领域服务，承载用户、服务者、需求、报价、订单、支付、退款、消息、评价和治理等主业务数据。
- `shared`：前后端共享 TypeScript 类型。
- `deploy`：Docker 镜像、Nginx 和部署脚本。
- `scripts`：本地冒烟验收脚本。
- `docs/superpowers`：阶段设计、计划和执行记录。

## 技术栈

- 前端：React 19、TypeScript、Rsbuild
- 小程序：Taro 4、React、TypeScript
- BFF：Node.js、Express 5、TypeScript
- 领域服务：Python 3.10+、FastAPI、SQLAlchemy、Alembic、Pydantic
- 数据库：PostgreSQL 16
- 构建与编排：pnpm、Docker Compose、Nginx

## 本地开发

安装依赖：

```bash
pnpm install
```

启动 H5 与 BFF 开发服务：

```bash
pnpm run dev
```

常用构建命令：

```bash
pnpm run verify:server
pnpm run verify:client
pnpm run verify:mp:h5
pnpm run verify:mp:weapp
```

全量构建：

```bash
pnpm run build
```

## Docker Compose 验收

启动完整链路：

```bash
docker compose up -d --build
```

默认端口：

- H5 前端：`http://localhost:8809`
- TS BFF：`http://localhost:3001`
- Python 服务：`http://localhost:8800`
- PostgreSQL：容器内 `5432`，宿主机 `54322`

运行端到端冒烟：

```bash
pnpm run smoke:compose
```

冒烟脚本默认检查：

- 前端首页
- Nginx `/api/state` 反向代理
- BFF `/health`
- 政策兼容接口
- 登录、服务者、需求、报价、接单、支付和会话主链路

只验证 BFF API 时可跳过前端入口：

```bash
MIMI_SMOKE_SKIP_FRONTEND=1 pnpm run smoke:compose
```

## Provider 边界

当前代码已具备真实 provider 的配置边界：

- DeepSeek：通过 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`、`DEEPSEEK_TIMEOUT_MS` 配置。
- 地图 SDK：通过 `MAP_AMAP_WEB_KEY`、`MAP_BAIDU_WEB_KEY`、`MAP_SDK_ENABLED` 配置。
- 支付：支持 `local`、`alipay`、`wechat_pay` provider 选择。

重要约束：

- 仓库不提交真实密钥、证书、商户号或私钥。
- provider 未配置时必须明确降级或返回未配置错误，不能伪造真实成功。
- 真实支付宝/微信网关 HTTP 适配仍需要商户配置、证书/私钥、平台公钥、回调域名和签名算法后继续完成。

## 关键文档

- [当前实施计划.md](docs/当前实施计划.md)
- [部署文档.md](docs/部署文档.md)
- [H5 完整实现设计](./docs/superpowers/specs/2026-05-13-mimi-travel-complete-h5-design.md)
- [H5 完整实现总路线图](./docs/superpowers/plans/2026-05-13-mimi-travel-complete-h5-roadmap.md)
- [Phase 8 Real Provider Closures](./docs/superpowers/plans/2026-05-15-real-provider-closures.md)

## 当前剩余生产门槛

- 真实支付宝/微信预下单、查询、退款、退款查询和签名验签 HTTP 适配仍需生产资料。
- H5 支付记录、退款申请、服务者工作台、报价管理需要继续从入口骨架补到完整可操作列表。
- BFF 仍有部分 `DomainStore` 兼容路径，需要逐步收口到 Python/PostgreSQL 主事实源。
- 服务者档期、办证/托运协助节点跟踪仍需独立领域闭环。

