# 管理后台（Admin）设计文档 v2.0

> 本文档基于实际前端实现重新设计，技术栈为 React 19 + TypeScript + Tailwind CSS

---

## 1. 概览

### 1.1 系统定位
微信私域活码系统的管理后台，面向运营人员和管理员，提供活码的创建、配置、监控和管理功能。

### 1.2 核心目标
- 快速创建和配置活码
- 实时监控活码数据（PV、阈值使用情况）
- 灵活的子码管理（上传、阈值设置、权重配置）
- 推广码生成和分享
- 极简登录验证

### 1.3 技术栈
- **前端**: React 19 + TypeScript + Vite + Tailwind CSS
- **图表**: Recharts 3.6
- **图标**: Lucide React
- **状态管理**: React 本地状态 (useState)
- **后端**: Node.js + Fastify
- **存储**: JSON文件（零数据库）

---

## 2. 页面结构

### 2.1 登录页 (Login Page)

#### 2.1.1 UI布局
- **整体结构**: 居中卡片式布局
- **背景**: 浅灰色（`slate-50` / `#f8fafc`）
- **卡片**: 白色背景，水平垂直居中，带淡入放大动画

#### 2.1.2 UI元素
| 元素 | 描述 | 样式 |
|------|------|------|
| 图标 | 盾牌图标 (ShieldCheck) | 蓝色圆角方块背景 |
| 标题 | "Admin Dashboard" | 蓝色加粗字体 |
| 副标题 | "请输入管理密码以继续" | 灰色小字 |
| 输入框 | 管理密码 | 占位符"请输入管理密码"，monospace字体 |
| 按钮 | "登录系统" | 蓝色背景（`blue-600`），白色文字 |
| 底部文字 | "Powered by JSON-LiveCode v1.0" | 深灰色小字 |

#### 2.1.3 交互逻辑
- **表单验证**: 密码不能为空
- **提交**: 点击按钮或按Enter键提交
- **错误处理**: 密码错误时 alert 提示
- **成功跳转**: 验证成功后切换到主界面
- **硬编码密码**: `admin`

#### 2.1.4 数据结构
```typescript
interface LoginRequest {
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}
```

---

### 2.2 仪表盘 (Dashboard)

#### 2.2.1 UI布局
- **统计卡片网格**: 1×4 响应式网格
- **图表区域**: 2列布局（左侧访问趋势、右侧流量分布）

#### 2.2.2 统计卡片
| 指标 | 示例值 | 变化趋势 |
|------|--------|---------|
| 总访问 PV | 5,269 | +12% |
| 活跃活码 | 24 | +2 |
| 今日新增 | 458 | +8% |
| 平均转化率 | 18.5% | -2% |

**卡片样式**:
```tsx
// 白色背景、圆角、轻微阴影
className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
```

#### 2.2.3 访问趋势图表
- **图表类型**: 折线图 (LineChart)
- **数据源**: CHART_DATA (7天数据)
- **线条样式**: 蓝色 `#2563eb`，线宽 3px
- **交互**: 悬浮显示 Tooltip

#### 2.2.4 流量分布图表
- **图表类型**: 柱状图 (BarChart)
- **数据源**: CHART_DATA
- **柱子样式**: 蓝色 `#3b82f6`，顶部圆角

#### 2.2.5 数据结构
```typescript
interface DashboardStats {
  totalPv: number;
  activeCodes: number;
  newToday: number;
  conversionRate: string;
}

interface ChartDataPoint {
  name: string;      // Mon, Tue, Wed...
  pv: number;        // 访问量
  uv: number;        // 独立访客
}
```

---

### 2.3 主页/我的活码 (Live Codes)

#### 2.3.1 UI布局
- **顶部导航栏** (Header)
  - 左侧: "LinkOS 管理后台"
  - 右侧: 状态指示（OSS: 已连接、JSON: 可读写）、用户头像

- **侧边栏** (Sidebar)
  - Logo区: LinkOS + 版本号
  - 菜单项: 仪表盘、我的活码（选中）、数据统计、系统设置、用户管理
  - 样式: 图标+文字，选中项蓝色高亮

