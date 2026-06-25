<template>
  <div class="admin-page">
    <div class="container">
      <!-- 标签页 -->
      <div class="tabs glass">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab" 
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="material-icons-outlined">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- 文件管理 -->
      <div v-if="activeTab === 'files'" class="tab-content">
        <!-- 工具栏 -->
        <div class="toolbar glass">
          <div class="toolbar-left">
            <div class="search-box">
              <span class="material-icons-outlined">search</span>
              <input class="input" v-model="searchQuery" placeholder="搜索文件..." @input="debouncedSearch" />
            </div>
            <select class="select" v-model="filterChannel" style="width: auto; min-width: 150px;">
              <option value="">全部渠道</option>
              <option v-for="ch in channelOptions" :key="ch" :value="ch">{{ ch }}</option>
            </select>
            <select class="select" v-model="filterType" style="width: auto; min-width: 120px;">
              <option value="">全部类型</option>
              <option value="image">图片</option>
              <option value="video">视频</option>
              <option value="audio">音频</option>
              <option value="document">文档</option>
            </select>
          </div>
          <div class="toolbar-right">
            <button class="btn-icon" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'" title="网格">
              <span class="material-icons-outlined">grid_view</span>
            </button>
            <button class="btn-icon" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'" title="列表">
              <span class="material-icons-outlined">view_list</span>
            </button>
            <button class="btn-icon" @click="fetchFiles" title="刷新">
              <span class="material-icons-outlined">refresh</span>
            </button>
          </div>
        </div>

        <!-- 批量操作 -->
        <div class="batch-bar glass" v-if="selectedFiles.length > 0">
          <span>已选择 {{ selectedFiles.length }} 项</span>
          <div class="batch-actions">
            <button class="btn btn-sm btn-secondary" @click="copySelectedLinks">
              <span class="material-icons-outlined">link</span>
              复制链接
            </button>
            <button class="btn btn-sm btn-error" @click="confirmBatchDelete">
              <span class="material-icons-outlined">delete</span>
              删除
            </button>
            <button class="btn btn-sm btn-secondary" @click="selectedFiles = []">
              取消选择
            </button>
          </div>
        </div>

        <!-- 网格视图 -->
        <div v-if="viewMode === 'grid'" class="file-grid">
          <div 
            v-for="file in files" 
            :key="file.name"
            class="file-card glass-card"
            :class="{ selected: isSelected(file) }"
            @click="toggleSelect(file)"
          >
            <div class="file-preview">
              <img v-if="isImage(file)" :src="getFileUrl(file)" @error="e => e.target.style.display = 'none'" />
              <div v-else class="file-icon-large" :style="{ color: getfileTypeColor(file) }">
                <span class="material-icons-outlined">{{ getFileTypeIcon(file) }}</span>
              </div>
              <div class="file-checkbox">
                <input type="checkbox" :checked="isSelected(file)" @click.stop />
              </div>
            </div>
            <div class="file-card-info">
              <div class="file-card-name">{{ file.name }}</div>
              <div class="file-card-meta">
                <span class="tag">{{ file.metadata?.Channel || '-' }}</span>
                <span>{{ formatTime(file.metadata?.TimeStamp) }}</span>
              </div>
            </div>
            <div class="file-card-actions" @click.stop>
              <button class="btn-icon" @click="showLink(file)" title="复制链接">
                <span class="material-icons-outlined">link</span>
              </button>
              <button class="btn-icon" @click="confirmDelete(file)" title="删除">
                <span class="material-icons-outlined">delete_outline</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else class="file-table glass">
          <table>
            <thead>
              <tr>
                <th width="40">
                  <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
                </th>
                <th>文件名</th>
                <th width="100">渠道</th>
                <th width="120">时间</th>
                <th width="100">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="file in files" :key="file.name" :class="{ selected: isSelected(file) }">
                <td>
                  <input type="checkbox" :checked="isSelected(file)" @change="toggleSelect(file)" />
                </td>
                <td>
                  <div class="file-name-cell">
                    <span class="material-icons-outlined" :style="{ color: getfileTypeColor(file) }">
                      {{ getFileTypeIcon(file) }}
                    </span>
                    <span class="truncate">{{ file.name }}</span>
                  </div>
                </td>
                <td>
                  <span class="tag">{{ file.metadata?.Channel || '-' }}</span>
                </td>
                <td class="text-muted">{{ formatTime(file.metadata?.TimeStamp) }}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn-icon" @click="showLink(file)" title="复制链接">
                      <span class="material-icons-outlined">link</span>
                    </button>
                    <button class="btn-icon" @click="confirmDelete(file)" title="删除">
                      <span class="material-icons-outlined">delete_outline</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 空状态 -->
        <div v-if="files.length === 0 && !loading" class="empty-state glass">
          <span class="material-icons-outlined">folder_open</span>
          <h3>暂无文件</h3>
          <p>上传一些文件开始使用吧</p>
          <router-link to="/" class="btn btn-primary">
            <span class="material-icons-outlined">cloud_upload</span>
            去上传
          </router-link>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="skeleton glass" v-for="i in 8" :key="i"></div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore && !loading" class="load-more">
          <button class="btn btn-secondary" @click="loadMore">
            <span class="material-icons-outlined">expand_more</span>
            加载更多
          </button>
        </div>
      </div>

      <!-- 渠道配置 -->
      <div v-if="activeTab === 'channels'" class="tab-content">
        <div class="channel-list">
          <div v-for="type in channelTypes" :key="type.id" class="channel-card glass-card">
            <div class="channel-header">
              <div class="channel-icon" :style="{ background: type.color }">
                <span class="material-icons-outlined">{{ type.icon }}</span>
              </div>
              <div class="channel-info">
                <h3>{{ type.name }}</h3>
                <p>{{ type.description }}</p>
              </div>
            </div>
            <div class="channel-body">
              <div v-if="getChannelsByType(type.id).length === 0" class="channel-empty">
                未配置
              </div>
              <div v-else class="channel-items">
                <div v-for="ch in getChannelsByType(type.id)" :key="ch.name" class="channel-item">
                  <span class="status-dot" :class="{ active: ch.enabled }"></span>
                  <span>{{ ch.name }}</span>
                </div>
              </div>
              <button class="btn btn-sm btn-secondary" @click="editChannel(type.id)">
                <span class="material-icons-outlined">add</span>
                添加
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 安全设置 -->
      <div v-if="activeTab === 'security'" class="tab-content">
        <div class="settings-card glass">
          <h3>管理员设置</h3>
          <div class="settings-form">
            <div class="form-group">
              <label>用户名</label>
              <input class="input" v-model="securitySettings.username" placeholder="留空表示无用户名" />
            </div>
            <div class="form-group">
              <label>密码</label>
              <input class="input" v-model="securitySettings.password" type="password" placeholder="留空表示不修改" />
            </div>
            <button class="btn btn-primary" @click="saveSecurity">
              <span class="material-icons-outlined">save</span>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 链接弹窗 -->
    <LinkDialog ref="linkDialog" :fileUrl="linkFile.url" :fileName="linkFile.name" />
    
    <!-- 确认弹窗 -->
    <ConfirmDialog ref="confirmDialog" :title="confirmTitle" :message="confirmMessage" :type="confirmType" @confirm="handleConfirm" />
    
    <!-- Toast -->
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { formatTime, getFileType, getFileIcon, getFileColor, copyToClipboard, debounce } from '@/utils/helpers'
import api from '@/utils/api'
import LinkDialog from '@/components/LinkDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import Toast from '@/components/Toast.vue'

