<template>
  <AdminLayout>
    <h1 class="text-h4 font-weight-bold mb-6">{{ t('settings.title') }}</h1>

    <v-card>
      <v-tabs v-model="tab" color="primary">
        <v-tab value="general">
          <v-icon start>mdi-cog</v-icon>
          {{ t('settings.general') }}
        </v-tab>
        <v-tab value="upload">
          <v-icon start>mdi-cloud-upload</v-icon>
          {{ t('settings.upload') }}
        </v-tab>
        <v-tab value="security">
          <v-icon start>mdi-shield</v-icon>
          {{ t('settings.security') }}
        </v-tab>
        <v-tab value="appearance">
          <v-icon start>mdi-palette</v-icon>
          {{ t('settings.appearance') }}
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text>
        <v-window v-model="tab">
          <!-- General Settings -->
          <v-window-item value="general">
            <v-form @submit.prevent="saveGeneral">
              <v-list>
                <v-list-item>
                  <v-list-item-title>{{ t('settings.language') }}</v-list-item-title>
                  <template #append>
                    <v-select
                      v-model="generalSettings.language"
                      :items="languageOptions"
                      density="compact"
                      hide-details
                      style="width: 150px"
                    />
                  </template>
                </v-list-item>
              </v-list>
              <v-btn type="submit" color="primary" class="mt-4">
                {{ t('common.save') }}
              </v-btn>
            </v-form>
          </v-window-item>

          <!-- Upload Settings -->
          <v-window-item value="upload">
            <v-list>
              <v-list-item
                v-for="(channels, type) in uploadConfig"
                :key="type"
                :title="type"
                :subtitle="`${channels.length} channel(s)`"
              >
                <template #append>
                  <v-btn variant="tonal" size="small" @click="editChannel(type)">
                    {{ t('common.edit') }}
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-window-item>

          <!-- Security Settings -->
          <v-window-item value="security">
            <v-form @submit.prevent="saveSecurity">
              <v-list>
                <v-list-item>
                  <v-list-item-title>{{ t('auth.authCode') }}</v-list-item-title>
                  <template #append>
                    <v-text-field
                      v-model="securitySettings.authCode"
                      type="password"
                      density="compact"
                      hide-details
                      style="width: 200px"
                    />
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>{{ t('auth.username') }}</v-list-item-title>
                  <template #append>
                    <v-text-field
                      v-model="securitySettings.adminUsername"
                      density="compact"
                      hide-details
                      style="width: 200px"
                    />
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>{{ t('auth.password') }}</v-list-item-title>
                  <template #append>
                    <v-text-field
                      v-model="securitySettings.adminPassword"
                      type="password"
                      density="compact"
                      hide-details
                      style="width: 200px"
                    />
                  </template>
                </v-list-item>
              </v-list>
              <v-btn type="submit" color="primary" class="mt-4">
                {{ t('common.save') }}
              </v-btn>
            </v-form>
          </v-window-item>

          <!-- Appearance Settings -->
          <v-window-item value="appearance">
            <v-list>
              <v-list-item :title="t('settings.darkMode')">
                <template #append>
                  <v-switch
                    v-model="darkMode"
                    color="primary"
                    hide-details
                    @change="toggleDarkMode"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { configApi } from '@/api'
import AdminLayout from '@/layouts/AdminLayout.vue'

const { t, locale } = useI18n()
const appStore = useAppStore()

const tab = ref('general')
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const darkMode = computed({
  get: () => appStore.darkMode,
  set: () => {}
})

const languageOptions = [
  { title: 'English', value: 'en' },
  { title: '中文', value: 'zh-CN' }
]

const generalSettings = ref({
  language: locale.value
})

const securitySettings = ref({
  authCode: '',
  adminUsername: '',
  adminPassword: ''
})

const uploadConfig = ref({})

onMounted(() => {
  fetchConfigs()
})

const fetchConfigs = async () => {
  try {
    const [securityRes, uploadRes] = await Promise.all([
      configApi.getSecurityConfig(),
      configApi.getUploadConfig()
    ])
    
    securitySettings.value = {
      authCode: securityRes.data.auth?.user?.authCode || '',
      adminUsername: securityRes.data.auth?.admin?.adminUsername || '',
      adminPassword: ''
    }
    
    uploadConfig.value = uploadRes.data || {}
  } catch (error) {
    console.error('Failed to fetch configs:', error)
  }
}

const saveGeneral = async () => {
  appStore.setLocale(generalSettings.value.language)
  locale.value = generalSettings.value.language
  showMessage(t('settings.saveSuccess'), 'success')
}

const saveSecurity = async () => {
  try {
    await configApi.updateSecurityConfig({
      auth: {
        user: { authCode: securitySettings.value.authCode },
        admin: {
          adminUsername: securitySettings.value.adminUsername,
          adminPassword: securitySettings.value.adminPassword
        }
      }
    })
    showMessage(t('settings.saveSuccess'), 'success')
  } catch (error) {
    showMessage(t('settings.saveFailed'), 'error')
  }
}

const toggleDarkMode = () => {
  appStore.toggleDarkMode()
}

const editChannel = (type) => {
  // TODO: Implement channel editing dialog
  showMessage('Channel editing not implemented yet', 'warning')
}

const showMessage = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>
