<template>
  <v-app>
    <!-- 侧边导航栏 -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      @click:rail="rail = !rail"
      permanent
      color="surface"
      :width="240"
      :rail-width="72"
    >
      <!-- Logo区域 -->
      <div class="pa-4 d-flex align-center" :class="{ 'justify-center': rail }">
        <v-avatar size="40" rounded="lg" color="primary" class="flex-shrink-0">
          <v-icon color="white">mdi-cloud-upload</v-icon>
        </v-avatar>
        <div v-if="!rail" class="ml-3">
          <div class="text-subtitle-1 font-weight-bold">PicBase</div>
          <div class="text-caption text-medium-emphasis">图床服务</div>
        </div>
      </div>

      <v-divider class="mb-2" />

      <!-- 主导航 -->
      <v-list nav density="comfortable" class="px-2">
        <v-list-item
          v-if="isLoggedIn"
          to="/"
          :active="$route.path === '/'"
          rounded="lg"
          color="primary"
        >
          <template #prepend>
            <v-icon>mdi-cloud-upload-outline</v-icon>
          </template>
          <v-list-item-title>上传文件</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="isLoggedIn"
          to="/admin"
          :active="$route.path === '/admin'"
          rounded="lg"
          color="primary"
        >
          <template #prepend>
            <v-icon>mdi-view-dashboard-outline</v-icon>
          </template>
          <v-list-item-title>管理后台</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-spacer />

      <!-- 底部操作 -->
      <v-list nav density="comfortable" class="px-2 pb-4">
        <v-list-item
          to="/help"
          :active="$route.path === '/help'"
          rounded="lg"
        >
          <template #prepend>
            <v-icon>mdi-help-circle-outline</v-icon>
          </template>
          <v-list-item-title>配置说明</v-list-item-title>
        </v-list-item>

        <v-list-item
          @click="toggleTheme"
          rounded="lg"
        >
          <template #prepend>
            <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          </template>
          <v-list-item-title>{{ isDark ? '浅色模式' : '深色模式' }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="isLoggedIn"
          @click="handleLogout"
          rounded="lg"
          color="error"
        >
          <template #prepend>
            <v-icon>mdi-logout</v-icon>
          </template>
          <v-list-item-title>退出登录</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-else
          to="/login"
          rounded="lg"
          color="primary"
        >
          <template #prepend>
            <v-icon>mdi-login</v-icon>
          </template>
          <v-list-item-title>登录</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- 顶部应用栏 (移动端) -->
    <v-app-bar
      class="d-lg-none"
      color="surface"
      elevation="0"
      border
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title class="font-weight-bold">PicBase</v-app-bar-title>
    </v-app-bar>

    <!-- 主内容区 -->
    <v-main>
      <router-view v-slot="{ Component }">
        <v-fade-transition mode="out-in">
          <component :is="Component" />
        </v-fade-transition>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'

const router = useRouter()
const theme = useTheme()
const isDark = ref(false)
const isLoggedIn = ref(false)
const drawer = ref(true)
const rail = ref(false)

onMounted(() => {
  // 检查主题
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    theme.global.name.value = 'darkTheme'
  }
  
  // 检查登录状态
  checkAuth()
  
  // 响应式处理
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

function toggleTheme() {
  isDark.value = !isDark.value
  theme.global.name.value = isDark.value ? 'darkTheme' : 'lightTheme'
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' })
  isLoggedIn.value = false
  router.push('/login')
}

// 监听路由变化，刷新登录状态
router.afterEach(() => {
  checkAuth()
})
</script>

<style>
.v-application {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
}

/* 侧边栏样式优化 */
.v-navigation-drawer {
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}

/* 导航项激活状态 */
.v-list-item--active {
  background: rgba(var(--v-theme-primary), 0.12) !important;
}
</style>
