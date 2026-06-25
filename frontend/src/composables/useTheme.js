import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'

export function useTheme() {
  const appStore = useAppStore()

  const toggleDarkMode = () => {
    appStore.toggleDarkMode()
  }

  return {
    darkMode: appStore.darkMode,
    toggleDarkMode
  }
}

export function useMediaQuery(query) {
  const matches = ref(false)
  let mediaQuery = null

  const update = (e) => {
    matches.value = e.matches
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(query)
    matches.value = mediaQuery.matches
    mediaQuery.addEventListener('change', update)
  })

  onUnmounted(() => {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', update)
    }
  })

  return matches
}

export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 600px)')
  const isTablet = useMediaQuery('(max-width: 900px)')
  const isDesktop = useMediaQuery('(min-width: 901px)')

  return {
    isMobile,
    isTablet,
    isDesktop
  }
}
