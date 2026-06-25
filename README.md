<div align="center">
  <img src="frontend/public/logo.svg" alt="PicBase Logo" width="80">
  <h1>PicBase</h1>
  <p><em>Modern file hosting solution powered by Cloudflare</em></p>
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Cloudflare Pages](https://img.shields.io/badge/deploy-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com)
</div>

---

## Overview

PicBase is a modern, self-hosted file hosting solution built on Cloudflare's edge infrastructure. It provides a beautiful Material Design 3 interface for uploading, managing, and sharing files with support for multiple storage backends.

## Features

- **Modern UI** - Material Design 3 with dark mode support
- **Multi-Channel Storage** - Telegram, Cloudflare R2, S3, Discord, HuggingFace, WebDAV
- **File Management** - Upload, delete, rename, move, and organize files
- **Directory Support** - Create and manage folders
- **Tag System** - Organize files with tags
- **Batch Operations** - Select and manage multiple files at once
- **Image Preview** - Built-in image viewer and gallery
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Internationalization** - English and Chinese support
- **RESTful API** - Full API for programmatic access
- **WebDAV Support** - Access files via WebDAV protocol

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vue 3, Vuetify 3 (Material Design 3), Vite |
| Backend | Cloudflare Pages Functions |
| Database | Cloudflare KV or D1 |
| Storage | Cloudflare R2, Telegram, S3, Discord, HuggingFace, WebDAV |

## Quick Start

### Prerequisites

- Cloudflare account with Pages, KV, and R2 enabled
- Node.js 18+ (for local development)

### Deployment

1. Fork or clone this repository
2. Connect to Cloudflare Pages
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `/frontend-dist`
4. Configure environment bindings:
   - KV namespace: `img_url`
   - R2 bucket: `img_r2`

### Local Development

```bash
# Install dependencies
npm install
cd frontend && npm install

# Start development server
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

## API Documentation

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/adminLogin` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/sessionCheck` - Check session

### File Management

- `POST /upload` - Upload file
- `GET /api/manage/list` - List files
- `DELETE /api/manage/delete/:path` - Delete file
- `PUT /api/manage/rename/:path` - Rename file
- `PUT /api/manage/move/:path` - Move file
- `GET /api/manage/metadata/:path` - Get file metadata

### Configuration

- `GET /api/manage/sysConfig/upload` - Get upload config
- `PUT /api/manage/sysConfig/upload` - Update upload config
- `GET /api/manage/sysConfig/security` - Get security config
- `PUT /api/manage/sysConfig/security` - Update security config

## License

MIT License - See [LICENSE](LICENSE) for details
