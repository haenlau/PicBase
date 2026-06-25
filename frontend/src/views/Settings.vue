<template>
  <AdminLayout>
    <v-container fluid class="pa-4 pa-md-6">
      <v-card>
        <v-tabs v-model="tab" color="primary" align-tabs="center">
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
              <v-card variant="flat">
                <v-card-title>
                  <v-icon class="mr-2">mdi-cog</v-icon>
                  {{ t('settings.general') }}
                </v-card-title>
                <v-divider />
                <v-list>
                  <v-list-item>
                    <template #prepend>
                      <v-icon>mdi-translate</v-icon>
                    </template>
                    <v-list-item-title>{{ t('settings.language') }}</v-list-item-title>
                    <v-list-item-subtitle>Choose your preferred language</v-list-item-subtitle>
                    <template #append>
                      <v-select
                        v-model="currentLocale"
                        :items="languageOptions"
                        density="compact"
                        hide-details
                        style="width: 150px"
                        variant="outlined"
                        @update:model-value="changeLocale"
                      />
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-window-item>

            <!-- Security Settings -->
            <v-window-item value="security">
              <v-card variant="flat">
                <v-card-title>
                  <v-icon class="mr-2">mdi-shield</v-icon>
                  {{ t('settings.security') }}
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <v-alert type="info" variant="tonal" class="mb-4">
                    Leave fields empty to disable authentication for that role.
                  </v-alert>
                  
                  <v-form @submit.prevent="saveSecurity">
                    <v-list>
                      <v-list-item>
                        <template #prepend>
                          <v-icon>mdi-account-key</v-icon>
                        </template>
                        <v-list-item-title>{{ t('auth.authCode') }}</v-list-item-title>
                        <v-list-item-subtitle>User access code for uploading files</v-list-item-subtitle>
                        <template #append>
                          <v-text-field
                            v-model="securitySettings.authCode"
                            type="password"
                            density="compact"
                            hide-details
                            style="width: 250px"
                            variant="outlined"
                            placeholder="Leave empty to disable"
                          />
                        </template>
                      </v-list-item>
                      
                      <v-divider />
                      
                      <v-list-item>
                        <template #prepend>
                          <v-icon>mdi-account</v-icon>
                        </template>
                        <v-list-item-title>{{ t('auth.username') }}</v-list-item-title>
                        <v-list-item-subtitle>Admin username for dashboard access</v-list-item-subtitle>
                        <template #append>
                          <v-text-field
                            v-model="securitySettings.adminUsername"
                            density="compact"
                            hide-details
                            style="width: 250px"
                            variant="outlined"
                            placeholder="Leave empty to disable"
                          />
                        </template>
                      </v-list-item>
                      
                      <v-divider />
                      
                      <v-list-item>
                        <template #prepend>
                          <v-icon>mdi-lock</v-icon>
                        </template>
                        <v-list-item-title>{{ t('auth.password') }}</v-list-item-title>
                        <v-list-item-subtitle>Admin password for dashboard access</v-list-item-subtitle>
                        <template #append>
                          <v-text-field
                            v-model="securitySettings.adminPassword"
                            type="password"
                            density="compact"
                            hide-details
                            style="width: 250px"
                            variant="outlined"
                            placeholder="Leave empty to keep current"
                          />
                        </template>
                      </v-list-item>
                    </v-list>

                    <div class="d-flex justify-end mt-4">
                      <v-btn type="submit" color="primary" :loading="saving">
                        <v-icon start>mdi-content-save</v-icon>
                        {{ t('common.save') }}
                      </v-btn>
                    </div>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-window-item>

            <!-- Appearance Settings -->
            <v-window-item value="appearance">
              <v-card variant="flat">
                <v-card-title>
                  <v-icon class="mr-2">mdi-palette</v-icon>
                  {{ t('settings.appearance') }}
                </v-card-title>
                <v-divider />
                <v-list>
                  <v-list-item>
                    <template #prepend>
                      <v-icon>{{ darkMode ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
                    </template>
                    <v-list-item-title>{{ t('settings.darkMode') }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ darkMode ? 'Dark mode is enabled' : 'Light mode is enabled' }}
                    </v-list-item-subtitle>
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
              </v-card>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-container>

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
