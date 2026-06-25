<template>
  <UserLayout>
    <v-container class="upload-page">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <h1 class="text-h4 font-weight-bold mb-6">{{ t('upload.title') }}</h1>

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
              <v-icon
                size="64"
                color="primary"
                class="mb-4"
              >
                mdi-cloud-upload-outline
              </v-icon>
              <h2 class="text-h5 font-weight-medium mb-2">
                {{ t('upload.dragDrop') }}
              </h2>
              <p class="text-body-1 text-medium-emphasis mb-4">
                {{ t('upload.orClick') }}
              </p>
              <v-btn
                color="primary"
                variant="tonal"
                @click.stop="triggerFileInput"
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

          <!-- Upload Settings -->
          <v-card v-if="files.length > 0" class="mb-6">
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="selectedChannel"
                    :items="channelOptions"
                    :label="t('upload.channel')"
                    prepend-inner-icon="mdi-server-network"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="uploadFolder"
                    :label="t('upload.folder')"
                    prepend-inner-icon="mdi-folder"
                    clearable
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- File List -->
          <v-card v-if="files.length > 0" class="mb-6">
            <v-card-title class="d-flex align-center justify-space-between">
              <span>{{ t('common.selected', { count: files.length }) }}</span>
              <div>
                <v-btn
                  color="primary"
                  variant="tonal"
                  size="small"
                  class="mr-2"
                  :loading="uploading"
                  :disabled="pendingFiles === 0"
                  @click="uploadAll"
                >
                  {{ t('upload.uploadAll') }} ({{ pendingFiles }})
                </v-btn>
                <v-btn
                  color="error"
                  variant="tonal"
                  size="small"
                  @click="clearFiles"
                >
                  {{ t('upload.clearAll') }}
                </v-btn>
              </div>
            </v-card-title>

            <v-divider />

            <v-list>
              <v-list-item
                v-for="file in files"
                :key="file.id"
                :subtitle="formatFileSize(file.size)"
              >
                <template #prepend>
                  <v-icon :color="getFileColor(file.status)">
                    {{ getFileIcon(file.status) }}
                  </v-icon>
                </template>

                <v-list-item-title>
                  {{ file.name }}
                </v-list-item-title>

                <template #append>
                  <div class="d-flex align-center ga-2">
                    <v-progress-circular
                      v-if="file.status === 'uploading'"
                      :model-value="file.progress"
                      size="24"
                      width="3"
                      color="primary"
                    />
                    <v-chip
                      v-else-if="file.status === 'completed'"
                      color="success"
                      size="small"
                      variant="tonal"
                    >
                      {{ t('upload.uploadComplete') }}
                    </v-chip>
                    <v-chip
                      v-else-if="file.status === 'error'"
                      color="error"
                      size="small"
                      variant="tonal"
                      @click:close="removeFile(file.id)"
                    >
                      {{ t('upload.uploadFailed') }}
                    </v-chip>
                    <v-btn
                      v-if="file.status === 'completed' && file.url"
                      icon
                      size="small"
                      variant="text"
                      @click="copyLink(file)"
                    >
                      <v-icon>mdi-content-copy</v-icon>
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
              <span>{{ t('upload.history') }}</span>
              <v-btn
                variant="text"
                size="small"
                @click="clearHistory"
              >
                {{ t('common.delete') }}
              </v-btn>
            </v-card-title>
            <v-list>
              <v-list-item
                v-for="(item, index) in uploadHistory"
                :key="index"
                :subtitle="formatDateTime(item.time)"
              >
                <template #prepend>
                  <v-icon>mdi-image</v-icon>
                </template>
                <v-list-item-title>{{ item.name }}</v-list-item-title>
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

const files = computed(() => uploadStore.files)
const uploading = computed(() => uploadStore.uploading)
const uploadHistory = computed(() => uploadStore.uploadHistory)
const pendingFiles = computed(() => uploadStore.files.filter(f => f.status === 'pending').length)

const selectedChannel = computed({
  get: () => uploadStore.selectedChannel,
  set: (val) => { uploadStore.selectedChannel = val }
})

const uploadFolder = computed({
  get: () => uploadStore.uploadFolder,
  set: (val) => { uploadStore.uploadFolder = val }
})

const channelOptions = computed(() => {
  const channels = uploadStore.channels
  const options = []
  for (const [type, data] of Object.entries(channels)) {
    if (data && Array.isArray(data) && data.length > 0) {
      data.forEach(ch => {
        options.push({
          title: ch.name || type,
          value: type
        })
      })
    }
  }
  if (options.length === 0) {
    options.push({ title: 'Telegram', value: 'telegram' })
  }
  return options
})

onMounted(() => {
  uploadStore.fetchChannels()
})

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleDrop = (event) => {
  event.preventDefault()
  dragover.value = false
  const droppedFiles = event.dataTransfer.files
  if (droppedFiles.length > 0) {
    uploadStore.addFiles(droppedFiles)
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
  showMessage(t('upload.uploadComplete'), 'success')
}

const copyLink = async (file) => {
  const fullUrl = `${window.location.origin}${file.url}`
  const success = await copyToClipboard(fullUrl)
  if (success) {
    showMessage(t('common.copied'), 'success')
  }
}

const copyHistoryLink = async (item) => {
  const fullUrl = `${window.location.origin}${item.url}`
  const success = await copyToClipboard(fullUrl)
  if (success) {
    showMessage(t('common.copied'), 'success')
  }
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
}

.upload-zone:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary), 0.05);
}

.upload-zone--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary), 0.1);
}
</style>
