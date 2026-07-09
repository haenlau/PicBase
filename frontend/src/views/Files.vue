<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">文件管理</h1>
      <p class="page-subtitle">管理你上传的所有文件</p>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <v-icon size="18" class="search-icon">mdi-magnify</v-icon>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索文件..."
            @input="debouncedSearch"
          />
        </div>
        <button class="btn-secondary btn-sm" @click="showNewFolderDialog = true">
          <v-icon size="16">mdi-folder-plus</v-icon>
          新建文件夹
        </button>
      </div>
      <div class="toolbar-right">
        <select v-model="filterChannel" class="toolbar-select">
          <option value="">全部渠道</option>
          <option v-for="ch in channelOptions" :key="ch" :value="ch">{{ ch }}</option>
        </select>
        <select v-model="filterType" class="toolbar-select toolbar-select-sm">
          <option v-for="item in fileTypeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
        <select v-model="sortBy" class="toolbar-select toolbar-select-md">
          <option value="time-desc">最新优先</option>
          <option value="time-asc">最早优先</option>
          <option value="name-asc">名称 A-Z</option>
          <option value="name-desc">名称 Z-A</option>
          <option value="size-desc">体积从大到小</option>
          <option value="size-asc">体积从小到大</option>
        </select>
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          >
            <v-icon size="18">mdi-view-grid</v-icon>
          </button>
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
          >
            <v-icon size="18">mdi-view-list</v-icon>
          </button>
        </div>
        <button class="btn-icon" @click="fetchFiles" :class="{ spinning: loading }">
          <v-icon size="18">mdi-refresh</v-icon>
        </button>
      </div>
    </div>

    <!-- 面包屑导航 -->
    <div v-if="currentDir" class="breadcrumb">
      <button class="breadcrumb-item" @click="navigateToDir('')">
        <v-icon size="16">mdi-home</v-icon>
      </button>
      <template v-for="(part, index) in currentDir.split('/').filter(Boolean)" :key="index">
        <span class="breadcrumb-separator">/</span>
        <button
          class="breadcrumb-item"
          @click="navigateToDir(currentDir.split('/').filter(Boolean).slice(0, index + 1).join('/') + '/')"
        >
          {{ part }}
        </button>
      </template>
    </div>

    <!-- 批量操作 -->
    <transition name="fade">
      <div v-if="selectedFiles.length > 0" class="batch-bar">
        <span class="batch-info">已选择 {{ selectedFiles.length }} 项</span>
        <div class="batch-actions">
          <button class="btn-sm btn-secondary" @click="moveSelectedFiles">
            <v-icon size="14">mdi-folder-move</v-icon>
            移动
          </button>
          <button class="btn-sm btn-secondary" @click="copySelectedLinks">
            <v-icon size="14">mdi-link</v-icon>
            复制链接
          </button>
          <button class="btn-sm btn-danger" @click="confirmBatchDelete">
            <v-icon size="14">mdi-delete</v-icon>
            删除
          </button>
          <button class="btn-sm btn-ghost" @click="selectedFiles = []">
            取消
          </button>
        </div>
      </div>
    </transition>

    <!-- 网格视图 -->
    <div v-if="viewMode === 'grid'" class="file-grid">
      <div v-if="loading" v-for="n in 8" :key="n" class="file-card-skeleton">
        <div class="skeleton-image"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>
      
      <!-- 目录 -->
      <div
        v-for="dir in visibleDirectories"
        :key="dir"
        class="file-card directory-card"
        @click="navigateToDir(dir)"
      >
        <div class="file-preview">
          <div class="file-icon-large">
            <v-icon size="48" color="warning">mdi-folder</v-icon>
          </div>
          <div class="file-overlay">
            <button class="overlay-btn" @click.stop="renameFolder(dir)" title="重命名">
              <v-icon size="18">mdi-pencil</v-icon>
              <span class="overlay-btn-label">重命名</span>
            </button>
            <button class="overlay-btn overlay-btn-danger" @click.stop="confirmDeleteFolder(dir)" title="删除">
              <v-icon size="18">mdi-delete</v-icon>
              <span class="overlay-btn-label">删除</span>
            </button>
          </div>
        </div>
        <div class="file-info">
          <div class="file-name">{{ getDirName(dir) }}</div>
          <div class="file-meta">
            <span class="file-channel">文件夹</span>
          </div>
        </div>
      </div>
      
      <!-- 文件 -->
      <div
        v-for="file in visibleFiles"
        :key="file.name"
        class="file-card"
        :class="{ 'file-card--selected': isSelected(file) }"
        @click="toggleSelect(file)"
      >
        <div class="file-preview">
          <img
            v-if="isImage(file)"
            :src="getFileUrl(file)"
            :alt="getFileName(file)"
            class="file-image"
            loading="lazy"
          />
          <div v-else class="file-icon-large">
            <v-icon size="32" :color="getFileTypeColor(file)">
              {{ getFileTypeIcon(file) }}
            </v-icon>
          </div>
          
          <!-- 悬停操作 -->
          <div class="file-overlay">
            <button class="overlay-btn" @click.stop="showLink(file)" title="复制链接">
              <v-icon size="18">mdi-link</v-icon>
              <span class="overlay-btn-label">链接</span>
            </button>
            <button class="overlay-btn" @click.stop="previewFile(file)" title="预览">
              <v-icon size="18">mdi-eye</v-icon>
              <span class="overlay-btn-label">预览</span>
            </button>
            <button class="overlay-btn" @click.stop="renameFile(file)" title="重命名">
              <v-icon size="18">mdi-pencil</v-icon>
              <span class="overlay-btn-label">重命名</span>
            </button>
            <button class="overlay-btn" @click.stop="moveFile(file)" title="移动">
              <v-icon size="18">mdi-folder-move</v-icon>
              <span class="overlay-btn-label">移动</span>
            </button>
            <button class="overlay-btn overlay-btn-danger" @click.stop="confirmDelete(file)" title="删除">
              <v-icon size="18">mdi-delete</v-icon>
              <span class="overlay-btn-label">删除</span>
            </button>
          </div>
          
          <!-- 选中状态 -->
          <div v-if="isSelected(file)" class="file-check">
            <v-icon size="16">mdi-check</v-icon>
          </div>
        </div>
        
        <div class="file-info">
          <div class="file-name">{{ getFileName(file) }}</div>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(getFileSize(file)) }}</span>
            <span class="file-dot">·</span>
            <span class="file-channel">{{ file.metadata?.Channel || '-' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-else class="file-list">
      <div class="list-header">
        <div class="list-col list-col-check">
          <input
            type="checkbox"
            :checked="allSelected"
            @change="toggleSelectAll"
            class="checkbox"
          />
        </div>
        <div class="list-col list-col-name">文件名</div>
        <div class="list-col list-col-size">大小</div>
        <div class="list-col list-col-channel">渠道</div>
        <div class="list-col list-col-time">时间</div>
        <div class="list-col list-col-actions">操作</div>
      </div>
      
      <div v-if="loading" class="list-loading">
        <div class="spinner"></div>
      </div>
      
      <!-- 目录 -->
      <div
        v-for="dir in visibleDirectories"
        :key="dir"
        class="list-item directory-item"
        @click="navigateToDir(dir)"
      >
        <div class="list-col list-col-check"></div>
        <div class="list-col list-col-name">
          <v-icon size="16" color="warning" class="mr-2">mdi-folder</v-icon>
          <span>{{ getDirName(dir) }}</span>
        </div>
        <div class="list-col list-col-size">-</div>
        <div class="list-col list-col-channel">文件夹</div>
        <div class="list-col list-col-time">-</div>
        <div class="list-col list-col-actions" @click.stop>
          <button class="btn-icon btn-icon-sm" title="重命名" @click="renameFolder(dir)">
            <v-icon size="14">mdi-pencil</v-icon>
          </button>
          <button class="btn-icon btn-icon-sm btn-icon-danger" title="删除" @click="confirmDeleteFolder(dir)">
            <v-icon size="14">mdi-delete</v-icon>
          </button>
        </div>
      </div>
      
      <!-- 文件 -->
      <div
        v-for="file in visibleFiles"
        :key="file.name"
        class="list-item"
        :class="{ 'list-item--selected': isSelected(file) }"
        @click="toggleSelect(file)"
      >
        <div class="list-col list-col-check" @click.stop>
          <input
            type="checkbox"
            :checked="isSelected(file)"
            @change="toggleSelect(file)"
            class="checkbox"
          />
        </div>
        <div class="list-col list-col-name">
          <v-icon size="16" :color="getFileTypeColor(file)" class="mr-2">
            {{ getFileTypeIcon(file) }}
          </v-icon>
          <span class="text-truncate">{{ getFileName(file) }}</span>
        </div>
        <div class="list-col list-col-size">{{ formatFileSize(getFileSize(file)) }}</div>
        <div class="list-col list-col-channel">
          <span class="channel-badge">{{ file.metadata?.Channel || '-' }}</span>
        </div>
        <div class="list-col list-col-time">{{ formatTime(file.metadata?.TimeStamp) }}</div>
        <div class="list-col list-col-actions" @click.stop>
          <button class="btn-icon btn-icon-sm" title="复制链接" @click="showLink(file)">
            <v-icon size="14">mdi-link</v-icon>
          </button>
          <button class="btn-icon btn-icon-sm" title="重命名" @click="renameFile(file)">
            <v-icon size="14">mdi-pencil</v-icon>
          </button>
          <button class="btn-icon btn-icon-sm" title="移动" @click="moveFile(file)">
            <v-icon size="14">mdi-folder-move</v-icon>
          </button>
          <button class="btn-icon btn-icon-sm btn-icon-danger" title="删除" @click="confirmDelete(file)">
            <v-icon size="14">mdi-delete</v-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="visibleFiles.length === 0 && visibleDirectories.length === 0 && !loading" class="empty-state">
      <div class="empty-icon">
        <v-icon size="48">{{ searchQuery ? 'mdi-magnify' : 'mdi-folder-open' }}</v-icon>
      </div>
      <h3 class="empty-title">{{ searchQuery ? '未找到匹配文件' : '暂无文件' }}</h3>
      <p class="empty-text">{{ searchQuery ? `没有找到包含 "${searchQuery}" 的文件` : '上传一些文件开始使用吧' }}</p>
      <button v-if="searchQuery" class="btn-secondary" @click="clearSearch">
        <v-icon size="16">mdi-close</v-icon>
        清空搜索
      </button>
      <button v-else class="btn-primary" @click="$router.push('/')">
        <v-icon size="16">mdi-cloud-upload</v-icon>
        去上传
      </button>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && !loading" class="load-more">
      <button class="btn-secondary" @click="loadMore">
        加载更多
      </button>
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

    <!-- 重命名弹窗 -->
    <div v-if="showRenameDialog" class="dialog-overlay" @click="showRenameDialog = false">
      <div class="dialog dialog-sm" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">重命名</h3>
          <button class="btn-icon btn-icon-ghost" @click="showRenameDialog = false">
            <v-icon size="20">mdi-close</v-icon>
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label class="form-label">新名称</label>
            <input
              v-model="newName"
              type="text"
              class="form-input"
              placeholder="输入新名称"
              @keyup.enter="confirmRename"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-ghost" @click="showRenameDialog = false">取消</button>
          <button class="btn-primary" @click="confirmRename" :disabled="!newName">确定</button>
        </div>
      </div>
    </div>

    <!-- 移动弹窗 -->
    <div v-if="showMoveDialog" class="dialog-overlay" @click="showMoveDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">移动到</h3>
          <button class="btn-icon btn-icon-ghost" @click="showMoveDialog = false">
            <v-icon size="20">mdi-close</v-icon>
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label class="form-label">目标目录</label>
            <input
              v-model="targetFolder"
              type="text"
              class="form-input"
              placeholder="输入目标目录，留空表示根目录"
            />
          </div>
          <div class="folder-tree">
            <div class="folder-item" @click="targetFolder = ''">
              <v-icon size="16">mdi-folder</v-icon>
              <span>根目录</span>
            </div>
            <div
              v-for="dir in allDirectories"
              :key="dir"
              class="folder-item"
              @click="targetFolder = dir"
            >
              <v-icon size="16">mdi-folder</v-icon>
              <span>{{ dir }}</span>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-ghost" @click="showMoveDialog = false">取消</button>
          <button class="btn-primary" @click="confirmMove">移动</button>
        </div>
      </div>
    </div>

    <!-- 新建文件夹弹窗 -->
    <div v-if="showNewFolderDialog" class="dialog-overlay" @click="showNewFolderDialog = false">
      <div class="dialog dialog-sm" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">新建文件夹</h3>
          <button class="btn-icon btn-icon-ghost" @click="showNewFolderDialog = false">
            <v-icon size="20">mdi-close</v-icon>
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label class="form-label">文件夹名称</label>
            <input
              v-model="newFolderName"
              type="text"
              class="form-input"
              placeholder="输入文件夹名称"
              @keyup.enter="createFolder"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-ghost" @click="showNewFolderDialog = false">取消</button>
          <button class="btn-primary" @click="createFolder" :disabled="!newFolderName">创建</button>
        </div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <div v-if="showConfirm" class="dialog-overlay" @click="showConfirm = false">
      <div class="dialog dialog-sm" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">{{ confirmTitle }}</h3>
        </div>
        <div class="dialog-content">
          <p class="confirm-text">{{ confirmMessage }}</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-ghost" @click="showConfirm = false">取消</button>
          <button class="btn-danger" @click="handleConfirm">确定</button>
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
import { ref, computed, onMounted, watch } from 'vue'
import { formatTime, formatFileSize, getFileType, getFileIcon, getFileColor, copyToClipboard, debounce } from '@/utils/helpers'
import api from '@/utils/api'

const FILES_PREFERENCES_KEY = 'picbase:files:preferences'
const savedPreferences = loadPreferences()

const viewMode = ref(savedPreferences.viewMode || 'grid')
const loading = ref(false)
const files = ref([])
const directories = ref([])
const allDirectories = ref([])
const optimisticDirectories = ref(new Set())
const currentDir = ref('')
const selectedFiles = ref([])
const searchQuery = ref('')
const filterChannel = ref('')
const filterType = ref(savedPreferences.filterType || '')
const sortBy = ref(savedPreferences.sortBy || 'time-desc')
const page = ref(0)
const pageSize = ref(50)
const hasMore = ref(true)

// 链接弹窗
const showLinkDialog = ref(false)
const linkFile = ref(null)
const copiedLabel = ref('')

// 重命名弹窗
const showRenameDialog = ref(false)
const renameTarget = ref(null)
const newName = ref('')

// 移动弹窗
const showMoveDialog = ref(false)
const moveTarget = ref(null)
const targetFolder = ref('')

// 新建文件夹弹窗
const showNewFolderDialog = ref(false)
const newFolderName = ref('')

// 确认弹窗
const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref(null)
const deleteTarget = ref(null)

const toast = ref({ show: false, message: '', type: 'success', icon: 'mdi-check' })

const fileTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'audio', label: '音频' },
  { value: 'document', label: '文档' },
  { value: 'archive', label: '压缩包' },
  { value: 'other', label: '其他' }
]

