<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">安全设置</h1>
      <p class="page-subtitle">配置管理员账号、API Token 和安全选项</p>
    </div>

    <div class="settings-grid">
      <!-- 管理员设置 -->
      <div class="settings-card">
        <div class="card-header">
          <v-icon size="20" class="card-icon">mdi-shield-account</v-icon>
          <h3 class="card-title">管理员设置</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input
              v-model="securitySettings.username"
              type="text"
              class="form-input"
              placeholder="留空表示无用户名"
            />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <div class="password-input">
              <input
                v-model="securitySettings.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="留空表示不修改"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <v-icon size="18">{{ showPassword ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
              </button>
            </div>
            <div v-if="securitySettings.password" class="password-strength">
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :class="passwordStrength.class"
                  :style="{ width: passwordStrength.percent + '%' }"
                ></div>
              </div>
              <span class="strength-text" :class="passwordStrength.class">
                {{ passwordStrength.text }}
              </span>
            </div>
          </div>
          <button class="btn-primary" @click="saveSecurity" :disabled="saving">
            <v-icon v-if="saving" size="16" class="spinning">mdi-loading</v-icon>
            <v-icon v-else size="16">mdi-content-save</v-icon>
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>

      <!-- API Token -->
      <div class="settings-card">
        <div class="card-header">
          <v-icon size="20" class="card-icon">mdi-key-variant</v-icon>
          <h3 class="card-title">API Token 管理</h3>
        </div>
        <div class="card-body">
          <div class="token-form">
            <div class="form-group">
              <label class="form-label">Token 名称</label>
              <input
                v-model="tokenForm.name"
                type="text"
                class="form-input"
                placeholder="例如 upload-client"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Owner</label>
              <input
                v-model="tokenForm.owner"
                type="text"
                class="form-input"
                placeholder="例如 admin"
              />
            </div>

            <div class="form-group">
              <label class="form-label">权限</label>
              <div class="permission-grid">
                <label
                  v-for="permission in permissionOptions"
                  :key="permission.key"
                  class="permission-item"
                >
                  <input
                    v-model="selectedPermissions"
                    type="checkbox"
                    :value="permission.key"
                  />
                  <span class="permission-copy">
                    <span class="permission-title">{{ permission.label }}</span>
                    <span class="permission-desc">{{ permission.description }}</span>
                  </span>
                </label>
              </div>
            </div>

            <button class="btn-primary" type="button" @click="createToken" :disabled="creatingToken">
              <v-icon v-if="creatingToken" size="16" class="spinning">mdi-loading</v-icon>
              <v-icon v-else size="16">mdi-plus</v-icon>
              {{ creatingToken ? '创建中...' : '创建 Token' }}
            </button>
          </div>

          <div v-if="createdToken" class="token-result-box">
            <div class="token-result-head">
              <div>
                <p class="token-result-title">Token 已创建</p>
                <p class="token-result-desc">只会显示一次，请立即复制保存。</p>
              </div>
              <button class="btn-ghost btn-sm" type="button" @click="createdToken = null">
                关闭
              </button>
            </div>

            <div class="token-secret-row">
              <input class="secret-input" :value="createdToken.token" readonly />
              <button class="btn-secondary btn-sm" type="button" @click="copyCreatedToken">
                复制
              </button>
            </div>

            <div class="token-result-meta">
              <span>名称：{{ createdToken.name }}</span>
              <span>权限：{{ formatPermissions(createdToken.permissions) }}</span>
            </div>
          </div>

          <div class="token-section-header">
            <h4 class="section-title">已有 Token</h4>
            <button class="btn-ghost btn-sm" type="button" @click="fetchTokens" :disabled="tokenLoading">
              <v-icon size="16" :class="{ spinning: tokenLoading }">mdi-refresh</v-icon>
              刷新
            </button>
          </div>

          <div v-if="tokenLoading" class="token-empty">
            <v-icon size="18" class="spinning">mdi-loading</v-icon>
            <span>正在加载 Token...</span>
          </div>
          <div v-else-if="!apiTokens.length" class="token-empty">
            <v-icon size="18">mdi-key-variant</v-icon>
            <span>还没有创建 API Token</span>
          </div>
          <div v-else class="token-list">
            <div v-for="token in apiTokens" :key="token.id" class="token-item">
              <div class="token-main">
                <div class="token-topline">
                  <span class="token-name">{{ token.name }}</span>
                  <span class="token-owner">{{ token.owner || 'admin' }}</span>
                </div>
                <div class="token-meta">
                  <span>创建：{{ formatDate(token.createdAt) }}</span>
                  <span>过期：{{ formatExpiresAt(token.expiresAt) }}</span>
                  <span v-if="token.autoDelete">自动删除</span>
                </div>
                <div class="token-permissions">
                  <span v-for="perm in token.permissions" :key="perm" class="token-chip">
                    {{ permissionLabel(perm) }}
                  </span>
                </div>
              </div>

              <div class="token-side">
                <code class="token-preview">{{ token.token }}</code>
                <button
                  class="btn-icon btn-icon-danger"
                  type="button"
                  @click="deleteToken(token)"
                  :disabled="tokenDeleting"
                >
                  <v-icon size="14">mdi-delete</v-icon>
                </button>
              </div>
            </div>
          </div>

          <div class="warning-box token-note">
            <v-icon size="16" color="warning">mdi-alert</v-icon>
            <div>
              <p><strong>提示</strong></p>
              <p>Token 只会在创建后完整显示一次，列表里只保留掩码。</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 安全说明 -->
      <div class="settings-card">
        <div class="card-header">
          <v-icon size="20" class="card-icon">mdi-information</v-icon>
          <h3 class="card-title">安全说明</h3>
        </div>
        <div class="card-body">
          <div class="info-list">
            <div class="info-item">
              <div class="info-icon info-icon-primary">
                <v-icon size="16">mdi-account-key</v-icon>
              </div>
              <div class="info-content">
                <p class="info-title">管理员账号</p>
                <p class="info-desc">用于登录管理后台，管理文件和配置</p>
              </div>
            </div>
            <div class="info-item">
              <div class="info-icon info-icon-warning">
                <v-icon size="16">mdi-shield-alert</v-icon>
              </div>
              <div class="info-content">
                <p class="info-title">密码安全</p>
                <p class="info-desc">建议设置强密码，定期更换</p>
              </div>
            </div>
            <div class="info-item">
              <div class="info-icon info-icon-info">
                <v-icon size="16">mdi-cookie</v-icon>
              </div>
              <div class="info-content">
                <p class="info-title">会话管理</p>
                <p class="info-desc">登录状态通过 Cookie 保存，有效期 14 天</p>
              </div>
            </div>
            <div class="info-item">
              <div class="info-icon info-icon-success">
                <v-icon size="16">mdi-account-key</v-icon>
              </div>
              <div class="info-content">
                <p class="info-title">API Token</p>
                <p class="info-desc">外部脚本可用 <code>Authorization: Bearer</code> 头调用上传接口</p>
              </div>
            </div>
          </div>

          <div class="warning-box">
            <v-icon size="16" color="warning">mdi-alert</v-icon>
            <div>
              <p><strong>忘记密码？</strong></p>
              <p>在 Cloudflare Dashboard 中进入你的 Pages 项目，找到绑定的 KV 或 D1 数据库，删除键名为 <code>manage@sysConfig@security</code> 的记录即可重置。</p>
            </div>
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
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api'