- **主内容区** (Main Content)
  - 顶部标题栏: "我的活码" + 操作按钮
  - 卡片网格: 响应式网格布局展示活码项目

#### 2.3.2 活码卡片设计
每个活码卡片包含：

| 字段 | 位置 | 描述 |
|------|------|------|
| 活码名称 | 顶部 | 如"社群引流A" |
| 状态标签 | 右上角 | 绿色"运行中" / 灰色"已暂停" |
| 二维码预览 | 左侧 | 80×80px |
| 总访问PV | 中部 | 粗体数字，如"1,203" |
| 当前子码 | 中部 | "#1" (显示子码索引) |
| 剩余阈值 | 中部 | "45/200"格式 |
| 操作按钮 | 底部 | 编辑、数据、推广码 |

**卡片样式**:
```tsx
className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
```

#### 2.3.3 顶部操作按钮
| 按钮 | 样式 | 功能 |
|------|------|------|
| 域名池配置 | 白色背景，灰色文字，齿轮图标 | 配置域名池 |
| 新建活码 | 蓝色背景，白色文字，+号图标 | 打开创建抽屉 |

#### 2.3.4 响应式网格
```tsx
// 响应式断点
grid-cols-1           // 移动端: 1列
md:grid-cols-2        // 平板: 2列
xl:grid-cols-3        // 桌面: 3列
2xl:grid-cols-4       // 大屏: 4列
```

#### 2.3.5 空状态占位卡片
```tsx
// 虚线边框、加号图标、居中文字
className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center"
```

---

### 2.4 新建/编辑活码抽屉 (Create/Edit Drawer)

#### 2.4.1 UI布局
- **标题栏**: "新建活码"/"编辑活码" + 关闭按钮（×）
- **表单区**: 分为两个模块
  - A. 基本信息（A标记，蓝色圆圈）
  - B. 子码管理（B标记，蓝色圆圈）
- **底部操作栏**: 取消（灰色）、保存配置（蓝色）

#### 2.4.2 表单字段

**A. 基本信息**
| 字段 | 标签 | 类型 | 必填 | 占位符 |
|------|------|------|------|---------|
| 活码名称 | `活码名称` | 文本 | 是 | `请输入活码名称` |
| 分流模式 | `分流模式` | 单选按钮组 | 是 | - |

**分流模式选项**:
- 阈值切换 (🔀) - THRESHOLD
- 随机展示 (🔁) - RANDOM
- 固定一张 (⚓) - FIXED

**样式**:
```tsx
// 选中状态: 蓝色边框 + 蓝色背景
className="border-blue-600 bg-blue-50 text-blue-700"

// 未选中状态: 灰色边框
className="border-gray-100 hover:border-gray-200"
```

**B. 子码管理**

| 字段 | 标签 | 类型 | 说明 |
|------|------|------|------|
| 二维码上传 | 点击或拖拽上传 | 文件 | 支持JPG/PNG，≤5MB |
| 子码列表 | - | 卡片列表 | 可添加多个子码 |

**子码卡片结构**:
```
┌─────────────────────────────────┐
│ [缩略图] [阈值输入] [状态开关]   │
│         [权重输入]              │
│                         [删除][上移] │
└─────────────────────────────────┘
```

**子码字段**:
- 缩略图: 图片预览，支持点击放大
- 阈值: 数字输入框，示例"200"
- 状态: 开关控件（开启/禁用）

#### 2.4.3 上传区域样式
```tsx
className="bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-2xl p-8"
```

#### 2.4.5 数据结构
```typescript
enum DistributionMode {
  THRESHOLD = 'THRESHOLD',  // 阈值切换
  RANDOM = 'RANDOM',        // 随机展示
  FIXED = 'FIXED'           // 固定一张
}

interface SubCode {
  id: string;
  qrUrl: string;           // 二维码图片URL
  threshold: number;        // 访问阈值
  currentPv: number;        // 当前访问量
  weight: number;           // 权重
  status: 'enabled' | 'disabled';  // 启用状态
}

interface LiveCode {
  id: string;
  name: string;
  status: 'running' | 'paused';
  distributionMode: DistributionMode;
  totalPv: number;
  subCodes: SubCode[];
  mainUrl: string;         // 主链接URL
}
```

