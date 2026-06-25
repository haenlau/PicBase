<template>
  <AdminLayout>
    <v-container fluid class="pa-4 pa-md-6">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div>
            <v-icon class="mr-2">mdi-server-network</v-icon>
            {{ t('settings.channels') }}
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="showAddDialog = true"
          >
            Add Channel
          </v-btn>
        </v-card-title>
        <v-divider />

        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            Configure storage channels for file uploads. Each channel type can have multiple instances.
          </v-alert>

          <!-- Channel Types -->
          <v-row>
            <v-col v-for="channelType in channelTypes" :key="channelType.type" cols="12" md="6" lg="4">
              <v-card variant="outlined" class="channel-card">
                <v-card-title class="d-flex align-center">
                  <v-icon :color="getChannelColor(channelType.type)" class="mr-2">
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
                          {{ channel.enabled ? 'Enabled' : 'Disabled' }}
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
                    <p class="text-caption text-medium-emphasis">No channels configured</p>
                  </div>

                  <v-btn
                    block
                    variant="tonal"
                    size="small"
                    class="mt-2"
                    @click="addChannel(channelType.type)"
                  >
                    <v-icon start size="small">mdi-plus</v-icon>
                    Add {{ channelType.name }}
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
          <span>{{ editingChannel ? 'Edit' : 'Add' }} {{ getChannelTypeName(editingChannelType) }}</span>
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
              label="Channel Name"
              :rules="[v => !!v || 'Name is required']"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            />

            <!-- Telegram Fields -->
            <template v-if="editingChannelType === 'telegram'">
              <v-text-field
                v-model="channelForm.botToken"
                label="Bot Token"
                :rules="[v => !!v || 'Bot Token is required']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                hint="Get from @BotFather"
                persistent-hint
              />
              <v-text-field
                v-model="channelForm.chatId"
                label="Chat ID"
                :rules="[v => !!v || 'Chat ID is required']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                hint="Channel or group ID"
                persistent-hint
              />
              <v-text-field
                v-model="channelForm.proxyUrl"
                label="Proxy URL (Optional)"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                hint="For API proxy"
                persistent-hint
              />
            </template>

            <!-- R2 Fields -->
            <template v-if="editingChannelType === 'cfr2'">
              <v-text-field
                v-model="channelForm.publicUrl"
                label="Public URL"
                :rules="[v => !!v || 'Public URL is required']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                hint="Your R2 public domain"
                persistent-hint
              />
            </template>

            <!-- S3 Fields -->
            <template v-if="editingChannelType === 's3'">
              <v-text-field
                v-model="channelForm.endpoint"
                label="Endpoint"
                :rules="[v => !!v || 'Endpoint is required']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.accessKeyId"
                label="Access Key ID"
                :rules="[v => !!v || 'Access Key ID is required']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.secretAccessKey"
                label="Secret Access Key"
                :rules="[v => !!v || 'Secret Access Key is required']"
                type="password"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.bucketName"
                label="Bucket Name"
                :rules="[v => !!v || 'Bucket Name is required']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.region"
                label="Region"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                hint="Default: auto"
                persistent-hint
              />
              <v-switch
                v-model="channelForm.pathStyle"
                label="Use Path Style"
                hint="Enable for S3-compatible services"
                persistent-hint
                density="compact"
                class="mb-4"
              />
            </template>

            <!-- Discord Fields -->
            <template v-if="editingChannelType === 'discord'">
              <v-text-field
                v-model="channelForm.botToken"
                label="Bot Token"
                :rules="[v => !!v || 'Bot Token is required']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.channelId"
                label="Channel ID"
                :rules="[v => !!v || 'Channel ID is required']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.proxyUrl"
                label="CDN Proxy URL (Optional)"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                hint="Proxy for CDN access"
                persistent-hint
              />
            </template>

            <!-- HuggingFace Fields -->
            <template v-if="editingChannelType === 'huggingface'">
              <v-text-field
                v-model="channelForm.token"
                label="API Token"
                :rules="[v => !!v || 'API Token is required']"
                type="password"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.repo"
                label="Repository"
                :rules="[v => !!v || 'Repository is required']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                hint="username/repo-name"
                persistent-hint
              />
              <v-switch
                v-model="channelForm.isPrivate"
                label="Private Repository"
                density="compact"
                class="mb-4"
              />
            </template>

            <!-- WebDAV Fields -->
            <template v-if="editingChannelType === 'webdav'">
              <v-text-field
                v-model="channelForm.baseUrl"
                label="WebDAV URL"
                :rules="[v => !!v || 'URL is required']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.username"
                label="Username"
                :rules="[v => !!v || 'Username is required']"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.password"
                label="Password"
                :rules="[v => !!v || 'Password is required']"
                type="password"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-text-field
                v-model="channelForm.publicUrl"
                label="Public URL (Optional)"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                hint="For public access"
                persistent-hint
              />
            </template>

            <!-- Enable/Disable -->
            <v-switch
              v-model="channelForm.enabled"
              label="Enabled"
              color="success"
              density="compact"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveChannel" :loading="saving">
            {{ editingChannel ? 'Update' : 'Add' }}
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
  // Telegram
  botToken: '',
  chatId: '',
  proxyUrl: '',
  // R2
  publicUrl: '',
  // S3
  endpoint: '',
  accessKeyId: '',
  secretAccessKey: '',
  bucketName: '',
  region: '',
  pathStyle: false,
  // Discord
  channelId: '',
  // HuggingFace
  token: '',
  repo: '',
  isPrivate: false,
  // WebDAV
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

const getChannelColor = (type) => {
  const ct = channelTypes.find(c => c.type === type)
  return ct?.color || 'grey'
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
  if (!confirm(`Delete channel "${name}"?`)) return
  
  const channels = uploadConfig.value[type]?.channels || []
  const index = channels.findIndex(c => c.name === name)
  if (index >= 0) {
    channels.splice(index, 1)
    await saveConfig()
    showMessage('Channel deleted', 'success')
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
      // Update existing
      const index = channels.findIndex(c => c.name === editingChannel.value.name)
      if (index >= 0) {
        channels[index] = { ...channelForm.value }
      }
    } else {
      // Add new
      channels.push({ ...channelForm.value })
    }
    
    uploadConfig.value[type].channels = channels
    await saveConfig()
    closeDialog()
    showMessage(editingChannel.value ? 'Channel updated' : 'Channel added', 'success')
  } catch (error) {
    showMessage('Failed to save channel', 'error')
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
