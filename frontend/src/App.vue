<template>
  <div class="app">
    <NavBar @refresh="handleRefresh" />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" ref="pageRef" />
        </Transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NavBar from './components/NavBar.vue'

const pageRef = ref(null)

function handleRefresh() {
  if (pageRef.value?.refresh) {
    pageRef.value.refresh()
  } else {
    window.location.reload()
  }
}
</script>

<style>
.app {
  min-height: 100vh;
}

.main-content {
  padding-top: 80px;
  min-height: 100vh;
}

.page-enter-active {
  animation: fadeInUp 0.3s ease;
}

.page-leave-active {
  animation: fadeInUp 0.3s ease reverse;
}
</style>
