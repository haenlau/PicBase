<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const theme = useTheme()

onMounted(() => {
  appStore.initDarkMode()
  // 初始化时同步主题
  theme.global.name.value = appStore.darkMode ? 'dark' : 'light'
})

// 监听 darkMode 变化，同步到 Vuetify
watch(() => appStore.darkMode, (isDark) => {
  theme.global.name.value = isDark ? 'dark' : 'light'
})
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}
</style>
