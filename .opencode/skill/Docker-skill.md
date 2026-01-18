# Docker 本地部署技能 (Local Docker Deploy Skill)

## 技能触发
**唤起关键词**: `本地Docker开始部署`

---

## 技能概述
用于本地Docker环境的项目构建、部署和验证。确保每次部署代码完全更新，支持多项目并行运行。

---

## 一、变量定义

| 变量名 | 格式 | 示例 | 说明 |
|--------|------|------|------|
| `PROJECT_NAME` | 小写字母+连字符 | `my-backend` | 项目唯一标识 |
| `IMAGE_NAME` | `${PROJECT_NAME}:local-dev` | `my-backend:local-dev` | 镜像名称，固定tag |
| `CONTAINER_NAME` | `${PROJECT_NAME}-container` | `my-backend-container` | 容器名称 |
| `BUILD_ID` | `YYYYMMDD-HHmmss` | `20260118-091530` | 构建时间戳 |
| `HOST_PORT` | 数字 | `3000` | 宿主机端口 |
| `CONTAINER_PORT` | 数字 | `8080` | 容器内端口 |

---

## 二、触发后交互流程

当用户说 `本地Docker开始部署` 时，按以下顺序询问：

### 询问1: 项目名称
```
请提供项目名称（英文小写+连字符，如 my-backend）：
```

### 询问2: 端口配置
```
请提供端口配置：
- 宿主机端口（本机访问端口，如 3000）：
- 容器端口（应用监听端口，如 8080）：
```

### 询问3: 项目路径（可选）
```
请提供项目路径（默认当前目录）：
```

---

## 三、执行流程

### Step 1: 环境检查
```bash
# 1.1 检查Docker是否运行
docker info > /dev/null 2>&1 || exit 1

# 1.2 检查Dockerfile是否存在
test -f Dockerfile || exit 1

# 1.3 检查.dockerignore是否存在，不存在则创建
test -f .dockerignore || cat > .dockerignore << 'EOF'
node_modules
.git
.gitignore
__pycache__
*.pyc
.env
.env.*
dist
build
.DS_Store
*.log
.idea
.vscode
EOF
```

### Step 2: 生成构建ID
```bash
BUILD_ID=$(date +"%Y%m%d-%H%M%S")
```

### Step 3: 清理旧容器
```bash
# 强制删除同名容器（忽略不存在的错误）
docker rm -f ${CONTAINER_NAME} 2>/dev/null || true
```

### Step 4: 端口冲突检测
```bash
# 检查端口是否被占用
if lsof -i:${HOST_PORT} > /dev/null 2>&1; then
  echo "错误: 端口 ${HOST_PORT} 已被占用"
  exit 1
fi
```

### Step 5: 构建镜像
```bash
docker build \
  --no-cache \
  --build-arg BUILD_ID=${BUILD_ID} \
  -t ${IMAGE_NAME} \
  .
```

### Step 6: 清理悬空镜像
```bash
docker image prune -f
```

### Step 7: 启动容器
```bash
docker run -d \
  --name ${CONTAINER_NAME} \
  -p ${HOST_PORT}:${CONTAINER_PORT} \
  --restart unless-stopped \
  ${IMAGE_NAME}
```

### Step 8: 验证部署
```bash
# 8.1 等待容器启动
sleep 3

# 8.2 检查容器状态
CONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' ${CONTAINER_NAME})
if [ "$CONTAINER_STATUS" != "running" ]; then
  echo "错误: 容器启动失败"
  docker logs ${CONTAINER_NAME}
  exit 1
fi

# 8.3 验证构建版本（核心校验）
DEPLOYED_VERSION=$(docker exec ${CONTAINER_NAME} cat /app/build_version.txt 2>/dev/null)
if [ "$DEPLOYED_VERSION" != "$BUILD_ID" ]; then
  echo "错误: 版本不匹配，代码未更新"
  echo "期望: $BUILD_ID"
  echo "实际: $DEPLOYED_VERSION"
  exit 1
fi

# 8.4 输出成功信息
echo "部署成功"
echo "项目: ${PROJECT_NAME}"
echo "版本: ${BUILD_ID}"
echo "访问: http://localhost:${HOST_PORT}"
```

---

