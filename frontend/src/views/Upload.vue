<template>
  <UserLayout>
    <v-container class="upload-page">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <!-- Upload Zone -->
          <v-card
            class="upload-zone mb-6"
            :class="{ 'upload-zone--active': dragover }"
            @drop.prevent="handleDrop"
            @dragover.prevent="handleDragover"
            @dragleave="handleDragleave"
            @click="triggerFileInput"
          >
            <v-card-text class="text-center pa-8 pa-md-12">
              <v-avatar size="80" color="primary" rounded="xl" variant="tonal" class="mb-4">
                <v-icon size="48">mdi-cloud-upload-outline</v-icon>
              </v-avatar>
              <h2 class="text-h5 font-weight-medium mb-2">
                {{ t('upload.dragDrop') }}
              </h2>
              <p class="text-body-1 text-medium-emphasis mb-4">
                {{ t('upload.orClick') }}
              </p>
              <v-btn
                color="primary"
                variant="tonal"
                size="large"
                @click.stop="triggerFileInput"
                :disabled="!hasChannels"
              >
                {{ t('upload.selectFiles') }}
              </v-btn>
            </v-card-text>
          </v-card>

          <input
            ref="fileInput"
            type="file"
            multiple
            class="d-none"
            @change="handleFileSelect"
          />

          <!-- No Channels Warning -->
          <v-alert
            v-if="!hasChannels && !loadingChannels"
            type="warning"
            variant="tonal"
            class="mb-6"
            prominent
          >
            <template #prepend>
              <v-icon size="32">mdi-alert-circle</v-icon>
            </template>
            <v-alert-title>No Upload Channels Configured</v-alert-title>
            <span>Please configure at least one storage channel before uploading files.</span>
            <template #append>
              <v-btn
                color="warning"
                variant="tonal"
                to="/admin/channels"
              >
                Configure Channels
              </v-btn>
            </template>
          </v-alert>

          <!-- Upload Settings -->
          <v-card v-if="files.length > 0 && hasChannels" class="mb-6">
            <v-card-title class="text-subtitle-1 font-weight-medium">
              <v-icon class="mr-2">mdi-cog</v-icon>
              Upload Settings
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="selectedChannel"
                    :items="channelOptions"
                    :label="t('upload.channel')"
                    prepend-inner-icon="mdi-server-network"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="uploadFolder"
                    :label="t('upload.folder')"
                    prepend-inner-icon="mdi-folder"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    placeholder="/"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- File List -->
          <v-card v-if="files.length > 0" class="mb-6">
            <v-card-title class="d-flex align-center justify-space-between">
              <div>
                <v-icon class="mr-2">mdi-file-multiple</v-icon>
                {{ t('common.selected', { count: files.length }) }}
              </div>
              <div>
                <v-btn
                  color="primary"
                  variant="tonal"
                  size="small"
                  class="mr-2"
                  :loading="uploading"
                  :disabled="pendingFiles === 0 || !hasChannels"
                  @click="uploadAll"
                >
                  <v-icon start>mdi-cloud-upload</v-icon>
                  {{ t('upload.uploadAll') }} ({{ pendingFiles }})
                </v-btn>
                <v-btn
                  color="error"
                  variant="tonal"
                  size="small"
                  @click="clearFiles"
                >
                  <v-icon start>mdi-delete</v-icon>
                  {{ t('upload.clearAll') }}
                </v-btn>
              </div>
            </v-card-title>

            <v-divider />

            <v-list lines="two">
              <v-list-item
                v-for="file in files"
                :key="file.id"
              >
                <template #prepend>
                  <v-icon :color="getFileColor(file.status)">
                    {{ getFileIcon(file.status) }}
                  </v-icon>
                </template>

                <v-list-item-title>{{ file.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatFileSize(file.size) }}
                  <span v-if="file.status === 'uploading'" class="ml-2">
                    {{ file.progress }}%
                  </span>
                  <span v-if="file.error" class="text-error ml-2">
                    {{ file.error }}
                  </span>
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex align-center ga-1">
                    <v-progress-circular
                      v-if="file.status === 'uploading'"
                      :model-value="file.progress"
                      size="32"
                      width="3"
                      color="primary"
                    >
                      <span class="text-caption">{{ file.progress }}</span>
                    </v-progress-circular>
                    <v-chip
                      v-else-if="file.status === 'completed'"
                      color="success"
                      size="small"
                      variant="tonal"
                    >
                      Done
                    </v-chip>
                    <v-btn
                      v-if="file.status === 'completed' && file.url"
                      icon
                      size="small"
                      variant="text"
                      @click="showLinkDialog(file)"
                    >
                      <v-icon>mdi-content-copy</v-icon>
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
            </v-list>
          </v-card>

          <!-- Upload History -->
          <v-card v-if="uploadHistory.length > 0">
            <v-card-title class="d-flex align-center justify-space-between">
              <div>
                <v-icon class="mr-2">mdi-history</v-icon>
                {{ t('upload.history') }}
              </div>
              <v-btn
                variant="text"
                size="small"
                color="error"
                @click="clearHistory"
              >
                {{ t('common.delete') }}
              </v-btn>
            </v-card-title>
            <v-divider />
            <v-list lines="two">
              <v-list-item
                v-for="(item, index) in uploadHistory"
                :key="index"
              >
                <template #prepend>
                  <v-icon>mdi-image</v-icon>
                </template>
                <v-list-item-title>{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ formatDateTime(item.time) }}</v-list-item-subtitle>
                <template #append>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="copyHistoryLink(item)"
                  >
                    <v-icon>mdi-content-copy</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Link Format Dialog -->
    <v-dialog v-model="showLinkFormatDialog" max-width="500">
      <v-card v-if="linkDialogFile">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>
            <v-icon class="mr-2">mdi-link</v-icon>
            Copy Link
          </span>
          <v-btn icon variant="text" @click="showLinkFormatDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-list>
            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-link-variant</v-icon>
              </template>
              <v-list-item-title class="text-caption font-weight-bold">Direct Link</v-list-item-title>
              <v-list-item-subtitle class="text-truncate">{{ getDirectLink(linkDialogFile) }}</v-list-item-subtitle>
              <template #append>
                <v-btn size="small" variant="tonal" @click="copyText(getDirectLink(linkDialogFile))">
                  <v-icon start size="small">mdi-content-copy</v-icon>
                  Copy
                </v-btn>
              </template>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <template #prepend>
                <v-icon color="success">mdi-language-markdown</v-icon>
              </template>
              <v-list-item-title class="text-caption font-weight-bold">Markdown</v-list-item-title>
              <v-list-item-subtitle class="text-truncate">{{ getMarkdownLink(linkDialogFile) }}</v-list-item-subtitle>
              <template #append>
                <v-btn size="small" variant="tonal" @click="copyText(getMarkdownLink(linkDialogFile))">
                  <v-icon start size="small">mdi-content-copy</v-icon>
                  Copy
                </v-btn>
              </template>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <template #prepend>
                <v-icon color="info">mdi-language-html5</v-icon>
              </template>
              <v-list-item-title class="text-caption font-weight-bold">HTML</v-list-item-title>
              <v-list-item-subtitle class="text-truncate">{{ getHtmlLink(linkDialogFile) }}</v-list-item-subtitle>
              <template #append>
                <v-btn size="small" variant="tonal" @click="copyText(getHtmlLink(linkDialogFile))">
                  <v-icon start size="small">mdi-content-copy</v-icon>
                  Copy
                </v-btn>
              </template>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <template #prepend>
                <v-icon color="warning">mdi-code-brackets</v-icon>
              </template>
              <v-list-item-title class="text-caption font-weight-bold">BBCode</v-list-item-title>
              <v-list-item-subtitle class="text-truncate">{{ getBBCodeLink(linkDialogFile) }}</v-list-item-subtitle>
              <template #append>
                <v-btn size="small" variant="tonal" @click="copyText(getBBCodeLink(linkDialogFile))">
                  <v-icon start size="small">mdi-content-copy</v-icon>
                  Copy
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </UserLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUploadStore } from '@/stores/upload'
import { formatFileSize, formatDateTime, copyToClipboard } from '@/utils/helpers'
import UserLayout from '@/layouts/UserLayout.vue'

