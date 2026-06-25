<template>
  <v-layout class="auth-layout">
    <v-main>
      <div class="auth-container">
        <div class="auth-background" />
        <div class="auth-content">
          <slot />
        </div>
      </div>
    </v-main>
  </v-layout>
</template>

<script setup>
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
}

.auth-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-background {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  opacity: 0.1;
}

.auth-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: 16px;
}
</style>
