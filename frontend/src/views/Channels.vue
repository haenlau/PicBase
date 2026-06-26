<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">渠道配置</h1>
      <p class="page-subtitle">配置文件上传的存储渠道</p>
    </div>

    <div class="channels-grid">
      <div v-for="type in channelTypes" :key="type.id" class="channel-card">
        <div class="channel-header">
          <div class="channel-icon" :style="{ background: type.color + '20', color: type.color }">
            <v-icon size="20">{{ type.icon }}</v-icon>
          </div>
          <div class="channel-info">
            <h3 class="channel-name">{{ type.name }}</h3>
            <p class="channel-desc">{{ type.description }}</p>
          </div>
          <span v-if="type.id === 'cfr2'" class="status-badge" :class="hasR2Binding ? 'status-success' : 'status-warning'">
            {{ hasR2Binding ? '已绑定' : '未绑定' }}
          </span>
        </div>

        <div class="channel-body">
          <!-- R2 特殊提示 -->
          <div v-if="type.id === 'cfr2'" class="r2-info">
            <div v-if="!hasR2Binding" class="r2-guide">
              <v-icon size="40" color="warning" class="mb-3">mdi-alert-circle-outline</v-icon>
              <p class="r2-guide-title">请在 Cloudflare Dashboard 中绑定 R2</p>
              <div class="r2-steps">
                <div class="r2-step">
                  <span class="step-num">1</span>
                  <span>进入 Cloudflare Dashboard</span>
                </div>
                <div class="r2-step">
                  <span class="step-num">2</span>
                  <span>选择 Pages 项目</span>
                </div>
                <div class="r2-step">
                  <span class="step-num">3</span>
                  <span>设置 → 函数 → R2 存储桶</span>
                </div>
                <div class="r2-step">
                  <span class="step-num">4</span>
                  <span>添加绑定：<code>img_r2</code></span>
                </div>
              </div>
            </div>
            <div v-else class="r2-bound">
              <v-icon size="40" color="success">mdi-check-circle-outline</v-icon>
              <p class="r2-bound-text">R2 存储桶已绑定</p>
            </div>
          </div>

          <!-- 其他渠道 -->
          <div v-else-if="getChannelsByType(type.id).length === 0" class="channel-empty">
            <v-icon size="32" color="disabled">mdi-cloud-off-outline</v-icon>
            <p>未配置</p>
          </div>
          
          <div v-else class="channel-list">
            <div v-for="ch in getChannelsByType(type.id)" :key="ch.name" class="channel-item">
              <div class="channel-item-status" :class="ch.enabled ? 'active' : ''"></div>
              <span class="channel-item-name">{{ ch.name }}</span>
              <div class="channel-item-actions">
                <button class="btn-icon btn-icon-sm" @click="editChannel(type.id, ch)">
                  <v-icon size="14">mdi-pencil</v-icon>
                </button>
                <button class="btn-icon btn-icon-sm btn-icon-danger" @click="deleteChannel(type.id, ch)">
                  <v-icon size="14">mdi-delete</v-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="type.id !== 'cfr2'" class="channel-footer">
          <button class="btn-secondary btn-sm" @click="addChannel(type.id)">
            <v-icon size="14">mdi-plus</v-icon>
            添加
          </button>
        </div>
      </div>
    </div>

    <!-- 渠道配置弹窗 -->
    <div v-if="showChannelDialog" class="dialog-overlay" @click="showChannelDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">{{ editingChannel ? '编辑' : '添加' }} {{ getChannelTypeName(editingChannelType) }}</h3>
          <button class="btn-icon btn-icon-ghost" @click="showChannelDialog = false">
            <v-icon size="20">mdi-close</v-icon>
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label class="form-label">渠道名称</label>
            <input v-model="channelForm.name" type="text" class="form-input" placeholder="输入渠道名称" />
          </div>

          <!-- Telegram -->
          <template v-if="editingChannelType === 'telegram'">
            <div class="form-group">
              <label class="form-label">Bot Token</label>
              <input v-model="channelForm.botToken" type="text" class="form-input" placeholder="从 @BotFather 获取" />
            </div>
            <div class="form-group">
              <label class="form-label">Chat ID</label>
              <input v-model="channelForm.chatId" type="text" class="form-input" placeholder="频道或群组 ID" />
            </div>
            <div class="form-group">
              <label class="form-label">代理 URL（可选）</label>
              <input v-model="channelForm.proxyUrl" type="text" class="form-input" placeholder="代理地址" />
            </div>
          </template>

          <!-- S3 -->
          <template v-if="editingChannelType === 's3'">
            <div class="form-group">
              <label class="form-label">端点</label>
              <input v-model="channelForm.endpoint" type="text" class="form-input" placeholder="S3 端点地址" />
            </div>
            <div class="form-group">
              <label class="form-label">Access Key ID</label>
              <input v-model="channelForm.accessKeyId" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Secret Access Key</label>
              <input v-model="channelForm.secretAccessKey" type="password" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">存储桶名称</label>
              <input v-model="channelForm.bucketName" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">区域</label>
              <input v-model="channelForm.region" type="text" class="form-input" placeholder="auto" />
            </div>
          </template>

          <!-- Discord -->
          <template v-if="editingChannelType === 'discord'">
            <div class="form-group">
              <label class="form-label">Bot Token</label>
              <input v-model="channelForm.botToken" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">频道 ID</label>
              <input v-model="channelForm.channelId" type="text" class="form-input" />
            </div>
          </template>

          <!-- HuggingFace -->
          <template v-if="editingChannelType === 'huggingface'">
            <div class="form-group">
              <label class="form-label">API Token</label>
              <input v-model="channelForm.token" type="password" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">仓库</label>
              <input v-model="channelForm.repo" type="text" class="form-input" placeholder="username/repo" />
            </div>
          </template>

          <!-- WebDAV -->
          <template v-if="editingChannelType === 'webdav'">
            <div class="form-group">
              <label class="form-label">WebDAV URL</label>
              <input v-model="channelForm.baseUrl" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input v-model="channelForm.username" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">密码</label>
              <input v-model="channelForm.password" type="password" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">公共 URL（可选）</label>
              <input v-model="channelForm.publicUrl" type="text" class="form-input" />
            </div>
          </template>

          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" v-model="channelForm.enabled" />
              <span>启用</span>
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-ghost" @click="showChannelDialog = false">取消</button>
          <button class="btn-primary" @click="saveChannel" :disabled="savingChannel">
            {{ savingChannel ? '保存中...' : (editingChannel ? '保存' : '添加') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <div v-if="showConfirm" class="dialog-overlay" @click="showConfirm = false">
      <div class="dialog dialog-sm" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">删除渠道</h3>
        </div>
        <div class="dialog-content">
          <p class="confirm-text">确定要删除 "{{ deleteTarget?.name }}" 吗？</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-ghost" @click="showConfirm = false">取消</button>
          <button class="btn-danger" @click="doDeleteChannel">确定</button>
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
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api'

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

const showConfirm = ref(false)
const deleteTarget = ref(null)
const deleteType = ref('')

const toast = ref({ show: false, message: '', type: 'success', icon: 'mdi-check' })

const channelTypes = [
  { id: 'telegram', name: 'Telegram', icon: 'mdi-telegram', color: '#0088cc', description: '上传到 Telegram 频道' },
  { id: 'cfr2', name: 'Cloudflare R2', icon: 'mdi-cloud', color: '#F38020', description: 'Cloudflare R2 存储' },
  { id: 's3', name: 'S3 兼容', icon: 'mdi-aws', color: '#FF9900', description: 'AWS S3 或兼容服务' },
  { id: 'discord', name: 'Discord', icon: 'mdi-discord', color: '#5865F2', description: '上传到 Discord 频道' },
  { id: 'huggingface', name: 'HuggingFace', icon: 'mdi-face-man', color: '#FFD21E', description: 'HuggingFace 仓库' },
  { id: 'webdav', name: 'WebDAV', icon: 'mdi-folder-network', color: '#4CAF50', description: 'WebDAV 服务' }
]

const hasR2Binding = computed(() => {
  const r2Channels = uploadConfig.value.cfr2?.channels || []
  return r2Channels.some(ch => ch.savePath === 'environment variable' || ch.name === 'R2_env')
})

onMounted(() => {
  fetchUploadConfig()
})

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
  if (!channelForm.value.name) {
    showToast('请输入渠道名称', 'error')
    return
  }

  savingChannel.value = true
  try {
    const type = editingChannelType.value
    const channels = uploadConfig.value[type]?.channels || []
    
    if (editingChannel.value) {
      const index = channels.findIndex(c => c.name === editingChannel.value.name)
      if (index >= 0) {
        channels[index] = { ...channelForm.value }
      }
    } else {
      channels.push({ ...channelForm.value })
    }
    
    uploadConfig.value[type].channels = channels
    await api.post('/api/manage/sysConfig/upload', uploadConfig.value)
    
    showChannelDialog.value = false
    showToast(editingChannel.value ? '保存成功' : '添加成功', 'success')
  } catch (err) {
    showToast('保存失败', 'error')
  } finally {
    savingChannel.value = false
  }
}

function deleteChannel(type, channel) {
  deleteTarget.value = channel
  deleteType.value = type
  showConfirm.value = true
}

async function doDeleteChannel() {
  showConfirm.value = false
  try {
    const channels = uploadConfig.value[deleteType.value]?.channels || []
    const index = channels.findIndex(c => c.name === deleteTarget.value.name)
    if (index >= 0) {
      channels.splice(index, 1)
      await api.post('/api/manage/sysConfig/upload', uploadConfig.value)
      showToast('删除成功', 'success')
    }
  } catch (err) {
    showToast('删除失败', 'error')
  }
}

function showToast(message, type = 'success') {
  const icons = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle'
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

/* 渠道网格 */
.channels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-lg);
}

