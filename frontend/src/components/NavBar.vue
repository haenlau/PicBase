<template>
  <nav class="navbar glass">
    <div class="navbar-content">
      <div class="navbar-brand" @click="$router.push('/')">
        <img src="/logo.svg" alt="Logo" class="navbar-logo" />
        <span class="navbar-title">PicBase</span>
      </div>
      
      <div class="navbar-links hide-mobile">
        <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">
          <span class="material-icons-outlined">cloud_upload</span>
          上传
        </router-link>
        <router-link to="/admin" class="nav-link" :class="{ active: $route.path === '/admin' }">
          <span class="material-icons-outlined">dashboard</span>
          管理
        </router-link>
      </div>
      
      <div class="navbar-actions">
        <button class="btn-icon" @click="$emit('refresh')" title="刷新">
          <span class="material-icons-outlined">refresh</span>
        </button>
        <button class="btn-icon" @click="toggleTheme" :title="isDark ? '浅色模式' : '深色模式'">
          <span class="material-icons-outlined">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
        </button>
        <button class="btn-icon" @click="handleAuth" :title="isLoggedIn ? '退出' : '登录'">
          <span class="material-icons-outlined">{{ isLoggedIn ? 'logout' : 'person' }}</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

defineEmits(['refresh'])

const router = useRouter()
const isDark = ref(false)
const isLoggedIn = ref(false)

onMounted(() => {
  // 检查主题
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  }
  
  // 检查登录状态
  checkAuth()
})

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/sessionCheck')
    const data = await res.json()
    isLoggedIn.value = data.valid && data.authType === 'admin'
  } catch {
    isLoggedIn.value = false
  }
}

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : '')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

async function handleAuth() {
  if (isLoggedIn.value) {
    await fetch('/api/auth/logout', { method: 'POST' })
    isLoggedIn.value = false
    router.push('/')
  } else {
    router.push('/login')
  }
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: var(--space-sm) var(--space-lg);
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  text-decoration: none;
  color: var(--text-primary);
}

.navbar-logo {
  width: 32px;
  height: 32px;
}

.navbar-title {
  font-size: 18px;
  font-weight: 600;
}

.navbar-links {
  display: flex;
  gap: var(--space-sm);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-full);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 14px;
  transition: var(--transition-normal);
}

.nav-link:hover,
.nav-link.active {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}

.nav-link .material-icons-outlined {
  font-size: 18px;
}

.navbar-actions {
  display: flex;
  gap: var(--space-sm);
}

@media (max-width: 768px) {
  .navbar-links {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--glass-bg-strong);
    backdrop-filter: var(--glass-blur);
    padding: var(--space-sm);
    justify-content: center;
    border-top: 1px solid var(--glass-border);
  }
  
  .nav-link {
    flex-direction: column;
    font-size: 11px;
    gap: 2px;
  }
}
</style>
