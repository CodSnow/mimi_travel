FROM node:22-alpine AS builder

# 启用 pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

WORKDIR /app

# 1. 拷贝 pnpm 工作区配置和各包的 package.json 以利用缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json shared/
COPY client/package.json client/
COPY server/package.json server/

# 2. 安装全部依赖
RUN pnpm install --frozen-lockfile

# 3. 拷贝源码并构建前端
COPY shared/ shared/
COPY client/ client/
RUN pnpm --filter ./client build

# --- Nginx 运行阶段 ---
FROM nginx:alpine

# 移除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 拷贝自定义 Nginx 配置
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# 拷贝构建好的前端产物
COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