const linkDialog = ref(null)
const confirmDialog = ref(null)
const toast = ref(null)

const activeTab = ref('files')
const viewMode = ref('grid')
const loading = ref(false)
const files = ref([])
const selectedFiles = ref([])
const searchQuery = ref('')
const filterChannel = ref('')
const filterType = ref('')
const page = ref(0)
const pageSize = ref(50)
const hasMore = ref(true)
const allChannels = ref([])

const linkFile = ref({ url: '', name: '' })
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmType = ref('warning')
const confirmAction = ref(null)
const deleteTarget = ref(null)

const securitySettings = ref({
  username: '',
  password: ''
})

const tabs = [
  { id: 'files', label: '文件管理', icon: 'folder' },
  { id: 'channels', label: '渠道配置', icon: 'cloud' },
  { id: 'security', label: '安全设置', icon: 'security' }
]

const channelTypes = [
  { id: 'telegram', name: 'Telegram', icon: 'telegram', color: '#0088cc', description: '上传到 Telegram 频道' },
  { id: 'cfr2', name: 'Cloudflare R2', icon: 'cloud', color: '#F38020', description: 'Cloudflare R2 存储' },
  { id: 's3', name: 'S3 兼容', icon: 'aws', color: '#FF9900', description: 'AWS S3 或兼容服务' },
  { id: 'discord', name: 'Discord', icon: 'discord', color: '#5865F2', description: '上传到 Discord 频道' },
  { id: 'huggingface', name: 'HuggingFace', icon: 'face', color: '#FFD21E', description: 'HuggingFace 仓库' },
  { id: 'webdav', name: 'WebDAV', icon: 'folder_network', color: '#4CAF50', description: 'WebDAV 服务' }
]