const { t } = useI18n()
const uploadStore = useUploadStore()

const fileInput = ref(null)
const dragover = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const loadingChannels = ref(true)
const showLinkFormatDialog = ref(false)
const linkDialogFile = ref(null)

const files = computed(() => uploadStore.files)
const uploading = computed(() => uploadStore.uploading)
const uploadHistory = computed(() => uploadStore.uploadHistory)
const pendingFiles = computed(() => uploadStore.files.filter(f => f.status === 'pending').length)

const hasChannels = computed(() => {
  const channels = uploadStore.channels
  return Object.values(channels).some(arr => Array.isArray(arr) && arr.length > 0)
})

const channelOptions = computed(() => {
  const channels = uploadStore.channels
  const options = []
  for (const [type, data] of Object.entries(channels)) {
    if (data && Array.isArray(data) && data.length > 0) {
      data.forEach(ch => {
        options.push({
          title: ch.name || type,
          value: `${type}::${ch.name}`
        })
      })
    }
  }
  return options
})

const selectedChannel = computed({
  get: () => {
    const current = uploadStore.selectedChannel
    const name = uploadStore.selectedChannelName
    if (name) {
      return `${current}::${name}`
    }
    return current
  },
  set: (val) => {
    if (val && val.includes('::')) {
      const [type, name] = val.split('::')
      uploadStore.selectedChannel = type
      uploadStore.selectedChannelName = name
    } else {
      uploadStore.selectedChannel = val
      uploadStore.selectedChannelName = ''
    }
  }
})

