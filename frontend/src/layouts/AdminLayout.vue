<template>
  <v-layout class="admin-layout">
    <!-- Side Navigation -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      @click:rail="rail = !rail"
      permanent
      color="surface"
    >
      <v-list-item
        class="pa-4"
        :title="rail ? 'PB' : 'PicBase'"
        subtitle="File Hosting"
        nav
      >
        <template #prepend>
          <v-avatar :size="rail ? 32 : 40" color="primary" rounded="lg">
            <v-icon color="white">mdi-cloud-upload</v-icon>
          </v-avatar>
        </template>
      </v-list-item>

      <v-divider />

      <v-list nav density="comfortable" class="pa-2">
        <v-list-item
          v-for="item in mainNavItems"
          :key="item.path"
          :to="item.path"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="lg"
          color="primary"
          :active="isActive(item.path)"
        />
      </v-list>

      <template #append>
        <v-divider />
        <v-list nav density="comfortable" class="pa-2">
          <v-list-item
            v-for="item in bottomNavItems"
            :key="item.path"
            :to="item.path"
            :prepend-icon="item.icon"
            :title="item.title"
            rounded="lg"
            color="primary"
            :active="isActive(item.path)"
          />
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            rounded="lg"
            @click="handleLogout"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- Top Bar -->
    <v-app-bar color="surface" elevation="0" border>
      <v-app-bar-nav-icon @click="rail = !rail" />
      
      <v-app-bar-title>
        <v-breadcrumbs :items="breadcrumbs" density="compact" class="pa-0">
          <template #divider>
            <v-icon size="small">mdi-chevron-right</v-icon>
          </template>
          <template #title="{ item, props }">
            <router-link
              v-if="item.to"
              :to="item.to"
              v-bind="props"
              class="text-decoration-none"
              style="color: inherit"
            />
            <span v-else v-bind="props">{{ item.title }}</span>
          </template>
        </v-breadcrumbs>
      </v-app-bar-title>

      <v-spacer />

      <v-btn
        icon
        variant="text"
        @click="toggleDarkMode"
      >
        <v-icon>{{ darkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

      <v-menu>
        <template #activator="{ props }">
          <v-btn icon variant="text" v-bind="props">
            <v-icon>mdi-translate</v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="lang in languages"
            :key="lang.code"
            :title="lang.name"
            :active="currentLocale === lang.code"
            @click="changeLocale(lang.code)"
          />
        </v-list>
      </v-menu>

      <v-btn
        icon
        variant="text"
        @click="refreshData"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <slot />
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()

const drawer = ref(true)
const rail = ref(false)

const darkMode = computed(() => appStore.darkMode)
const currentLocale = computed(() => locale.value)

const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '中文' }
]

const mainNavItems = computed(() => [
  {
    path: '/upload',
    icon: 'mdi-cloud-upload',
    title: t('upload.title')
  },
  {
    path: '/admin/dashboard',
    icon: 'mdi-view-dashboard',
    title: t('dashboard.title')
  },
  {
    path: '/browse',
    icon: 'mdi-image-multiple',
    title: t('browse.title')
  }
])

const bottomNavItems = computed(() => [
  {
    path: '/admin/settings',
    icon: 'mdi-cog',
    title: t('settings.title')
  }
])

const breadcrumbs = computed(() => {
  const items = []
  const path = route.path

  if (path.startsWith('/admin')) {
    items.push({ title: 'Admin', to: '/admin/dashboard' })
  }

  if (path === '/admin/dashboard') {
    items.push({ title: t('dashboard.title') })
  } else if (path === '/admin/settings' || path.startsWith('/admin/settings/')) {
    items.push({ title: t('settings.title'), to: path === '/admin/settings' ? undefined : '/admin/settings' })
    if (route.params.tab) {
      items.push({ title: t(`settings.${route.params.tab}`) })
    }
  } else if (path === '/upload') {
    items.push({ title: t('upload.title') })
  } else if (path === '/browse') {
    items.push({ title: t('browse.title') })
  }

  return items
})

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const toggleDarkMode = () => {
  appStore.toggleDarkMode()
}

const changeLocale = (code) => {
  appStore.setLocale(code)
  locale.value = code
}

const refreshData = () => {
  window.location.reload()
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}
</style>
