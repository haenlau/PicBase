<div align="center">
  <img src="frontend/public/logo.svg" alt="PicBase Logo" width="80">
  <h1>PicBase</h1>
  <p><em>基于 Cloudflare 的现代图床解决方案</em></p>
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Cloudflare Pages](https://img.shields.io/badge/deploy-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com)
</div>

---

## 简介

PicBase 是一个基于 Cloudflare 边缘基础设施构建的现代自托管文件托管解决方案。它提供了美观的 Material Design 3 界面，支持多种存储后端，适合个人图床、博客配图、文件分享等场景。

[English](./README.md) | 中文

## 功能特性

- **现代界面** - Material Design 3 设计风格，支持深色模式
- **多渠道存储** - Telegram、Cloudflare R2、S3、Discord、HuggingFace、WebDAV
- **文件管理** - 上传、删除、重命名、移动、目录管理
- **多格式链接** - 直链、Markdown、HTML、BBCode 一键复制
- **批量操作** - 批量选择、删除、移动文件
- **图片预览** - 内置图片查看器
- **响应式设计** - 适配桌面、平板、手机
- **图片压缩** - 上传时自动压缩，节省存储空间
- **RESTful API** - 完整的 API 接口

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | Vue 3、Vuetify 3、Vite |
| 后端 | Cloudflare Pages Functions |
| 数据库 | Cloudflare KV 或 D1 |
| 存储 | Cloudflare R2、Telegram、S3 等 |

## 快速开始

### 前置条件

- Cloudflare 账户（需启用 Pages、KV、R2）
- Node.js 22.16+（仓库通过 `.node-version` 对齐 Cloudflare Pages v3 默认版本）

### 部署步骤

1. Fork 或克隆此仓库
2. 在 Cloudflare Dashboard 中创建 Pages 项目
3. 连接 GitHub 仓库
4. 配置构建设置：
   - **构建命令**：`npm run build`
   - **构建输出目录**：`/frontend-dist`
5. 配置环境绑定：
   - KV 命名空间：`img_url`
   - R2 存储桶：`img_r2`
6. 部署完成后访问网站，首次登录会自动创建管理员账号

### 本地开发

```bash
# 安装依赖
npm install
cd frontend && npm install

# 启动前端开发服务器
npm run dev

# 另开终端，启动后端
npm run start
```

## 项目结构

```
PicBase/
├── frontend/              # 前端源码
│   ├── src/
│   │   ├── api/          # API 客户端
│   │   ├── components/   # Vue 组件
│   │   ├── layouts/      # 页面布局
│   │   ├── router/       # 路由配置
│   │   ├── stores/       # Pinia 状态管理
│   │   ├── styles/       # 主题样式
│   │   ├── utils/        # 工具函数
│   │   └── views/        # 页面视图
│   └── package.json
├── functions/             # Cloudflare Pages Functions (后端)
├── frontend-dist/         # 构建输出
├── package.json           # 根目录 package.json
└── README.md
```

## 页面说明

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 上传页面 | 拖拽上传、选择渠道、指定目录 |
| `/files` | 文件管理 | 文件列表、搜索、筛选、批量操作 |
| `/channels` | 渠道配置 | 管理存储渠道 |
| `/settings` | 安全设置 | 管理员账号配置 |
| `/help` | 配置说明 | 存储渠道绑定指南 |
| `/browse` | 公开浏览 | 公开图库（需配置） |

## API 文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/adminLogin` | 管理员登录 |
| POST | `/api/auth/logout` | 退出登录 |
| GET | `/api/auth/sessionCheck` | 检查会话 |

### 文件管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/upload` | 上传文件 |
| GET | `/api/manage/list` | 文件列表 |
| DELETE | `/api/manage/delete/:path` | 删除文件 |
| POST | `/api/manage/rename/:path` | 重命名文件 |
| POST | `/api/manage/move/:path` | 移动文件 |
| GET | `/api/manage/metadata/:path` | 获取元数据 |

### 配置接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/manage/sysConfig/upload` | 获取上传配置 |
| POST | `/api/manage/sysConfig/upload` | 更新上传配置 |
| GET | `/api/manage/sysConfig/security` | 获取安全配置 |
| POST | `/api/manage/sysConfig/security` | 更新安全配置 |

## 许可证

MIT License - 详见 [LICENSE](LICENSE)
