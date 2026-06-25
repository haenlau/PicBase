<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card glass-strong">
        <div class="login-header">
          <img src="/logo.svg" alt="Logo" class="login-logo" />
          <h1 class="login-title">PicBase</h1>
          <p class="login-subtitle">管理员登录</p>
        </div>
        
        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label class="form-label">
              <span class="material-icons-outlined">person</span>
              用户名
            </label>
            <input
              class="input"
              v-model="username"
              type="text"
              placeholder="请输入用户名"
              autocomplete="username"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">
              <span class="material-icons-outlined">lock</span>
              密码
            </label>
            <input
              class="input"
              v-model="password"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
          </div>
          
          <div class="form-error" v-if="error">
            <span class="material-icons-outlined">error</span>
            {{ error }}
          </div>
          
          <button class="btn btn-primary btn-lg w-full" type="submit" :disabled="loading">
            <span v-if="loading" class="material-icons-outlined spinning">sync</span>
            <span v-else class="material-icons-outlined">login</span>
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
        
        <div class="login-footer">
          <router-link to="/" class="btn btn-secondary">
            <span class="material-icons-outlined">arrow_back</span>
            返回首页
          </router-link>
        </div>
      </div>
    </div>
    
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Toast from '@/components/Toast.vue'

const router = useRouter()
const toast = ref(null)

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const res = await fetch('/api/auth/adminLogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    })
    
    const data = await res.json()
    
    if (res.ok && data.success) {
      toast.value?.success('登录成功')
      router.push('/admin')
    } else {
      error.value = data.error || '登录失败'
    }
  } catch (err) {
    error.value = '网络错误，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  padding: var(--space-2xl);
  animation: scaleIn 0.3s ease;
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.login-logo {
  width: 64px;
  height: 64px;
  margin-bottom: var(--space-md);
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: var(--space-xs);
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 13px;
  color: var(--text-secondary);
}

.form-label .material-icons-outlined {
  font-size: 16px;
}

.form-error {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: rgba(231, 76, 60, 0.1);
  border-radius: var(--radius-md);
  color: var(--error);
  font-size: 13px;
}

.form-error .material-icons-outlined {
  font-size: 18px;
}

.login-footer {
  margin-top: var(--space-xl);
  text-align: center;
}

.spinning {
  animation: spin 1s linear infinite;
}

.w-full {
  width: 100%;
}
</style>
