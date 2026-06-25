<template>
  <v-container fluid class="pa-4 pa-md-6">
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">
        <!-- 页面标题 -->
        <div class="mb-6">
          <h1 class="text-h4 font-weight-bold">上传文件</h1>
          <p class="text-body-1 text-medium-emphasis mt-1">支持拖拽、点击、粘贴上传</p>
        </div>

        <!-- 上传区域 -->
        <v-card
          class="upload-zone mb-6"
          :class="{ 'upload-zone--active': isDragOver }"
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragOver = true"
          @dragleave="isDragOver = false"
          @click="triggerFileInput"
        >
          <v-card-text class="text-center pa-8 pa-md-12">
            <v-avatar size="80" rounded="xl" color="primary" variant="tonal" class="mb-4">
              <v-icon size="40">mdi-cloud-upload-outline</v-icon>
            </v-avatar>
            <h2 class="text-h5 font-weight-bold mb-2">拖拽文件到此处</h2>
            <p class="text-body-2 text-medium-emphasis mb-4">或点击选择文件</p>
            <v-btn
              color="primary"
              size="large"
              @click.stop="triggerFileInput"
            >
              <v-icon start>mdi-folder-open</v-icon>
              选择文件
            </v-btn>
            <div class="mt-4">
              <v-chip size="small" variant="tonal" class="mr-2">
                <v-icon start size="small">mdi-keyboard</v-icon>
                Ctrl+V 粘贴
              </v-chip>
              <v-chip size="small" variant="tonal">
                <v-icon start size="small">mdi-image</v-icon>
                仅支持图片
              </v-chip>
            </div>
          </v-card-text>
        </v-card>

        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*"
          class="d-none"
          @change="handleFileSelect"
        />

        <!-- 上传设置 -->
        <v-expand-transition>
          <v-card v-if="channels.length > 0" class="mb-6">
            <v-card-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="selectedChannel"
                    :items="channels"
                    item-title="name"
                    item-value="name"
                    label="上传渠道"
                    prepend-inner-icon="mdi-cloud"
                    return-object
                    density="compact"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="uploadFolder"
                    label="上传目录（可选）"
                    prepend-inner-icon="mdi-folder"
                    placeholder="/"
                    density="compact"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-expand-transition>

        <!-- 无渠道提示 -->
        <v-alert
          v-if="channels.length === 0 && !loadingChannels"
          type="warning"
          prominent
          class="mb-6"
        >
          <template #prepend>
            <v-icon size="32">mdi-alert-circle</v-icon>
          </template>
          <v-alert-title>未配置存储渠道</v-alert-title>
          请先配置至少一个存储渠道后再上传文件。
          <template #append>
            <v-btn color="warning" to="/admin">去配置</v-btn>
          </template>
        </v-alert>

        <!-- 文件列表 -->
        <v-card v-if="files.length > 0" class="mb-6">
          <v-card-title class="d-flex align-center justify-space-between py-3">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-file-multiple</v-icon>
              <span>待上传 ({{ files.length }})</span>
            </div>
            <div class="d-flex ga-2">
              <v-btn
                color="primary"
                size="small"
                :loading="uploading"
                :disabled="!selectedChannel"
                @click="uploadAll"
              >
                <v-icon start>mdi-cloud-upload</v-icon>
                全部上传
              </v-btn>
              <v-btn
                color="error"
                size="small"
                variant="tonal"
                @click="clearFiles"
              >
                <v-icon start>mdi-delete-outline</v-icon>
                清空
              </v-btn>
            </div>
          </v-card-title>

          <v-divider />

          <v-list lines="two" class="py-0">
            <template v-for="file in files" :key="file.id">
              <v-list-item>
                <template #prepend>
                  <v-avatar :color="file.color" variant="tonal" size="40">
                    <v-icon :color="file.color">{{ file.icon }}</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="text-body-2 font-weight-medium">
                  {{ file.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  <span>{{ file.sizeText }}</span>
                  <v-chip
                    v-if="file.compressed"
                    size="x-small"
                    color="success"
                    class="ml-2"
                    variant="tonal"
                  >
                    已压缩
                  </v-chip>
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex align-center ga-1">
                    <!-- 上传中 -->
                    <v-progress-circular
                      v-if="file.status === 'uploading'"
                      :model-value="file.progress"
                      size="32"
                      width="3"
                      color="primary"
                    >
                      <span class="text-caption">{{ Math.round(file.progress) }}</span>
                    </v-progress-circular>
                    
                    <!-- 成功 -->
                    <v-chip
                      v-if="file.status === 'success'"
                      color="success"
                      size="small"
                      variant="flat"
                    >
                      <v-icon start size="small">mdi-check</v-icon>
                      完成
                    </v-chip>
                    
                    <!-- 失败 -->
                    <v-chip
                      v-if="file.status === 'error'"
                      color="error"
                      size="small"
                      variant="flat"
                    >
                      <v-icon start size="small">mdi-alert</v-icon>
                      失败
                    </v-chip>

                    <!-- 操作按钮 -->
                    <v-btn
                      v-if="file.status === 'success'"
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="showLink(file)"
                    >
                      <v-icon>mdi-link</v-icon>
                    </v-btn>
                    
                    <v-btn
                      v-if="file.status === 'error'"
                      icon
                      size="small"
                      variant="text"
                      color="warning"
                      @click="retryUpload(file)"
                    >
                      <v-icon>mdi-refresh</v-icon>
                    </v-btn>
                    
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      @click="removeFile(file.id)"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
              <v-divider v-if="file !== files[files.length - 1]" />
            </template>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- 链接弹窗 -->
    <v-dialog v-model="showLinkDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-link</v-icon>
            <span>复制链接</span>
          </div>
          <v-btn icon variant="text" size="small" @click="showLinkDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-list>
            <v-list-item v-for="item in linkFormats" :key="item.label" class="py-3">
              <template #prepend>
                <v-icon :color="item.color" size="20">{{ item.icon }}</v-icon>
              </template>
              
              <v-list-item-title class="text-body-2 font-weight-medium">
                {{ item.label }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption text-truncate">
                {{ item.value }}
              </v-list-item-subtitle>

              <template #append>
                <v-btn
                  size="small"
                  variant="tonal"
                  :color="copiedLabel === item.label ? 'success' : undefined"
                  @click="copyLink(item)"
                >
                  <v-icon start size="small">
                    {{ copiedLabel === item.label ? 'mdi-check' : 'mdi-content-copy' }}
                  </v-icon>
                  {{ copiedLabel === item.label ? '已复制' : '复制' }}
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Toast -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="bottom right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
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
const selectedChannel = ref(null)
const uploadFolder = ref('')
const files = ref([])

// 链接弹窗
const showLinkDialog = ref(false)
const linkFile = ref({ url: '', name: '' })
const copiedLabel = ref('')

// Toast
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const linkFormats = computed(() => {
  const url = linkFile.value.url
  const name = linkFile.value.name
  return [
    { label: '直链', icon: 'mdi-link', color: 'primary', value: url },
    { label: 'Markdown', icon: 'mdi-language-markdown', color: 'success', value: `![${name}](${url})` },
    { label: 'HTML', icon: 'mdi-language-html5', color: 'info', value: `<img src="${url}" alt="${name}" />` },
    { label: 'BBCode', icon: 'mdi-code-brackets', color: 'warning', value: `[img]${url}[/img]` }
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
        fileObj.progress += Math.random() * 15
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
    showMessage(`上传失败: ${err.message}`, 'error')
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
  copiedLabel.value = ''
  showLinkDialog.value = true
}

async function copyLink(item) {
  const success = await copyToClipboard(item.value)
  if (success) {
    copiedLabel.value = item.label
    showMessage('已复制到剪贴板', 'success')
    setTimeout(() => {
      if (copiedLabel.value === item.label) {
        copiedLabel.value = ''
      }
    }, 2000)
  }
}

function showMessage(text, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>

<style scoped>
.upload-zone {
  border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgb(var(--v-theme-surface));
}

.upload-zone:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.upload-zone--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
  transform: scale(1.02);
}
</style>
