<template>
  <Transition name="notification">
    <div
      v-if="visible"
      :class="['cookie-share-notification', type]"
      @click="close"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  message: string
  type?: 'success' | 'error'
  duration?: number
}>()

const visible = ref(false)
let timer: number | null = null

const close = () => {
  visible.value = false
}

onMounted(() => {
  visible.value = true
  if (props.duration !== 0) {
    timer = window.setTimeout(() => {
      close()
    }, props.duration || 3000)
  }
})

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})
</script>

<style scoped>
.cookie-share-notification {
  position: fixed !important;
  bottom: 24px !important;
  right: 24px !important;
  padding: 16px 24px !important;
  border-radius: 12px !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  background: rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #4A5567 !important;
  font-family: -apple-system, system-ui, sans-serif !important;
  font-size: 14px !important;
  cursor: pointer !important;
  z-index: 2147483647 !important;
}

.cookie-share-notification.success {
  border-left: 4px solid #91B3A7 !important;
}

.cookie-share-notification.error {
  border-left: 4px solid #FF6B6B !important;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0 !important;
  transform: translateY(30px) !important;
}
</style> 