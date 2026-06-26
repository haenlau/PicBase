<div align="center">
  <img src="frontend/public/logo.svg" alt="PicBase Logo" width="80">
  <h1>PicBase</h1>
  <p><em>Modern file hosting solution powered by Cloudflare</em></p>
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Cloudflare Pages](https://img.shields.io/badge/deploy-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com)
</div>

---

## Introduction

PicBase is a modern, self-hosted file hosting solution built on Cloudflare's edge infrastructure. It features a beautiful Material Design 3 interface and supports multiple storage backends, making it perfect for image hosting, blog assets, and file sharing.

English | [中文](./README_zh.md)

## Features

- **Modern UI** - Material Design 3 with dark mode support
- **Multi-Channel Storage** - Telegram, Cloudflare R2, S3, Discord, HuggingFace, WebDAV
- **File Management** - Upload, delete, rename, move, directory support
- **Multi-Format Links** - Direct, Markdown, HTML, BBCode with one-click copy
- **Batch Operations** - Select and manage multiple files at once
- **Image Preview** - Built-in image viewer
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Image Compression** - Auto-compress on upload to save storage
- **RESTful API** - Full API for programmatic access

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vue 3, Vuetify 3, Vite |
| Backend | Cloudflare Pages Functions |
| Database | Cloudflare KV or D1 |
| Storage | Cloudflare R2, Telegram, S3, etc. |

## Quick Start

### Prerequisites

- Cloudflare account (with Pages, KV, R2 enabled)
- Node.js 18+

### Deployment

1. Fork or clone this repository
2. Create a Pages project in Cloudflare Dashboard
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `/frontend-dist`
5. Configure environment bindings:
   - KV namespace: `img_url`
   - R2 bucket: `img_r2`
6. After deployment, visit your site. First login will auto-create admin account

### Local Development

```bash
# Install dependencies
npm install
cd frontend && npm install

# Start frontend dev server
npm run dev

# In another terminal, start backend
npm run start
```

## Project Structure

```
PicBase/
├── frontend/              # Frontend source code
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # Vue components
│   │   ├── layouts/      # Page layouts
│   │   ├── router/       # Vue Router
│   │   ├── stores/       # Pinia stores
│   │   ├── styles/       # Theme & styles
│   │   ├── utils/        # Utilities
│   │   └── views/        # Page views
│   └── package.json
├── functions/             # Cloudflare Pages Functions (backend)
├── frontend-dist/         # Build output
├── package.json           # Root package.json
└── README.md
```

## Pages

| Path | Page | Description |
|------|------|-------------|
| `/` | Upload | Drag & drop upload, select channel, set directory |
| `/files` | File Manager | File list, search, filter, batch operations |
| `/channels` | Channels | Manage storage channels |
| `/settings` | Settings | Admin account configuration |
| `/help` | Help | Storage channel setup guide |
| `/browse` | Browse | Public gallery (configurable) |

## API Documentation

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/adminLogin` | Admin login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/sessionCheck` | Check session |

### File Management

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload file |
| GET | `/api/manage/list` | List files |
| DELETE | `/api/manage/delete/:path` | Delete file |
| POST | `/api/manage/rename/:path` | Rename file |
| POST | `/api/manage/move/:path` | Move file |
| GET | `/api/manage/metadata/:path` | Get metadata |

### Configuration

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/manage/sysConfig/upload` | Get upload config |
| POST | `/api/manage/sysConfig/upload` | Update upload config |
| GET | `/api/manage/sysConfig/security` | Get security config |
| POST | `/api/manage/sysConfig/security` | Update security config |

## License

MIT License - See [LICENSE](LICENSE) for details