.channel-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.channel-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.channel-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.channel-info {
  flex: 1;
}

.channel-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.channel-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
}

.status-success {
  background: var(--success-light);
  color: var(--success);
}

.status-warning {
  background: var(--warning-light);
  color: var(--warning);
}

.channel-body {
  padding: var(--space-lg);
  min-height: 120px;
}

/* R2 信息 */
.r2-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.r2-guide-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.r2-steps {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.r2-step {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
}

.step-num {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: white;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.r2-bound {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.r2-bound-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--success);
}

/* 渠道列表 */
.channel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  color: var(--text-tertiary);
  font-size: 14px;
}

.channel-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.channel-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.channel-item-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);
  flex-shrink: 0;
}

.channel-item-status.active {
  background: var(--success);
}

.channel-item-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
}

.channel-item-actions {
  display: flex;
  gap: var(--space-xs);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.channel-item:hover .channel-item-actions {
  opacity: 1;
}

.channel-footer {
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
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
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--bg-hover);
}

.btn-icon-ghost {
  background: transparent;
  border: none;
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

.form-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
}

.form-checkbox input {
  accent-color: var(--accent);
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

/* 动画 */
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
@media (max-width: 768px) {
  .page-container {
    padding: var(--space-lg);
  }
  
  .channels-grid {
    grid-template-columns: 1fr;
  }
}
</style>
