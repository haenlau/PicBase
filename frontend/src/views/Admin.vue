<template>
  <v-container>
    <!-- 标签页 -->
    <v-tabs v-model="activeTab" color="primary" class="mb-6">
      <v-tab value="files">
        <v-icon start>mdi-folder</v-icon>
        文件管理
      </v-tab>
      <v-tab value="channels">
        <v-icon start>mdi-cloud</v-icon>
        渠道配置
      </v-tab>
      <v-tab value="security">
        <v-icon start>mdi-shield</v-icon>
        安全设置
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">
      <!-- 文件管理 -->
      <v-tabs-window-item value="files">
        <!-- 工具栏 -->
        <v-card class="mb-4">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="searchQuery"
                  label="搜索文件"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  density="compact"
                  hide-details
                  @update:model-value="debouncedSearch"
                />
              </v-col>
              <v-col cols="12" md="8">
                <div class="d-flex align-center flex-wrap ga-2 justify-end">
                  <v-select
                    v-model="filterChannel"
                    :items="channelOptions"
                    label="渠道"
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
                  <v-btn icon variant="text" @click="fetchFiles">
                    <v-icon>mdi-refresh</v-icon>
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 批量操作 -->
        <v-slide-y-transition>
          <v-card v-if="selectedFiles.length > 0" class="mb-4" color="primary" variant="tonal">
            <v-card-text class="d-flex align-center justify-space-between">
              <span>已选择 {{ selectedFiles.length }} 项</span>
              <div>
                <v-btn variant="text" size="small" class="mr-2" @click="copySelectedLinks">
                  <v-icon start>mdi-link</v-icon>
                  复制链接
                </v-btn>
                <v-btn variant="text" size="small" color="error" @click="confirmBatchDelete">
                  <v-icon start>mdi-delete</v-icon>
                  删除
                </v-btn>
                <v-btn variant="text" size="small" @click="selectedFiles = []">
                  取消
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-slide-y-transition>

        <!-- 网格视图 -->
        <v-row v-if="viewMode === 'grid'">
          <v-col v-if="loading" v-for="n in 8" :key="n" cols="6" sm="4" md="3" lg="2">
            <v-skeleton-loader type="card" />
          </v-col>
          
          <v-col
            v-for="file in files"
            :key="file.name"
            cols="6"
            sm="4"
            md="3"
            lg="2"
          >
            <v-card
              class="file-card"
              :class="{ 'file-card--selected': isSelected(file) }"
              @click="toggleSelect(file)"
            >
              <div class="file-preview">
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
                  <v-icon size="48" :color="getFileTypeColor(file)">
                    {{ getFileTypeIcon(file) }}
                  </v-icon>
                </div>
                <v-checkbox
                  :model-value="isSelected(file)"
                  @click.stop
                  @update:model-value="toggleSelect(file)"
                  hide-details
                  density="compact"
                  class="file-checkbox"
                />
              </div>
              <v-card-text class="pa-2">
                <p class="text-caption text-truncate">{{ file.name }}</p>
                <p class="text-caption text-medium-emphasis">
                  {{ file.metadata?.Channel || '-' }}
                </p>
              </v-card-text>
              <v-card-actions class="pa-1 justify-end">
                <v-btn icon size="x-small" variant="text" @click.stop="showLink(file)">
                  <v-icon size="small">mdi-link</v-icon>
                </v-btn>
                <v-btn icon size="x-small" variant="text" color="error" @click.stop="confirmDelete(file)">
                  <v-icon size="small">mdi-delete-outline</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- 列表视图 -->
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
                <th>文件名</th>
                <th width="100">渠道</th>
                <th width="120">时间</th>
                <th width="100">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="5" class="text-center py-8">
                  <v-progress-circular indeterminate color="primary" />
                </td>
              </tr>
              <tr
                v-for="file in files"
                :key="file.name"
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
                    <v-icon :color="getFileTypeColor(file)" size="20">
                      {{ getFileTypeIcon(file) }}
                    </v-icon>
                    <span class="text-truncate">{{ file.name }}</span>
                  </div>
                </td>
                <td>
                  <v-chip size="small" variant="tonal">
                    {{ file.metadata?.Channel || '-' }}
                  </v-chip>
                </td>
                <td class="text-caption text-medium-emphasis">
                  {{ formatTime(file.metadata?.TimeStamp) }}
                </td>
                <td @click.stop>
                  <v-btn icon size="small" variant="text" @click="showLink(file)">
                    <v-icon>mdi-link</v-icon>
                  </v-btn>
                  <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(file)">
                    <v-icon>mdi-delete-outline</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>

        <!-- 空状态 -->
        <v-card v-if="files.length === 0 && !loading" class="text-center py-12">
          <v-icon size="64" color="grey" class="mb-4">mdi-folder-open</v-icon>
          <h3 class="text-h6 text-medium-emphasis mb-2">暂无文件</h3>
          <p class="text-body-2 text-medium-emphasis mb-4">上传一些文件开始使用吧</p>
          <v-btn color="primary" to="/">
            <v-icon start>mdi-cloud-upload</v-icon>
            去上传
          </v-btn>
        </v-card>

        <!-- 加载更多 -->
        <div v-if="hasMore && !loading" class="text-center mt-4">
          <v-btn variant="tonal" @click="loadMore">
            <v-icon start>mdi-chevron-down</v-icon>
            加载更多
          </v-btn>
        </div>
      </v-tabs-window-item>

      <!-- 渠道配置 -->
      <v-tabs-window-item value="channels">
        <v-row>
          <v-col v-for="type in channelTypes" :key="type.id" cols="12" md="6" lg="4">
            <v-card>
              <v-card-title class="d-flex align-center">
                <v-icon :color="type.color" class="mr-2">{{ type.icon }}</v-icon>
                {{ type.name }}
              </v-card-title>
              <v-card-subtitle>{{ type.description }}</v-card-subtitle>
              <v-divider />
              <v-card-text>
                <div v-if="getChannelsByType(type.id).length === 0" class="text-medium-emphasis text-center py-4">
                  未配置
                </div>
                <v-list v-else density="compact">
                  <v-list-item v-for="ch in getChannelsByType(type.id)" :key="ch.name">
                    <template #prepend>
                      <v-icon :color="ch.enabled ? 'success' : 'grey'">
                        {{ ch.enabled ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                      </v-icon>
                    </template>
                    <v-list-item-title>{{ ch.name }}</v-list-item-title>
                    <template #append>
                      <v-btn icon size="x-small" variant="text" @click="editChannel(type.id, ch)">
                        <v-icon size="small">mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn icon size="x-small" variant="text" color="error" @click="deleteChannel(type.id, ch)">
                        <v-icon size="small">mdi-delete</v-icon>
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="tonal" size="small" @click="addChannel(type.id)">
                  <v-icon start>mdi-plus</v-icon>
                  添加
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- 安全设置 -->
      <v-tabs-window-item value="security">
        <v-card max-width="500">
          <v-card-title>
            <v-icon class="mr-2">mdi-shield</v-icon>
            管理员设置
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-form @submit.prevent="saveSecurity">
              <v-text-field
                v-model="securitySettings.username"
                label="用户名"
                prepend-inner-icon="mdi-account"
                class="mb-2"
              />
              <v-text-field
                v-model="securitySettings.password"
                label="密码"
                type="password"
                prepend-inner-icon="mdi-lock"
                class="mb-4"
              />
              <v-btn type="submit" color="primary">
                <v-icon start>mdi-content-save</v-icon>
                保存
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- 渠道配置弹窗 -->
    <v-dialog v-model="showChannelDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ editingChannel ? '编辑' : '添加' }} {{ getChannelTypeName(editingChannelType) }}</span>
          <v-btn icon variant="text" @click="showChannelDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="channelFormRef">
            <v-text-field
              v-model="channelForm.name"
              label="渠道名称"
              :rules="[v => !!v || '请输入名称']"
              class="mb-2"
            />

            <!-- Telegram -->
            <template v-if="editingChannelType === 'telegram'">
              <v-text-field
                v-model="channelForm.botToken"
                label="Bot Token"
                :rules="[v => !!v || '请输入Bot Token']"
                class="mb-2"
              />
              <v-text-field
                v-model="channelForm.chatId"
                label="Chat ID"
                :rules="[v => !!v || '请输入Chat ID']"
                class="mb-2"
              />
              <v-text-field
                v-model="channelForm.proxyUrl"
                label="代理URL（可选）"
                class="mb-2"
              />
            </template>

            <!-- R2 -->
            <template v-if="editingChannelType === 'cfr2'">
              <v-text-field
                v-model="channelForm.publicUrl"
                label="公共URL"
                :rules="[v => !!v || '请输入公共URL']"
                class="mb-2"
              />
            </template>

            <!-- S3 -->
            <template v-if="editingChannelType === 's3'">
              <v-text-field
                v-model="channelForm.endpoint"
                label="端点"
                :rules="[v => !!v || '请输入端点']"
                class="mb-2"
              />
              <v-text-field
                v-model="channelForm.accessKeyId"
                label="Access Key ID"
                :rules="[v => !!v || '请输入Access Key ID']"
                class="mb-2"
              />
              <v-text-field
                v-model="channelForm.secretAccessKey"
                label="Secret Access Key"
                type="password"
                :rules="[v => !!v || '请输入Secret Access Key']"
                class="mb-2"
              />
              <v-text-field
                v-model="channelForm.bucketName"
                label="存储桶名称"
                :rules="[v => !!v || '请输入存储桶名称']"
                class="mb-2"
              />
              <v-text-field
                v-model="channelForm.region"
                label="区域"
                placeholder="auto"
                class="mb-2"
              />
            </template>

            <!-- Discord -->
            <template v-if="editingChannelType === 'discord'">
              <v-text-field
                v-model="channelForm.botToken"
                label="Bot Token"
                :rules="[v => !!v || '请输入Bot Token']"
                class="mb-2"
              />
              <v-text-field
                v-model="channelForm.channelId"
                label="频道ID"
                :rules="[v => !!v || '请输入频道ID']"
                class="mb-2"
              />
            </template>

            <!-- HuggingFace -->
            <template v-if="editingChannelType === 'huggingface'">
              <v-text-field
                v-model="channelForm.token"
                label="API Token"
                type="password"
                :rules="[v => !!v || '请输入Token']"
                class="mb-2"
              />
              <v-text-field
                v-model="channelForm.repo"
                label="仓库"
                :rules="[v => !!v || '请输入仓库']"
                placeholder="username/repo"
                class="mb-2"
              />
            </template>

            <!-- WebDAV -->
            <template v-if="editingChannelType === 'webdav'">
              <v-text-field
                v-model="channelForm.baseUrl"
                label="WebDAV URL"
                :rules="[v => !!v || '请输入URL']"
                class="mb-2"
              />
              <v-text-field
                v-model="channelForm.username"
                label="用户名"
                :rules="[v => !!v || '请输入用户名']"
                class="mb-2"
              />
              <v-text-field
                v-model="channelForm.password"
                label="密码"
                type="password"
                :rules="[v => !!v || '请输入密码']"
                class="mb-2"
              />
              <v-text-field
                v-model="channelForm.publicUrl"
                label="公共URL（可选）"
                class="mb-2"
              />
            </template>

            <v-switch
              v-model="channelForm.enabled"
              label="启用"
              color="success"
              hide-details
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showChannelDialog = false">取消</v-btn>
          <v-btn color="primary" @click="saveChannel" :loading="savingChannel">
            {{ editingChannel ? '保存' : '添加' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 链接弹窗 -->
    <v-dialog v-model="showLinkDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div>
            <v-icon class="mr-2">mdi-link</v-icon>
            复制链接
          </div>
          <v-btn icon variant="text" @click="showLinkDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-list>
            <v-list-item v-for="item in linkFormats" :key="item.label">
              <template #prepend>
                <v-icon :color="item.color">{{ item.icon }}</v-icon>
              </template>
              <v-list-item-title class="text-caption font-weight-bold">
                {{ item.label }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-truncate">
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

    <!-- 确认弹窗 -->
    <v-dialog v-model="showConfirm" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          {{ confirmTitle }}
        </v-card-title>
        <v-card-text>{{ confirmMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showConfirm = false">取消</v-btn>
          <v-btn color="error" @click="handleConfirm">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { formatTime, getFileType, getFileIcon, getFileColor, copyToClipboard, debounce } from '@/utils/helpers'
import api from '@/utils/api'

const activeTab = ref('files')
const viewMode = ref('grid')
const loading = ref(false)
const files = ref([])
const selectedFiles = ref([])
const searchQuery = ref('')
const filterChannel = ref('')
const page = ref(0)
const pageSize = ref(50)
const hasMore = ref(true)
const allChannels = ref([])

// 渠道配置
const uploadConfig = ref({
  telegram: { channels: [] },
  cfr2: { channels: [] },
  s3: { channels: [] },
  discord: { channels: [] },
  huggingface: { channels: [] },
  webdav: { channels: [] }
})
const showChannelDialog = ref(false)
const editingChannel = ref(null)
const editingChannelType = ref('')
const savingChannel = ref(false)
const channelFormRef = ref(null)
const channelForm = ref({
  name: '',
  enabled: true,
  botToken: '',
  chatId: '',
  proxyUrl: '',
  publicUrl: '',
  endpoint: '',
  accessKeyId: '',
  secretAccessKey: '',
  bucketName: '',
  region: 'auto',
  channelId: '',
  token: '',
  repo: '',
  baseUrl: '',
  username: '',
  password: ''
})

// 链接弹窗
const showLinkDialog = ref(false)
const linkFile = ref({ url: '', name: '' })
const copiedLabel = ref('')

// 确认弹窗
const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref(null)
const deleteTarget = ref(null)

// Toast
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// 安全设置
const securitySettings = ref({
  username: '',
  password: ''
})

const channelTypes = [
  { id: 'telegram', name: 'Telegram', icon: 'mdi-telegram', color: '#0088cc', description: '上传到 Telegram 频道' },
  { id: 'cfr2', name: 'Cloudflare R2', icon: 'mdi-cloud', color: '#F38020', description: 'Cloudflare R2 存储' },
  { id: 's3', name: 'S3 兼容', icon: 'mdi-aws', color: '#FF9900', description: 'AWS S3 或兼容服务' },
  { id: 'discord', name: 'Discord', icon: 'mdi-discord', color: '#5865F2', description: '上传到 Discord 频道' },
  { id: 'huggingface', name: 'HuggingFace', icon: 'mdi-face-man', color: '#FFD21E', description: 'HuggingFace 仓库' },
  { id: 'webdav', name: 'WebDAV', icon: 'mdi-folder-network', color: '#4CAF50', description: 'WebDAV 服务' }
]

const channelOptions = computed(() => {
  const channels = new Set()
  files.value.forEach(f => {
    if (f.metadata?.Channel) channels.add(f.metadata.Channel)
  })
  return ['全部', ...Array.from(channels)]
})

const allSelected = computed(() => {
  return files.value.length > 0 && selectedFiles.value.length === files.value.length
})

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
  fetchFiles()
  fetchChannels()
  fetchUploadConfig()
})

watch(filterChannel, () => {
  page.value = 0
  files.value = []
  fetchFiles()
})

const debouncedSearch = debounce(() => {
  page.value = 0
  files.value = []
  fetchFiles()
}, 300)

async function fetchFiles() {
  loading.value = true
  try {
    const params = {
      start: page.value * pageSize.value,
      count: pageSize.value
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (filterChannel.value && filterChannel.value !== '全部') params.channel = filterChannel.value
    
    const data = await api.get('/api/manage/list?' + new URLSearchParams(params))
    
    if (page.value === 0) {
      files.value = data.files || []
    } else {
      files.value.push(...(data.files || []))
    }
    
    hasMore.value = (data.files || []).length === pageSize.value
  } catch (err) {
    showMessage('加载失败', 'error')
  } finally {
    loading.value = false
  }
}

async function fetchChannels() {
  try {
    const data = await api.get('/api/channels')
    allChannels.value = []
    for (const [type, channelList] of Object.entries(data)) {
      if (Array.isArray(channelList)) {
        channelList.forEach(ch => {
          allChannels.value.push({ ...ch, type })
        })
      }
    }
  } catch (err) {
    console.error('Failed to fetch channels:', err)
  }
}

async function fetchUploadConfig() {
  try {
    const data = await api.get('/api/manage/sysConfig/upload')
    uploadConfig.value = data
  } catch (err) {
    console.error('Failed to fetch upload config:', err)
  }
}

function getChannelsByType(type) {
  return uploadConfig.value[type]?.channels || []
}

function getChannelTypeName(type) {
  const found = channelTypes.find(t => t.id === type)
  return found?.name || type
}

function addChannel(type) {
  editingChannel.value = null
  editingChannelType.value = type
  resetChannelForm()
  showChannelDialog.value = true
}

function editChannel(type, channel) {
  editingChannel.value = channel
  editingChannelType.value = type
  channelForm.value = { ...channel }
  showChannelDialog.value = true
}

function resetChannelForm() {
  channelForm.value = {
    name: '',
    enabled: true,
    botToken: '',
    chatId: '',
    proxyUrl: '',
    publicUrl: '',
    endpoint: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    region: 'auto',
    channelId: '',
    token: '',
    repo: '',
    baseUrl: '',
    username: '',
    password: ''
  }
}

async function saveChannel() {
  const { valid } = await channelFormRef.value.validate()
  if (!valid) return

  savingChannel.value = true
  try {
    const type = editingChannelType.value
    const channels = uploadConfig.value[type]?.channels || []
    
    if (editingChannel.value) {
      // 编辑
      const index = channels.findIndex(c => c.name === editingChannel.value.name)
      if (index >= 0) {
        channels[index] = { ...channelForm.value }
      }
    } else {
      // 添加
      channels.push({ ...channelForm.value })
    }
    
    uploadConfig.value[type].channels = channels
    
    // 保存到后端
    await api.post('/api/manage/sysConfig/upload', uploadConfig.value)
    
    showChannelDialog.value = false
    showMessage(editingChannel.value ? '保存成功' : '添加成功', 'success')
    
    // 刷新渠道列表
    await fetchChannels()
  } catch (err) {
    showMessage('保存失败', 'error')
  } finally {
    savingChannel.value = false
  }
}

async function deleteChannel(type, channel) {
  confirmTitle.value = '删除渠道'
  confirmMessage.value = `确定要删除 "${channel.name}" 吗？`
  confirmAction.value = 'deleteChannel'
  deleteTarget.value = { type, channel }
  showConfirm.value = true
}

function loadMore() {
  page.value++
  fetchFiles()
}

function isImage(file) {
  const type = file.metadata?.FileType
  return type && type.startsWith('image/')
}

function getFileUrl(file) {
  return `/file/${file.name}`
}

function getFileTypeIcon(file) {
  const type = getFileType(file.metadata?.FileType, file.name)
  return getFileIcon(type)
}

function getFileTypeColor(file) {
  const type = getFileType(file.metadata?.FileType, file.name)
  return getFileColor(type)
}

function isSelected(file) {
  return selectedFiles.value.some(f => f.name === file.name)
}

function toggleSelect(file) {
  const index = selectedFiles.value.findIndex(f => f.name === file.name)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(file)
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedFiles.value = []
  } else {
    selectedFiles.value = [...files.value]
  }
}

function showLink(file) {
  linkFile.value = {
    url: window.location.origin + '/file/' + file.name,
    name: file.name
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

async function copySelectedLinks() {
  const links = selectedFiles.value.map(f => window.location.origin + '/file/' + f.name).join('\n')
  const success = await copyToClipboard(links)
  if (success) {
    showMessage(`已复制 ${selectedFiles.value.length} 个链接`, 'success')
  }
}

function confirmDelete(file) {
  deleteTarget.value = file
  confirmTitle.value = '删除文件'
  confirmMessage.value = `确定要删除 "${file.name}" 吗？此操作不可恢复。`
  confirmAction.value = 'delete'
  showConfirm.value = true
}

function confirmBatchDelete() {
  deleteTarget.value = null
  confirmTitle.value = '批量删除'
  confirmMessage.value = `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？此操作不可恢复。`
  confirmAction.value = 'batchDelete'
  showConfirm.value = true
}

async function handleConfirm() {
  showConfirm.value = false
  
  if (confirmAction.value === 'delete' && deleteTarget.value) {
    await deleteFile(deleteTarget.value)
  } else if (confirmAction.value === 'batchDelete') {
    await batchDelete()
  } else if (confirmAction.value === 'deleteChannel' && deleteTarget.value) {
    await doDeleteChannel(deleteTarget.value.type, deleteTarget.value.channel)
  }
}

async function deleteFile(file) {
  try {
    await api.del('/api/manage/delete/' + encodeURIComponent(file.name))
    files.value = files.value.filter(f => f.name !== file.name)
    selectedFiles.value = selectedFiles.value.filter(f => f.name !== file.name)
    showMessage('删除成功', 'success')
  } catch (err) {
    showMessage('删除失败', 'error')
  }
}

async function batchDelete() {
  let successCount = 0
  for (const file of selectedFiles.value) {
    try {
      await api.del('/api/manage/delete/' + encodeURIComponent(file.name))
      successCount++
    } catch (err) {
      console.error('Delete failed:', file.name, err)
    }
  }
  
  files.value = files.value.filter(f => !selectedFiles.value.some(s => s.name === f.name))
  selectedFiles.value = []
  showMessage(`成功删除 ${successCount} 个文件`, 'success')
}

async function doDeleteChannel(type, channel) {
  try {
    const channels = uploadConfig.value[type]?.channels || []
    const index = channels.findIndex(c => c.name === channel.name)
    if (index >= 0) {
      channels.splice(index, 1)
      await api.post('/api/manage/sysConfig/upload', uploadConfig.value)
      showMessage('删除成功', 'success')
      await fetchChannels()
    }
  } catch (err) {
    showMessage('删除失败', 'error')
  }
}

async function saveSecurity() {
  try {
    await api.post('/api/manage/sysConfig/security', {
      auth: {
        admin: {
          adminUsername: securitySettings.value.username,
          adminPassword: securitySettings.value.password
        }
      }
    })
    showMessage('保存成功', 'success')
  } catch (err) {
    showMessage('保存失败', 'error')
  }
}

function showMessage(text, color = 'success') {
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
}

.file-card--selected {
  border: 2px solid rgb(var(--v-theme-primary));
}

.file-preview {
  position: relative;
  overflow: hidden;
}

.file-checkbox {
  position: absolute;
  top: 4px;
  left: 4px;
}
</style>
