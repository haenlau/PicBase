<template>
  <div class="upload-page" @drop.prevent="handleDrop" @dragover.prevent="handleDragOver" @dragleave="handleDragLeave">
    <div class="container">
      <!-- 上传区域 -->
      <div class="upload-zone glass-card" :class="{ 'drag-over': isDragOver }" @click="triggerFileInput">
        <div class="upload-icon">
          <span class="material-icons-outlined">cloud_upload</span>
        </div>
        <h2 class="upload-title">拖拽文件到此处上传</h2>
        <p class="upload-subtitle">或点击选择文件</p>
        <button class="btn btn-primary btn-lg" @click.stop="triggerFileInput">
          <span class="material-icons-outlined">folder_open</span>
          选择文件
        </button>
        <p class="upload-hint">支持 Ctrl+V 粘贴上传</p>
        <input
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          @change="handleFileSelect"
        />
      </div>

      <!-- 上传设置 -->
      <div class="upload-settings glass" v-if="channels.length > 0">
        <div class="setting-item">
          <label class="setting-label">
            <span class="material-icons-outlined">cloud</span>
            上传渠道
          </label>
          <select class="select" v-model="selectedChannel">
            <option v-for="ch in channels" :key="ch.name" :value="ch">
              {{ ch.name }}
            </option>
          </select>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <span class="material-icons-outlined">folder</span>
            上传目录
          </label>
          <input class="input" v-model="uploadFolder" placeholder="可选" />
        </div>
      </div>

      <!-- 无渠道提示 -->
      <div class="no-channels glass" v-if="channels.length === 0 && !loadingChannels">
        <span class="material-icons-outlined">warning</span>
        <p>未配置存储渠道</p>
        <router-link to="/admin" class="btn btn-primary">去配置</router-link>
      </div>

      <!-- 文件列表 -->
      <div class="file-list" v-if="files.length > 0">
        <div class="file-list-header">
          <h3>待上传 ({{ files.length }})</h3>
          <div class="file-list-actions">
            <button class="btn btn-primary" @click="uploadAll" :disabled="uploading">
              <span class="material-icons-outlined">cloud_upload</span>
              全部上传
            </button>
            <button class="btn btn-secondary" @click="clearFiles">
              <span class="material-icons-outlined">delete_outline</span>
              清空
            </button>
          </div>
        </div>
        
        <div class="file-items">
          <div class="file-item glass" v-for="file in files" :key="file.id">
            <div class="file-icon" :style="{ color: file.color }">
              <span class="material-icons-outlined">{{ file.icon }}</span>
            </div>
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-meta">
                <span>{{ file.sizeText }}</span>
                <span v-if="file.compressed" class="tag tag-success">已压缩</span>
              </div>
              <div class="file-progress" v-if="file.status === 'uploading'">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: file.progress + '%' }"></div>
                </div>
                <span class="progress-text">{{ file.progress }}%</span>
              </div>
            </div>
            <div class="file-status">
              <span v-if="file.status === 'pending'" class="material-icons-outlined text-muted">schedule</span>
              <span v-if="file.status === 'uploading'" class="material-icons-outlined text-primary spinning">sync</span>
              <span v-if="file.status === 'success'" class="material-icons-outlined text-success">check_circle</span>
              <span v-if="file.status === 'error'" class="material-icons-outlined text-error">error</span>
            </div>
            <div class="file-actions">
              <button v-if="file.status === 'success'" class="btn-icon" @click="showLink(file)" title="复制链接">
                <span class="material-icons-outlined">link</span>
              </button>
              <button v-if="file.status === 'error'" class="btn-icon" @click="retryUpload(file)" title="重试">
                <span class="material-icons-outlined">refresh</span>
              </button>
              <button class="btn-icon" @click="removeFile(file.id)" title="移除">
                <span class="material-icons-outlined">close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 链接弹窗 -->
    <LinkDialog ref="linkDialog" :fileUrl="linkFile.url" :fileName="linkFile.name" />
    
    <!-- Toast -->
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getFileType, getFileIcon, getFileColor, formatFileSize, generateId } from '@/utils/helpers'
import { compressImage } from '@/utils/compress'
import api from '@/utils/api'
import NavBar from '@/components/NavBar.vue'
import LinkDialog from '@/components/LinkDialog.vue'
import Toast from '@/components/Toast.vue'

const fileInput = ref(null)
const linkDialog = ref(null)
const toast = ref(null)

const isDragOver = ref(false)
const uploading = ref(false)
const loadingChannels = ref(true)
const channels = ref([])
const selectedChannel = ref(null)
const uploadFolder = ref('')
const files = ref([])
const linkFile = ref({ url: '', name: '' })

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
          channels.value.push({
            ...ch,
            type,
            fullName: `${ch.name} (${type})`
          })
        })
      }
    }
    
    if (channels.value.length > 0) {
      selectedChannel.value = channels.value[0]
    }
  } catch (err) {
    console.error('Failed to fetch channels:', err)
  } finally {
    loadingChannels.value = false
  }
}

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

function handleDragOver() {
  isDragOver.value = true
}

function handleDragLeave() {
  isDragOver.value = false
}

