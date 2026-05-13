FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

WORKDIR /app

# 1. 拷贝 Monorepo 核心配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json shared/
COPY client/package.json client/
COPY server/package.json server/

# 2. 安装所有依赖（包含 shared 类型支持）
RUN pnpm install --frozen-lockfile

# 3. 拷贝源码
COPY shared/ shared/
COPY server/ server/

# 4. 编译后端
RUN pnpm --filter ./server build

# --- 运行阶段 ---
FROM node:22-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

WORKDIR /app/server

# 生产环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 只拷贝运行必需文件
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/
COPY --from=builder /app/shared/package.json /app/shared/
COPY --from=builder /app/server/package.json ./
COPY --from=builder /app/server/dist ./dist

# 只安装生产依赖
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3001

# 入口文件在 dist/index.js
CMD ["node", "dist/index.js"]
