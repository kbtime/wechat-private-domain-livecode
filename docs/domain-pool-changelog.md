# Domain Pool Management Feature - Changelog

## 概述

实现了完整的域名池管理功能，用于防封策略。系统支持多域名管理、健康检查、三种选择策略（轮询、随机、加权）和自动封禁机制。

## 实施日期

2026-01-18

## 功能特性

### 1. 后端实现 (Node.js + Fastify)

#### 数据存储服务 (`server/src/storage/domain-pool.ts`)
- 基于JSON文件的域名池存储
- 支持配置管理（策略、最大失败次数、健康检查间隔等）
- 域名CRUD操作（增删改查）
- 三种域名选择策略实现：
  - `round-robin`: 轮询模式，按顺序选择域名
  - `random`: 随机模式，随机选择活跃域名
  - `weighted`: 加权模式，根据权重分配流量
- 健康检查与失败追踪
- 自动封禁机制（失败次数超过阈值自动封禁）

#### API路由 (`server/src/routes/domain-pool.ts`)
- `GET /api/admin/domain-pool` - 获取配置和统计
- `PUT /api/admin/domain-pool/config` - 更新池配置
- `GET /api/admin/domain-pool/domains` - 获取域名列表
- `POST /api/admin/domain-pool/domains` - 添加域名
- `PUT /api/admin/domain-pool/domains/:id` - 更新域名
- `DELETE /api/admin/domain-pool/domains/:id` - 删除域名
- `POST /api/admin/domain-pool/domains/:id/toggle` - 切换状态
- `POST /api/admin/domain-pool/health-check` - 手动健康检查
- `GET /api/admin/domain-pool/select` - 选择可用域名（供跳转使用）

#### 健康检查定时任务 (`server/src/index.ts`)
- 自动定时健康检查（间隔可配置）
- 失败追踪和自动封禁
- 优雅关闭支持

### 2. 前端实现 (React 19 + TypeScript + Vite)

#### 类型定义 (`client/src/types.ts`)
- `DomainStatus`: 'active' | 'inactive' | 'banned' | 'testing'
- `SelectionStrategy`: 'round-robin' | 'random' | 'weighted'
- `Domain`: 域名实体
- `DomainPoolConfig`: 域名池配置
- `DomainPoolStatistics`: 统计数据
- 请求/响应类型

#### API封装 (`client/src/api/index.ts`)
- `domainPoolApi`: 完整的域名池API方法封装

#### UI组件
- `DomainList` (`client/src/components/DomainList.tsx`)
  - 域名列表表格展示
  - 状态徽章（活跃/未激活/测试中/已封禁）
  - 健康状态指示
  - 操作按钮（编辑/删除/切换状态）

- `AddEditDomainModal` (`client/src/components/AddEditDomainModal.tsx`)
  - 添加/编辑域名表单
  - 域名、协议、权重、顺序配置
  - 健康检查路径设置

- 导航集成 (`client/src/components/Layout.tsx`)
  - 添加"域名池管理"菜单项

- 域名池页面 (`client/src/App.tsx`)
  - 统计卡片（总域名数、活跃域名、已封禁、总请求数、成功率）
  - 配置面板（策略选择、最大失败次数、健康检查间隔、重试间隔、启用/禁用）
  - 域名列表展示
  - 手动健康检查按钮

## 数据结构

### Domain (域名)
```typescript
{
  id: string;                    // 域名ID
  domain: string;                // 域名
  protocol: 'http' | 'https';    // 协议
  status: DomainStatus;          // 状态
  weight: number;                // 权重
  order: number;                 // 顺序
  healthCheckUrl?: string;       // 健康检查路径
  lastCheckTime?: string;        // 最后检查时间
  lastFailureTime?: string;      // 最后失败时间
  failureCount: number;          // 当前失败次数
  totalRequests: number;         // 总请求数
  totalFailures: number;         // 总失败数
  createdAt: string;             // 创建时间
  updatedAt: string;             // 更新时间
}
```

