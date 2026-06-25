<template>
  <AdminLayout>
    <v-container fluid class="pa-4 pa-md-6">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div>
            <v-icon class="mr-2">mdi-server-network</v-icon>
            {{ t('channels.title') }}
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="showAddDialog = true"
          >
            {{ t('channels.addChannel') }}
          </v-btn>
        </v-card-title>
        <v-divider />

        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            {{ t('channels.description') }}
          </v-alert>

          <!-- Channel Types -->
          <v-row>
            <v-col v-for="channelType in channelTypes" :key="channelType.type" cols="12" md="6" lg="4">
              <v-card variant="outlined" class="channel-card">
                <v-card-title class="d-flex align-center">
                  <v-icon :color="channelType.color" class="mr-2">
                    {{ channelType.icon }}
                  </v-icon>
                  {{ channelType.name }}
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <p class="text-caption text-medium-emphasis mb-4">{{ channelType.description }}</p>
                  
                  <!-- Configured Channels -->
                  <div v-if="getChannelsByType(channelType.type).length > 0">
                    <v-list density="compact">
                      <v-list-item
                        v-for="channel in getChannelsByType(channelType.type)"
                        :key="channel.name"
                      >
                        <template #prepend>
                          <v-icon :color="channel.enabled ? 'success' : 'grey'">
                            {{ channel.enabled ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                          </v-icon>
                        </template>
                        <v-list-item-title>{{ channel.name }}</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ channel.enabled ? t('channels.enabled') : t('channels.disabled') }}
                        </v-list-item-subtitle>
                        <template #append>
                          <v-btn
                            icon
                            size="small"
                            variant="text"
                            @click="editChannel(channelType.type, channel)"
                          >
                            <v-icon>mdi-pencil</v-icon>
                          </v-btn>
                          <v-btn
                            icon
                            size="small"
                            variant="text"
                            color="error"
                            @click="deleteChannel(channelType.type, channel.name)"
                          >
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </template>
                      </v-list-item>
                    </v-list>
                  </div>
                  
                  <!-- Empty State -->
                  <div v-else class="text-center py-4">
                    <v-icon size="48" color="grey" class="mb-2">mdi-server-off</v-icon>
                    <p class="text-caption text-medium-emphasis">{{ t('channels.noChannels') }}</p>
                  </div>

                  <v-btn
                    block
                    variant="tonal"
                    size="small"
                    class="mt-2"
                    @click="addChannel(channelType.type)"
                  >
                    <v-icon start size="small">mdi-plus</v-icon>
                    {{ t('channels.addChannel') }} {{ channelType.name }}
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>

    <!-- Add/Edit Channel Dialog -->
    <v-dialog v-model="showChannelDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ editingChannel ? t('channels.editChannel') : t('channels.addChannel') }} {{ getChannelTypeName(editingChannelType) }}</span>
          <v-btn icon variant="text" @click="closeDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="saveChannel">
            <!-- Common Fields -->
            <v-text-field
              v-model="channelForm.name"
              :label="t('channels.channelName')"
              :rules="[v => !!v || t('channels.channelNameRequired')]"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            />

            <!-- Telegram Fields -->
            <template v-if="editingChannelType === 'telegram'">
              <v-text-field
                v-model="channelForm.botToken"
                :label="t('channels.botToken')"
                :rules="[v => !!v || t('channels.botToken') + ' *']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                hint="Get from @BotFather"
                persistent-hint
              />
              <v-text-field
                v-model="channelForm.chatId"
                :label="t('channels.chatId')"
                :rules="[v => !!v || t('channels.chatId') + ' *']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.proxyUrl"
                :label="t('channels.proxyUrl')"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
            </template>

            <!-- R2 Fields -->
            <template v-if="editingChannelType === 'cfr2'">
              <v-text-field
                v-model="channelForm.publicUrl"
                :label="t('channels.publicUrl')"
                :rules="[v => !!v || t('channels.publicUrl') + ' *']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
            </template>

            <!-- S3 Fields -->
            <template v-if="editingChannelType === 's3'">
              <v-text-field
                v-model="channelForm.endpoint"
                :label="t('channels.endpoint')"
                :rules="[v => !!v || t('channels.endpoint') + ' *']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.accessKeyId"
                :label="t('channels.accessKeyId')"
                :rules="[v => !!v || t('channels.accessKeyId') + ' *']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.secretAccessKey"
                :label="t('channels.secretAccessKey')"
                :rules="[v => !!v || t('channels.secretAccessKey') + ' *']"
                type="password"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.bucketName"
                :label="t('channels.bucketName')"
                :rules="[v => !!v || t('channels.bucketName') + ' *']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.region"
                :label="t('channels.region')"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                hint="auto"
                persistent-hint
              />
              <v-switch
                v-model="channelForm.pathStyle"
                :label="t('channels.pathStyle')"
                density="compact"
                class="mb-4"
              />
            </template>

            <!-- Discord Fields -->
            <template v-if="editingChannelType === 'discord'">
              <v-text-field
                v-model="channelForm.botToken"
                :label="t('channels.botToken')"
                :rules="[v => !!v || t('channels.botToken') + ' *']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.channelId"
                :label="t('channels.channelId')"
                :rules="[v => !!v || t('channels.channelId') + ' *']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.proxyUrl"
                :label="t('channels.proxyUrl')"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
            </template>

            <!-- HuggingFace Fields -->
            <template v-if="editingChannelType === 'huggingface'">
              <v-text-field
                v-model="channelForm.token"
                :label="t('channels.token')"
                :rules="[v => !!v || t('channels.token') + ' *']"
                type="password"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.repo"
                :label="t('channels.repo')"
                :rules="[v => !!v || t('channels.repo') + ' *']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                hint="username/repo-name"
                persistent-hint
              />
              <v-switch
                v-model="channelForm.isPrivate"
                :label="t('channels.isPrivate')"
                density="compact"
                class="mb-4"
              />
            </template>

            <!-- WebDAV Fields -->
            <template v-if="editingChannelType === 'webdav'">
              <v-text-field
                v-model="channelForm.baseUrl"
                :label="t('channels.baseUrl')"
                :rules="[v => !!v || t('channels.baseUrl') + ' *']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.username"
                :label="t('channels.username')"
                :rules="[v => !!v || t('channels.username') + ' *']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.password"
                label="Password"
                :rules="[v => !!v || 'Password *']"
                type="password"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.publicUrl"
                :label="t('channels.publicUrl')"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
            </template>

            <!-- Enable/Disable -->
            <v-switch
              v-model="channelForm.enabled"
              :label="t('channels.enabled')"
              color="success"
              density="compact"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" @click="saveChannel" :loading="saving">
            {{ editingChannel ? t('common.save') : t('channels.addChannel') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { configApi } from '@/api'
import AdminLayout from '@/layouts/AdminLayout.vue'

const { t } = useI18n()

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const saving = ref(false)
const showChannelDialog = ref(false)
const showAddDialog = ref(false)
const editingChannel = ref(null)
const editingChannelType = ref('')
const formRef = ref(null)

const uploadConfig = ref({
  telegram: { channels: [] },
  cfr2: { channels: [] },
  s3: { channels: [] },
  discord: { channels: [] },
  huggingface: { channels: [] },
  webdav: { channels: [] }
})

const channelForm = ref({
  name: '',
  enabled: true,
  botToken: '',
  chatId: '',
  proxyUrl: '',
  publicUrl: '',
  endpoint: '',
  accessKeyId: '',
  secretAccessKey: '',
  bucketName: '',
  region: '',
  pathStyle: false,
  channelId: '',
  token: '',
  repo: '',
  isPrivate: false,
  baseUrl: '',
  username: '',
  password: ''
})

const channelTypes = [
  {
    type: 'telegram',
    name: 'Telegram',
    icon: 'mdi-telegram',
    color: '#0088cc',
    description: 'Upload files to Telegram channels or groups.'
  },
  {
    type: 'cfr2',
    name: 'Cloudflare R2',
    icon: 'mdi-cloud',
    color: '#F38020',
    description: 'Cloudflare R2 object storage. Fast and reliable.'
  },
  {
    type: 's3',
    name: 'S3 Compatible',
    icon: 'mdi-aws',
    color: '#FF9900',
    description: 'AWS S3 or compatible services (MinIO, etc).'
  },
  {
    type: 'discord',
    name: 'Discord',
    icon: 'mdi-discord',
    color: '#5865F2',
    description: 'Upload files to Discord channels.'
  },
  {
    type: 'huggingface',
    name: 'Hugging Face',
    icon: 'mdi-face-man',
    color: '#FFD21E',
    description: 'Store files in Hugging Face repositories.'
  },
  {
    type: 'webdav',
    name: 'WebDAV',
    icon: 'mdi-folder-network',
    color: '#4CAF50',
    description: 'Upload to any WebDAV compatible server.'
  }
]

onMounted(() => {
  fetchConfig()
})

const fetchConfig = async () => {
  try {
    const response = await configApi.getUploadConfig()
    uploadConfig.value = response.data
  } catch (error) {
    console.error('Failed to fetch config:', error)
  }
}

const getChannelsByType = (type) => {
  return uploadConfig.value[type]?.channels || []
}

const getChannelTypeName = (type) => {
  const ct = channelTypes.find(c => c.type === type)
  return ct?.name || type
}

const addChannel = (type) => {
  editingChannel.value = null
  editingChannelType.value = type
  resetForm()
  showChannelDialog.value = true
}

const editChannel = (type, channel) => {
  editingChannel.value = channel
  editingChannelType.value = type
  channelForm.value = { ...channel }
  showChannelDialog.value = true
}

const deleteChannel = async (type, name) => {
  if (!confirm(t('channels.deleteConfirm', { name }))) return
  
  const channels = uploadConfig.value[type]?.channels || []
  const index = channels.findIndex(c => c.name === name)
  if (index >= 0) {
    channels.splice(index, 1)
    await saveConfig()
    showMessage(t('channels.deleteSuccess'), 'success')
  }
}

const saveChannel = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  saving.value = true
  try {
    const type = editingChannelType.value
    const channels = uploadConfig.value[type]?.channels || []
    
    if (editingChannel.value) {
      const index = channels.findIndex(c => c.name === editingChannel.value.name)
      if (index >= 0) {
        channels[index] = { ...channelForm.value }
      }
    } else {
      channels.push({ ...channelForm.value })
    }
    
    uploadConfig.value[type].channels = channels
    await saveConfig()
    closeDialog()
    showMessage(t('channels.saveSuccess'), 'success')
  } catch (error) {
    showMessage(t('settings.saveFailed'), 'error')
  } finally {
    saving.value = false
  }
}

const saveConfig = async () => {
  await configApi.updateUploadConfig(uploadConfig.value)
}

const closeDialog = () => {
  showChannelDialog.value = false
  editingChannel.value = null
  editingChannelType.value = ''
  resetForm()
}

const resetForm = () => {
  channelForm.value = {
    name: '',
    enabled: true,
    botToken: '',
    chatId: '',
    proxyUrl: '',
    publicUrl: '',
    endpoint: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    region: '',
    pathStyle: false,
    channelId: '',
    token: '',
    repo: '',
    isPrivate: false,
    baseUrl: '',
    username: '',
    password: ''
  }
}

const showMessage = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>

<style scoped>
.channel-card {
  height: 100%;
  transition: all 0.2s ease;
}

.channel-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