const saving = ref(false)
const showPassword = ref(false)
const securitySettings = ref({
  username: '',
  password: ''
})

const tokenLoading = ref(false)
const creatingToken = ref(false)
const tokenDeleting = ref(false)
const apiTokens = ref([])
const createdToken = ref(null)
const selectedPermissions = ref(['upload'])
const tokenForm = ref({
  name: '',
  owner: 'admin'
})

const permissionOptions = [
  { key: 'upload', label: '上传', description: '允许调用 /upload 上传文件' },
  { key: 'list', label: '查看', description: '允许读取文件列表' },
  { key: 'delete', label: '删除', description: '允许删除文件' },
  { key: 'manage', label: '管理', description: '允许访问管理接口' }
]

const toast = ref({ show: false, message: '', type: 'success', icon: 'mdi-check' })

// 密码强度计算
const passwordStrength = computed(() => {
  const pwd = securitySettings.value.password
  if (!pwd) return { percent: 0, class: '', text: '' }
  
  let score = 0
  if (pwd.length >= 8) score += 25
  if (pwd.length >= 12) score += 15
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 20
  if (/\d/.test(pwd)) score += 20
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 20
  
  if (score < 30) return { percent: score, class: 'strength-weak', text: '弱' }
  if (score < 60) return { percent: score, class: 'strength-medium', text: '中等' }
  if (score < 80) return { percent: score, class: 'strength-good', text: '良好' }
  return { percent: score, class: 'strength-strong', text: '强' }
})