const channelOptions = computed(() => {
  const channels = new Set()
  files.value.forEach(f => {
    if (f.metadata?.Channel) channels.add(f.metadata.Channel)
  })
  return Array.from(channels).sort((a, b) => a.localeCompare(b, 'zh-CN'))
})

const allSelected = computed(() => {
  const visibleNames = new Set(visibleFiles.value.map(file => file.name))
  return visibleFiles.value.length > 0 && visibleFiles.value.every(file => isSelected(file)) && selectedFiles.value.some(file => visibleNames.has(file.name))
})

const visibleFiles = computed(() => {
  const filtered = files.value.filter(file => !filterType.value || getFileTypeForFile(file) === filterType.value)
  return [...filtered].sort(compareFiles)
})

const visibleDirectories = computed(() => {
  return [...directories.value].sort((a, b) => getDirName(a).localeCompare(getDirName(b), 'zh-CN'))
})

const linkFormats = computed(() => {
  const file = linkFile.value
  if (!file) return []
  
  const url = window.location.origin + '/file/' + encodeURIComponent(file.name)
  const name = getFileName(file)
  return [
    { label: '直链', value: url },
    { label: 'Markdown', value: `![${name}](${url})` },
    { label: 'HTML', value: `<img src="${url}" alt="${name}" />` },
    { label: 'BBCode', value: `[img]${url}[/img]` }
  ]
})

