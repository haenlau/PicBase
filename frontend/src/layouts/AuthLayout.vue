<template>
  <v-layout class="auth-layout">
    <v-app-bar color="surface" elevation="0" border>
      <v-app-bar-title>
        <router-link to="/" class="text-decoration-none" style="color: inherit">
          <v-icon class="mr-2">mdi-cloud-upload</v-icon>
          PicBase
        </router-link>
      </v-app-bar-title>

      <v-spacer />

      <v-btn
        icon
        variant="text"
        @click="toggleDarkMode"
      >
        <v-icon>{{ darkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <div class="auth-container">
        <div class="auth-background" />
        <div class="auth-content">
          <slot />
          
          <!-- Footer Links -->
          <div class="text-center mt-6">
            <v-btn
              variant="text"
              size="small"
              to="/"
            >
              Back to Home
            </v-btn>
          </div>
        </div>
      </div>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const darkMode = computed(() => appStore.darkMode)

const toggleDarkMode = () => {
  appStore.toggleDarkMode()
}
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
}

.auth-container {
  position: relative;
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.auth-background {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  opacity: 0.05;
}

.auth-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
}
</style>