onMounted(() => {
  fetchSecurity()
  fetchTokens()
})

async function fetchSecurity() {
  try {
    const data = await api.get('/api/manage/sysConfig/security')
    securitySettings.value = {
      username: data.auth?.admin?.adminUsername || '',
      password: ''
    }
  } catch (err) {
    console.error('Failed to fetch security config:', err)
  }
}

async function saveSecurity() {
  saving.value = true
  try {
    await api.post('/api/manage/sysConfig/security', {
      auth: {
        admin: {
          adminUsername: securitySettings.value.username,
          adminPassword: securitySettings.value.password
        }
      }
    })
    showToast('保存成功', 'success')
    // 清空密码字段
    securitySettings.value.password = ''
  } catch (err) {
    showToast('保存失败', 'error')
  } finally {
    saving.value = false
  }
}

async function fetchTokens() {
  tokenLoading.value = true
  try {
    const data = await api.get('/api/manage/apiTokens')
    apiTokens.value = (data.tokens || [])
      .map(normalizeToken)
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
  } catch (err) {
    console.error('Failed to fetch API tokens:', err)
    showToast('读取 Token 失败', 'error')
  } finally {
    tokenLoading.value = false
  }
}

async function createToken() {
  const name = tokenForm.value.name.trim()
  const owner = tokenForm.value.owner.trim() || 'admin'
  const permissions = [...selectedPermissions.value]

  if (!name) {
    showToast('请输入 Token 名称', 'error')
    return
  }

  if (permissions.length === 0) {
    showToast('至少选择一个权限', 'error')
    return
  }

  creatingToken.value = true
  try {
    const token = await api.post('/api/manage/apiTokens', {
      name,
      owner,
      permissions,
      expiresAt: null,
      autoDelete: false
    })
    createdToken.value = token
    resetTokenForm()
    await fetchTokens()
    showToast('Token 创建成功', 'success')
  } catch (err) {
    console.error('Failed to create API token:', err)
    showToast(err.message || '创建 Token 失败', 'error')
  } finally {
    creatingToken.value = false
  }
}

async function deleteToken(token) {
  if (!window.confirm(`确定删除 Token "${token.name}" 吗？`)) return

  tokenDeleting.value = true
  try {
    await api.del(`/api/manage/apiTokens?id=${encodeURIComponent(token.id)}`)
    if (createdToken.value?.id === token.id) {
      createdToken.value = null
    }
    await fetchTokens()
    showToast('Token 已删除', 'success')
  } catch (err) {
    console.error('Failed to delete API token:', err)
    showToast(err.message || '删除 Token 失败', 'error')
  } finally {
    tokenDeleting.value = false
  }
}

async function copyCreatedToken() {
  if (!createdToken.value?.token) return

  try {
    await navigator.clipboard.writeText(createdToken.value.token)
    showToast('Token 已复制', 'success')
  } catch (err) {
    console.error('Failed to copy API token:', err)
    showToast('复制失败，请手动选择 Token', 'error')
  }
}

