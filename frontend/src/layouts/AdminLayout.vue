<template>
  <v-layout>
    <SideNav v-model:open="sidebarOpen" v-model:collapsed="sidebarCollapsed" />
    <TopBar @toggle-sidebar="toggleSidebar" />
    <v-main>
      <v-container fluid class="pa-4 pa-md-6">
        <slot />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import SideNav from '@/components/layout/SideNav.vue'
import TopBar from '@/components/layout/TopBar.vue'

const appStore = useAppStore()

const sidebarOpen = computed({
  get: () => appStore.sidebarOpen,
  set: (val) => { appStore.sidebarOpen = val }
})

const sidebarCollapsed = computed({
  get: () => appStore.sidebarCollapsed,
  set: (val) => { appStore.sidebarCollapsed = val }
})

const toggleSidebar = () => {
  appStore.toggleSidebar()
}
</script>