## 四、Dockerfile 模板要求

项目的 Dockerfile 必须包含以下内容：

```dockerfile
# 基础镜像（根据项目类型选择）
FROM node:18-alpine
# FROM python:3.11-slim
# FROM golang:1.21-alpine

WORKDIR /app

# 依赖安装（利用缓存）
COPY package*.json ./
RUN npm install
# 或 COPY requirements.txt ./
# 或 RUN pip install -r requirements.txt

# 复制源代码
COPY . .

# ========== 必须添加：版本标记 ==========
ARG BUILD_ID=unknown
RUN echo "${BUILD_ID}" > /app/build_version.txt
# ========================================

# 构建（如需要）
RUN npm run build

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["npm", "start"]
```

---

## 五、常用命令速查

| 操作 | 命令 |
|------|------|
| 查看运行中的容器 | `docker ps` |
| 查看所有容器 | `docker ps -a` |
| 查看容器日志 | `docker logs ${CONTAINER_NAME}` |
| 实时日志 | `docker logs -f ${CONTAINER_NAME}` |
| 进入容器 | `docker exec -it ${CONTAINER_NAME} sh` |
| 停止容器 | `docker stop ${CONTAINER_NAME}` |
| 删除容器 | `docker rm -f ${CONTAINER_NAME}` |
| 查看本地镜像 | `docker images` |
| 删除镜像 | `docker rmi ${IMAGE_NAME}` |
| 查看容器内版本 | `docker exec ${CONTAINER_NAME} cat /app/build_version.txt` |

---

## 六、完整部署脚本

将以下脚本保存为 `deploy.sh`，放在项目根目录：

```bash
#!/bin/bash
set -e

# ============ 配置区 ============
PROJECT_NAME="my-project"
HOST_PORT=3000
CONTAINER_PORT=8080
# ================================

IMAGE_NAME="${PROJECT_NAME}:local-dev"
CONTAINER_NAME="${PROJECT_NAME}-container"
BUILD_ID=$(date +"%Y%m%d-%H%M%S")

echo ">>> 开始部署 ${PROJECT_NAME}"
echo ">>> 构建ID: ${BUILD_ID}"

# 清理旧容器
echo ">>> 清理旧容器..."
docker rm -f ${CONTAINER_NAME} 2>/dev/null || true

# 构建镜像
echo ">>> 构建镜像..."
docker build --no-cache --build-arg BUILD_ID=${BUILD_ID} -t ${IMAGE_NAME} .

# 清理悬空镜像
docker image prune -f > /dev/null

# 启动容器
echo ">>> 启动容器..."
docker run -d \
  --name ${CONTAINER_NAME} \
  -p ${HOST_PORT}:${CONTAINER_PORT} \
  --restart unless-stopped \
  ${IMAGE_NAME}

# 验证
sleep 3
DEPLOYED_VERSION=$(docker exec ${CONTAINER_NAME} cat /app/build_version.txt 2>/dev/null || echo "")

if [ "$DEPLOYED_VERSION" = "$BUILD_ID" ]; then
  echo ">>> ✅ 部署成功"
  echo ">>> 访问地址: http://localhost:${HOST_PORT}"
else
  echo ">>> ❌ 部署失败: 版本校验不通过"
  docker logs ${CONTAINER_NAME}
  exit 1
fi
```

---

## 七、错误处理

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| `端口已被占用` | 其他进程占用端口 | 更换 HOST_PORT 或停止占用进程 |
| `版本不匹配` | 镜像未正确更新 | 检查 Dockerfile 是否包含 BUILD_ID 写入 |
| `容器启动失败` | 应用代码错误 | 执行 `docker logs` 查看错误日志 |
| `Dockerfile不存在` | 缺少配置文件 | 在项目根目录创建 Dockerfile |

---

## 八、多项目管理

不同项目使用不同的 `PROJECT_NAME` 和 `HOST_PORT`，可同时运行：

| 项目 | PROJECT_NAME | HOST_PORT |
|------|--------------|-----------|
| 前端 | `frontend` | `3000` |
| 后端API | `backend-api` | `8080` |
| 管理后台 | `admin-panel` | `3001` |

查看所有本地开发容器：
```bash
docker ps --filter "name=-container"
```