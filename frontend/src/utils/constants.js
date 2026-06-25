export const APP_NAME = 'PicBase'
export const APP_VERSION = '3.0.0'

export const UPLOAD_CHANNELS = {
  TELEGRAM: 'telegram',
  CLOUDFLARE_R2: 'cfr2',
  S3: 's3',
  DISCORD: 'discord',
  HUGGINGFACE: 'huggingface',
  WEBDAV: 'webdav'
}

export const FILE_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  PDF: 'pdf',
  FILE: 'file'
}

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'size-asc', label: 'Size (small first)' },
  { value: 'size-desc', label: 'Size (large first)' }
]

export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list'
}

export const PAGE_SIZES = [12, 24, 48, 96]

export const DEFAULT_PAGE_SIZE = 24

export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export const ALLOWED_FILE_TYPES = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'text/plain',
  'text/csv'
]
