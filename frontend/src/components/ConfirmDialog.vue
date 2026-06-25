<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="overlay" @click="cancel">
        <div class="dialog glass-strong" @click.stop>
          <div class="dialog-header">
            <span class="material-icons-outlined dialog-icon" :class="type">
              {{ getIcon() }}
            </span>
            <h3 class="dialog-title">{{ title }}</h3>
          </div>
          <p class="dialog-message">{{ message }}</p>
          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="cancel">取消</button>
            <button class="btn" :class="getConfirmClass()" @click="confirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: { type: String, default: '确认' },
  message: { type: String, default: '确定要执行此操作吗？' },
  confirmText: { type: String, default: '确定' },
  type: { type: String, default: 'warning' } // warning, error, info
})

const emit = defineEmits(['confirm', 'cancel'])
const visible = ref(false)

function getIcon() {
  const icons = {
    warning: 'warning',
    error: 'error',
    info: 'info'
  }
  return icons[props.type] || 'warning'
}

function getConfirmClass() {
  const classes = {
    warning: 'btn-primary',
    error: 'btn-error',
    info: 'btn-primary'
  }
  return classes[props.type] || 'btn-primary'
}

function show() {
  visible.value = true
}

function hide() {
  visible.value = false
}

function confirm() {
  emit('confirm')
  hide()
}

function cancel() {
  emit('cancel')
  hide()
}

defineExpose({ show, hide })
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-lg);
}

.dialog {
  width: 100%;
  max-width: 400px;
  padding: var(--space-xl);
  animation: scaleIn 0.3s ease;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.dialog-icon {
  font-size: 28px;
}

.dialog-icon.warning { color: var(--warning); }
.dialog-icon.error { color: var(--error); }
.dialog-icon.info { color: var(--info); }

.dialog-title {
  font-size: 18px;
  font-weight: 600;
}

.dialog-message {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: var(--space-xl);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
