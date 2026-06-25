/**
 * 图片压缩工具
 * 使用 Canvas API 进行客户端压缩
 */

/**
 * 压缩图片
 * @param {File} file - 原始文件
 * @param {Object} options - 压缩选项
 * @param {number} options.quality - 压缩质量 0-1，默认 0.8
 * @param {number} options.maxWidth - 最大宽度，默认 1920
 * @param {number} options.maxHeight - 最大高度，默认 1080
 * @returns {Promise<File>} 压缩后的文件
 */
export async function compressImage(file, options = {}) {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080
  } = options

  // 只压缩图片文件
  if (!file.type.startsWith('image/')) {
    return file
  }

  // 不压缩 GIF（会丢失动画）
  if (file.type === 'image/gif') {
    return file
  }

  // 不压缩 SVG
  if (file.type === 'image/svg+xml') {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    
    // 计算新尺寸
    let { width, height } = bitmap
    const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)

    // 使用 Canvas 压缩
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, width, height)

    // 转换为 Blob
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, file.type, quality)
    })

    if (!blob) {
      return file
    }

    // 如果压缩后更大，返回原文件
    if (blob.size >= file.size) {
      return file
    }

    // 创建新的 File 对象
    return new File([blob], file.name, {
      type: file.type,
      lastModified: Date.now()
    })
  } catch (error) {
    console.error('Image compression failed:', error)
    return file
  }
}

/**
 * 批量压缩图片
 * @param {FileList|Array} files - 文件列表
 * @param {Object} options - 压缩选项
 * @returns {Promise<Array>} 压缩后的文件数组
 */
export async function compressImages(files, options = {}) {
  const compressed = []
  for (const file of files) {
    const result = await compressImage(file, options)
    compressed.push(result)
  }
  return compressed
}