onMounted(() => {
  fetchFiles()
})

watch([viewMode, filterType, sortBy], savePreferences)

watch(filterChannel, () => {
  page.value = 0
  files.value = []
  fetchFiles()
})

watch(filterType, () => {
  selectedFiles.value = []
})

function clearSearch() {
  searchQuery.value = ''
  page.value = 0
  files.value = []
  fetchFiles()
}

const debouncedSearch = debounce(() => {
  page.value = 0
  files.value = []
  fetchFiles()
}, 300)

function loadPreferences() {
  if (typeof localStorage === 'undefined') return {}

  try {
    return JSON.parse(localStorage.getItem(FILES_PREFERENCES_KEY) || '{}')
  } catch {
    return {}
  }
}

function savePreferences() {
  if (typeof localStorage === 'undefined') return

  localStorage.setItem(FILES_PREFERENCES_KEY, JSON.stringify({
    viewMode: viewMode.value,
    filterType: filterType.value,
    sortBy: sortBy.value
  }))
}

async function fetchFiles({ silent = false } = {}) {
  if (!silent) loading.value = true
  try {
    const parentDir = getCurrentParent()
    const params = {
      start: page.value * pageSize.value,
      count: pageSize.value,
      _t: Date.now() // 添加时间戳防止缓存
    }
    if (parentDir) params.dir = parentDir
    if (searchQuery.value) params.search = searchQuery.value
    if (filterChannel.value) params.channel = filterChannel.value
    
    // 同时获取文件列表和虚拟文件夹
    const [data, folderData] = await Promise.all([
      api.get('/api/manage/list?' + new URLSearchParams(params)),
      api.get('/api/manage/folders?parent=' + encodeURIComponent(parentDir))
    ])
    
    // 过滤掉占位文件
    const filteredFiles = (data.files || []).filter(f => {
      const name = f.name || ''
      return !name.endsWith('.picbase_folder') && !name.endsWith('/.picbase_folder')
    })
    
    // 合并虚拟文件夹和基于路径的文件夹
    const virtualFolders = (folderData.folders || []).map(f => f.path)
    const pathFolders = data.directories || []
    const allFolders = mergeDirectoryLists(
      virtualFolders,
      pathFolders,
      getVisibleOptimisticDirectories(parentDir)
    )
    
    if (page.value === 0) {
      files.value = filteredFiles
      directories.value = allFolders
    } else {
      files.value.push(...filteredFiles)
    }
    
    hasMore.value = (data.files || []).length === pageSize.value
    
  } catch (err) {
    if (!silent) showToast('加载失败', 'error')
  } finally {
    if (!silent) loading.value = false
  }
}

