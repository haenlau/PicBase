<template>
  <v-container fluid class="pa-4 pa-md-6">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">渠道配置</h1>
      <p class="text-body-1 text-medium-emphasis mt-1">配置文件上传的存储渠道</p>
    </div>

    <v-row>
      <v-col v-for="type in channelTypes" :key="type.id" cols="12" md="6" lg="4">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon :color="type.color" class="mr-2">{{ type.icon }}</v-icon>
            {{ type.name }}
            <v-spacer />
            <v-chip
              v-if="type.id === 'cfr2'"
              :color="hasR2Binding ? 'success' : 'warning'"
              size="small"
              variant="tonal"
            >
              {{ hasR2Binding ? '已绑定' : '未绑定' }}
            </v-chip>
          </v-card-title>
          <v-card-subtitle>{{ type.description }}</v-card-subtitle>
          <v-divider />
          <v-card-text>
            <!-- R2 特殊提示 -->
            <div v-if="type.id === 'cfr2'" class="text-center py-4">
              <v-icon v-if="!hasR2Binding" size="48" color="warning" class="mb-2">mdi-alert-circle-outline</v-icon>
              <v-icon v-else size="48" color="success" class="mb-2">mdi-check-circle-outline</v-icon>
              
              <p class="text-body-2 mb-2">
                {{ hasR2Binding ? 'R2 存储桶已绑定' : '请在 Cloudflare Dashboard 中绑定 R2' }}
              </p>
              
              <v-card v-if="!hasR2Binding" variant="tonal" color="info" class="text-left mt-3">
                <v-card-text class="pa-3">
                  <p class="text-caption font-weight-bold mb-1">绑定步骤：</p>
                  <ol class="text-caption pl-4">
                    <li>进入 Cloudflare Dashboard</li>
                    <li>选择 Pages 项目</li>
                    <li>设置 → 函数 → R2 存储桶</li>
                    <li>添加绑定：<code>img_r2</code></li>
                  </ol>
                </v-card-text>
              </v-card>
            </div>

            <!-- 其他渠道 -->
            <div v-else-if="getChannelsByType(type.id).length === 0" class="text-medium-emphasis text-center py-4">
              未配置
            </div>
            <v-list v-else density="compact">
              <v-list-item v-for="ch in getChannelsByType(type.id)" :key="ch.name">
                <template #prepend>
                  <v-icon :color="ch.enabled ? 'success' : 'grey'">
                    {{ ch.enabled ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                  </v-icon>
                </template>
                <v-list-item-title>{{ ch.name }}</v-list-item-title>
                <template #append>
                  <v-btn icon size="x-small" variant="text" @click="editChannel(type.id, ch)">
                    <v-icon size="small">mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn icon size="x-small" variant="text" color="error" @click="deleteChannel(type.id, ch)">
                    <v-icon size="small">mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              v-if="type.id !== 'cfr2'"
              variant="tonal"
              size="small"
              @click="addChannel(type.id)"
            >
              <v-icon start>mdi-plus</v-icon>
              添加
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 渠道配置弹窗 -->
    <v-dialog v-model="showChannelDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ editingChannel ? '编辑' : '添加' }} {{ getChannelTypeName(editingChannelType) }}</span>
          <v-btn icon variant="text" @click="showChannelDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="channelFormRef">
            <v-text-field
              v-model="channelForm.name"
              label="渠道名称"
              :rules="[v => !!v || '请输入名称']"
              class="mb-2"
            />

            <!-- Telegram -->
            <template v-if="editingChannelType === 'telegram'">
              <v-text-field v-model="channelForm.botToken" label="Bot Token" :rules="[v => !!v || '请输入Bot Token']" class="mb-2" />
              <v-text-field v-model="channelForm.chatId" label="Chat ID" :rules="[v => !!v || '请输入Chat ID']" class="mb-2" />
              <v-text-field v-model="channelForm.proxyUrl" label="代理URL（可选）" class="mb-2" />
            </template>

            <!-- S3 -->
            <template v-if="editingChannelType === 's3'">
              <v-text-field v-model="channelForm.endpoint" label="端点" :rules="[v => !!v || '请输入端点']" class="mb-2" />
              <v-text-field v-model="channelForm.accessKeyId" label="Access Key ID" :rules="[v => !!v || '请输入Access Key ID']" class="mb-2" />
              <v-text-field v-model="channelForm.secretAccessKey" label="Secret Access Key" type="password" :rules="[v => !!v || '请输入Secret Access Key']" class="mb-2" />
              <v-text-field v-model="channelForm.bucketName" label="存储桶名称" :rules="[v => !!v || '请输入存储桶名称']" class="mb-2" />
              <v-text-field v-model="channelForm.region" label="区域" placeholder="auto" class="mb-2" />
            </template>

            <!-- Discord -->
            <template v-if="editingChannelType === 'discord'">
              <v-text-field v-model="channelForm.botToken" label="Bot Token" :rules="[v => !!v || '请输入Bot Token']" class="mb-2" />
              <v-text-field v-model="channelForm.channelId" label="频道ID" :rules="[v => !!v || '请输入频道ID']" class="mb-2" />
            </template>

            <!-- HuggingFace -->
            <template v-if="editingChannelType === 'huggingface'">
              <v-text-field v-model="channelForm.token" label="API Token" type="password" :rules="[v => !!v || '请输入Token']" class="mb-2" />
              <v-text-field v-model="channelForm.repo" label="仓库" :rules="[v => !!v || '请输入仓库']" placeholder="username/repo" class="mb-2" />
            </template>

            <!-- WebDAV -->
            <template v-if="editingChannelType === 'webdav'">
              <v-text-field v-model="channelForm.baseUrl" label="WebDAV URL" :rules="[v => !!v || '请输入URL']" class="mb-2" />
              <v-text-field v-model="channelForm.username" label="用户名" :rules="[v => !!v || '请输入用户名']" class="mb-2" />
              <v-text-field v-model="channelForm.password" label="密码" type="password" :rules="[v => !!v || '请输入密码']" class="mb-2" />
              <v-text-field v-model="channelForm.publicUrl" label="公共URL（可选）" class="mb-2" />
            </template>

            <v-switch
              v-model="channelForm.enabled"
              label="启用"
              color="success"
              hide-details
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showChannelDialog = false">取消</v-btn>
          <v-btn color="primary" @click="saveChannel" :loading="savingChannel">
            {{ editingChannel ? '保存' : '添加' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 确认弹窗 -->
    <v-dialog v-model="showConfirm" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          删除渠道
        </v-card-title>
        <v-card-text>确定要删除 "{{ deleteTarget?.name }}" 吗？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showConfirm = false">取消</v-btn>
          <v-btn color="error" @click="doDeleteChannel">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="bottom right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api'

const uploadConfig = ref({
  telegram: { channels: [] },
  cfr2: { channels: [] },
  s3: { channels: [] },
  discord: { channels: [] },
  huggingface: { channels: [] },
  webdav: { channels: [] }
})

const showChannelDialog = ref(false)
const editingChannel = ref(null)
const editingChannelType = ref('')
const savingChannel = ref(false)
const channelFormRef = ref(null)
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
  region: 'auto',
  channelId: '',
  token: '',
  repo: '',
  baseUrl: '',
  username: '',
  password: ''
})

const showConfirm = ref(false)
const deleteTarget = ref(null)
const deleteType = ref('')

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const channelTypes = [
  { id: 'telegram', name: 'Telegram', icon: 'mdi-telegram', color: '#0088cc', description: '上传到 Telegram 频道' },
  { id: 'cfr2', name: 'Cloudflare R2', icon: 'mdi-cloud', color: '#F38020', description: 'Cloudflare R2 存储' },
  { id: 's3', name: 'S3 兼容', icon: 'mdi-aws', color: '#FF9900', description: 'AWS S3 或兼容服务' },
  { id: 'discord', name: 'Discord', icon: 'mdi-discord', color: '#5865F2', description: '上传到 Discord 频道' },
  { id: 'huggingface', name: 'HuggingFace', icon: 'mdi-face-man', color: '#FFD21E', description: 'HuggingFace 仓库' },
  { id: 'webdav', name: 'WebDAV', icon: 'mdi-folder-network', color: '#4CAF50', description: 'WebDAV 服务' }
]

const hasR2Binding = computed(() => {
  const r2Channels = uploadConfig.value.cfr2?.channels || []
  return r2Channels.some(ch => ch.savePath === 'environment variable' || ch.name === 'R2_env')
})

onMounted(() => {
  fetchUploadConfig()
})

async function fetchUploadConfig() {
  try {
    const data = await api.get('/api/manage/sysConfig/upload')
    uploadConfig.value = data
  } catch (err) {
    console.error('Failed to fetch upload config:', err)
  }
}

function getChannelsByType(type) {
  return uploadConfig.value[type]?.channels || []
}

function getChannelTypeName(type) {
  const found = channelTypes.find(t => t.id === type)
  return found?.name || type
}

function addChannel(type) {
  editingChannel.value = null
  editingChannelType.value = type
  resetChannelForm()
  showChannelDialog.value = true
}

function editChannel(type, channel) {
  editingChannel.value = channel
  editingChannelType.value = type
  channelForm.value = { ...channel }
  showChannelDialog.value = true
}

function resetChannelForm() {
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
    region: 'auto',
    channelId: '',
    token: '',
    repo: '',
    baseUrl: '',
    username: '',
    password: ''
  }
}

async function saveChannel() {
  const { valid } = await channelFormRef.value.validate()
  if (!valid) return

  savingChannel.value = true
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
    await api.post('/api/manage/sysConfig/upload', uploadConfig.value)
    
    showChannelDialog.value = false
    showMessage(editingChannel.value ? '保存成功' : '添加成功', 'success')
  } catch (err) {
    showMessage('保存失败', 'error')
  } finally {
    savingChannel.value = false
  }
}

function deleteChannel(type, channel) {
  deleteTarget.value = channel
  deleteType.value = type
  showConfirm.value = true
}

async function doDeleteChannel() {
  showConfirm.value = false
  try {
    const channels = uploadConfig.value[deleteType.value]?.channels || []
    const index = channels.findIndex(c => c.name === deleteTarget.value.name)
    if (index >= 0) {
      channels.splice(index, 1)
      await api.post('/api/manage/sysConfig/upload', uploadConfig.value)
      showMessage('删除成功', 'success')
    }
  } catch (err) {
    showMessage('删除失败', 'error')
  }
}

function showMessage(text, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>