const channelOptions = computed(() => {
  const channels = new Set()
  files.value.forEach(f => {
    if (f.metadata?.Channel) channels.add(f.metadata.Channel)
  })
  return Array.from(channels)
})

const allSelected = computed(() => {
  return files.value.length > 0 && selectedFiles.value.length === files.value.length
})

onMounted(() => {
  fetchFiles()
  fetchChannels()
})

watch([filterChannel, filterType], () => {
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
    if (filterChannel.value) params.channel = filterChannel.value
    if (filterType.value) params.fileType = filterType.value
    
    const data = await api.get('/api/manage/list?' + new URLSearchParams(params))
    
    if (page.value === 0) {
      files.value = data.files || []
    } else {
      files.value.push(...(data.files || []))
    }
    
    hasMore.value = (data.files || []).length === pageSize.value
  } catch (err) {
    toast.value?.error('加载失败')
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

function getChannelsByType(type) {
  return allChannels.value.filter(ch => ch.type === type)
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

function getfileTypeColor(file) {
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
  linkDialog.value?.show()
}

async function copySelectedLinks() {
  const links = selectedFiles.value.map(f => window.location.origin + '/file/' + f.name).join('\n')
  const success = await copyToClipboard(links)
  if (success) {
    toast.value?.success('已复制 ' + selectedFiles.value.length + ' 个链接')
  }
}

function confirmDelete(file) {
  deleteTarget.value = file
  confirmTitle.value = '删除文件'
  confirmMessage.value = `确定要删除 "${file.name}" 吗？此操作不可恢复。`
  confirmType.value = 'error'
  confirmAction.value = 'delete'
  confirmDialog.value?.show()
}

function confirmBatchDelete() {
  deleteTarget.value = null
  confirmTitle.value = '批量删除'
  confirmMessage.value = `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？此操作不可恢复。`
  confirmType.value = 'error'
  confirmAction.value = 'batchDelete'
  confirmDialog.value?.show()
}

async function handleConfirm() {
  if (confirmAction.value === 'delete' && deleteTarget.value) {
    await deleteFile(deleteTarget.value)
  } else if (confirmAction.value === 'batchDelete') {
    await batchDelete()
  }
}

async function deleteFile(file) {
  try {
    await api.del('/api/manage/delete/' + encodeURIComponent(file.name))
    files.value = files.value.filter(f => f.name !== file.name)
    selectedFiles.value = selectedFiles.value.filter(f => f.name !== file.name)
    toast.value?.success('删除成功')
  } catch (err) {
    toast.value?.error('删除失败')
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
  toast.value?.success(`成功删除 ${successCount} 个文件`)
}

function editChannel(type) {
  toast.value?.info('渠道配置功能开发中')
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
    toast.value?.success('保存成功')
  } catch (err) {
    toast.value?.error('保存失败')
  }
}

function refresh() {
  fetchFiles()
  fetchChannels()
}

defineExpose({ refresh })
</script>

<style scoped>
.admin-page {
  min-height: calc(100vh - 80px);
  padding: var(--space-xl) 0;
}

.tabs {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-xs);
  margin-bottom: var(--space-lg);
}

.tab {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-normal);
  font-size: 14px;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tab.active {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.tab .material-icons-outlined {
  font-size: 18px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.toolbar-left {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
  flex: 1;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: 0 var(--space-md);
  flex: 1;
  min-width: 200px;
}

.search-box .material-icons-outlined {
  color: var(--text-muted);
}

.search-box .input {
  border: none;
  background: transparent;
  padding: var(--space-sm) 0;
}

.toolbar-right {
  display: flex;
  gap: var(--space-sm);
}

.btn-icon.active {
  background: rgba(255, 255, 255, 0.2);
}

.batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  background: rgba(102, 126, 234, 0.2);
}

.batch-actions {
  display: flex;
  gap: var(--space-sm);
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-md);
}

.file-card {
  cursor: pointer;
  transition: var(--transition-normal);
  overflow: hidden;
}

.file-card.selected {
  border-color: var(--info);
  box-shadow: 0 0 0 2px var(--info);
}

.file-preview {
  position: relative;
  height: 150px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon-large .material-icons-outlined {
  font-size: 48px;
}

.file-checkbox {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
}

.file-card-info {
  padding: var(--space-md);
}

.file-card-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--space-xs);
}

.file-card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
}

