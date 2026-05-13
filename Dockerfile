FROM node:22-alpine AS builder

WORKDIR /app

# 启用 corepack 并安装指定版本的 pnpm
RUN corepack enable && corepack prepare pnpm@8.15.7 --activate

# 复制所有项目文件到工作目录
COPY . .

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建全栈应用（将同时触发 apps/web 和 apps/server 的 build 脚本）
RUN pnpm run build

# 生产运行阶段
FROM node:22-alpine AS runner

WORKDIR /app

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@8.15.7 --activate

# 将 builder 阶段构建好的文件复制过来，保持 monorepo 的结构
# 这样 apps/server/dist/index.js 运行时能够通过相对路径正确找到 apps/web/dist 并对外提供静态服务
COPY --from=builder /app ./

# 暴露后端服务端口
EXPOSE 4000

# 启动服务
CMD ["pnpm", "start"]
