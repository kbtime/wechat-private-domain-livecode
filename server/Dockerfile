# 后端生产环境 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies 用于构建）
RUN npm ci

# 复制源代码
COPY . .
COPY tsconfig.json ./

# ========== 版本标记 ==========
ARG BUILD_ID=unknown
RUN echo "${BUILD_ID}" > /app/build_version.txt
# ==============================

# 构建 TypeScript
RUN npm run build

# 创建上传目录
RUN mkdir -p uploads

# 创建数据目录
RUN mkdir -p data

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["npm", "start"]
