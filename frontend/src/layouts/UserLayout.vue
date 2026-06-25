<template>
  <v-layout class="user-layout">
    <!-- Top Bar -->
    <v-app-bar color="surface" elevation="0" border>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      
      <v-app-bar-title>
        <router-link to="/" class="text-decoration-none" style="color: inherit">
          <v-icon class="mr-2">mdi-cloud-upload</v-icon>
          PicBase
        </router-link>
      </v-app-bar-title>

      <v-spacer />

      <!-- Navigation Tabs -->
      <v-tabs v-model="activeTab" density="compact" class="d-none d-sm-flex">
        <v-tab value="/upload" to="/upload">
          <v-icon start>mdi-cloud-upload</v-icon>
          {{ t('upload.title') }}
        </v-tab>
        <v-tab value="/browse" to="/browse">
          <v-icon start>mdi-image-multiple</v-icon>
          {{ t('browse.title') }}
        </v-tab>
      </v-tabs>

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
        v-if="authStore.isAdmin"
        icon
        variant="text"
        to="/admin/dashboard"
      >
        <v-icon>mdi-view-dashboard</v-icon>
      </v-btn>

      <v-btn
        v-if="authStore.isAuthenticated"
        icon
        variant="text"
        @click="handleLogout"
      >
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      temporary
    >
      <v-list nav>
        <v-list-item
          to="/upload"
          prepend-icon="mdi-cloud-upload"
          :title="t('upload.title')"
          @click="drawer = false"
        />
        <v-list-item
          to="/browse"
          prepend-icon="mdi-image-multiple"
          :title="t('browse.title')"
          @click="drawer = false"
        />
        <v-divider class="my-2" />
        <v-list-item
          v-if="authStore.isAdmin"
          to="/admin/dashboard"
          prepend-icon="mdi-view-dashboard"
          :title="t('dashboard.title')"
          @click="drawer = false"
        />
        <v-list-item
          v-if="authStore.isAdmin"
          to="/admin/settings"
          prepend-icon="mdi-cog"
          :title="t('settings.title')"
          @click="drawer = false"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <slot />
    </v-main>

    <!-- Mobile Bottom Navigation -->
    <v-bottom-navigation
      v-model="activeTab"
      class="d-flex d-sm-none"
      grow
    >
      <v-btn value="/upload" to="/upload">
        <v-icon>mdi-cloud-upload</v-icon>
        <span>{{ t('upload.title') }}</span>
      </v-btn>
      <v-btn value="/browse" to="/browse">
        <v-icon>mdi-image-multiple</v-icon>
        <span>{{ t('browse.title') }}</span>
      </v-btn>
      <v-btn
        v-if="authStore.isAdmin"
        value="/admin/dashboard"
        to="/admin/dashboard"
      >
        <v-icon>mdi-view-dashboard</v-icon>
        <span>{{ t('dashboard.title') }}</span>
      </v-btn>
    </v-bottom-navigation>
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

const drawer = ref(false)
const activeTab = ref(route.path)

const darkMode = computed(() => appStore.darkMode)
const currentLocale = computed(() => locale.value)

const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '中文' }
]

const toggleDarkMode = () => {
  appStore.toggleDarkMode()
}

const changeLocale = (code) => {
  appStore.setLocale(code)
  locale.value = code
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.user-layout {
  min-height: 100vh;
}

:deep(.v-bottom-navigation) {
  position: fixed;
  bottom: 0;
}
</style>