### DomainPoolConfig (配置)
```typescript
{
  id: string;                      // 配置ID
  name: string;                    // 池名称
  strategy: SelectionStrategy;     // 选择策略
  maxFailures: number;             // 最大失败次数（封禁阈值）
  healthCheckInterval: number;     // 健康检查间隔（秒）
  retryInterval: number;           // 重试间隔（秒）
  currentIndex: number;            // 当前索引（轮询用）
  isActive: boolean;               // 是否启用
  createdAt: string;
  updatedAt: string;
}
```

## 文件变更清单

### 后端文件

| 文件 | 操作 | 描述 |
|------|------|------|
| `server/src/types.ts` | 新增 | 域名池相关类型定义 |
| `server/src/storage/domain-pool.ts` | 新增 | 域名池数据存储服务 |
| `server/src/routes/domain-pool.ts` | 新增 | 域名池API路由 |
| `server/src/routes/index.ts` | 修改 | 注册域名池路由 |
| `server/src/index.ts` | 修改 | 添加健康检查定时任务 |

### 前端文件

| 文件 | 操作 | 描述 |
|------|------|------|
| `client/src/types.ts` | 修改 | 添加域名池类型 |
| `client/src/api/index.ts` | 修改 | 添加域名池API |
| `client/src/components/Layout.tsx` | 修改 | 添加域名池导航 |
| `client/src/components/DomainList.tsx` | 新增 | 域名列表组件 |
| `client/src/components/AddEditDomainModal.tsx` | 新增 | 添加/编辑域名弹窗 |
| `client/src/App.tsx` | 修改 | 添加域名池页面和状态管理 |

### 依赖变更

| 文件 | 操作 | 描述 |
|------|------|------|
| `client/package.json` | 修改 | 添加 tailwindcss, postcss, autoprefixer |

## 使用说明

### 1. 配置域名池

1. 访问管理后台，点击左侧"域名池管理"
2. 在"域名池配置"区域设置：
   - **选择策略**: 选择域名选择方式（轮询/随机/加权）
   - **最大失败次数**: 失败多少次后自动封禁域名
   - **健康检查间隔**: 自动健康检查的时间间隔（秒）
   - **重试间隔**: 封禁后重试的间隔（秒）
3. 点击启用/禁用按钮控制域名池开关

### 2. 添加域名

1. 点击"添加域名"按钮
2. 填写域名信息：
   - 域名（如：example.com）
   - 协议（HTTP/HTTPS）
   - 权重（加权模式下使用）
   - 顺序（轮询模式下排序）
   - 健康检查路径（如：/health）
3. 点击保存

### 3. 管理域名

- **编辑**: 点击编辑图标修改域名配置
- **切换状态**: 点击启用/禁用图标切换域名状态
- **删除**: 点击删除图标删除域名
- **健康检查**: 点击"健康检查"按钮手动执行检查

## 测试建议

1. **功能测试**
   - 添加/编辑/删除域名
   - 切换域名状态
   - 修改池配置
   - 手动健康检查

2. **策略测试**
   - 测试三种选择策略是否正常工作
   - 验证加权模式下权重分配是否正确
   - 验证轮询模式顺序是否正确

3. **健康检查测试**
   - 测试正常域名通过检查
   - 测试失败域名的失败计数
   - 测试超过阈值自动封禁
   - 测试定时任务是否正常运行

## 已知问题

无

## 后续优化建议

1. 添加域名分组功能（按业务/地区分组）
2. 支持域名标签和备注
3. 添加域名使用统计图表
4. 支持批量导入域名
5. 添加域名历史记录
6. 实现更复杂的健康检查逻辑（如响应时间阈值）

## 相关文档

- [域名池设计文档](./domain-pool-design.md)
- [API文档](../server/src/routes/domain-pool.ts)