function resetTokenForm() {
  tokenForm.value = {
    name: '',
    owner: 'admin'
  }
  selectedPermissions.value = ['upload']
}

function normalizeToken(token) {
  return {
    ...token,
    permissions: Array.isArray(token.permissions) ? token.permissions : []
  }
}

function permissionLabel(permission) {
  return permissionOptions.find(item => item.key === permission)?.label || permission
}

function formatPermissions(permissions) {
  return (permissions || []).map(permissionLabel).join('、') || '无'
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false
  }).format(date)
}

function formatExpiresAt(value) {
  return value ? formatDate(value) : '永不过期'
}

function getTime(value) {
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
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

/* 设置网格 */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--space-lg);
}

.settings-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.card-icon {
  color: var(--text-secondary);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-body {
  padding: var(--space-lg);
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
  padding: 10px 12px;
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

.password-input {
  position: relative;
}

.password-input .form-input {
  padding-right: 40px;
}

.password-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover {
  color: var(--text-secondary);
}

/* 密码强度 */
.password-strength {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: all var(--transition-normal);
}

.strength-weak { background: var(--error); }
.strength-medium { background: var(--warning); }
.strength-good { background: var(--info); }
.strength-strong { background: var(--success); }

.strength-text {
  font-size: 12px;
  font-weight: 500;
  min-width: 40px;
}

.strength-weak { color: var(--error); }
.strength-medium { color: var(--warning); }
.strength-good { color: var(--info); }
.strength-strong { color: var(--success); }

/* 信息列表 */
.info-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.info-item {
  display: flex;
  gap: var(--space-md);
}

.info-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.info-icon-primary {
  background: var(--accent-light);
  color: var(--accent);
}

.info-icon-warning {
  background: var(--warning-light);
  color: var(--warning);
}

.info-icon-info {
  background: var(--accent-light);
  color: var(--accent);
}

.info-icon-success {
  background: var(--success-light);
  color: var(--success);
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.info-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 警告框 */
.warning-box {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--warning-light);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.warning-box p {
  margin: 0;
}

.warning-box p + p {
  margin-top: var(--space-xs);
}

.warning-box code {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}

/* API Token */
.token-form {
  margin-bottom: var(--space-lg);
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-sm);
}

.permission-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.permission-item:hover {
  border-color: var(--accent);
}

.permission-item input {
  margin-top: 2px;
  accent-color: var(--accent);
  flex-shrink: 0;
}

.permission-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.permission-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.permission-desc {
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-secondary);
}

.token-result-box {
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
  background: var(--accent-light);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
}

.token-result-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.token-result-title {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.token-result-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.token-secret-row {
  display: flex;
  gap: var(--space-sm);
}

.secret-input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: monospace;
  font-size: 12px;
}

.token-result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-top: var(--space-sm);
  font-size: 12px;
  color: var(--text-secondary);
}

.token-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin: var(--space-lg) 0 var(--space-md);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.token-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
}

.token-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.token-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.token-main {
  flex: 1;
  min-width: 0;
}

.token-topline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: 4px;
}

.token-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.token-owner {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 11px;
}

.token-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: var(--space-sm);
}

.token-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.token-chip {
  padding: 2px 8px;
  background: var(--accent-light);
  color: var(--accent);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
}

.token-side {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.token-preview {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
  font-size: 12px;
}

.token-note {
  margin-top: var(--space-lg);
}

/* 按钮 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 20px;
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
  justify-content: center;
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
  justify-content: center;
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

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon-danger {
  color: var(--error);
}

.btn-icon-danger:hover {
  background: var(--error-light);
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
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
  
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .permission-grid {
    grid-template-columns: 1fr;
  }

  .token-secret-row,
  .token-item,
  .token-side {
    flex-direction: column;
    align-items: stretch;
  }

  .token-preview {
    max-width: none;
  }
}
</style>
