<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">上传文件</h1>
      <p class="page-subtitle">将图片拖拽到此处或点击上传</p>
    </div>

    <!-- 上传区域 -->
    <div
      class="upload-zone"
      :class="{ 'upload-zone--active': isDragOver }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @click="triggerFileInput"
    >
      <div class="upload-icon">
        <v-icon size="48">mdi-cloud-upload-outline</v-icon>
      </div>
      <h3 class="upload-title">拖拽文件到此处</h3>
      <p class="upload-subtitle">或点击选择文件</p>
      <button class="btn-primary" @click.stop="triggerFileInput">
        选择文件
      </button>
      <div class="upload-hints">
        <span class="hint">支持 Ctrl+V 粘贴</span>
        <span class="hint-divider">·</span>
        <span class="hint">仅支持图片格式</span>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*,.apng,.avif,.bmp,.cur,.dib,.gif,.heic,.heif,.ico,.jfif,.jpeg,.jpg,.pjp,.pjpeg,.png,.svg,.tif,.tiff,.webp"
      class="d-none"
      @change="handleFileSelect"
    />

    <!-- 上传设置 -->
    <div v-if="channels.length > 0 && !loadingChannels" class="settings-card">
      <div class="settings-row">
        <div class="setting-item">
          <label class="setting-label">上传渠道</label>
          <select v-model="selectedChannelKey" class="setting-select">
            <option v-for="ch in channelOptions" :key="ch.key" :value="ch.key">
              {{ ch.label }}
            </option>
          </select>
        </div>
        <div class="setting-item">
          <label class="setting-label">上传目录</label>
          <input
            v-model="uploadFolder"
            type="text"
            class="setting-input"
            placeholder="可选"
          />
        </div>
      </div>
    </div>

    <!-- 无渠道提示 -->
    <div v-if="channels.length === 0 && !loadingChannels" class="warning-card">
      <v-icon size="24" color="warning">mdi-alert-circle</v-icon>
      <div>
        <p class="warning-title">未配置存储渠道</p>
        <p class="warning-text">请先配置至少一个存储渠道后再上传文件</p>
      </div>
      <button class="btn-secondary" @click="$router.push('/channels')">
        去配置
      </button>
    </div>

    <!-- 文件列表 -->
    <div v-if="files.length > 0" class="files-card">
      <div class="files-header">
        <span class="files-title">上传队列 ({{ files.length }})</span>
        <div class="files-actions">
          <button
            class="btn-primary btn-sm"
            :disabled="uploading || !selectedChannel || pendingCount === 0"
            @click="uploadAll"
          >
            <v-icon v-if="uploading" size="16" class="spinning">mdi-loading</v-icon>
            <v-icon v-else size="16">mdi-cloud-upload</v-icon>
            上传待处理
          </button>
          <button
            v-if="failedCount > 0"
            class="btn-secondary btn-sm"
            :disabled="uploading || !selectedChannel"
            @click="retryFailed"
          >
            <v-icon size="16">mdi-refresh</v-icon>
            重试失败
          </button>
          <button
            v-if="successCount > 0"
            class="btn-secondary btn-sm"
            @click="copySuccessfulLinks"
          >
            <v-icon size="16">mdi-link-variant</v-icon>
            复制成功链接
          </button>
          <button
            v-if="successCount > 0"
            class="btn-ghost btn-sm"
            :disabled="uploading"
            @click="clearSuccessful"
          >
            清理成功项
          </button>
          <button class="btn-ghost btn-sm" :disabled="uploading" @click="clearFiles">
            清空
          </button>
        </div>
      </div>

      <div class="files-list">
        <div v-for="file in files" :key="file.id" class="file-item">
          <div class="file-icon" :style="{ color: file.color }">
            <v-icon size="20">{{ file.icon }}</v-icon>
          </div>
          <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-meta">
              <span>{{ file.sizeText }}</span>
              <span v-if="file.preparing" class="badge badge-info">处理中</span>
              <span v-if="file.compressed" class="badge badge-success">已压缩</span>
              <span v-if="file.error" class="file-error">{{ file.error }}</span>
            </div>
          </div>
          <div class="file-status">
            <!-- 上传中 -->
            <div v-if="file.status === 'uploading'" class="progress-ring">
              <svg viewBox="0 0 36 36">
                <path
                  class="progress-ring-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  class="progress-ring-fill"
                  :stroke-dasharray="`${file.progress}, 100`"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span class="progress-text">{{ Math.round(file.progress) }}</span>
            </div>
            
            <!-- 成功 -->
            <div v-if="file.status === 'success'" class="status-success">
              <v-icon size="16">mdi-check</v-icon>
            </div>
            
            <!-- 失败 -->
            <div v-if="file.status === 'error'" class="status-error">
              <v-icon size="16">mdi-alert</v-icon>
            </div>
          </div>
          <div class="file-actions">
            <button
              v-if="file.status === 'success'"
              class="btn-icon"
              title="复制链接"
              @click="showLink(file)"
            >
              <v-icon size="16">mdi-link</v-icon>
            </button>
            <button
              v-if="file.status === 'error'"
              class="btn-icon"
              title="重试"
              @click="retryUpload(file)"
            >
              <v-icon size="16">mdi-refresh</v-icon>
            </button>
            <button
              class="btn-icon btn-icon-ghost"
              title="移除"
              :disabled="file.status === 'uploading' || file.preparing"
              @click="removeFile(file.id)"
            >
              <v-icon size="16">mdi-close</v-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 链接弹窗 -->
    <div v-if="showLinkDialog" class="dialog-overlay" @click="showLinkDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">复制链接</h3>
          <button class="btn-icon btn-icon-ghost" @click="showLinkDialog = false">
            <v-icon size="20">mdi-close</v-icon>
          </button>
        </div>
        <div class="dialog-content">
          <div v-for="item in linkFormats" :key="item.label" class="link-item">
            <div class="link-info">
              <span class="link-label">{{ item.label }}</span>
              <span class="link-value">{{ item.value }}</span>
            </div>
            <button
              class="btn-sm"
              :class="copiedLabel === item.label ? 'btn-success' : 'btn-secondary'"
              @click="copyLink(item)"
            >
              {{ copiedLabel === item.label ? '已复制' : '复制' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" class="toast" :class="`toast-${toast.type}`">
      <v-icon size="16">{{ toast.icon }}</v-icon>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getFileType, getFileIcon, getFileColor, formatFileSize, generateId, copyToClipboard } from '@/utils/helpers'
import { compressImage } from '@/utils/compress'
import api from '@/utils/api'

const fileInput = ref(null)
const isDragOver = ref(false)
const uploading = ref(false)
const loadingChannels = ref(true)
const channels = ref([])
const selectedChannelKey = ref('')
const uploadFolder = ref('')
const files = ref([])

const showLinkDialog = ref(false)
const linkFile = ref({ url: '', name: '' })
const copiedLabel = ref('')

const toast = ref({ show: false, message: '', type: 'success', icon: 'mdi-check' })

const pendingCount = computed(() => files.value.filter(file => file.status === 'pending').length)
const failedCount = computed(() => files.value.filter(file => file.status === 'error').length)
const successCount = computed(() => files.value.filter(file => file.status === 'success').length)

const linkFormats = computed(() => {
  const url = linkFile.value.url
  const name = linkFile.value.name
  return [
    { label: '直链', value: url },
    { label: 'Markdown', value: `![${name}](${url})` },
    { label: 'HTML', value: `<img src="${url}" alt="${name}" />` },
    { label: 'BBCode', value: `[img]${url}[/img]` }
  ]
})

onMounted(() => {
  fetchChannels()
  document.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste)
})

