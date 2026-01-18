# 域名池与活码集成 - 实施任务清单

**Project**: WeChat Private Domain Live Code System
**Feature**: Domain Pool & Live Code Integration
**Created**: 2026-01-18
**Status**: In Progress

---

## 📋 总体进度

```
Phase 1: ██████████ 100%  ████████████ 100%  ████████████ 100%  ░░░░░░░░░░░░ 0%
```

---

## Phase 1: 数据层扩展 (100%)

### ✅ 已完成任务

- [x] **1.1** 后端类型定义扩展
  - [x] 添加 `DomainConfig` 接口
  - [x] 添加 `DomainBindingInfo` 接口
  - [x] 扩展 `LiveCode` 类型（添加 `domainConfig` 字段）
  - [x] 扩展 `Domain` 类型（添加绑定追踪）

- [x] **1.2** 前端类型定义扩展
  - [x] 同步 `DomainConfig` 接口到 `client/src/types.ts`
  - [x] 添加 API 请求/响应类型

- [x] **1.3** 存储层实现
  - [x] 更新 `server/src/storage.ts`
    - [x] 添加 `getDomainConfig(liveCodeId)` 方法
    - [x] 添加 `updateDomainConfig(liveCodeId, updates)` 方法
    - [x] 添加 `bindPrimaryDomain(liveCodeId, request, domainInfo)` 方法
    - [x] 添加 `unbindPrimaryDomain(liveCodeId, forceUnbind, confirmationCode)` 方法
  - [x] 创建 `server/src/storage/domain-bindings.ts`
    - [x] 域名绑定追踪存储服务
    - [x] 记录绑定、移除绑定、查询绑定信息
    - [x] 支持活码名称更新、活码删除清理
  - [x] 更新 `server/src/storage/domain-pool.ts`
    - [x] 添加 `selectDomainForLiveCode()` 方法（集成故障转移逻辑）

### ⏳ 待开始任务

- [ ] **1.4** 数据文件更新（可选）
  - [ ] 为现有活码添加默认 `domainConfig` 字段（自动兼容）

---

## Phase 2: 后端 API 实现 (100%)

### ✅ 已完成任务

- [x] **2.1** 域名配置 API 路由
  - [x] `GET /api/admin/live-codes/:id/domain-config` - 获取域名配置
  - [x] `PUT /api/admin/live-codes/:id/domain-config` - 更新域名配置（备用域名、策略）
  - [x] `POST /api/admin/live-codes/:id/domain-config/primary` - 绑定主域名（需确认）
  - [x] `DELETE /api/admin/live-codes/:id/domain-config/primary` - 解绑主域名（需管理员确认码）

- [x] **2.2** 域名池绑定查询 API
  - [x] `GET /api/admin/domain-pool/domains/:id/binding-info` - 查询域名绑定信息

- [x] **2.3** 故障转移逻辑
  - [x] 实现 `selectDomainForLiveCode()` 核心逻辑
  - [x] 主域名优先选择
  - [x] 备用域名故障转移
  - [x] 域名池全局选择（fallback）

### ⏳ 待开始任务

- [ ] **2.4** 活码访问路由更新（可选，未来增强）
  - [ ] 更新 `GET /api/link/:id` 路由，集成域名选择逻辑
  - [ ] 注：当前使用原活码访问逻辑，域名配置功能用于管理界面

---

## Phase 3: 前端 UI 实现 (100%)

### ✅ 已完成任务

- [x] **3.1** API 客户端扩展
  - [x] 修改 `delete()` 方法支持 body 参数
  - [x] 添加域名配置 API 方法到 `client/src/api/index.ts`

- [x] **3.2** 域名配置组件
  - [x] 创建 `DomainConfigPanel.tsx` - 域名配置主面板
  - [x] 主域名绑定/锁定显示
  - [x] 备用域名列表
  - [x] 域名选择策略配置
  - [x] 故障转移开关
  - [x] 主域名确认弹窗

- [x] **3.3** 活码编辑页面更新
  - [x] 在 `CreateEditDrawer.tsx` 集成域名配置面板
  - [x] 添加可折叠的"域名配置"部分
  - [x] 仅在编辑模式下显示

- [x] **3.4** 域名池管理页面更新
  - [x] 在 `DomainList.tsx` 添加"绑定信息"列
  - [x] 添加"查看绑定"按钮
  - [x] 创建 `DomainBindingInfoDrawer.tsx` - 域名绑定信息抽屉
  - [x] 显示主域名/备用域名绑定统计
  - [x] 显示绑定活码列表（含绑定时间、优先级）

- [x] **3.5** 域名配置入口优化
  - [x] 创建 `DomainConfigDrawer.tsx` - 独立域名配置抽屉
  - [x] 在 `LiveCodeCard.tsx` 添加"域名"按钮
  - [x] 从 `CreateEditDrawer.tsx` 移除域名配置部分
  - [x] 在 `App.tsx` 集成域名配置抽屉逻辑

- [x] **3.6** 域名配置功能重新设计 (v2.0)
  - [x] 完全重写 `DomainConfigPanel.tsx`
  - [x] 移除绑定模式选择（不需要）
  - [x] 移除域名选择策略UI（保留但隐藏）
  - [x] 实现炮灰域名管理功能
    - [x] 添加炮灰域名
    - [x] 删除炮灰域名
    - [x] 上移/下移调整优先级
  - [x] 实现故障转移开关
  - [x] 创建 `docs/domain-config-redesign.md` 设计文档

- [x] **3.7** 炮灰域名落地展示策略
  - [x] 添加炮灰域名选择策略（顺序/随机/轮询）
  - [x] 实现三种选择模式的后端逻辑
  - [x] 添加跳转统计信息（总次数、当前索引、各域名次数）
  - [x] 前端UI显示策略选择和统计信息
  - [x] 更新API接口支持策略配置
  - [x] 创建 `docs/fallback-landing-strategy.md` 设计文档

---

## Phase 4: 测试与验证 (0%)

### ⏳ 待开始任务

- [ ] **4.1** 单元测试
  - [ ] 测试域名配置 CRUD 操作
  - [ ] 测试主域名锁定/解锁逻辑
  - [ ] 测试故障转移选择算法
  - [ ] 测试边界条件（无可用域名、全失败等）

- [ ] **4.2** 集成测试
  - [ ] 测试完整的绑定流程
  - [ ] 测试故障转移场景
  - [ ] 测试并发访问场景

- [ ] **4.3** 用户验收测试
  - [ ] 验证主域名锁定保护
  - [ ] 验证备用域名灵活性
  - [ ] 验证故障转移正确性

---

## 🚨 风险追踪

| 风险 | 状态 | 缓解措施 |
|-----|------|---------|
| 数据迁移兼容性问题 | 🟡 监控中 | 保持向后兼容，未配置域名时使用原逻辑 |
| 故障转移逻辑复杂度 | 🟡 监控中 | 充分的单元测试 |
| 前端状态管理复杂度 | 🟢 可控 | 使用 React Context 统一管理 |

---

## 📝 备注

### 优先级说明
- **P0**: 必须完成，阻塞其他任务
- **P1**: 高优先级，核心功能
- **P2**: 中优先级，增强功能
- **P3**: 低优先级，优化项

### 依赖关系
- Phase 2 依赖 Phase 1 完成
- Phase 3 依赖 Phase 2 完成
- Phase 4 可与 Phase 3 并行进行部分测试

### 当前阻塞
无

---

## 🔗 相关文档

- [设计文档](./domain-livecode-integration-design.md)
- [变更日志](./domain-livecode-integration-changelog.md)
- [原始 PRD](./PRD.md)