---

### 2.5 推广码弹窗 (Promotion Modal)

#### 2.5.1 UI布局
- **标题栏**: 蓝色背景（`blue-600`），"推广码"标题 + 关闭按钮
- **二维码区**: 大尺寸二维码居中显示，白色卡片容器
- **链接区**: 输入框显示推广链接 + 复制按钮
- **下载按钮**: 全宽蓝色按钮
- **成功提示**: 复制成功后显示浮动提示

#### 2.5.2 交互逻辑
- **打开**: 从卡片点击"推广码"按钮
- **复制链接**: 点击复制按钮，将链接复制到剪贴板，按钮变绿显示"已复制"
- **下载二维码**: 下载二维码图片到本地
- **关闭**: 点击背景区域或关闭按钮

#### 2.5.3 二维码生成
```typescript
// 使用 QR Server API
src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code.mainUrl)}`}
```

#### 2.5.4 状态反馈
```tsx
// 复制按钮状态切换
copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />
copied ? '已复制' : '复制链接'
```

---

### 2.6 数据统计 (Statistics)

#### 2.6.1 UI布局（待开发）
- 时间范围选择器
- 核心指标卡片（总PV、UV、转化率等）
- 图表展示（访问趋势、子码使用分布）
- 数据表格（详细访问记录）

#### 2.6.2 数据结构
```typescript
interface Statistics {
  liveCodeId: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    totalPV: number;
    totalUV: number;
    conversionRate: number;
  };
  trends: Array<{
    date: string;
    pv: number;
    uv: number;
  }>;
}
```

---

## 3. 组件设计

### 3.1 组件清单

| 组件名称 | 文件路径 | 功能 |
|---------|---------|------|
| `Layout` | `/components/Layout.tsx` | 主布局：侧边栏+顶部栏+内容区 |
| `LiveCodeCard` | `/components/LiveCodeCard.tsx` | 活码卡片展示 |
| `CreateEditDrawer` | `/components/CreateEditDrawer.tsx` | 创建/编辑活码抽屉 |
| `PromotionModal` | `/components/PromotionModal.tsx` | 推广码弹窗 |

### 3.2 组件 Props

```typescript
// Layout
interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

// LiveCodeCard
interface LiveCodeCardProps {
  code: LiveCode;
  onEdit: (code: LiveCode) => void;
  onStats: (code: LiveCode) => void;
  onPromote: (code: LiveCode) => void;
}

// CreateEditDrawer
interface CreateEditDrawerProps {
  code?: LiveCode;
  onClose: () => void;
  onSave: (code: Partial<LiveCode>) => void;
}

// PromotionModal
interface PromotionModalProps {
  code: LiveCode;
  onClose: () => void;
}
```

---

## 4. 路由/视图设计

### 4.1 视图状态路由

使用 React 状态进行视图切换（无第三方路由库）：

```typescript
const [activeView, setActiveView] = useState('live-codes');

// 视图列表
type ViewType = 'dashboard' | 'live-codes' | 'stats' | 'settings' | 'users';

