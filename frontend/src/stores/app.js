import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useTheme } from 'vuetify'

export const useAppStore = defineStore('app', () => {
  const darkMode = ref(false)
  const locale = ref(localStorage.getItem('locale') || 'en')
  const sidebarOpen = ref(true)
  const sidebarCollapsed = ref(false)

  const initDarkMode = () => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      darkMode.value = saved === 'true'
    } else {
      darkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  }

  const toggleDarkMode = () => {
    darkMode.value = !darkMode.value
    localStorage.setItem('darkMode', darkMode.value.toString())
  }

  const setLocale = (newLocale) => {
    locale.value = newLocale
    localStorage.setItem('locale', newLocale)
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const toggleSidebarCollapsed = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    darkMode,
    locale,
    sidebarOpen,
    sidebarCollapsed,
    initDarkMode,
    toggleDarkMode,
    setLocale,
    toggleSidebar,
    toggleSidebarCollapsed
  }
})