async function fetchChannels() {
  try {
    const data = await api.get('/api/channels')
    channels.value = []
    
    for (const [type, channelList] of Object.entries(data)) {
      if (Array.isArray(channelList)) {
        channelList.forEach(ch => {
          channels.value.push({ ...ch, type })
        })
      }
    }
    
    // 默认选择第一个渠道
    if (channels.value.length > 0 && channelOptions.value.length > 0) {
      selectedChannelKey.value = channelOptions.value[0].key
    }
  } catch (err) {
    console.error('Failed to fetch channels:', err)
  } finally {
    loadingChannels.value = false
  }
}

// 渠道选项（用于下拉框）
const channelOptions = computed(() => {
  return channels.value.map(ch => ({
    key: `${ch.type}::${ch.name}`,
    label: ch.name,
    channel: ch
  }))
})

// 当前选中的渠道对象
const selectedChannel = computed(() => {
  if (!selectedChannelKey.value) return null
  return channels.value.find(ch => `${ch.type}::${ch.name}` === selectedChannelKey.value) || null
})

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(e) {
  addFiles(e.target.files)
  e.target.value = ''
}

function handleDrop(e) {
  isDragOver.value = false
  addFiles(e.dataTransfer.files)
}

function handlePaste(e) {
  const items = e.clipboardData?.items
  if (!items) return
  
  const fileItems = Array.from(items).filter(item => item.kind === 'file')
  if (fileItems.length > 0) {
    e.preventDefault()
    const pastedFiles = fileItems.map(item => item.getAsFile()).filter(Boolean)
    addFiles(pastedFiles)
  }
}

