<template>
  <v-app-bar color="surface" :elevation="0">
    <template #prepend>
      <slot name="prepend" />
      <v-app-bar-nav-icon
        v-if="showNavToggle"
        @click="$emit('toggle-sidebar')"
      />
    </template>

    <v-app-bar-title>
      <slot name="title">
        <span class="text-h6 font-weight-medium">{{ title }}</span>
      </slot>
    </v-app-bar-title>

    <template #append>
      <slot name="append" />
      
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
            :active="locale === lang.code"
            @click="changeLocale(lang.code)"
          />
        </v-list>
      </v-menu>

      <v-btn
        v-if="authStore.isAuthenticated"
        icon
        variant="text"
        @click="handleLogout"
      >
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </template>
  </v-app-bar>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  showNavToggle: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: 'PicBase'
  }
})

defineEmits(['toggle-sidebar'])

const router = useRouter()
const { locale } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()

const darkMode = computed(() => appStore.darkMode)

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
