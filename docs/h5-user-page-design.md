# H5 用户端页面设计文档

**Document ID**: h5-user-page-design-v1.1
**Created**: 2026-01-18
**Status**: Design Phase

---

## 1. 设计概述

### 1.1 文档目的

本文档定义了微信私域活码系统的**用户端 H5 页面**设计方案，这是最终用户（扫码用户）看到的界面。

### 1.2 系统定位

```
┌─────────────────────────────────────────────────────────────┐
│                     系统架构层级                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  管理端 (Admin Dashboard)                                    │
│  - 域名池管理                                               │
│  - 活码配置                                                 │
│  - 数据统计                                                 │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  用户端 (H5 Page)  ← 本文档设计范围                          │
│  - 扫码落地页                                               │
│  - 404 错误页                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 页面清单

| 页面 | 路径 | 说明 |
|-----|------|-----|
| 扫码落地页 | `/h5/landing` | 显示二维码，用户长按识别添加好友 |
| 404错误页 | `/h5/error` | 二维码失效或不存在时的错误提示 |

---

## 2. 用户旅程设计

### 2.1 完整用户流程

```
用户扫码
    │
    ▼
┌─────────────────┐
│ 请求活码链接    │
│ /api/link?id=xx │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 域名选择逻辑    │
│ - 主域名检查    │
│ - 故障转移      │
│ - 炮灰域名选择  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 302 重定向      │
│ 到 H5 落地页    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ H5 落地页加载   │
│ - 显示二维码    │
│ - 用户长按识别  │
└─────────────────┘
```

### 2.2 异常流程

```
活码不存在/已停用
    │
    ▼
┌─────────────────┐
│ 404 错误页      │
│ - 提示二维码失效│
└─────────────────┘
```

---

## 3. 页面设计

### 3.1 扫码落地页 (Landing Page)

**UI 设计图**：`UI/index/C端扫码落地页_1.png`

```
┌─────────────────────────────────────┐
│ ←          扫码页面标题              │  ← 44px 高度导航栏
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ┌─────────────┐             │
│         │             │             │
│         │  [二维码]    │             │  ← 200x200px 二维码
│         │             │             │
│         └─────────────┘             │
│                                     │
│        请长按识别二维码              │  ← 提示文字
│                                     │
│         添加微信好友                 │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      © 2025 LinkOS                  │  ← 底部版权信息
│                                     │
└─────────────────────────────────────┘
```

#### 3.1.1 页面结构

```typescript
interface LandingPageProps {
  liveCodeId: string;      // 活码ID
  title: string;           // 页面标题（默认"扫码页面标题"）
  qrCodeUrl: string;       // 二维码图片URL
  description?: string;    // 描述文字（默认"添加微信好友"）
}
```

#### 3.1.2 组件规范

| 元素 | 规范 |
|-----|------|
| 导航栏高度 | 44px |
| 标题字号 | 16px Medium |
| 二维码尺寸 | 200x200px |
| 提示文字字号 | 14px Regular |
| 提示文字颜色 | #666666 |
| 描述文字字号 | 14px Regular |
| 描述文字颜色 | #1890ff（品牌色） |
| 背景色 | #F5F5F5 |
| 底部版权字号 | 12px Regular |
| 底部版权颜色 | #999999 |

#### 3.1.3 HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>扫码页面标题</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #F5F5F5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      height: 44px;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      padding: 0 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header-back {
      font-size: 20px;
      color: #333;
      margin-right: 12px;
      cursor: pointer;
    }
    .header-title {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 16px 80px;
    }
    .qrcode {
      width: 200px;
      height: 200px;
      background: #FFFFFF;
      padding: 12px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .qrcode img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .hint {
      margin-top: 20px;
      font-size: 14px;
      color: #666666;
    }
    .description {
      margin-top: 8px;
      font-size: 14px;
      color: #1890ff;
      font-weight: 500;
    }
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      text-align: center;
      background: #F5F5F5;
    }
    .footer p {
      font-size: 12px;
      color: #999999;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="header-back">←</span>
    <span class="header-title">扫码页面标题</span>
  </div>
  <div class="content">
    <div class="qrcode">
      <img src="[二维码图片URL]" alt="二维码">
    </div>
    <p class="hint">请长按识别二维码</p>
    <p class="description">添加微信好友</p>
  </div>
  <div class="footer">
    <p>© 2025 LinkOS</p>
  </div>
</body>
</html>
```

---

### 3.2 404 错误页 (Error Page)

