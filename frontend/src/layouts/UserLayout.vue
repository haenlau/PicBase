<template>
  <v-layout>
    <TopBar :show-nav-toggle="false">
      <template #prepend>
        <v-btn
          icon
          variant="text"
          @click="$router.push('/')"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </template>
    </TopBar>
    <v-main>
      <slot />
    </v-main>
  </v-layout>
</template>

<script setup>
import TopBar from '@/components/layout/TopBar.vue'
</script>
