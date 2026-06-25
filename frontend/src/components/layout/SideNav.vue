<template>
  <v-navigation-drawer
    :model-value="open"
    @update:model-value="$emit('update:open', $event)"
    :rail="collapsed"
    @update:rail="$emit('update:collapsed', $event)"
    :permanent="!isMobile"
    :temporary="isMobile"
    color="surface"
  >
    <v-list-item
      class="pa-4"
      :title="collapsed ? 'PB' : 'PicBase'"
      subtitle="File Hosting"
    >
      <template #prepend>
        <v-avatar :size="collapsed ? 32 : 40" color="primary" rounded="lg">
          <v-icon color="white">mdi-cloud-upload</v-icon>
        </v-avatar>
      </template>
    </v-list-item>

    <v-divider />

    <v-list nav density="comfortable" class="pa-2">
      <v-list-item
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :prepend-icon="item.icon"
        :title="item.title"
        rounded="lg"
        color="primary"
      />
    </v-list>

    <template #append>
      <v-list nav density="comfortable" class="pa-2">
        <v-list-item
          prepend-icon="mdi-cog"
          title="Settings"
          to="/admin/settings"
          rounded="lg"
          color="primary"
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
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useResponsive } from '@/composables/useTheme'

const props = defineProps({
  open: Boolean,
  collapsed: Boolean
})

const emit = defineEmits(['update:open', 'update:collapsed'])

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const { isMobile } = useResponsive()

const navItems = computed(() => [
  {
    path: '/admin/dashboard',
    icon: 'mdi-view-dashboard',
    title: t('dashboard.title')
  },
  {
    path: '/upload',
    icon: 'mdi-cloud-upload',
    title: t('upload.title')
  },
  {
    path: '/browse',
    icon: 'mdi-image-multiple',
    title: t('browse.title')
  }
])

const handleLogout = async () => {
  await authStore.logout()
  router.push('/admin/login')
}
</script>