async function fetchAllDirectories() {
  try {
    const [data, folderData] = await Promise.all([
      api.get('/api/manage/list?count=-1&dir=&recursive=true'),
      api.get('/api/manage/folders?parent=&recursive=true')
    ])
    const virtualFolders = (folderData.folders || []).map(folder => folder.path)
    allDirectories.value = mergeDirectoryLists(
      data.directories || [],
      virtualFolders,
      Array.from(optimisticDirectories.value)
    )
  } catch (err) {
    console.error('Failed to fetch directories:', err)
  }
}

function navigateToDir(dir) {
  currentDir.value = normalizeDirPath(dir)
  page.value = 0
  files.value = []
  directories.value = []
  selectedFiles.value = []
  fetchFiles()
}

function getDirName(dir) {
  const parts = dir.split('/').filter(Boolean)
  return parts[parts.length - 1] || dir
}

function normalizeDirPath(dir) {
  return (dir || '').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')
}

function getCurrentParent() {
  return normalizeDirPath(currentDir.value)
}

function getDirectoryParent(dir) {
  const normalized = normalizeDirPath(dir)
  const parts = normalized.split('/').filter(Boolean)
  parts.pop()
  return parts.join('/')
}

function mergeDirectoryLists(...lists) {
  const merged = lists
    .flat()
    .map(normalizeDirPath)
    .filter(Boolean)
  return [...new Set(merged)].sort((a, b) => getDirName(a).localeCompare(getDirName(b), 'zh-CN'))
}