**UI 设计图**：`UI/index/C端扫码404错误页面.png`

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│         ┌─────────────┐             │
│         │             │             │
│         │   [404]     │             │  ← 错误图标/提示
│         │             │             │
│         └─────────────┘             │
│                                     │
│         二维码已失效                 │  ← 标题
│                                     │
│      该二维码已失效或不存在           │  ← 描述
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      © 2025 LinkOS                  │  ← 底部版权信息
│                                     │
└─────────────────────────────────────┘
```

#### 3.2.1 页面结构

```typescript
interface ErrorPageProps {
  code?: number;           // 错误码（默认404）
  title?: string;          // 错误标题（默认"二维码已失效"）
  message?: string;        // 错误描述（默认"该二维码已失效或不存在"）
}
```

#### 3.2.2 组件规范

| 元素 | 规范 |
|-----|------|
| 错误图标 | 可选，或使用 "404" 文字 |
| 标题字号 | 18px Medium |
| 标题颜色 | #333333 |
| 描述字号 | 14px Regular |
| 描述颜色 | #666666 |
| 背景色 | #F5F5F5 |

#### 3.2.3 HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>二维码已失效</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #F5F5F5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .error-icon {
      font-size: 64px;
      color: #D9D9D9;
      margin-bottom: 24px;
    }
    .error-title {
      font-size: 18px;
      font-weight: 500;
      color: #333333;
      margin-bottom: 12px;
    }
    .error-message {
      font-size: 14px;
      color: #666666;
    }
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      text-align: center;
    }
    .footer p {
      font-size: 12px;
      color: #999999;
    }
  </style>
</head>
<body>
  <div class="error-icon">404</div>
  <h1 class="error-title">二维码已失效</h1>
  <p class="error-message">该二维码已失效或不存在</p>
  <div class="footer">
    <p>© 2025 LinkOS</p>
  </div>
</body>
</html>
```

---

## 4. 技术实现方案

### 4.1 技术栈

| 技术 | 说明 |
|-----|------|
| 框架 | 纯 HTML + CSS（无需 JS 框架） |
| 构建 | 静态 HTML 文件 |
| 部署 | 放在 `server/public/h5/` 目录 |

### 4.2 项目结构

```
server/
├── public/h5/                    # H5 页面静态资源
│   ├── landing.html             # 扫码落地页
│   ├── error.html               # 404错误页
│   └── assets/                  # 静态资源（可选）
│       └── images/
│
└── src/
    └── routes/
        └── h5.ts                # H5 路由（API）
```

### 4.3 API 设计

#### 4.3.1 获取活码内容 API

```typescript
// GET /api/h5/live-code/:id
// 获取活码的展示内容
interface GetLiveCodeContentResponse {
  success: boolean;
  data: {
    liveCodeId: string;
    title: string;               // 页面标题
    qrCodeUrl: string;           // 二维码图片URL
    description: string;         // 描述文字
    status: 'active' | 'inactive';
  };
}

// 错误响应
interface ErrorResponse {
  success: false;
  message: string;
  code: number;                  // 404 或其他错误码
}
```

#### 4.3.2 数据上报 API

```typescript
// POST /api/h5/analytics
// 上报页面访问（可选）
interface AnalyticsRequest {
  liveCodeId: string;
  subCodeId?: string;
  domainUsed: string;
  timestamp: string;
}
```

### 4.4 后端路由实现

```typescript
// server/src/routes/h5.ts

import type { FastifyInstance } from 'fastify';
import { storage } from '../storage.js';

/**
 * H5 用户端路由
 */
export async function h5Routes(fastify: FastifyInstance) {
  // 获取活码展示内容
  fastify.get<{ Params: { id: string } }>(
    '/api/h5/live-code/:id',
    async (request, reply) => {
      const { id } = request.params;
      const liveCode = await storage.findById(id);

      // 活码不存在或已停用
      if (!liveCode || liveCode.status !== 'running') {
        reply.code(404);
        return {
          success: false,
          message: '二维码已失效或不存在',
          code: 404
        };
      }

      // 选择子码（根据分配模式）
      const subCode = selectSubCodeForDisplay(liveCode);

      // 更新访问统计
      await storage.incrementPv(id, subCode.id);

      // 返回展示内容
      return {
        success: true,
        data: {
          liveCodeId: id,
          title: liveCode.name || '扫码页面标题',
          qrCodeUrl: subCode.qrUrl,
          description: '添加微信好友',
          status: 'active'
        }
      };
    }
  );

  // H5 落地页路由（静态页面）
  fastify.get('/h5/landing', async (request, reply) => {
    return reply.sendFile('landing.html');
  });

  // H5 错误页路由（静态页面）
  fastify.get('/h5/error', async (request, reply) => {
    return reply.sendFile('error.html');
  });

  // 数据上报（可选）
  fastify.post('/api/h5/analytics', async (request, reply) => {
    // 存储或处理统计数据
    return { success: true };
  });
}

// 选择子码用于展示
function selectSubCodeForDisplay(liveCode: LiveCode): SubCode {
  const { distributionMode, subCodes } = liveCode;
  const enabledSubCodes = subCodes.filter(s => s.status === 'enabled');

  if (enabledSubCodes.length === 0) {
    throw new Error('没有可用的子码');
  }

  switch (distributionMode) {
    case 'THRESHOLD':
      // 阈值模式：选择当前未达阈值的子码
      for (const sub of enabledSubCodes) {
        if (sub.currentPv < (sub.threshold || Infinity)) {
          return sub;
        }
      }
      return enabledSubCodes[0];

    case 'RANDOM':
      // 随机模式
      return enabledSubCodes[Math.floor(Math.random() * enabledSubCodes.length)];

    case 'FIXED':
    default:
      // 固定模式：返回第一个
      return enabledSubCodes[0];
  }
}
```

