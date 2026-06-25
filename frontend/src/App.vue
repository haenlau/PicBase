<template>
  <v-app>
    <v-app-bar color="surface" elevation="0" border>
      <v-app-bar-nav-icon @click="$router.push('/')">
        <v-avatar size="32" rounded="lg" color="primary">
          <v-icon color="white">mdi-cloud-upload</v-icon>
        </v-avatar>
      </v-app-bar-nav-icon>
      
      <v-app-bar-title class="font-weight-bold">
        PicBase
      </v-app-bar-title>

      <v-spacer />

      <v-btn
        v-if="isLoggedIn"
        variant="text"
        to="/"
        :active="$route.path === '/'"
      >
        <v-icon start>mdi-cloud-upload</v-icon>
        上传
      </v-btn>
      
      <v-btn
        v-if="isLoggedIn"
        variant="text"
        to="/admin"
        :active="$route.path === '/admin'"
      >
        <v-icon start>mdi-view-dashboard</v-icon>
        管理
      </v-btn>

      <v-spacer />

      <v-btn icon variant="text" @click="toggleTheme">
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

      <v-btn icon variant="text" @click="handleAuth">
        <v-icon>{{ isLoggedIn ? 'mdi-logout' : 'mdi-login' }}</v-icon>
      </v-btn>
    </v-app-bar>

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

onMounted(() => {
  // 检查主题
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    theme.global.name.value = 'darkTheme'
  }
  
  // 检查登录状态
  checkAuth()
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

function toggleTheme() {
  isDark.value = !isDark.value
  theme.global.name.value = isDark.value ? 'darkTheme' : 'lightTheme'
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

async function handleAuth() {
  if (isLoggedIn.value) {
    await fetch('/api/auth/logout', { method: 'POST' })
    isLoggedIn.value = false
    router.push('/login')
  } else {
    router.push('/login')
  }
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
</style>
