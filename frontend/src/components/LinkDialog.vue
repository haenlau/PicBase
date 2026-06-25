<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="overlay" @click="close">
        <div class="dialog glass-strong" @click.stop>
          <div class="dialog-header">
            <h3 class="dialog-title">
              <span class="material-icons-outlined">link</span>
              复制链接
            </h3>
            <button class="btn-icon" @click="close">
              <span class="material-icons-outlined">close</span>
            </button>
          </div>
          
          <div class="dialog-content">
            <div class="link-item" v-for="item in linkFormats" :key="item.label">
              <div class="link-label">
                <span class="material-icons-outlined" :style="{ color: item.color }">
                  {{ item.icon }}
                </span>
                {{ item.label }}
              </div>
              <div class="link-value">{{ item.value }}</div>
              <button 
                class="btn btn-sm" 
                :class="copied === item.label ? 'btn-success' : 'btn-secondary'"
                @click="copy(item)"
              >
                <span class="material-icons-outlined">
                  {{ copied === item.label ? 'check' : 'content_copy' }}
                </span>
                {{ copied === item.label ? '已复制' : '复制' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyToClipboard } from '@/utils/helpers'

const props = defineProps({
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: 'image' }
})

const visible = ref(false)
const copied = ref('')

const linkFormats = computed(() => {
  const url = props.fileUrl
  const name = props.fileName
  
  return [
    {
      label: '直链',
      icon: 'link',
      color: '#667eea',
      value: url
    },
    {
      label: 'Markdown',
      icon: 'code',
      color: '#00b894',
      value: `![${name}](${url})`
    },
    {
      label: 'HTML',
      icon: 'language',
      color: '#4ecdc4',
      value: `<img src="${url}" alt="${name}" />`
    },
    {
      label: 'BBCode',
      icon: 'brackets',
      color: '#ffeaa7',
      value: `[img]${url}[/img]`
    }
  ]
})

function show() {
  visible.value = true
  copied.value = ''
}

function close() {
  visible.value = false
}

async function copy(item) {
  const success = await copyToClipboard(item.value)
  if (success) {
    copied.value = item.label
    setTimeout(() => {
      if (copied.value === item.label) {
        copied.value = ''
      }
    }, 2000)
  }
}

defineExpose({ show, close })
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
  max-width: 500px;
  padding: var(--space-xl);
  animation: scaleIn 0.3s ease;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 18px;
  font-weight: 600;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.link-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.link-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.link-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-width: 100px;
  font-size: 13px;
  font-weight: 500;
}

.link-label .material-icons-outlined {
  font-size: 18px;
}

.link-value {
  flex: 1;
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
  font-family: monospace;
  max-height: 40px;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .link-item {
    flex-wrap: wrap;
  }
  
  .link-label {
    min-width: auto;
    width: 100%;
  }
  
  .link-value {
    width: 100%;
  }
}
</style>
