<template>
  <v-app>
    <!-- 侧边导航栏 -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      @click:rail="rail = !rail"
      permanent
      :width="240"
      :rail-width="64"
    >
      <!-- Logo区域 -->
      <div class="sidebar-logo" :class="{ 'justify-center': rail }">
        <div class="logo-icon">
          <v-icon size="20">mdi-cloud-upload</v-icon>
        </div>
        <div v-if="!rail" class="logo-copy">
          <span class="logo-text">PicBase</span>
          <span class="logo-kicker">Air1 Quick Tools</span>
        </div>
      </div>

      <!-- 导航菜单 -->
      <div class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <v-icon size="20">{{ item.icon }}</v-icon>
          <span v-if="!rail" class="nav-label">{{ item.label }}</span>
        </router-link>
      </div>

      <!-- 底部操作 -->
      <div class="sidebar-footer">
        <div class="nav-item" @click="toggleTheme">
          <v-icon size="20">{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          <span v-if="!rail" class="nav-label">{{ isDark ? '浅色模式' : '深色模式' }}</span>
        </div>
        
        <div v-if="isLoggedIn" class="nav-item" @click="handleLogout">
          <v-icon size="20">mdi-logout</v-icon>
          <span v-if="!rail" class="nav-label">退出登录</span>
        </div>
        <router-link v-else to="/login" class="nav-item">
          <v-icon size="20">mdi-login</v-icon>
          <span v-if="!rail" class="nav-label">登录</span>
        </router-link>
      </div>
    </v-navigation-drawer>

    <!-- 顶部应用栏 (移动端) -->
    <v-app-bar class="d-lg-none" elevation="0">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title class="font-weight-600">PicBase</v-app-bar-title>
    </v-app-bar>

    <!-- 主内容区 -->
    <v-main class="main-layout">
      <div class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      <footer class="app-footer">
        Part of Air1 Quick Tools · Powered by Cloudflare
      </footer>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from 'vuetify'

const router = useRouter()
const route = useRoute()
const theme = useTheme()
const isDark = ref(false)
const isLoggedIn = ref(false)
const drawer = ref(true)
const rail = ref(false)

const navItems = computed(() => {
  const items = [
    { path: '/', icon: 'mdi-cloud-upload-outline', label: '上传文件' },
    { path: '/files', icon: 'mdi-folder-outline', label: '文件管理' },
    { path: '/channels', icon: 'mdi-cloud-outline', label: '渠道配置' },
    { path: '/settings', icon: 'mdi-cog-outline', label: '安全设置' },
    { path: '/help', icon: 'mdi-help-circle-outline', label: '配置说明' },
  ]
  return items
})

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    theme.global.name.value = 'darkTheme'
    document.documentElement.setAttribute('data-theme', 'dark')
  }
  
  checkAuth()
  handleResize()
  window.addEventListener('resize', handleResize)
})

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/sessionCheck')
    const data = await res.json()
    isLoggedIn.value = data.valid
  } catch {
    isLoggedIn.value = false
  }
}

function handleResize() {
  if (window.innerWidth < 1280) {
    rail.value = true
  } else {
    rail.value = false
  }
}

function isActive(path) {
  return route.path === path
}

function toggleTheme() {
  isDark.value = !isDark.value
  theme.global.name.value = isDark.value ? 'darkTheme' : 'lightTheme'
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : '')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' })
  isLoggedIn.value = false
  router.push('/login')
}

router.afterEach(() => {
  checkAuth()
})
</script>

<style scoped>
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid var(--border);
}

.logo-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--air1-blue), var(--air1-cyan));
  color: white;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.logo-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.logo-kicker {
  font-size: 11px;
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
}

.sidebar-nav {
  padding: 12px 8px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-light);
  color: var(--accent);
}

.nav-label {
  white-space: nowrap;
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid var(--border);
}

.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1 0 auto;
  min-width: 0;
}

.app-footer {
  flex: 0 0 auto;
  padding: 12px var(--space-2xl);
  color: var(--text-tertiary);
  font-size: 12px;
  text-align: center;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
