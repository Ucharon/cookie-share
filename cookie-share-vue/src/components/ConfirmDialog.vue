<template>
  <Transition name="dialog">
    <div v-if="visible" class="cookie-share-overlay" @click="handleOverlayClick">
      <div class="cookie-share-dialog">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="dialog-buttons">
          <button class="cancel-btn" @click="handleCancel">{{ cancelText }}</button>
          <button class="confirm-btn" @click="handleConfirm">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  closeOnClickOverlay?: boolean
}>(), {
  title: '确认',
  confirmText: '确认',
  cancelText: '取消',
  closeOnClickOverlay: true
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const visible = ref(true)

const handleConfirm = () => {
  visible.value = false
  emit('confirm')
}

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget && props.closeOnClickOverlay) {
    handleCancel()
  }
}
</script>

<style scoped>
.cookie-share-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.4) !important;
  backdrop-filter: blur(2px) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 2147483647 !important;
}

.cookie-share-dialog {
  background: rgba(255, 255, 255, 0.95) !important;
  padding: 24px !important;
  border-radius: 12px !important;
  text-align: center !important;
  min-width: 320px !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15) !important;
}

.cookie-share-dialog h3 {
  margin: 0 0 16px 0 !important;
  color: #4A5567 !important;
  font-size: 18px !important;
}

.cookie-share-dialog p {
  margin: 0 0 24px 0 !important;
  color: #666 !important;
}

.dialog-buttons {
  display: flex !important;
  gap: 12px !important;
  justify-content: center !important;
}

.dialog-buttons button {
  padding: 8px 24px !important;
  border-radius: 6px !important;
  border: none !important;
  cursor: pointer !important;
  min-width: 100px !important;
  transition: all 0.3s ease !important;
  font-size: 14px !important;
}

.cancel-btn {
  background: #91B3A7 !important;
  color: white !important;
}

.cancel-btn:hover {
  background: #7A9B8F !important;
  transform: translateY(-1px) !important;
}

.confirm-btn {
  background: #FF6B6B !important;
  color: white !important;
}

.confirm-btn:hover {
  background: #FF5252 !important;
  transform: translateY(-1px) !important;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s ease !important;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0 !important;
}

.dialog-enter-from .cookie-share-dialog,
.dialog-leave-to .cookie-share-dialog {
  transform: scale(0.9) !important;
}
</style> 