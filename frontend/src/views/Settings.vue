<template>
  <v-container fluid class="pa-4 pa-md-6">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">安全设置</h1>
      <p class="text-body-1 text-medium-emphasis mt-1">配置管理员账号和安全选项</p>
    </div>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-shield-account</v-icon>
            管理员设置
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-form @submit.prevent="saveSecurity">
              <v-text-field
                v-model="securitySettings.username"
                label="用户名"
                prepend-inner-icon="mdi-account"
                hint="留空表示无用户名"
                persistent-hint
                class="mb-4"
              />
              <v-text-field
                v-model="securitySettings.password"
                label="密码"
                type="password"
                prepend-inner-icon="mdi-lock"
                hint="留空表示不修改"
                persistent-hint
                class="mb-4"
              />
              <v-btn type="submit" color="primary" :loading="saving">
                <v-icon start>mdi-content-save</v-icon>
                保存
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-information</v-icon>
            安全说明
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-list>
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-account-key</v-icon>
                </template>
                <v-list-item-title>管理员账号</v-list-item-title>
                <v-list-item-subtitle>用于登录管理后台，管理文件和配置</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template #prepend>
                  <v-icon color="warning">mdi-shield-alert</v-icon>
                </template>
                <v-list-item-title>密码安全</v-list-item-title>
                <v-list-item-subtitle>建议设置强密码，定期更换</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon color="info">mdi-cookie</v-icon>
                </template>
                <v-list-item-title>会话管理</v-list-item-title>
                <v-list-item-subtitle>登录状态通过 Cookie 保存，有效期 14 天</v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <v-alert type="warning" variant="tonal" class="mt-4">
              <strong>注意：</strong>如果忘记密码，需要在 Cloudflare Dashboard 中删除 D1 数据库的 <code>manage@sysConfig@security</code> 记录来重置。
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="bottom right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const saving = ref(false)
const securitySettings = ref({
  username: '',
  password: ''
})

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

onMounted(() => {
  fetchSecurity()
})

async function fetchSecurity() {
  try {
    const data = await api.get('/api/manage/sysConfig/security')
    securitySettings.value = {
      username: data.auth?.admin?.adminUsername || '',
      password: ''
    }
  } catch (err) {
    console.error('Failed to fetch security config:', err)
  }
}

async function saveSecurity() {
  saving.value = true
  try {
    await api.post('/api/manage/sysConfig/security', {
      auth: {
        admin: {
          adminUsername: securitySettings.value.username,
          adminPassword: securitySettings.value.password
        }
      }
    })
    showMessage('保存成功', 'success')
  } catch (err) {
    showMessage('保存失败', 'error')
  } finally {
    saving.value = false
  }
}

function showMessage(text, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>