const uploadFolder = computed({
  get: () => uploadStore.uploadFolder,
  set: (val) => { uploadStore.uploadFolder = val }
})

onMounted(async () => {
  await uploadStore.fetchChannels()
  loadingChannels.value = false
  
  // 自动选择第一个可用渠道
  if (channelOptions.value.length > 0 && !selectedChannel.value) {
    selectedChannel.value = channelOptions.value[0].value
  }
})

const triggerFileInput = () => {
  if (hasChannels.value) {
    fileInput.value.click()
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  dragover.value = false
  if (hasChannels.value) {
    const droppedFiles = event.dataTransfer.files
    if (droppedFiles.length > 0) {
      uploadStore.addFiles(droppedFiles)
    }
  }
}

const handleDragover = (event) => {
  event.preventDefault()
  dragover.value = true
}

const handleDragleave = () => {
  dragover.value = false
}

const handleFileSelect = (event) => {
  const selectedFiles = event.target.files
  if (selectedFiles.length > 0) {
    uploadStore.addFiles(selectedFiles)
  }
  event.target.value = ''
}

const removeFile = (fileId) => {
  uploadStore.removeFile(fileId)
}

const clearFiles = () => {
  uploadStore.clearFiles()
}

const uploadAll = async () => {
  await uploadStore.uploadAll()
  
  // 上传完成后，自动弹出第一个成功文件的链接弹窗
  const completedFile = files.value.find(f => f.status === 'completed' && f.url)
  if (completedFile) {
    showLinkDialog(completedFile)
  }
  
  showMessage(t('upload.uploadComplete'), 'success')
}

const retryUpload = async (file) => {
  file.status = 'pending'
  file.error = null
  file.progress = 0
  await uploadStore.uploadFile(file)
}

const showLinkDialog = (file) => {
  linkDialogFile.value = file
  showLinkFormatDialog.value = true
}

// 链接格式生成
const getDirectLink = (file) => {
  const fileId = file.url || file.name
  return `${window.location.origin}${fileId}`
}

const getMarkdownLink = (file) => {
  return `![${file.name}](${getDirectLink(file)})`
}

const getHtmlLink = (file) => {
  return `<img src="${getDirectLink(file)}" alt="${file.name}" />`
}

const getBBCodeLink = (file) => {
  return `[img]${getDirectLink(file)}[/img]`
}

const copyText = async (text) => {
  const success = await copyToClipboard(text)
  if (success) {
    showMessage(t('common.copied'), 'success')
  }
}

const copyHistoryLink = async (item) => {
  const url = `${window.location.origin}${item.url}`
  await copyText(url)
}

const clearHistory = () => {
  uploadStore.clearHistory()
}

const showMessage = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const getFileIcon = (status) => {
  switch (status) {
    case 'completed': return 'mdi-check-circle'
    case 'error': return 'mdi-alert-circle'
    case 'uploading': return 'mdi-loading'
    default: return 'mdi-file'
  }
}

const getFileColor = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'error': return 'error'
    case 'uploading': return 'primary'
    default: return 'grey'
  }
}
</script>

<style scoped>
.upload-page {
  max-width: 1200px;
}

.upload-zone {
  border: 2px dashed rgb(var(--v-theme-outline));
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgb(var(--v-theme-surface));
}

.upload-zone:hover:not(.upload-zone--active) {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.upload-zone--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
  transform: scale(1.01);
}
</style>
