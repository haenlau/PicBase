<template>
  <AdminLayout>
    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis">{{ t('dashboard.totalFiles') }}</p>
                <p class="text-h4 font-weight-bold">{{ stats.totalFiles }}</p>
              </div>
              <v-icon size="48" color="primary" class="opacity-50">mdi-file-multiple</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis">{{ t('dashboard.storageUsed') }}</p>
                <p class="text-h4 font-weight-bold">{{ stats.storageUsed }}</p>
              </div>
              <v-icon size="48" color="success" class="opacity-50">mdi-harddisk</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis">{{ t('dashboard.recentUploads') }}</p>
                <p class="text-h4 font-weight-bold">{{ stats.recentUploads }}</p>
              </div>
              <v-icon size="48" color="warning" class="opacity-50">mdi-upload</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis">{{ t('common.channel') }}</p>
                <p class="text-h4 font-weight-bold">{{ stats.channels }}</p>
              </div>
              <v-icon size="48" color="info" class="opacity-50">mdi-server-network</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Toolbar -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              :label="t('common.search')"
              prepend-inner-icon="mdi-magnify"
              clearable
              density="compact"
              hide-details
              @click:clear="clearSearch"
            />
          </v-col>
          <v-col cols="12" md="8">
            <div class="d-flex align-center flex-wrap ga-2 justify-end">
              <v-select
                v-model="filterChannel"
                :items="channelFilterOptions"
                :label="t('common.channel')"
                density="compact"
                hide-details
                style="min-width: 150px"
              />
              <v-btn-toggle v-model="viewMode" mandatory density="compact">
                <v-btn value="grid" icon>
                  <v-icon>mdi-view-grid</v-icon>
                </v-btn>
                <v-btn value="list" icon>
                  <v-icon>mdi-view-list</v-icon>
                </v-btn>
              </v-btn-toggle>
              <v-btn
                icon
                variant="text"
                @click="fetchFiles"
                :loading="loading"
              >
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Batch Actions -->
    <v-slide-y-transition>
      <v-card v-if="selectedFiles.length > 0" class="mb-4" color="primary" variant="tonal">
        <v-card-text class="d-flex align-center justify-space-between">
          <span>{{ t('common.selected', { count: selectedFiles.length }) }}</span>
          <div>
            <v-btn
              variant="text"
              size="small"
              class="mr-2"
              @click="batchDelete"
            >
              <v-icon start>mdi-delete</v-icon>
              {{ t('dashboard.batchDelete') }}
            </v-btn>
            <v-btn
              variant="text"
              size="small"
              @click="clearSelection"
            >
              <v-icon start>mdi-close</v-icon>
              {{ t('common.cancel') }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-slide-y-transition>

    <!-- File Grid -->
    <v-card v-if="viewMode === 'grid'">
      <v-card-text>
        <v-row v-if="loading">
          <v-col v-for="n in 12" :key="n" cols="6" sm="4" md="3" lg="2">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>
        <v-row v-else-if="files.length === 0">
          <v-col cols="12">
            <div class="text-center py-12">
              <v-icon size="64" color="grey" class="mb-4">mdi-folder-open</v-icon>
              <p class="text-h6 text-medium-emphasis">{{ t('dashboard.noFiles') }}</p>
            </div>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col
            v-for="file in files"
            :key="fileKey(file)"
            cols="6"
            sm="4"
            md="3"
            lg="2"
          >
            <v-card
              class="file-card"
              :class="{ 'file-card--selected': isSelected(file) }"
              @click="toggleSelect(file)"
              @dblclick="openDetail(file)"
            >
              <div class="file-card__preview">
                <v-img
                  v-if="isImage(file)"
                  :src="getFileUrl(file)"
                  height="120"
                  cover
                >
                  <template #error>
                    <div class="d-flex align-center justify-center h-100">
                      <v-icon size="48" color="grey">mdi-image-broken</v-icon>
                    </div>
                  </template>
                </v-img>
                <div v-else class="d-flex align-center justify-center" style="height: 120px">
                  <v-icon size="48" color="grey">{{ getFileTypeIcon(file) }}</v-icon>
                </div>
                <v-checkbox-btn
                  :model-value="isSelected(file)"
                  @click.stop
                  @update:model-value="toggleSelect(file)"
                  hide-details
                  density="compact"
                  class="file-card__checkbox"
                />
              </div>
              <v-card-text class="pa-2">
                <p class="text-caption text-truncate">{{ file.name }}</p>
                <p class="text-caption text-medium-emphasis">{{ formatFileSize(file.size) }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- File List -->
    <v-card v-else>
      <v-table>
        <thead>
          <tr>
            <th width="40">
              <v-checkbox
                :model-value="allSelected"
                @update:model-value="toggleSelectAll"
                hide-details
                density="compact"
              />
            </th>
            <th>{{ t('common.name') }}</th>
            <th width="100">{{ t('common.size') }}</th>
            <th width="100">{{ t('common.channel') }}</th>
            <th width="120">{{ t('common.date') }}</th>
            <th width="80">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
            </td>
          </tr>
          <tr v-else-if="files.length === 0">
            <td colspan="6" class="text-center py-8">
              <v-icon size="48" color="grey" class="mb-2">mdi-folder-open</v-icon>
              <p>{{ t('dashboard.noFiles') }}</p>
            </td>
          </tr>
          <tr
            v-for="file in files"
            :key="fileKey(file)"
            :class="{ 'bg-primary-lighten-4': isSelected(file) }"
            @click="toggleSelect(file)"
            style="cursor: pointer"
          >
            <td @click.stop>
              <v-checkbox
                :model-value="isSelected(file)"
                @update:model-value="toggleSelect(file)"
                hide-details
                density="compact"
              />
            </td>
            <td>
              <div class="d-flex align-center ga-2">
                <v-icon size="24" color="grey">{{ getFileTypeIcon(file) }}</v-icon>
                <span class="text-truncate">{{ file.name }}</span>
              </div>
            </td>
            <td>{{ formatFileSize(file.size) }}</td>
            <td>
              <v-chip size="small" variant="tonal">
                {{ file.channel || '-' }}
              </v-chip>
            </td>
            <td>{{ formatDate(file.time) }}</td>
            <td @click.stop>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn icon size="small" variant="text" v-bind="props">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item @click="copyLink(file)">
                    <template #prepend>
                      <v-icon>mdi-content-copy</v-icon>
                    </template>
                    <v-list-item-title>{{ t('dashboard.copyLink') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="openDetail(file)">
                    <template #prepend>
                      <v-icon>mdi-information</v-icon>
                    </template>
                    <v-list-item-title>{{ t('dashboard.metadata') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="deleteFile(file)">
                    <template #prepend>
                      <v-icon color="error">mdi-delete</v-icon>
                    </template>
                    <v-list-item-title class="text-error">{{ t('common.delete') }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="d-flex justify-center mt-4">
      <v-pagination
        v-model="page"
        :length="totalPages"
        :total-visible="7"
        rounded="circle"
      />
    </div>

    <!-- File Detail Dialog -->
    <v-dialog v-model="showDetail" max-width="600">
      <v-card v-if="selectedFile">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ t('dashboard.details') }}</span>
          <v-btn icon variant="text" @click="showDetail = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-list>
            <v-list-item :subtitle="selectedFile.name">
              <template #prepend>
                <v-icon>mdi-file</v-icon>
              </template>
              <v-list-item-title>{{ t('common.name') }}</v-list-item-title>
            </v-list-item>
            <v-list-item :subtitle="formatFileSize(selectedFile.size)">
              <template #prepend>
                <v-icon>mdi-harddisk</v-icon>
              </template>
              <v-list-item-title>{{ t('common.size') }}</v-list-item-title>
            </v-list-item>
            <v-list-item :subtitle="selectedFile.channel || '-'">
              <template #prepend>
                <v-icon>mdi-server-network</v-icon>
              </template>
              <v-list-item-title>{{ t('common.channel') }}</v-list-item-title>
            </v-list-item>
            <v-list-item :subtitle="formatDateTime(selectedFile.time)">
              <template #prepend>
                <v-icon>mdi-calendar</v-icon>
              </template>
              <v-list-item-title>{{ t('common.date') }}</v-list-item-title>
            </v-list-item>
            <v-list-item :subtitle="selectedFile.url">
              <template #prepend>
                <v-icon>mdi-link</v-icon>
              </template>
              <v-list-item-title>URL</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="copyLink(selectedFile)">
            <v-icon start>mdi-content-copy</v-icon>
            {{ t('dashboard.copyLink') }}
          </v-btn>
          <v-btn color="error" @click="deleteFile(selectedFile); showDetail = false">
            <v-icon start>mdi-delete</v-icon>
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { manageApi } from '@/api'
import { formatFileSize, formatDateTime, formatDate, copyToClipboard } from '@/utils/helpers'
import AdminLayout from '@/layouts/AdminLayout.vue'

const { t } = useI18n()

const loading = ref(false)
const files = ref([])
const selectedFiles = ref([])
const search = ref('')
const filterChannel = ref('all')
const viewMode = ref(localStorage.getItem('viewMode') || 'grid')
const page = ref(1)
const pageSize = ref(24)
const totalCount = ref(0)
const showDetail = ref(false)
const selectedFile = ref(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const stats = ref({
  totalFiles: 0,
  storageUsed: '0 B',
  recentUploads: 0,
  channels: 0
})

const channelFilterOptions = computed(() => [
  { title: t('common.all'), value: 'all' },
  { title: 'Telegram', value: 'TelegramNew' },
  { title: 'Cloudflare R2', value: 'CloudflareR2' },
  { title: 'S3', value: 'S3' },
  { title: 'Discord', value: 'Discord' },
  { title: 'HuggingFace', value: 'HuggingFace' },
  { title: 'WebDAV', value: 'WebDAV' }
])

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

const allSelected = computed(() => {
  return files.value.length > 0 && selectedFiles.value.length === files.value.length
})

const fileKey = (file) => {
  return file.id || file.name || Math.random().toString()
}

watch(viewMode, (val) => {
  localStorage.setItem('viewMode', val)
})

watch([filterChannel], () => {
  page.value = 1
  fetchFiles()
})

watch(page, () => {
  fetchFiles()
})

onMounted(() => {
  fetchFiles()
})

const fetchFiles = async () => {
  loading.value = true
  try {
    const params = {
      start: (page.value - 1) * pageSize.value,
      count: pageSize.value
    }
    if (search.value) params.search = search.value
    if (filterChannel.value !== 'all') params.channel = filterChannel.value

    const response = await manageApi.getFiles(params)
    files.value = response.data.files || []
    totalCount.value = response.data.totalCount || 0
    
    // Update stats
    if (response.data.totalCount !== undefined) {
      stats.value.totalFiles = response.data.totalCount
    }
  } catch (error) {
    console.error('Failed to fetch files:', error)
    showMessage(t('common.error'), 'error')
  } finally {
    loading.value = false
  }
}

const clearSearch = () => {
  search.value = ''
  page.value = 1
  fetchFiles()
}

const isImage = (file) => {
  return file.type && file.type.startsWith('image/')
}

const getFileUrl = (file) => {
  return file.url || `/file/${file.id}`
}

const getFileTypeIcon = (file) => {
  if (!file.type) return 'mdi-file'
  if (file.type.startsWith('image/')) return 'mdi-file-image'
  if (file.type.startsWith('video/')) return 'mdi-file-video'
  if (file.type.startsWith('audio/')) return 'mdi-file-music'
  if (file.type === 'application/pdf') return 'mdi-file-pdf'
  return 'mdi-file'
}

const isSelected = (file) => {
  const key = file.id || file.name
  return selectedFiles.value.some(f => (f.id || f.name) === key)
}

const toggleSelect = (file) => {
  const key = file.id || file.name
  const index = selectedFiles.value.findIndex(f => (f.id || f.name) === key)
  if (index >= 0) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(file)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedFiles.value = []
  } else {
    selectedFiles.value = [...files.value]
  }
}

const clearSelection = () => {
  selectedFiles.value = []
}

const openDetail = (file) => {
  selectedFile.value = file
  showDetail.value = true
}

const copyLink = async (file) => {
  const url = `${window.location.origin}${file.url}`
  const success = await copyToClipboard(url)
  if (success) {
    showMessage(t('dashboard.linkCopied'), 'success')
  }
}

const deleteFile = async (file) => {
  try {
    await manageApi.deleteFile(file.id || file.name)
    showMessage(t('dashboard.deleteSuccess'), 'success')
    fetchFiles()
    selectedFiles.value = selectedFiles.value.filter(f => (f.id || f.name) !== (file.id || file.name))
  } catch (error) {
    showMessage(t('dashboard.deleteFailed'), 'error')
  }
}

const batchDelete = async () => {
  if (selectedFiles.value.length === 0) return
  
  try {
    for (const file of selectedFiles.value) {
      await manageApi.deleteFile(file.id || file.name)
    }
    showMessage(t('dashboard.deleteSuccess'), 'success')
    selectedFiles.value = []
    fetchFiles()
  } catch (error) {
    showMessage(t('dashboard.deleteFailed'), 'error')
  }
}

const showMessage = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>

<style scoped>
.file-card {
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.file-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.file-card--selected {
  border: 2px solid rgb(var(--v-theme-primary));
}

.file-card__preview {
  position: relative;
  overflow: hidden;
}

.file-card__checkbox {
  position: absolute;
  top: 4px;
  left: 4px;
}
</style>
