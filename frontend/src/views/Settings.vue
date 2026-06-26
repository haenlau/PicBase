<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">安全设置</h1>
      <p class="page-subtitle">配置管理员账号和安全选项</p>
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
            <input
              v-model="securitySettings.password"
              type="password"
              class="form-input"
              placeholder="留空表示不修改"
            />
          </div>
          <button class="btn-primary" @click="saveSecurity" :disabled="saving">
            <v-icon v-if="saving" size="16" class="spinning">mdi-loading</v-icon>
            <v-icon v-else size="16">mdi-content-save</v-icon>
            {{ saving ? '保存中...' : '保存' }}
          </button>
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
          </div>

          <div class="warning-box">
            <v-icon size="16" color="warning">mdi-alert</v-icon>
            <p><strong>注意：</strong>如果忘记密码，需要在 Cloudflare Dashboard 中删除 D1 数据库的 <code>manage@sysConfig@security</code> 记录来重置。</p>
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
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const saving = ref(false)
const securitySettings = ref({
  username: '',
  password: ''
})

const toast = ref({ show: false, message: '', type: 'success', icon: 'mdi-check' })

onMounted(() => {
  fetchSecurity()
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
  } catch (err) {
    showToast('保存失败', 'error')
  } finally {
    saving.value = false
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

.warning-box code {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
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
}
</style>
