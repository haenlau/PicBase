/**
 * 安全工具模块
 * 提供文件类型校验、安全头、SVG清理等功能
 */

// 允许的文件类型配置 - 仅图片格式
export const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/tiff': ['.tiff', '.tif'],
  'image/bmp': ['.bmp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'image/avif': ['.avif'],
  'image/svg+xml': ['.svg'],
}

// 允许的文件扩展名
export const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.tiff', '.tif',
  '.bmp',
  '.heic', '.heif',
  '.avif',
  '.svg',
]

/**
 * 校验文件类型是否允许
 * @param {File} file - 文件对象
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function validateFileType(file) {
  const fileName = file.name || ''
  const mimeType = file.type || ''
  
  // 获取文件扩展名
  const ext = getFileExtension(fileName).toLowerCase()
  
  // 检查扩展名是否在允许列表中
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      allowed: false,
      reason: `不支持的文件格式: ${ext}。仅支持图片格式 (JPEG, PNG, WebP, GIF, TIFF, BMP, HEIC, AVIF, SVG)`
    }
  }
  
  // 如果有MIME类型，检查是否在白名单中
  if (mimeType && !Object.keys(ALLOWED_MIME_TYPES).includes(mimeType)) {
    // MIME不在白名单，但扩展名在，可能是未知类型，继续检查
    console.warn(`MIME type ${mimeType} not in whitelist, but extension ${ext} is allowed`)
  }
  
  return { allowed: true }
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(fileName) {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot === -1) return ''
  return fileName.substring(lastDot)
}

/**
 * 清理SVG文件内容，移除危险代码
 * @param {string} svgContent - SVG内容
 * @returns {string} 清理后的SVG内容
 */
export function sanitizeSVG(svgContent) {
  if (typeof svgContent !== 'string') return svgContent
  
  let cleaned = svgContent
  
  // 移除<script>标签及其内容
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // 移除事件处理器属性
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
  
  // 移除javascript:协议
  cleaned = cleaned.replace(/javascript\s*:/gi, '')
  
  // 移除data:协议中的脚本
  cleaned = cleaned.replace(/data\s*:\s*text\/html/gi, 'data:text/plain')
  
  // 移除<foreignObject>标签（可能包含HTML）
  cleaned = cleaned.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
  
  // 移除<use>标签的href中的javascript
  cleaned = cleaned.replace(/xlink:href\s*=\s*["']javascript:[^"']*["']/gi, '')
  cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
  
  return cleaned
}

/**
 * 获取安全的Content-Type
 * @param {string} fileName - 文件名
 * @param {string} originalMimeType - 原始MIME类型
 * @returns {string} 安全的Content-Type
 */
export function getSafeContentType(fileName, originalMimeType) {
  const ext = getFileExtension(fileName).toLowerCase()
  
  // 映射扩展名到安全的MIME类型
  const safeMimeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.avif': 'image/avif',
    '.svg': 'image/svg+xml',
  }
  
  return safeMimeMap[ext] || 'application/octet-stream'
}

/**
 * 构建安全响应头
 * @param {Headers} headers - 原始headers
 * @param {string} fileName - 文件名
 * @param {boolean} isInline - 是否内联显示
 * @returns {Headers} 添加安全头后的headers
 */
export function setSecurityHeaders(headers, fileName, isInline = true) {
  const safeHeaders = new Headers(headers)
  
  // 防止MIME嗅探
  safeHeaders.set('X-Content-Type-Options', 'nosniff')
  
  // 防止点击劫持
  safeHeaders.set('X-Frame-Options', 'SAMEORIGIN')
  
  // XSS保护（旧版浏览器）
  safeHeaders.set('X-XSS-Protection', '1; mode=block')
  
  // Content-Security-Policy
  safeHeaders.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'")
  
  // Referrer策略
  safeHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // 权限策略
  safeHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // 对于SVG，强制下载而不是内联显示
  const ext = getFileExtension(fileName).toLowerCase()
  if (ext === '.svg') {
    safeHeaders.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
  }
  
  return safeHeaders
}

/**
 * 验证并清理上传的文件
 * @param {File} file - 文件对象
 * @returns {Promise<{ valid: boolean, file?: File, error?: string }>}
 */
export async function validateAndSanitizeFile(file) {
  // 1. 校验文件类型
  const validation = validateFileType(file)
  if (!validation.allowed) {
    return { valid: false, error: validation.reason }
  }
  
  // 2. 如果是SVG，需要清理内容
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    try {
      const content = await file.text()
      const sanitized = sanitizeSVG(content)
      
      // 创建新的清理后的文件
      const blob = new Blob([sanitized], { type: 'image/svg+xml' })
      const cleanFile = new File([blob], file.name, { type: 'image/svg+xml' })
      
      return { valid: true, file: cleanFile }
    } catch (error) {
      return { valid: false, error: 'Failed to sanitize SVG file' }
    }
  }
  
  return { valid: true, file }
}
