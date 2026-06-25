export const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes === undefined || bytes === null) return '0 B'
  
  // 确保 bytes 是数字
  const numBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes
  if (isNaN(numBytes)) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(Math.abs(numBytes)) / Math.log(k))
  const index = Math.min(i, sizes.length - 1)
  
  return parseFloat((numBytes / Math.pow(k, index)).toFixed(2)) + ' ' + sizes[index]
}

/**
 * 从后端返回的FileSize字符串解析字节数
 * 后端存储的FileSize可能是 "2.5" (MB) 或 "2.5MB" 格式
 */
export const parseFileSize = (sizeStr, sizeBytes) => {
  // 优先使用 FileSizeBytes 字段
  if (sizeBytes) {
    const num = typeof sizeBytes === 'string' ? parseFloat(sizeBytes) : sizeBytes
    if (!isNaN(num) && num > 0) return num
  }
  
  // 解析 FileSize 字段
  if (!sizeStr) return 0
  
  const str = sizeStr.toString()
  const numMatch = str.match(/[\d.]+/)
  if (!numMatch) return 0
  
  const num = parseFloat(numMatch[0])
  if (isNaN(num)) return 0
  
  // 如果数字小于1000，假设是MB单位
  if (num < 1000) {
    return num * 1024 * 1024
  }
  return num
}

export const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString()
}

export const formatDateTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
}

export const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf') return 'pdf'
  return 'file'
}

export const isImageFile = (mimeType) => {
  return mimeType && mimeType.startsWith('image/')
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      return true
    } catch (e) {
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const debounce = (fn, delay = 300) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export const throttle = (fn, limit = 300) => {
  let inThrottle
  return (...args) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
