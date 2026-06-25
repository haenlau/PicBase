<template>
  <v-layout class="user-layout">
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
          to="/upload"
          prepend-icon="mdi-cloud-upload"
          :title="t('upload.title')"
          rounded="lg"
          color="primary"
          :active="route.path === '/upload'"
        />
        <v-list-item
          to="/browse"
          prepend-icon="mdi-image-multiple"
          :title="t('browse.title')"
          rounded="lg"
          color="primary"
          :active="route.path === '/browse'"
        />
      </v-list>

      <template #append>
        <v-divider />
        <v-list nav density="comfortable" class="pa-2">
          <v-list-item
            v-if="authStore.isAdmin"
            to="/admin/dashboard"
            prepend-icon="mdi-view-dashboard"
            :title="t('dashboard.title')"
            rounded="lg"
            color="primary"
          />
          <v-list-item
            v-if="authStore.isAdmin"
            to="/admin/settings"
            prepend-icon="mdi-cog"
            :title="t('settings.title')"
            rounded="lg"
            color="primary"
          />
          <v-list-item
            v-if="authStore.isAuthenticated"
            prepend-icon="mdi-logout"
            :title="t('auth.logout')"
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

const breadcrumbs = computed(() => {
  const items = []
  const path = route.path

  if (path === '/upload') {
    items.push({ title: t('upload.title') })
  } else if (path === '/browse') {
    items.push({ title: t('browse.title') })
  }

  return items
})

const toggleDarkMode = () => {
  appStore.toggleDarkMode()
}

const changeLocale = (code) => {
  appStore.setLocale(code)
  locale.value = code
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.user-layout {
  min-height: 100vh;
}
</style>
