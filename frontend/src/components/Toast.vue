<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast glass"
          :class="toast.type"
        >
          <span class="material-icons-outlined toast-icon">
            {{ getIcon(toast.type) }}
          </span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click="remove(toast.id)">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

function getIcon(type) {
  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }
  return icons[type] || 'info'
}

function add(message, type = 'info', duration = 3000) {
  const id = nextId++
  toasts.value.push({ id, message, type })
  
  if (duration > 0) {
    setTimeout(() => remove(id), duration)
  }
  
  return id
}

function remove(id) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

function success(message, duration) {
  return add(message, 'success', duration)
}

function error(message, duration) {
  return add(message, 'error', duration)
}

function warning(message, duration) {
  return add(message, 'warning', duration)
}

function info(message, duration) {
  return add(message, 'info', duration)
}

defineExpose({ add, remove, success, error, warning, info })
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  animation: slideInRight 0.3s ease;
}

.toast.success {
  border-left: 4px solid var(--success);
}

.toast.error {
  border-left: 4px solid var(--error);
}

.toast.warning {
  border-left: 4px solid var(--warning);
}

.toast.info {
  border-left: 4px solid var(--info);
}

.toast-icon {
  font-size: 20px;
}

.toast.success .toast-icon { color: var(--success); }
.toast.error .toast-icon { color: var(--error); }
.toast.warning .toast-icon { color: var(--warning); }
.toast.info .toast-icon { color: var(--info); }

.toast-message {
  flex: 1;
  font-size: 14px;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
}

.toast-close:hover {
  color: var(--text-primary);
}

.toast-enter-active {
  animation: slideInRight 0.3s ease;
}

.toast-leave-active {
  animation: slideInRight 0.3s ease reverse;
}
</style>