function getVisibleOptimisticDirectories(parent = getCurrentParent()) {
  return Array.from(optimisticDirectories.value)
    .map(normalizeDirPath)
    .filter(dir => getDirectoryParent(dir) === parent)
}

function rememberOptimisticDirectory(dir) {
  const normalized = normalizeDirPath(dir)
  if (!normalized) return
  optimisticDirectories.value = new Set([...optimisticDirectories.value, normalized])
  directories.value = mergeDirectoryLists(directories.value, getVisibleOptimisticDirectories())
  allDirectories.value = mergeDirectoryLists(allDirectories.value, [normalized])
}

function forgetOptimisticDirectory(dir) {
  const normalized = normalizeDirPath(dir)
  const next = new Set(optimisticDirectories.value)
  next.delete(normalized)
  optimisticDirectories.value = next
  directories.value = directories.value.filter(item => normalizeDirPath(item) !== normalized)
  allDirectories.value = allDirectories.value.filter(item => normalizeDirPath(item) !== normalized)
}

function sanitizeFolderName(name) {
  return (name || '').replace(/[\/\\:*?"<>|]/g, '_').trim()
}

function loadMore() {
  page.value++
  fetchFiles()
}

function getFileTypeForFile(file) {
  return getFileType(file.metadata?.FileType, file.name)
}

function getFileTimestamp(file) {
  return Number(file.metadata?.TimeStamp) || 0
}

function getFileSize(file) {
  const sizeStr = file.metadata?.FileSize
  if (!sizeStr) return 0
  const num = parseFloat(sizeStr)
  return num < 1000 ? num * 1024 * 1024 : num
}

function compareFiles(a, b) {
  if (sortBy.value === 'name-asc') {
    return getFileName(a).localeCompare(getFileName(b), 'zh-CN')
  }

  if (sortBy.value === 'name-desc') {
    return getFileName(b).localeCompare(getFileName(a), 'zh-CN')
  }

  if (sortBy.value === 'size-asc') {
    return getFileSize(a) - getFileSize(b)
  }

  if (sortBy.value === 'size-desc') {
    return getFileSize(b) - getFileSize(a)
  }

  if (sortBy.value === 'time-asc') {
    return getFileTimestamp(a) - getFileTimestamp(b)
  }

  return getFileTimestamp(b) - getFileTimestamp(a)
}

function isImage(file) {
  return getFileTypeForFile(file) === 'image'
}

function getFileUrl(file) {
  return `/file/${encodeURIComponent(file.name)}`
}

function getFileName(file) {
  const name = file.name || ''
  const parts = name.split('/')
  return parts[parts.length - 1] || name
}

function getFileTypeIcon(file) {
  const type = getFileTypeForFile(file)
  return getFileIcon(type)
}

function getFileTypeColor(file) {
  const type = getFileTypeForFile(file)
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
    const visibleNames = new Set(visibleFiles.value.map(file => file.name))
    selectedFiles.value = selectedFiles.value.filter(file => !visibleNames.has(file.name))
  } else {
    const selectedNames = new Set(selectedFiles.value.map(file => file.name))
    selectedFiles.value = [
      ...selectedFiles.value,
      ...visibleFiles.value.filter(file => !selectedNames.has(file.name))
    ]
  }
}

// 链接相关
function showLink(file) {
  linkFile.value = file
  copiedLabel.value = ''
  showLinkDialog.value = true
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

async function copySelectedLinks() {
  const links = selectedFiles.value.map(f => {
    return window.location.origin + '/file/' + encodeURIComponent(f.name)
  }).join('\n')
  const success = await copyToClipboard(links)
  if (success) {
    showToast(`已复制 ${selectedFiles.value.length} 个链接`, 'success')
  }
}

// 预览
function previewFile(file) {
  if (isImage(file)) {
    window.open(`/file/${encodeURIComponent(file.name)}`, '_blank')
  }
}

// 重命名
function renameFile(file) {
  renameTarget.value = { type: 'file', file }
  newName.value = getFileName(file)
  showRenameDialog.value = true
}

function renameFolder(dir) {
  renameTarget.value = { type: 'folder', dir }
  newName.value = getDirName(dir)
  showRenameDialog.value = true
}

async function confirmRename() {
  if (!newName.value || !renameTarget.value) return
  
  try {
    if (renameTarget.value.type === 'file') {
      const file = renameTarget.value.file
      const oldName = file.name
      const dir = oldName.includes('/') ? oldName.substring(0, oldName.lastIndexOf('/') + 1) : ''
      const newNameFull = dir + newName.value
      const previousFiles = [...files.value]
      const previousSelected = [...selectedFiles.value]

      files.value = files.value.map(item => item.name === oldName ? { ...item, name: newNameFull } : item)
      selectedFiles.value = selectedFiles.value.map(item => item.name === oldName ? { ...item, name: newNameFull } : item)
      showRenameDialog.value = false

      // 后端使用 POST 方法
      try {
        await api.post('/api/manage/rename/' + encodeURIComponent(oldName), {
          newName: newNameFull
        })

        showToast('重命名成功', 'success')
        fetchFiles({ silent: true })
      } catch (err) {
        files.value = previousFiles
        selectedFiles.value = previousSelected
        showToast('重命名失败: ' + (err.message || ''), 'error')
      }
    } else {
      // 文件夹重命名需要特殊处理
      showToast('文件夹重命名暂不支持', 'warning')
      showRenameDialog.value = false
    }
  } catch (err) {
    showToast('重命名失败: ' + (err.message || ''), 'error')
  }
}

// 移动
function moveFile(file) {
  moveTarget.value = { type: 'file', files: [file] }
  targetFolder.value = ''
  showMoveDialog.value = true
  fetchAllDirectories()
}

function moveSelectedFiles() {
  if (selectedFiles.value.length === 0) return
  moveTarget.value = { type: 'file', files: [...selectedFiles.value] }
  targetFolder.value = ''
  showMoveDialog.value = true
  fetchAllDirectories()
}

async function confirmMove() {
  const targets = moveTarget.value?.files || []
  if (targets.length === 0) return

  const previousFiles = [...files.value]
  const targetDir = normalizeDirPath(targetFolder.value)
  const currentParent = getCurrentParent()
  const movedNames = new Set(targets.map(file => file.name))
  showMoveDialog.value = false
  selectedFiles.value = []

  if (targetDir !== currentParent) {
    files.value = files.value.filter(file => !movedNames.has(file.name))
  }

  try {
    await Promise.all(targets.map(file => {
      const oldName = file.name
      return api.post('/api/manage/move/' + encodeURIComponent(oldName) + '?dist=' + encodeURIComponent(targetDir))
    }))
    
    showToast(`移动成功 ${targets.length} 个文件`, 'success')
    fetchFiles({ silent: true })
  } catch (err) {
    files.value = previousFiles
    showToast('移动失败: ' + (err.message || ''), 'error')
  }
}

// 新建文件夹
async function createFolder() {
  if (!newFolderName.value) return

  const folderName = sanitizeFolderName(newFolderName.value)
  if (!folderName) {
    showToast('文件夹名称无效', 'warning')
    return
  }

  const parent = getCurrentParent()
  const optimisticPath = parent ? `${parent}/${folderName}` : folderName
  rememberOptimisticDirectory(optimisticPath)
  showNewFolderDialog.value = false
  newFolderName.value = ''

  try {
    // 使用文件夹 API 创建虚拟文件夹
    const result = await api.post('/api/manage/folders', {
      name: folderName,
      parent
    })

    const serverPath = normalizeDirPath(result.folder?.path || optimisticPath)
    if (serverPath !== optimisticPath) {
      forgetOptimisticDirectory(optimisticPath)
      rememberOptimisticDirectory(serverPath)
    }
    
    showToast('文件夹创建成功', 'success')
    fetchFiles({ silent: true })
  } catch (err) {
    forgetOptimisticDirectory(optimisticPath)
    showToast('创建文件夹失败: ' + (err.message || ''), 'error')
  }
}

// 删除
function confirmDelete(file) {
  deleteTarget.value = { type: 'file', file }
  confirmTitle.value = '删除文件'
  confirmMessage.value = `确定要删除 "${getFileName(file)}" 吗？此操作不可恢复。`
  confirmAction.value = 'delete'
  showConfirm.value = true
}

function confirmDeleteFolder(dir) {
  deleteTarget.value = { type: 'folder', dir }
  confirmTitle.value = '删除文件夹'
  confirmMessage.value = `确定要删除文件夹 "${getDirName(dir)}" 及其所有内容吗？此操作不可恢复。`
  confirmAction.value = 'deleteFolder'
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
  
  if (confirmAction.value === 'delete' && deleteTarget.value?.file) {
    await deleteFile(deleteTarget.value.file)
  } else if (confirmAction.value === 'deleteFolder' && deleteTarget.value?.dir) {
    await deleteFolder(deleteTarget.value.dir)
  } else if (confirmAction.value === 'batchDelete') {
    await batchDelete()
  }
}

async function deleteFile(file) {
  try {
    // 立即从列表中移除（乐观更新）
    const fileName = file.name
    files.value = files.value.filter(f => f.name !== fileName)
    selectedFiles.value = selectedFiles.value.filter(f => f.name !== fileName)
    
    // 然后调用 API
    await api.del('/api/manage/delete/' + encodeURIComponent(fileName))
    showToast('删除成功', 'success')
  } catch (err) {
    // 如果失败，需要回滚（重新加载）
    showToast('删除失败', 'error')
    fetchFiles()
  }
}

async function deleteFolder(dir) {
  const previousDirectories = [...directories.value]
  const previousFiles = [...files.value]
  const normalizedDir = normalizeDirPath(dir)
  const dirName = normalizedDir ? normalizedDir + '/' : ''
  directories.value = directories.value.filter(d => normalizeDirPath(d) !== normalizedDir)
  files.value = files.value.filter(f => !f.name.startsWith(dirName))
  forgetOptimisticDirectory(normalizedDir)

  try {
    // 删除文件夹里的所有文件
    const timestamp = Date.now()
    const data = await api.get('/api/manage/list?count=-1&dir=' + encodeURIComponent(normalizedDir) + '&_t=' + timestamp)
    const filesToDelete = data.files || []
    
    for (const file of filesToDelete) {
      await api.del('/api/manage/delete/' + encodeURIComponent(file.name))
    }
    
    // 删除虚拟文件夹
    await api.del('/api/manage/folders?path=' + encodeURIComponent(normalizedDir))
    
    showToast('文件夹删除成功', 'success')
  } catch (err) {
    directories.value = previousDirectories
    files.value = previousFiles
    showToast('删除文件夹失败', 'error')
  }
}

async function batchDelete() {
  const targets = [...selectedFiles.value]
  const previousFiles = [...files.value]
  const deletedNames = new Set(targets.map(f => f.name))
  files.value = files.value.filter(f => !deletedNames.has(f.name))
  selectedFiles.value = []

  const results = await Promise.allSettled(
    targets.map(file => api.del('/api/manage/delete/' + encodeURIComponent(file.name)))
  )
  const successCount = results.filter(result => result.status === 'fulfilled').length
  const failedCount = results.length - successCount

  if (failedCount > 0) {
    files.value = previousFiles
    showToast(`删除失败 ${failedCount} 个文件`, 'error')
    fetchFiles({ silent: true })
    return
  }

  showToast(`成功删除 ${successCount} 个文件`, 'success')
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

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
  min-width: 200px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.search-box {
  position: relative;
  max-width: 320px;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all var(--transition-fast);
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.toolbar-select {
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  cursor: pointer;
  max-width: 160px;
}

.toolbar-select-sm {
  max-width: 120px;
}

.toolbar-select-md {
  max-width: 150px;
}

.view-toggle {
  display: flex;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-btn:hover {
  color: var(--text-primary);
}

.toggle-btn.active {
  background: var(--accent-light);
  color: var(--accent);
}

/* 面包屑导航 */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) 0;
  margin-bottom: var(--space-lg);
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.breadcrumb-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.breadcrumb-separator {
  color: var(--text-tertiary);
  font-size: 12px;
}

/* 批量操作 */
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--accent-light);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
}

.batch-info {
  font-size: 14px;
  font-weight: 500;
  color: var(--accent);
}

.batch-actions {
  display: flex;
  gap: var(--space-sm);
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

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px 16px;
  background: var(--error);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-danger:hover {
  opacity: 0.9;
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
  width: 36px;
  height: 36px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
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
  border: none;
}

.btn-icon-ghost:hover {
  background: var(--bg-hover);
}

.btn-icon-sm {
  width: 28px;
  height: 28px;
}

.btn-icon-danger {
  color: var(--error);
}

.btn-icon-danger:hover {
  background: var(--error-light);
}

/* 网格视图 */
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-md);
}

.file-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.file-card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
}

