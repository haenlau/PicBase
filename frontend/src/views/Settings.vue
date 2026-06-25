<template>
  <AdminLayout>
    <h1 class="text-h4 font-weight-bold mb-6">{{ t('settings.title') }}</h1>

    <v-card>
      <v-tabs v-model="tab" color="primary">
        <v-tab value="general">
          <v-icon start>mdi-cog</v-icon>
          {{ t('settings.general') }}
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
            <v-list>
              <v-list-item>
                <v-list-item-title>{{ t('settings.language') }}</v-list-item-title>
                <template #append>
                  <v-select
                    v-model="currentLocale"
                    :items="languageOptions"
                    density="compact"
                    hide-details
                    style="width: 150px"
                    @update:model-value="changeLocale"
                  />
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
                  <v-list-item-subtitle>User access code for upload</v-list-item-subtitle>
                  <template #append>
                    <v-text-field
                      v-model="securitySettings.authCode"
                      type="password"
                      density="compact"
                      hide-details
                      style="width: 200px"
                      placeholder="Leave empty to disable"
                    />
                  </template>
                </v-list-item>
                <v-divider />
                <v-list-item>
                  <v-list-item-title>{{ t('auth.username') }}</v-list-item-title>
                  <v-list-item-subtitle>Admin username</v-list-item-subtitle>
                  <template #append>
                    <v-text-field
                      v-model="securitySettings.adminUsername"
                      density="compact"
                      hide-details
                      style="width: 200px"
                      placeholder="Leave empty to disable"
                    />
                  </template>
                </v-list-item>
                <v-divider />
                <v-list-item>
                  <v-list-item-title>{{ t('auth.password') }}</v-list-item-title>
                  <v-list-item-subtitle>Admin password</v-list-item-subtitle>
                  <template #append>
                    <v-text-field
                      v-model="securitySettings.adminPassword"
                      type="password"
                      density="compact"
                      hide-details
                      style="width: 200px"
                      placeholder="Leave empty to keep current"
                    />
                  </template>
                </v-list-item>
              </v-list>
              <v-btn type="submit" color="primary" class="mt-4" :loading="saving">
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
const saving = ref(false)

const currentLocale = ref(locale.value)

const darkMode = computed({
  get: () => appStore.darkMode,
  set: () => {}
})

const languageOptions = [
  { title: 'English', value: 'en' },
  { title: '中文', value: 'zh-CN' }
]

const securitySettings = ref({
  authCode: '',
  adminUsername: '',
  adminPassword: ''
})

onMounted(() => {
  fetchSecurityConfig()
})

const fetchSecurityConfig = async () => {
  try {
    const response = await configApi.getSecurityConfig()
    const data = response.data
    securitySettings.value = {
      authCode: '',
      adminUsername: data.auth?.admin?.adminUsername || '',
      adminPassword: ''
    }
  } catch (error) {
    console.error('Failed to fetch security config:', error)
  }
}

const changeLocale = (newLocale) => {
  appStore.setLocale(newLocale)
  locale.value = newLocale
}

const saveSecurity = async () => {
  saving.value = true
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
  } finally {
    saving.value = false
  }
}

const toggleDarkMode = () => {
  appStore.toggleDarkMode()
}

const showMessage = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>
