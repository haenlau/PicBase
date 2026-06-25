<template>
  <AuthLayout>
    <v-card class="text-center pa-8">
      <v-card-text>
        <h1 class="text-h1 font-weight-bold text-primary mb-4">404</h1>
        <h2 class="text-h4 font-weight-medium mb-2">{{ t('notFound.message') }}</h2>
        <p class="text-body-1 text-medium-emphasis mb-6">{{ t('notFound.description') }}</p>
        <v-btn
          color="primary"
          size="large"
          to="/"
        >
          <v-icon start>mdi-home</v-icon>
          {{ t('notFound.backHome') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </AuthLayout>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/layouts/AuthLayout.vue'

const { t } = useI18n()
</script>
