/**
 * 图片压缩工具
 */

export async function compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
  // 不压缩 GIF 和 SVG
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 计算新尺寸
        let { width, height } = img
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
        
        // 使用 Canvas 压缩
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressed = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressed)
            } else {
              resolve(file)
            }
          },
          file.type,
          quality
        )
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
