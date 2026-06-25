<div align="center">
  <img src="frontend/public/logo.svg" alt="PicBase Logo" width="80">
  <h1>PicBase</h1>
  <p><em>基于 Cloudflare 的现代文件托管解决方案</em></p>
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Cloudflare Pages](https://img.shields.io/badge/deploy-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com)
</div>

---

## 概述

PicBase 是一个基于 Cloudflare 边缘基础设施构建的现代自托管文件托管解决方案。它提供了精美的 Material Design 3 界面，用于上传、管理和分享文件，支持多种存储后端。

## 功能特性

- **现代界面** - Material Design 3 设计，支持深色模式
- **多渠道存储** - Telegram、Cloudflare R2、S3、Discord、HuggingFace、WebDAV
- **文件管理** - 上传、删除、重命名、移动和组织文件
- **目录支持** - 创建和管理文件夹
- **标签系统** - 使用标签组织文件
- **批量操作** - 选择并管理多个文件
- **图片预览** - 内置图片查看器和图库
- **响应式设计** - 适用于桌面、平板和手机
- **国际化** - 支持英文和中文
- **RESTful API** - 完整的编程接口
- **WebDAV 支持** - 通过 WebDAV 协议访问文件

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | Vue 3、Vuetify 3 (Material Design 3)、Vite |
| 后端 | Cloudflare Pages Functions |
| 数据库 | Cloudflare KV 或 D1 |
| 存储 | Cloudflare R2、Telegram、S3、Discord、HuggingFace、WebDAV |

## 快速开始

### 前提条件

- 拥有 Cloudflare 账户，并启用 Pages、KV 和 R2
- Node.js 18+（用于本地开发）

### 部署

1. Fork 或克隆此仓库
2. 连接到 Cloudflare Pages
3. 配置构建设置：
   - **构建命令**：`npm run build`
   - **构建输出目录**：`/frontend-dist`
4. 配置环境绑定：
   - KV 命名空间：`img_url`
   - R2 存储桶：`img_r2`

### 本地开发

```bash
# 安装依赖
npm install
cd frontend && npm install

# 启动开发服务器
npm run dev

# 在另一个终端启动后端
npm run start
```

## 项目结构

```
PicBase/
├── frontend/              # 前端源代码
│   ├── src/
│   │   ├── api/          # API 客户端
│   │   ├── components/   # Vue 组件
│   │   ├── layouts/      # 页面布局
│   │   ├── router/       # Vue Router
│   │   ├── stores/       # Pinia 状态管理
│   │   ├── styles/       # 主题和样式
│   │   ├── utils/        # 工具函数
│   │   └── views/        # 页面视图
│   └── package.json
├── functions/             # Cloudflare Pages Functions（后端）
├── frontend-dist/         # 构建输出
├── package.json           # 根 package.json
└── README.md
```

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE)
