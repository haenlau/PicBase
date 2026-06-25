<template>
  <AuthLayout>
    <v-card class="pa-4 pa-md-8">
      <v-card-item class="text-center mb-4">
        <v-avatar size="64" color="primary" rounded="xl" class="mb-4">
          <v-icon size="36" color="white">mdi-shield-crown</v-icon>
        </v-avatar>
        <v-card-title class="text-h4 font-weight-bold">{{ t('auth.adminLogin') }}</v-card-title>
        <v-card-subtitle>{{ t('auth.enterUsername') }} & {{ t('auth.enterPassword') }}</v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <v-form @submit.prevent="handleLogin" ref="formRef">
          <v-text-field
            v-model="username"
            :label="t('auth.username')"
            prepend-inner-icon="mdi-account"
            :rules="usernameRules"
            :disabled="loading"
            autofocus
            class="mb-2"
          />

          <v-text-field
            v-model="password"
            :label="t('auth.password')"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
            :rules="passwordRules"
            :disabled="loading"
            class="mb-4"
          />

          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            closable
            class="mb-4"
            @click:close="error = ''"
          >
            {{ error }}
          </v-alert>

          <v-btn
            type="submit"
            block
            size="large"
            color="primary"
            :loading="loading"
            class="mb-4"
          >
            {{ t('auth.login') }}
          </v-btn>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn
          variant="text"
          size="small"
          to="/login"
        >
          {{ t('auth.login') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()

const formRef = ref(null)
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const usernameRules = [
  v => !!v || t('auth.enterUsername')
]

const passwordRules = [
  v => !!v || t('auth.enterPassword')
]

const handleLogin = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  error.value = ''

  const result = await authStore.adminLogin(username.value, password.value)
  
  if (result.success) {
    const redirect = route.query.redirect || '/admin/dashboard'
    router.push(redirect)
  } else {
    error.value = result.message
  }

  loading.value = false
}
</script>