### 4.5 域名选择与重定向

需要在活码访问入口添加域名选择逻辑：

```typescript
// server/src/routes/link.ts (新增)

import { domainPoolStorage } from '../storage/domain-pool.js';
import { storage } from '../storage.js';

/**
 * 活码访问入口 - 用户扫码后的第一个请求
 */
export async function linkRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { id: string } }>(
    '/api/link',
    async (request, reply) => {
      const { id } = request.query;
      const liveCode = await storage.findById(id);

      // 活码不存在或已停用 -> 404页面
      if (!liveCode || liveCode.status !== 'running') {
        const errorUrl = `${request.protocol}://${request.host}/h5/error`;
        reply.redirect(302, errorUrl);
        return;
      }

      // 选择域名
      const domainSelection = await domainPoolStorage.selectDomainForLiveCode({
        primaryDomain: liveCode.domainConfig?.primaryDomain,
        fallbackDomainIds: liveCode.domainConfig?.fallbackDomains.domainIds,
        strategy: liveCode.domainConfig?.strategy || 'round-robin',
        failoverEnabled: liveCode.domainConfig?.fallbackDomains.failoverEnabled
      });

      // 没有可用域名 -> 404页面
      if (!domainSelection) {
        const errorUrl = `${request.protocol}://${request.host}/h5/error`;
        reply.redirect(302, errorUrl);
        return;
      }

      // 重定向到落地页
      const landingUrl = `${domainSelection.protocol}://${domainSelection.domain}/h5/landing?id=${id}`;
      reply.redirect(302, landingUrl);
    }
  );
}
```

---

## 5. 设计规范

### 5.1 颜色规范

```css
:root {
  /* 品牌色 */
  --brand-primary: #1890ff;

  /* 中性色 */
  --gray-1: #FFFFFF;
  --gray-2: #F5F5F5;
  --gray-3: #D9D9D9;
  --gray-4: #999999;
  --gray-5: #666666;
  --gray-6: #333333;
}
```

### 5.2 字体规范

```css
/* 系统字体栈 */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* 字号 */
--font-size-sm: 12px;   /* 底部版权 */
--font-size-base: 14px; /* 正文 */
--font-size-lg: 16px;   /* 导航标题 */
--font-size-xl: 18px;   /* 错误标题 */
--font-size-xxl: 64px;  /* 404 图标 */

/* 字重 */
--font-weight-normal: 400;
--font-weight-medium: 500;
```

### 5.3 间距规范

```css
/* 移动端标准间距 */
--space-xs: 8px;
--space-sm: 12px;
--space-md: 16px;
--space-lg: 20px;
--space-xl: 24px;
--space-xxl: 40px;
```

---

## 6. 数据埋点

### 6.1 埋点事件

| 事件名称 | 触发时机 |
|---------|---------|
| page_view | 页面加载 |
| qrcode_shown | 二维码展示成功 |
| error | 页面错误 |

### 6.2 简单埋点实现

```html
<!-- 在页面中添加简单的埋点脚本 -->
<script>
  // 页面加载埋点
  fetch('/api/h5/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      liveCodeId: new URLSearchParams(window.location.search).get('id'),
      domainUsed: window.location.hostname,
      timestamp: new Date().toISOString()
    })
  }).catch(() => {}); // 静默失败
</script>
```

---

## 7. 实施计划

### Phase 1: 创建静态页面 (Day 1)
- [ ] 创建 `server/public/h5/` 目录
- [ ] 创建 `landing.html` 和 `error.html`
- [ ] 实现静态样式

### Phase 2: 后端 API (Day 2)
- [ ] 创建 `server/src/routes/h5.ts`
- [ ] 实现活码内容获取 API
- [ ] 实现数据上报 API

### Phase 3: 域名选择与重定向 (Day 3)
- [ ] 创建 `server/src/routes/link.ts`
- [ ] 集成域名池选择逻辑
- [ ] 实现 302 重定向

### Phase 4: 测试 (Day 4)
- [ ] 功能测试
- [ ] 域名切换测试
- [ ] 错误场景测试

---

## 附录

### A. 参考资料

- UI 设计图：`UI/index/C端扫码落地页_1.png`
- UI 设计图：`UI/index/C端扫码404错误页面.png`

### B. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|-----|------|---------|-----|
| v1.0 | 2026-01-18 | 初始版本（过于复杂） | Claude |
| v1.1 | 2026-01-18 | 简化设计，基于实际 UI | Claude |

### C. 相关文档

- [admin-design.md](./admin-design.md) - 管理后台设计
- [domain-livecode-integration-design.md](./domain-livecode-integration-design.md) - 域名池与活码集成
