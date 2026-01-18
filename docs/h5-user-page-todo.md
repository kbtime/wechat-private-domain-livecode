# H5 用户端页面开发任务清单

**Document ID**: h5-user-page-todo-v1.0
**Created**: 2026-01-18
**Status**: In Progress

---

## 总览

| 项目 | 状态 | 负责人 | 预计工时 |
|-----|------|--------|---------|
| Phase 1: 静态页面 | ⏳ 待开始 | - | 4h |
| Phase 2: 后端 API | ⏳ 待开始 | - | 4h |
| Phase 3: 域名选择与重定向 | ⏳ 待开始 | - | 4h |
| Phase 4: 测试部署 | ⏳ 待开始 | - | 4h |

**总计**: 约 16 工时

---

## Phase 1: 创建静态页面 (Day 1)

### 1.1 项目结构搭建
- [ ] 创建 `server/public/h5/` 目录
- [ ] 创建 `server/public/h5/assets/` 静态资源目录

### 1.2 扫码落地页
- [ ] 创建 `server/public/h5/landing.html`
- [ ] 实现 HTML 结构（导航栏 + 内容区 + 底部版权）
- [ ] 实现 CSS 样式（基于设计规范）
- [ ] 添加页面标题和二维码占位符
- [ ] 确保响应式设计（移动端适配）

### 1.3 404 错误页
- [ ] 创建 `server/public/h5/error.html`
- [ ] 实现 HTML 结构（404 图标 + 标题 + 描述）
- [ ] 实现 CSS 样式（居中布局）
- [ ] 添加错误提示文案

### 1.4 验证
- [ ] 本地打开 HTML 文件验证样式
- [ ] 浏览器兼容性测试（Chrome, Safari, 微信内置浏览器）

---

## Phase 2: 后端 API (Day 2)

### 2.1 创建路由文件
- [ ] 创建 `server/src/routes/h5.ts`
- [ ] 导出 `h5Routes` 函数

### 2.2 活码内容获取 API
- [ ] 实现 `GET /api/h5/live-code/:id`
- [ ] 验证活码存在且状态为 running
- [ ] 实现子码选择逻辑（THRESHOLD/RANDOM/FIXED）
- [ ] 更新访问统计（incrementPv）
- [ ] 返回二维码 URL 和页面配置

### 2.3 静态页面路由
- [ ] 实现 `GET /h5/landing`（返回 landing.html）
- [ ] 实现 `GET /h5/error`（返回 error.html）
- [ ] 配置 Fastify 静态文件服务

### 2.4 数据上报 API（可选）
- [ ] 实现 `POST /api/h5/analytics`
- [ ] 接收并存储埋点数据

### 2.5 注册路由
- [ ] 在 `server/src/routes/index.ts` 中注册 h5Routes

### 2.6 验证
- [ ] API 接口测试（Postman/curl）
- [ ] 单元测试（可选）

---

## Phase 3: 域名选择与重定向 (Day 3)

### 3.1 创建活码访问入口
- [ ] 创建 `server/src/routes/link.ts`
- [ ] 实现 `GET /api/link?id=:id`

### 3.2 域名选择逻辑
- [ ] 集成 `domainPoolStorage.selectDomainForLiveCode()`
- [ ] 主域名优先选择
- [ ] 故障转移到备用域名
- [ ] 使用炮灰域名落地展示策略（sequential/random/round-robin）

### 3.3 重定向逻辑
- [ ] 活码不存在/已停用 → 重定向到 404 页
- [ ] 无可用域名 → 重定向到 404 页
- [ ] 正常情况 → 302 重定向到落地页

### 3.4 注册路由
- [ ] 在 `server/src/routes/index.ts` 中注册 linkRoutes
- [ ] 更新 CORS 配置（如果需要）

### 3.5 更新活码数据结构
- [ ] 确保 `LiveCode` 类型包含 `domainConfig`
- [ ] 确保向后兼容（旧数据自动补充默认值）

### 3.6 验证
- [ ] 域名选择逻辑测试
- [ ] 重定向测试（302 状态码验证）
- [ ] 故障转移测试（模拟主域名失败）

---

## Phase 4: 测试与部署 (Day 4)

### 4.1 功能测试
- [ ] 正常扫码流程测试
- [ ] 活码不存在测试
- [ ] 活码已停用测试
- [ ] 无可用域名测试

### 4.2 域名切换测试
- [ ] 主域名正常访问
- [ ] 主域名失败切换到备用域名
- [ ] 炮灰域名三种策略测试（sequential/random/round-robin）

### 4.3 兼容性测试
- [ ] 微信内置浏览器测试
- [ ] Safari iOS 测试
- [ ] Chrome Android 测试
- [ ] 不同屏幕尺寸测试

### 4.4 性能测试
- [ ] 页面加载速度测试
- [ ] 并发访问测试
- [ ] API 响应时间测试

### 4.5 部署
- [ ] 构建生产环境镜像
- [ ] 更新 Docker 配置
- [ ] 部署到生产环境
- [ ] 域名 DNS 配置（如需要）

### 4.6 文档更新
- [ ] 更新 README.md
- [ ] 更新 API 文档
- [ ] 更新部署文档

---

## 检查清单

### 代码质量
- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过
- [ ] 代码符合项目规范

### 安全检查
- [ ] URL 参数验证
- [ ] XSS 防护
- [ ] 错误信息不泄露敏感数据

### 文档完整性
- [ ] 设计文档最新
- [ ] API 文档完整
- [ ] 变更日志更新

---

## 阻塞问题

| 问题描述 | 影响 | 解决方案 | 状态 |
|---------|------|---------|------|
| - | - | - | - |

---

## 备注

1. **开发顺序建议**：Phase 1 → Phase 2 → Phase 3 → Phase 4
2. **测试建议**：每完成一个 Phase 进行一次集成测试
3. **部署建议**：先部署到测试环境验证，再部署到生产环境
