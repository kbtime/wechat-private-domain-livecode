# PRD：微信私域活码系统 (JSON 轻量版)

| 文档版本 | 修改日期   | 修改人 | 备注                                               |
| :------- | :--------- | :----- | :------------------------------------------------- |
| v2.0     | 2026-01-17 | Monica | 移除数据库，采用 JSON 文件存储；增加 .env 鉴权逻辑 |

## 1. 系统架构与技术栈 (Architecture)

### 1.1 核心设计理念
*   **无状态 (Stateless)**：不依赖外部数据库服务，数据自包含。
*   **极简部署**：代码包解压即用，仅依赖文件读写权限。
*   **配置分离**：敏感信息（密码、Key）进环境变量，业务数据进 JSON。

### 1.2 目录结构规划
```text
/root
├── .env                # [文件] 敏感配置 (密码, OSS Key, 主域名)
├── data
│   ├── config.json     # [数据] 活码规则、子码链接、炮灰域名列表
│   └── stats.json      # [数据] 扫码计数统计 (读写分离，避免锁死配置)
├── public              # [目录] 对外访问入口
│   ├── index.php/js    # 分发逻辑入口
│   └── admin           # 管理后台入口
└── src                 # 核心逻辑代码
```

---

## 2. 核心功能逻辑 (Core Logic)

### 2.1 鉴权模块 (Authentication)
*   **机制**：单一管理员模式。
*   **逻辑**：
    1.  访问后台 `/admin` 时，系统检查 Session。
    2.  未登录则展示极简登录页（仅一个输入框：`Password`）。
    3.  用户输入密码提交 -> 后端读取 `.env` 文件中的 `ADMIN_PASSWORD` 进行比对。
    4.  比对成功 -> 写入 Session -> 跳转管理页。

### 2.2 数据存储结构 (JSON Schema)
这是本系统的“心脏”，替代了 SQL 表结构。

#### A. `data/config.json` (配置表)
```json
{
  "domains": {
    "fodder_list": [
      "http://a.com",
      "http://b.com"
    ]
  },
  "live_codes": [
    {
      "id": "x8Gk",                // 唯一短码
      "name": "由你社群引流",
      "mode": "threshold",         // 模式: threshold, random, fixed
      "create_time": 1705480000,
      "status": "active",
      "sub_codes": [
        {
          "id": "img_01",
          "url": "https://oss.aliyun.com/...", // OSS CDN地址
          "limit": 200,            // 阈值
          "weight": 1,             // 权重
          "status": "active"
        },
        {
          "id": "img_02",
          "url": "https://oss.aliyun.com/...",
          "limit": 200,
          "status": "active"
        }
      ]
    }
  ]
}
```

#### B. `data/stats.json` (统计表)
*独立文件的目的是减少写入冲突风险。*
```json
{
  "x8Gk": {                  // 活码ID
    "total_pv": 1500,        // 总访问量
    "sub_codes": {
      "img_01": 200,         // 子码1已扫次数
      "img_02": 45           // 子码2已扫次数
    }
  }
}
```

---

## 3. 功能需求详细说明 (Functional Requirements)

### 3.1 管理后台 (Admin Dashboard)

#### 3.1.1 登录页
*   **UI**：极简卡片，居中显示。
*   **交互**：输入密码 -> Enter -> 错误提示/成功跳转。

#### 3.1.2 仪表盘 (Dashboard)
*   **顶部**：显示当前系统状态（OSS 连接状态、`.env` 读取状态）。
*   **列表区**：以卡片或表格形式展示现有活码。
    *   展示：活码名称、短链接、当前 PV、当前展示的是第几张图。
    *   操作：编辑、删除、**获取推广码**。

#### 3.1.3 活码编辑器 (Editor)
*   **基础设置**：输入名称、选择分流模式。
*   **域名池管理**：
    *   一个大文本框，一行一个输入炮灰域名。
    *   保存时更新到 `config.json` 的 `domains` 字段。
*   **子码管理 (OSS 集成)**：
    *   **上传按钮**：点击选择本地图片 -> 前端直接调用阿里云 OSS SDK (或后端中转) -> 获取 URL。
    *   **列表回显**：显示已上传图片的缩略图、阈值输入框、权重输入框、删除按钮。
    *   *注意*：保存时，将整个结构序列化写入 `config.json`。

#### 3.1.4 推广物料生成
*   **触发**：在列表页点击“二维码图标”。
*   **逻辑**：
    1.  读取 `.env` 中的 `MASTER_DOMAIN` (主域名)。
    2.  拼接 URL: `https://{MASTER_DOMAIN}/s/{id}`。
    3.  调用 **草料二维码 API** (参数: text=URL)。
    4.  弹窗展示返回的二维码图片。

### 3.2 流量分发引擎 (Backend - JSON版)

**核心挑战**：并发写 `stats.json` 可能导致数据丢失。
**解决方案**：使用文件锁 (`flock` in PHP / `fs-ext` in Node) 确保同一时间只有一个请求能写入统计文件。

#### 逻辑流程：
1.  **读取配置**：加载 `config.json` 到内存。
2.  **读取统计**：加载 `stats.json`。
3.  **决策计算**：
    *   *阈值模式*：遍历 `config` 中的子码列表，对比 `stats` 中的计数。找到第一个 `count < limit` 的子码。
4.  **计数更新**：
    *   内存中 `count + 1`。
    *   **加锁** -> 写入 `stats.json` -> **解锁**。
5.  **构建跳转**：
    *   从 `config.domains` 随机取一个炮灰域名。
    *   执行 302 跳转。

---

## 4. 环境变量配置 (.env)

这是系统唯一的“配置文件”，部署时需手动创建。

```ini
# --- 安全配置 ---
# 管理后台登录密码
ADMIN_PASSWORD=YourStrongPassword123

# --- 域名配置 ---
# 主域名 (入口)，不带 http/https
MASTER_DOMAIN=main.example.com

# --- 阿里云 OSS 配置 ---
OSS_ACCESS_KEY_ID=LTAI5t...
OSS_ACCESS_KEY_SECRET=Op9...
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_BUCKET=my-qrcode-bucket
# 如果配置了 CDN 域名，填这里；否则留空使用默认 Bucket 域名
OSS_CDN_DOMAIN=https://cdn.example.com

# --- 第三方服务 ---
# 草料二维码 API 地址 (假设需要 Key)
CAOLIAO_API_URL=https://cli.im/api/qrcode/code
CAOLIAO_API_KEY=xxx
```

---

## 5. 交互与UI 建议 (UI/UX)

由于没有数据库，后台 UI 建议使用纯静态 HTML + Vue.js (CDN引入) 或 jQuery 实现，数据通过 Ajax 请求后端的 PHP/Node 接口（这些接口负责读写 JSON）。

*   **风格**：Ant Design Vue 或 Bootstrap 5 (现成组件库，开发快)。
*   **反馈**：保存配置时，由于要写文件，可能会有 100ms-300ms 延迟，前端需加 `Loading` 遮罩，避免用户重复点击导致 JSON 文件损坏。

## 6. 风险提示 (Critical Warning)

1.  **JSON 文件损坏风险**：
    *   如果服务器断电或写入中断，`config.json` 可能会变为空白。
    *   **对策**：代码中必须实现“写入前先备份”机制（如保存为 `config.json.bak`），读取失败时自动回滚。
2.  **性能瓶颈**：
    *   当 `stats.json` 变得很大时，每次读写都会变慢。
    *   **对策**：建议定期（如每天凌晨）归档旧数据，或者仅保留最近 7 天的详细数据。