.file-card--selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.file-preview {
  position: relative;
  aspect-ratio: 1;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.file-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon-large {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.file-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  align-items: center;
  justify-items: center;
  justify-content: center;
  align-content: center;
  grid-template-columns: repeat(2, 72px);
  gap: var(--space-sm);
  padding: var(--space-md);
  background: rgba(0, 0, 0, 0.68);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.file-card:hover .file-overlay {
  opacity: 1;
}

.overlay-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 72px;
  height: 32px;
  padding: 0 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.file-overlay .overlay-btn:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}

.overlay-btn:hover {
  background: var(--bg-primary);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.overlay-btn-label {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.overlay-btn-danger {
  background: var(--error);
  border-color: var(--error);
  color: white;
}

.overlay-btn-danger:hover {
  background: var(--error);
  color: white;
  opacity: 0.92;
}

.file-check {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: white;
  border-radius: var(--radius-full);
}

.file-info {
  padding: var(--space-md);
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.file-dot {
  color: var(--border);
}

/* 目录卡片 */
.directory-card {
  cursor: pointer;
  border: 1px dashed var(--border);
}

.directory-card:hover {
  border-color: var(--warning);
  background: var(--warning-light);
}

.directory-item {
  cursor: pointer;
}

.directory-item:hover {
  background: var(--warning-light);
}

/* 列表视图 */
.file-list {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.list-item {
  display: flex;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background: var(--bg-hover);
}

.list-item--selected {
  background: var(--accent-light);
}

.list-col {
  display: flex;
  align-items: center;
}

.list-col-check {
  width: 40px;
  flex-shrink: 0;
}

.list-col-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--text-primary);
}

.list-col-size {
  width: 80px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.list-col-channel {
  width: 100px;
  flex-shrink: 0;
}

.list-col-time {
  width: 100px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.list-col-actions {
  width: 128px;
  flex-shrink: 0;
  display: flex;
  gap: var(--space-xs);
  justify-content: flex-end;
}

.channel-badge {
  display: inline-flex;
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--text-secondary);
}

.checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 50%;
  margin-bottom: var(--space-lg);
  color: var(--text-tertiary);
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.empty-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
}

/* 加载更多 */
.load-more {
  display: flex;
  justify-content: center;
  padding: var(--space-xl);
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
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  animation: fadeInUp 0.2s ease;
}

.dialog-sm {
  max-width: 400px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  z-index: 1;
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-content {
  padding: var(--space-lg);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
  position: sticky;
  bottom: 0;
  background: var(--bg-secondary);
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

/* 表单 */
.form-group {
  margin-bottom: var(--space-lg);
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.form-input {
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

.form-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.form-input::placeholder {
  color: var(--text-tertiary);
}

/* 文件夹树 */
.folder-tree {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-top: var(--space-sm);
}

.folder-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 13px;
  color: var(--text-primary);
}

.folder-item:hover {
  background: var(--bg-hover);
}

.confirm-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
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

/* 骨架屏 */
.file-card-skeleton {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.skeleton-image {
  aspect-ratio: 1;
  background: var(--bg-tertiary);
  animation: pulse 1.5s infinite;
}

.skeleton-text {
  height: 16px;
  margin: 12px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

.skeleton-text.short {
  width: 60%;
  margin-top: 0;
}

/* 加载动画 */
.list-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-xl);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinning {
  animation: spin 1s linear infinite;
}

/* 动画 */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-container {
    padding: var(--space-lg);
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }
  
  .toolbar-right {
    justify-content: flex-start;
  }

  .toolbar-select,
  .toolbar-select-sm,
  .toolbar-select-md {
    flex: 1;
    max-width: none;
    min-width: 0;
  }
  
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .file-overlay {
    grid-template-columns: repeat(2, 40px);
    gap: 6px;
    padding: 8px;
  }

  .overlay-btn {
    width: 40px;
    padding: 0;
  }

  .overlay-btn-label {
    display: none;
  }
  
  .list-col-size,
  .list-col-time {
    display: none;
  }
  
  .list-col-actions {
    width: 80px;
  }
}
</style>