function handlePaste(e) {
  const items = e.clipboardData?.items
  if (!items) return
  
  const fileItems = Array.from(items).filter(item => item.kind === 'file')
  if (fileItems.length > 0) {
    e.preventDefault()
    const files = fileItems.map(item => item.getAsFile()).filter(Boolean)
    addFiles(files)
  }
}

async function addFiles(fileList) {
  for (const file of fileList) {
    const fileType = getFileType(file.type, file.name)
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
      compressed: false
    }
    
    // 压缩图片
    if (fileType === 'image' && file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
      try {
        const compressed = await compressImage(file, 0.8)
        if (compressed.size < file.size) {
          fileObj.file = compressed
          fileObj.size = compressed.size
          fileObj.sizeText = formatFileSize(compressed.size)
          fileObj.compressed = true
        }
      } catch (e) {
        console.warn('Compression failed:', e)
      }
    }
    
    files.value.push(fileObj)
  }
}

function removeFile(id) {
  files.value = files.value.filter(f => f.id !== id)
}

function clearFiles() {
  files.value = []
}

async function uploadAll() {
  if (uploading.value || !selectedChannel.value) return
  
  uploading.value = true
  const pendingFiles = files.value.filter(f => f.status === 'pending')
  
  for (const file of pendingFiles) {
    await uploadFile(file)
  }
  
  uploading.value = false
  
  // 显示第一个成功文件的链接
  const successFile = files.value.find(f => f.status === 'success')
  if (successFile) {
    showLink(successFile)
  }
}

async function uploadFile(fileObj) {
  fileObj.status = 'uploading'
  fileObj.progress = 0
  
  try {
    const params = {
      uploadChannel: selectedChannel.value.type
    }
    if (selectedChannel.value.name) {
      params.channelName = selectedChannel.value.name
    }
    if (uploadFolder.value) {
      params.uploadFolder = uploadFolder.value
    }
    
    // 模拟进度
    const progressInterval = setInterval(() => {
      if (fileObj.progress < 90) {
        fileObj.progress += Math.random() * 10
      }
    }, 200)
    
    const result = await api.upload(fileObj.file, params)
    
    clearInterval(progressInterval)
    fileObj.progress = 100
    
    if (result && result[0]?.src) {
      fileObj.status = 'success'
      fileObj.url = result[0].src
    } else {
      throw new Error('Invalid response')
    }
  } catch (err) {
    fileObj.status = 'error'
    toast.value?.error(`上传失败: ${err.message}`)
  }
}

async function retryUpload(fileObj) {
  fileObj.status = 'pending'
  fileObj.progress = 0
  await uploadFile(fileObj)
}

function showLink(fileObj) {
  linkFile.value = {
    url: window.location.origin + fileObj.url,
    name: fileObj.name
  }
  linkDialog.value?.show()
}

function refresh() {
  fetchChannels()
}

defineExpose({ refresh })
</script>

<style scoped>
.upload-page {
  min-height: calc(100vh - 80px);
  padding: var(--space-xl) 0;
}

.upload-zone {
  text-align: center;
  padding: var(--space-2xl);
  cursor: pointer;
  transition: var(--transition-normal);
  border: 2px dashed rgba(255, 255, 255, 0.3);
}

.upload-zone:hover,
.upload-zone.drag-over {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.02);
}

.upload-icon {
  margin-bottom: var(--space-lg);
}

.upload-icon .material-icons-outlined {
  font-size: 64px;
  opacity: 0.8;
}

.upload-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: var(--space-sm);
}

.upload-subtitle {
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
}

.upload-hint {
  margin-top: var(--space-md);
  font-size: 12px;
  color: var(--text-muted);
}

.upload-settings {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-lg);
  margin-top: var(--space-lg);
}

.setting-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.setting-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 13px;
  color: var(--text-secondary);
}

.setting-label .material-icons-outlined {
  font-size: 16px;
}

.no-channels {
  text-align: center;
  padding: var(--space-2xl);
  margin-top: var(--space-lg);
}

.no-channels .material-icons-outlined {
  font-size: 48px;
  color: var(--warning);
  margin-bottom: var(--space-md);
}

.no-channels p {
  margin-bottom: var(--space-lg);
  color: var(--text-secondary);
}

.file-list {
  margin-top: var(--space-xl);
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.file-list-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.file-list-actions {
  display: flex;
  gap: var(--space-sm);
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.file-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  animation: fadeInUp 0.3s ease;
}

.file-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
}

.file-icon .material-icons-outlined {
  font-size: 24px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.file-progress {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--success);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 32px;
}

.file-status .material-icons-outlined {
  font-size: 24px;
}

.text-muted { color: var(--text-muted); }
.text-primary { color: var(--info); }
.text-success { color: var(--success); }
.text-error { color: var(--error); }

.spinning {
  animation: spin 1s linear infinite;
}

.file-actions {
  display: flex;
  gap: var(--space-xs);
}

@media (max-width: 640px) {
  .upload-settings {
    flex-direction: column;
  }
  
  .file-list-header {
    flex-direction: column;
    gap: var(--space-md);
    align-items: flex-start;
  }
  
  .file-item {
    flex-wrap: wrap;
  }
  
  .file-info {
    width: calc(100% - 56px);
  }
}
</style>