.file-card-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 var(--space-sm) var(--space-sm);
  gap: var(--space-xs);
  opacity: 0;
  transition: var(--transition-fast);
}

.file-card:hover .file-card-actions {
  opacity: 1;
}

.file-table {
  overflow-x: auto;
}

.file-table table {
  width: 100%;
  border-collapse: collapse;
}

.file-table th,
.file-table td {
  padding: var(--space-md);
  text-align: left;
  border-bottom: 1px solid var(--glass-border);
}

.file-table th {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.file-table tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.file-table tr.selected {
  background: rgba(102, 126, 234, 0.1);
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.file-name-cell .material-icons-outlined {
  font-size: 20px;
}

.table-actions {
  display: flex;
  gap: var(--space-xs);
}

.empty-state {
  text-align: center;
  padding: var(--space-2xl);
}

.empty-state .material-icons-outlined {
  font-size: 64px;
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
}

.empty-state h3 {
  margin-bottom: var(--space-sm);
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
}

.loading-state {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-md);
}

.skeleton {
  height: 200px;
  animation: pulse 1.5s infinite;
}

.load-more {
  text-align: center;
  padding: var(--space-xl);
}

.channel-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--space-lg);
}

.channel-card {
  padding: var(--space-lg);
}

.channel-header {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.channel-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-icon .material-icons-outlined {
  color: white;
  font-size: 24px;
}

.channel-info h3 {
  font-size: 16px;
  margin-bottom: 2px;
}

.channel-info p {
  font-size: 12px;
  color: var(--text-muted);
}

.channel-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.channel-empty {
  color: var(--text-muted);
  font-size: 13px;
}

.channel-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.channel-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
}

.status-dot.active {
  background: var(--success);
}

.settings-card {
  padding: var(--space-xl);
  max-width: 500px;
}

.settings-card h3 {
  margin-bottom: var(--space-lg);
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-group label {
  font-size: 13px;
  color: var(--text-secondary);
}

.text-muted {
  color: var(--text-muted);
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
  }
  
  .toolbar-left {
    width: 100%;
  }
  
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .channel-list {
    grid-template-columns: 1fr;
  }
}
</style>