// 条件渲染
{activeView === 'dashboard' && renderDashboard()}
{activeView === 'live-codes' && renderLiveCodes()}
{activeView === 'stats' && <div>统计报表正在开发中...</div>}
{activeView === 'settings' && <div>系统设置正在开发中...</div>}
{activeView === 'users' && <div>用户管理正在开发中...</div>}
```

### 4.2 侧边栏导航结构

```
LinkOS (Logo + v1.0)
├── 仪表盘
├── 我的活码 (active)
├── 数据统计 (子菜单，可展开)
│   ├── 访问分析
│   └── 转化跟踪
├── 系统设置
├── 用户管理
└── 退出登录
```

---

## 5. API接口设计

### 5.1 认证相关

```typescript
// POST /api/admin/login
interface LoginRequest {
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

// POST /api/admin/logout
// 无需参数
```

### 5.2 活码管理

```typescript
// GET /api/admin/live-codes
// 返回所有活码列表
interface GetLiveCodesResponse {
  success: boolean;
  data: LiveCode[];
}

// POST /api/admin/live-codes
interface CreateLiveCodeRequest {
  name: string;
  distributionMode: DistributionMode;
  subCodes: SubCode[];
}

interface CreateLiveCodeResponse {
  success: boolean;
  data?: LiveCode;
  message?: string;
}

// PUT /api/admin/live-codes/:id
interface UpdateLiveCodeRequest {
  name?: string;
  distributionMode?: DistributionMode;
  subCodes?: SubCode[];
  status?: 'running' | 'paused';
}

// DELETE /api/admin/live-codes/:id
// 无需参数

// GET /api/admin/live-codes/:id
// 返回单个活码详情
```

### 5.3 推广码

```typescript
// POST /api/admin/live-codes/:id/promotion-code
// 生成推广码

// GET /api/admin/live-codes/:id/promotion-code
// 获取现有推广码
```

### 5.4 数据统计

```typescript
// GET /api/admin/live-codes/:id/statistics
interface StatisticsQuery {
  startDate?: string;
  endDate?: string;
}

interface StatisticsResponse {
  success: boolean;
  data: Statistics;
}
```

---

## 6. 状态管理

### 6.1 本地状态结构

```typescript
// 认证状态
const [isAuthenticated, setIsAuthenticated] = useState(false);

// 视图状态
const [activeView, setActiveView] = useState('live-codes');

// 数据状态
const [liveCodes, setLiveCodes] = useState<LiveCode[]>(MOCK_LIVE_CODES);

// UI 状态
const [selectedCode, setSelectedCode] = useState<LiveCode | null>(null);
const [showPromote, setShowPromote] = useState(false);
const [showDrawer, setShowDrawer] = useState(false);
const [drawerData, setDrawerData] = useState<LiveCode | undefined>(undefined);
```

### 6.2 数据操作

```typescript
// 保存（创建或更新）
const handleSave = (newData: Partial<LiveCode>) => {
  if (newData.id) {
    // 更新现有活码
    setLiveCodes(prev => prev.map(c => c.id === newData.id ? { ...c, ...newData } as LiveCode : c));
  } else {
    // 创建新活码
    const newCode = {
      ...newData,
      id: `code-${Date.now()}`,
      status: 'running',
      totalPv: 0,
      mainUrl: `https://caoliao.api/link?id=${Date.now()}`,
    } as LiveCode;
    setLiveCodes(prev => [newCode, ...prev]);
  }
  setShowDrawer(false);
};
```

---

## 7. 设计规范

### 7.1 颜色方案

| 用途 | 颜色 | Tailwind Class | Hex值 |
|------|------|----------------|-------|
| 主色 | 蓝色 | `blue-600` | `#2563eb` |
| 悬浮主色 | 深蓝色 | `blue-700` | `#1d4ed8` |
| 成功 | 绿色 | `green-600` | `#16a34a` |
| 警告 | 橙色 | `orange-600` | `#ea580c` |
| 错误 | 红色 | `red-600` | `#dc2626` |
| 背景 | 浅灰蓝 | `slate-50` | `#f8fafc` |
| 卡片背景 | 白色 | `white` | `#ffffff` |
| 顶部栏 | 深蓝黑 | `#001529` | - |
| 文字主色 | 深灰 | `gray-800` | `#1f2937` |
| 文字次色 | 中灰 | `gray-600` | `#4b5563` |
| 文字辅助 | 浅灰 | `gray-400` | `#9ca3af` |
| 边框色 | 浅灰 | `gray-200` | `#e5e7eb` |

### 7.2 字体规范

| 用途 | 大小 | 字重 | Tailwind Class |
|------|------|------|----------------|
| 大标题 | 24px | 加粗 | `text-2xl font-bold` |
| 标题 | 20px | 加粗 | `text-xl font-bold` |
| 正文 | 14px | 常规 | `text-sm` |
| 辅助文字 | 12px | - | `text-xs` |
| 代码/数据 | - | monospace | `font-mono` |

**全局字体**: Inter (Google Fonts)

### 7.3 间距规范

基于 Tailwind 默认间距 (4px 基准):

| 用途 | 值 | Tailwind Class | 像素值 |
|------|-----|----------------|--------|
| 卡片内边距 | 大 | `p-6` | 24px |
| 表单区域内边距 | 大 | `p-8` | 32px |
| 组件间距 | 中 | `gap-6` | 24px |
| 网格间距 | 中 | `gap-6` | 24px |
| 元素间距 | 小 | `space-y-4` | 16px |

### 7.4 圆角规范

| 用途 | Tailwind Class | 像素值 |
|------|----------------|--------|
| 按钮 | `rounded-lg` | 8px |
| 卡片 | `rounded-xl` | 12px |
| 模态框/登录框 | `rounded-2xl` | 16px |
| 圆形元素 | `rounded-full` | 完全圆角 |

### 7.5 阴影规范

| 用途 | Tailwind Class |
|------|----------------|
| 卡片轻微阴影 | `shadow-sm` |
| 卡片悬浮阴影 | `shadow-md` |
| 模态框阴影 | `shadow-xl` |
| 蓝色按钮阴影 | `shadow-lg shadow-blue-200` |

### 7.6 动画效果

| 效果 | Tailwind Class | 用途 |
|------|----------------|------|
| 淡入 | `animate-in fade-in duration-300` | 页面切换 |
| 右侧滑入 | `animate-in slide-in-from-right duration-300` | 抽屉打开 |
| 缩放淡入 | `animate-in fade-in zoom-in duration-200` | 模态框打开 |
| 按压效果 | `active:scale-[0.98]` | 按钮点击反馈 |

---

## 8. 边界情况处理

### 8.1 网络异常
- 请求失败时显示错误提示
- 提供重试选项
- 离线时显示网络异常状态

### 8.2 数据极限
- 活码数量超过100时启用分页
- 子码数量建议不超过50个
- 文件上传大小限制5MB
- 文字超长显示省略号 + hover提示

### 8.3 权限控制
- 未登录显示登录页
- 操作失败时显示具体错误信息

---

## 9. 性能优化

- 图表使用 ResponsiveContainer 自适应容器
- 模态框/抽屉使用条件渲染减少DOM
- 动画使用 Tailwind 内置 transform 优化

---

## 10. 项目结构

```
/Users/lhong/code/huoma/UI/linkos-admin-dashboard/
├── components/                    # 组件目录
│   ├── CreateEditDrawer.tsx      # 创建/编辑抽屉组件
│   ├── Layout.tsx                # 主布局组件
│   ├── LiveCodeCard.tsx          # 活码卡片组件
│   └── PromotionModal.tsx        # 推广码弹窗组件
├── App.tsx                        # 主应用组件
├── constants.tsx                  # 常量和模拟数据
├── types.ts                       # TypeScript 类型定义
├── index.tsx                      # 应用入口文件
├── index.html                     # HTML 模板
├── vite.config.ts                # Vite 配置
├── tsconfig.json                 # TypeScript 配置
└── package.json                  # 项目依赖
```

---

## 11. 待完善功能

1. **后端 API 集成**: 当前使用模拟数据 (MOCK_LIVE_CODES)
2. **数据持久化**: 刷新后数据丢失，需要后端存储
3. **表单验证**: 缺少客户端验证
4. **错误处理**: 缺少全局错误处理
5. **加载状态**: 缺少加载指示器
6. **深色模式**: 未实现
7. **国际化**: 仅中文界面
8. **权限管理**: 无细粒度权限控制
9. **单元测试**: 无测试覆盖

---

## 12. 变更记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v2.0 | 2026-01 | 基于前端实现重新设计，技术栈改为 React 19 + Tailwind CSS |
| v1.0 | - | 初始版本，Vue 3 + Element Plus 设计 |
