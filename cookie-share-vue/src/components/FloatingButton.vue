<template>
  <button
    v-show="isVisible"
    class="cookie-share-floating-btn"
    @click="$emit('click')"
    ref="floatingBtn"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <path
        fill="#91B3A7"
        d="M21.598 13.789c-1.646-.583-2.76-2.145-2.76-3.891 0-.284-.1-.516-.316-.715-.184-.15-.466-.217-.699-.183-1.397.2-2.728-.2-3.743-1.015-1.015-.816-1.73-2.045-1.847-3.476-.017-.25-.167-.483-.383-.633-.217-.133-.483-.167-.732-.067-2.262.815-4.391-.616-5.239-2.562-.167-.366-.549-.566-.949-.482-3.193.715-6.07 2.72-8.031 5.248C-6.804 11.66-6.354 19.82.366 26.54c5.538 5.53 14.48 5.53 20.002 0 2.562-2.562 4.257-6.22 4.257-10.11-.033-.55-.05-.915-.566-1.098z"
      />
      <circle fill="#4A5567" cx="10" cy="12" r="1.5" />
      <circle fill="#4A5567" cx="16" cy="9" r="1.5" />
      <circle fill="#4A5567" cx="14" cy="15" r="1.5" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useGMValue } from '../composables/useGMValue'

const props = defineProps<{
  autoHideFullscreen?: boolean
}>()

defineEmits<{
  (e: 'click'): void
}>()

const floatingBtn = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const { value: showFloatingButton } = useGMValue('cookie_share_show_floating_button', true)

const isVisible = computed(() => {
  if (!showFloatingButton.value) return false
  if (props.autoHideFullscreen && isFullscreen.value) return false
  return true
})

// 拖拽相关状态
let isDragging = false
let currentX = 0
let currentY = 0
let initialX = 0
let initialY = 0

const handleFullscreenChange = () => {
  isFullscreen.value = Boolean(
    document.fullscreenElement || 
    (document as any).webkitFullscreenElement
  )
}

const dragStart = (e: MouseEvent) => {
  if (!floatingBtn.value) return
  
  isDragging = true
  initialX = e.clientX - floatingBtn.value.offsetLeft
  initialY = e.clientY - floatingBtn.value.offsetTop
  floatingBtn.value.style.transition = 'none'
}

const dragEnd = () => {
  isDragging = false
  if (floatingBtn.value) {
    floatingBtn.value.style.transition = ''
  }
}

const drag = (e: MouseEvent) => {
  if (!isDragging || !floatingBtn.value) return

  e.preventDefault()
  currentX = e.clientX - initialX
  currentY = e.clientY - initialY

  // 确保不会拖出屏幕
  const maxX = window.innerWidth - floatingBtn.value.offsetWidth
  const maxY = window.innerHeight - floatingBtn.value.offsetHeight

  currentX = Math.min(Math.max(0, currentX), maxX)
  currentY = Math.min(Math.max(0, currentY), maxY)

  floatingBtn.value.style.left = `${currentX}px`
  floatingBtn.value.style.top = `${currentY}px`
}

onMounted(() => {
  if (floatingBtn.value) {
    floatingBtn.value.addEventListener('mousedown', dragStart)
    document.addEventListener('mousemove', drag)
    document.addEventListener('mouseup', dragEnd)
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  if (floatingBtn.value) {
    floatingBtn.value.removeEventListener('mousedown', dragStart)
    document.removeEventListener('mousemove', drag)
    document.removeEventListener('mouseup', dragEnd)
  }

  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
.cookie-share-floating-btn {
  position: fixed !important;
  bottom: 20px !important;
  left: 20px !important;
  width: 32px !important;
  height: 32px !important;
  backdrop-filter: blur(4px) !important;
  -webkit-backdrop-filter: blur(4px) !important;
  background: rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  z-index: 2147483645 !important;
  transition: transform 0.3s ease !important;
  padding: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.cookie-share-floating-btn:hover {
  transform: scale(1.125) !important;
}

.cookie-share-floating-btn svg {
  width: 24px !important;
  height: 24px !important;
  transform: rotate(0deg) !important;
}
</style> 