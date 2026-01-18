# 多阶段构建：构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL
ARG BUILD_ID=unknown

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 复制 package 文件
COPY package*.json ./

    # 安装依赖
    RUN npm install

# 复制源代码和配置
COPY . .

# ========== 版本标记 ==========
RUN echo "${BUILD_ID}" > /app/build_version.txt
# ==============================

# 构建项目
RUN npm run build

# 生产阶段：使用 nginx 提供静态文件
FROM nginx:alpine

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/build_version.txt /usr/share/nginx/html/build_version.txt
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