function addFiles(fileList) {
  const selectedFiles = Array.from(fileList || [])
  let addedCount = 0

  for (const file of selectedFiles) {
    const fileType = getFileType(file.type, file.name)
    if (fileType !== 'image') {
      showToast(`不支持的图片格式: ${file.name}`, 'warning')
      continue
    }

    const fileObj = {
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      sizeText: formatFileSize(file.size),
      type: fileType,
      icon: getFileIcon(fileType),
      color: getFileColor(fileType),
      status: 'pending',
      progress: 0,
      url: null,
      error: null,
      compressed: false,
      preparing: false,
      preparePromise: null
    }

    files.value.push(fileObj)
    addedCount++
    fileObj.preparePromise = prepareFile(fileObj)
  }

  if (addedCount > 1) {
    showToast(`已加入 ${addedCount} 张图片`, 'success')
  }
}

async function prepareFile(fileObj) {
  const file = fileObj.file
  const fileType = fileObj.type

  try {
    if (fileType === 'image' && file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
      fileObj.preparing = true
      const compressed = await compressImage(file, 0.8)
      if (compressed.size < file.size && fileObj.status === 'pending') {
        fileObj.file = compressed
        fileObj.size = compressed.size
        fileObj.sizeText = formatFileSize(compressed.size)
        fileObj.compressed = true
      }
    }
  } catch (e) {
    console.warn('Compression failed:', e)
  } finally {
    fileObj.preparing = false
  }
}

function removeFile(id) {
  const file = files.value.find(item => item.id === id)
  if (file?.status === 'uploading' || file?.preparing) {
    showToast('文件处理中，暂时无法移除', 'warning')
    return
  }
  files.value = files.value.filter(f => f.id !== id)
}

function clearFiles() {
  files.value = []
}

function clearSuccessful() {
  files.value = files.value.filter(file => file.status !== 'success')
}

async function uploadAll() {
  if (uploading.value || !selectedChannel.value) return
  
  const pendingFiles = files.value.filter(f => f.status === 'pending')
  if (pendingFiles.length === 0) {
    showToast('没有待上传文件', 'warning')
    return
  }

  uploading.value = true
  const concurrency = Math.min(3, pendingFiles.length)
  let cursor = 0

  async function uploadNext() {
    while (cursor < pendingFiles.length) {
      const file = pendingFiles[cursor++]
      await uploadFile(file)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, uploadNext))
  
  uploading.value = false
  
  const successFile = files.value.find(f => f.status === 'success')
  if (successFile) {
    showLink(successFile)
  }
}

async function uploadFile(fileObj) {
  let progressInterval = null

  try {
    if (fileObj.preparePromise) {
      await fileObj.preparePromise
    }

    fileObj.status = 'uploading'
    fileObj.progress = 0
    fileObj.error = null

    const params = {
      uploadChannel: selectedChannel.value.type
    }
    if (selectedChannel.value.name) {
      params.channelName = selectedChannel.value.name
    }
    if (uploadFolder.value) {
      params.uploadFolder = uploadFolder.value
    }
    
    progressInterval = setInterval(() => {
      if (fileObj.progress < 90) {
        fileObj.progress += Math.random() * 15
      }
    }, 200)
    
    const result = await api.upload(fileObj.file, params)
    
    fileObj.progress = 100
    
    if (result && result[0]?.src) {
      fileObj.status = 'success'
      fileObj.url = result[0].src
    } else {
      throw new Error('Invalid response')
    }
  } catch (err) {
    fileObj.status = 'error'
    fileObj.error = err.message || '上传失败'
    showToast(`上传失败: ${err.message}`, 'error')
  } finally {
    if (progressInterval) {
      clearInterval(progressInterval)
    }
  }
}

async function retryUpload(fileObj) {
  if (uploading.value) return
  uploading.value = true
  fileObj.status = 'pending'
  fileObj.progress = 0
  fileObj.error = null
  try {
    await uploadFile(fileObj)
  } finally {
    uploading.value = false
  }
}

