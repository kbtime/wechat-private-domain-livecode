# WeChat Private Domain Live Code System

微信私域活码系统 - 域名池与活码管理系统

## 功能特性

### 域名池管理
- 域名池健康检查
- 域名状态监控（活跃/已封禁/测试中）
- 域名权重和顺序配置
- 域名绑定信息查询

### 活码管理
- 多子码轮换显示
- 支持阈值模式、随机模式、固定模式
- 二维码上传和管理
- 推广码生成

### 域名-活码集成
- **主域名配置**：绑定后永久锁定，确保生产环境稳定性
- **炮灰域名配置**：灵活管理，支持添加/删除/优先级调整
- **故障转移**：主域名失败时自动切换到炮灰域名
- **域名选择策略**：支持轮询、随机、权重等策略

### 文件上传
- 阿里云OSS集成
- 图片上传和管理

## 技术栈

### 后端
- Node.js + Fastify
- TypeScript
- JSON文件存储
- JWT认证

### 前端
- React 19
- TypeScript
- Tailwind CSS
- Vite

### 部署
- Docker + Docker Compose

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/kbtime/wechat-private-domain-livecode.git
cd wechat-private-domain-livecode
```

### 2. 配置环境变量

复制 `docker-compose.yml.example` 为 `docker-compose.yml` 并修改配置：

```bash
cp docker-compose.yml.example docker-compose.yml
```

修改以下环境变量：
- `JWT_SECRET`: JWT密钥
- `ADMIN_PASSWORD`: 管理员密码
- `OSS_ACCESS_KEY_ID`: 阿里云OSS访问密钥ID
- `OSS_ACCESS_KEY_SECRET`: 阿里云OSS访问密钥Secret
- `OSS_BUCKET`: OSS存储桶名称

### 3. 启动服务

```bash
docker-compose up -d
```

### 4. 访问应用

- 前端管理界面: http://localhost:3000
- 后端API: http://localhost:3001
- 健康检查: http://localhost:3001/health

## 项目结构

```
wechat-private-domain-livecode/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── api/           # API客户端
│   │   ├── components/    # React组件
│   │   ├── hooks/         # 自定义Hooks
│   │   └── types.ts       # 类型定义
│   ├── Dockerfile
│   └── nginx.conf
├── server/                # 后端应用
│   ├── src/
│   │   ├── routes/        # API路由
│   │   ├── services/      # 服务层
│   │   ├── storage/       # 数据存储
│   │   └── types.ts       # 类型定义
│   ├── data/              # 数据文件
│   └── Dockerfile
├── docs/                  # 项目文档
├── docker-compose.yml.example
└── README.md
```

## 文档

- [域名池设计文档](docs/domain-pool-design.md)
- [域名-活码集成设计](docs/domain-livecode-integration-design.md)
- [域名配置重新设计](docs/domain-config-redesign.md)
- [变更日志](docs/domain-livecode-integration-changelog.md)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
