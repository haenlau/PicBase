/**
 * 安全工具模块
 * 提供文件类型校验、安全头、SVG清理等功能
 */

// 允许的文件类型配置
export const ALLOWED_MIME_TYPES = {
  // 图片
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp'],
  'image/tiff': ['.tiff', '.tif'],
  'image/svg+xml': ['.svg'],
  'image/x-icon': ['.ico'],
  'image/vnd.microsoft.icon': ['.ico'],
  // 其他安全类型
  'application/pdf': ['.pdf'],
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  'application/x-7z-compressed': ['.7z'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
}

// 危险的MIME类型 - 绝对禁止
export const BLOCKED_MIME_TYPES = [
  'text/html',
  'text/javascript',
  'application/javascript',
  'application/x-javascript',
  'application/xhtml+xml',
  'application/xml',
  'text/xml',
  'application/x-shockwave-flash',
  'application/java-archive',
  'application/x-httpd-php',
  'application/x-perl',
  'application/x-python',
  'text/x-python',
  'application/x-ruby',
  'text/x-ruby',
  'application/x-shellscript',
  'text/x-shellscript',
  'application/x-executable',
  'application/x-msdos-program',
  'application/x-msdownload',
  'application/x-bat',
  'application/x-dosexec',
]

// 危险的文件扩展名
export const BLOCKED_EXTENSIONS = [
  '.html', '.htm', '.xhtml',
  '.js', '.mjs', '.cjs',
  '.jsx', '.tsx', '.ts',
  '.php', '.php3', '.php4', '.php5', '.phtml',
  '.py', '.pyc', '.pyo',
  '.rb', '.rbw',
  '.pl', '.pm', '.cgi',
  '.sh', '.bash', '.csh', '.ksh',
  '.bat', '.cmd', '.com', '.exe', '.msi', '.scr',
  '.jsp', '.jspx', '.asp', '.aspx', '.ascx',
  '.vbs', '.vbe', '.wsf', '.wsh',
  '.ps1', '.psm1', '.psd1',
  '.jar', '.war', '.ear',
  '.class', '.swf',
  '.dll', '.so', '.dylib',
  '.action', '.do',
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
  
  // 检查是否在黑名单中
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return {
      allowed: false,
      reason: `File type ${ext} is not allowed for security reasons`
    }
  }
  
  // 检查MIME类型是否在黑名单中
  if (BLOCKED_MIME_TYPES.includes(mimeType)) {
    return {
      allowed: false,
      reason: `MIME type ${mimeType} is not allowed for security reasons`
    }
  }
  
  // 如果有MIME类型，检查是否在白名单中
  if (mimeType && Object.keys(ALLOWED_MIME_TYPES).length > 0) {
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      // MIME不在白名单，但可能是未知类型，检查扩展名
      const allowedExts = Object.values(ALLOWED_MIME_TYPES).flat()
      if (!allowedExts.includes(ext)) {
        return {
          allowed: false,
          reason: `File type ${ext} (${mimeType}) is not supported`
        }
      }
    }
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
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
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
  
  // 对于HTML和SVG，强制下载而不是内联显示
  const ext = getFileExtension(fileName).toLowerCase()
  if (ext === '.html' || ext === '.htm' || ext === '.svg') {
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