async function retryFailed() {
  files.value
    .filter(file => file.status === 'error')
    .forEach(file => {
      file.status = 'pending'
      file.progress = 0
      file.error = null
    })

  await uploadAll()
}

function showLink(fileObj) {
  linkFile.value = {
    url: window.location.origin + fileObj.url,
    name: fileObj.name
  }
  copiedLabel.value = ''
  showLinkDialog.value = true
}

async function copySuccessfulLinks() {
  const links = files.value
    .filter(file => file.status === 'success' && file.url)
    .map(file => window.location.origin + file.url)
    .join('\n')

  if (!links) {
    showToast('没有可复制的链接', 'warning')
    return
  }

  const success = await copyToClipboard(links)
  if (success) {
    showToast(`已复制 ${successCount.value} 个链接`, 'success')
  }
}

async function copyLink(item) {
  const success = await copyToClipboard(item.value)
  if (success) {
    copiedLabel.value = item.label
    showToast('已复制到剪贴板', 'success')
    setTimeout(() => {
      if (copiedLabel.value === item.label) {
        copiedLabel.value = ''
      }
    }, 2000)
  }
}

function showToast(message, type = 'success') {
  const icons = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert'
  }
  toast.value = { show: true, message, type, icon: icons[type] || 'mdi-information' }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}
</script>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-2xl);
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 上传区域 */
.upload-zone {
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-3xl) var(--space-xl);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  background: var(--bg-secondary);
  margin-bottom: var(--space-xl);
}

.upload-zone:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}

.upload-zone--active {
  border-color: var(--accent);
  background: var(--accent-light);
  transform: scale(1.01);
}

.upload-icon {
  margin-bottom: var(--space-lg);
  color: var(--text-tertiary);
}

.upload-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.upload-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
}

.upload-hints {
  margin-top: var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  font-size: 12px;
  color: var(--text-tertiary);
}

.hint-divider {
  color: var(--border);
}

/* 按钮 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px 16px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px 16px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px 16px;
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-success {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px 16px;
  background: var(--success);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-icon-ghost {
  background: transparent;
}

.btn-icon-ghost:hover {
  background: var(--bg-hover);
}

/* 设置卡片 */
.settings-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.settings-row {
  display: flex;
  gap: var(--space-lg);
}

.setting-item {
  flex: 1;
}

.setting-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.setting-select,
.setting-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all var(--transition-fast);
}

.setting-select:focus,
.setting-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

/* 警告卡片 */
.warning-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--warning-light);
  border: 1px solid var(--warning);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-xl);
}

.warning-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.warning-text {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 文件列表 */
.files-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.files-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.files-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.files-actions {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.files-list {
  padding: var(--space-sm);
}

.file-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.file-item:hover {
  background: var(--bg-hover);
}

.file-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.file-error {
  color: var(--error);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
}

.badge-success {
  background: var(--success-light);
  color: var(--success);
}

.badge-info {
  background: var(--accent-light);
  color: var(--accent);
}

.file-status {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  position: relative;
  width: 32px;
  height: 32px;
}

.progress-ring svg {
  transform: rotate(-90deg);
}

.progress-ring-bg {
  fill: none;
  stroke: var(--bg-tertiary);
  stroke-width: 3;
}

.progress-ring-fill {
  fill: none;
  stroke: var(--accent);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-primary);
}

.status-success {
  color: var(--success);
}

.status-error {
  color: var(--error);
}

.file-actions {
  display: flex;
  gap: var(--space-xs);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.file-item:hover .file-actions {
  opacity: 1;
}

/* 弹窗 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.15s ease;
}

.dialog {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-lg);
  animation: fadeInUp 0.2s ease;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-content {
  padding: var(--space-lg);
}

.link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--border);
}

.link-item:last-child {
  border-bottom: none;
}

.link-info {
  flex: 1;
  min-width: 0;
}

.link-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.link-value {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: 14px;
  z-index: 1001;
  animation: fadeInUp 0.2s ease;
}

.toast-success {
  border-left: 3px solid var(--success);
  color: var(--success);
}

.toast-error {
  border-left: 3px solid var(--error);
  color: var(--error);
}

.toast-warning {
  border-left: 3px solid var(--warning);
  color: var(--warning);
}

/* 动画 */
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 640px) {
  .page-container {
    padding: var(--space-lg);
  }
  
  .settings-row {
    flex-direction: column;
  }
  
  .upload-zone {
    padding: var(--space-xl);
  }

  .files-header {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-md);
  }

  .files-actions {
    justify-content: flex-start;
  }
}
</style>
