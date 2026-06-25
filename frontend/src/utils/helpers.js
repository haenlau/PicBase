export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  
  return date.toLocaleDateString('zh-CN')
}

export function getFileType(mimeType, fileName) {
  if (!mimeType && fileName) {
    const ext = fileName.split('.').pop().toLowerCase()
    const extMap = {
      'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
      'webp': 'image', 'svg': 'image', 'bmp': 'image',
      'mp4': 'video', 'webm': 'video', 'mov': 'video',
      'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio',
      'pdf': 'document', 'doc': 'document', 'docx': 'document',
      'zip': 'archive', 'rar': 'archive', '7z': 'archive'
    }
    return extMap[ext] || 'other'
  }
  
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document'
  return 'other'
}

export function getFileIcon(type) {
  const icons = {
    image: 'image',
    video: 'videocam',
    audio: 'audiotrack',
    document: 'description',
    archive: 'folder_zip',
    other: 'insert_drive_file'
  }
  return icons[type] || 'insert_drive_file'
}

export function getFileColor(type) {
  const colors = {
    image: '#ff6b6b',
    video: '#4ecdc4',
    audio: '#45b7d1',
    document: '#96ceb4',
    archive: '#ffeaa7',
    other: '#a0a0a0'
  }
  return colors[type] || '#a0a0a0'
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      return true
    } catch {
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
