<template>
  <button
    v-show="isVisible"
    class="cookie-share-floating-btn"
    @click="$emit('click')"
    ref="floatingBtn"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <path
        fill="currentColor"
        d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useGMValue } from '../composables/useGMValue'

const props = defineProps<{
  autoHideFullscreen?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const floatingBtn = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const isEntering = ref(true) // 控制入场动画
const isMobile = ref(false) // 是否为移动端
const isDragging = ref(false) // 改为响应式引用
const startTime = ref(0) // 记录点击开始时间
const { value: showFloatingButton } = useGMValue('cookie_share_show_floating_button', true)
const { value: buttonPosition } = useGMValue('cookie_share_button_position', window.innerHeight / 2)

// 检测是否为移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768 || 'ontouchstart' in window
}

// 计算边缘吸附区域
const EDGE_THRESHOLD = 50 // 距离边缘多少像素触发吸附
const BUTTON_MARGIN = isMobile.value ? 12 : 20 // 按钮距离边缘的最小距离
const DRAG_THRESHOLD = isMobile.value ? 10 : 5 // 点击判定阈值
const CLICK_TIMEOUT = 200 // 点击判定时间阈值（毫秒）

// 拖拽相关状态
let initialY = 0
let currentY = 0
let startY = 0 // 记录开始位置

// 计算吸附位置
const calculateSnapPosition = (y: number): number => {
  if (!floatingBtn.value) return y

  const buttonHeight = floatingBtn.value.offsetHeight
  const maxY = window.innerHeight - buttonHeight - BUTTON_MARGIN

  // 顶部吸附
  if (y < EDGE_THRESHOLD) {
    return BUTTON_MARGIN
  }
  // 底部吸附
  if (y > maxY - EDGE_THRESHOLD) {
    return maxY
  }
  return y
}

// 更新按钮位置
const updateButtonPosition = (y: number) => {
  if (!floatingBtn.value) return

  const buttonHeight = floatingBtn.value.offsetHeight
  const maxY = window.innerHeight - buttonHeight - BUTTON_MARGIN
  const validY = Math.min(Math.max(BUTTON_MARGIN, y), maxY)
  
  floatingBtn.value.style.top = `${validY}px`
  buttonPosition.value = validY
  currentY = validY
}

// 处理窗口大小变化
const handleResize = () => {
  if (!floatingBtn.value) return

  const buttonHeight = floatingBtn.value.offsetHeight
  const maxY = window.innerHeight - buttonHeight - BUTTON_MARGIN
  
  // 如果之前位置靠近边缘，保持吸附
  if (buttonPosition.value <= EDGE_THRESHOLD + BUTTON_MARGIN) {
    updateButtonPosition(BUTTON_MARGIN)
  } else if (buttonPosition.value >= maxY - EDGE_THRESHOLD) {
    updateButtonPosition(maxY)
  } else {
    updateButtonPosition(buttonPosition.value)
  }
}

const isVisible = computed(() => {
  if (!showFloatingButton.value) return false
  if (props.autoHideFullscreen && isFullscreen.value) return false
  return true
})

const handleFullscreenChange = () => {
  isFullscreen.value = Boolean(
    document.fullscreenElement || 
    (document as any).webkitFullscreenElement
  )
}

const dragStart = (e: MouseEvent) => {
  if (!floatingBtn.value) return
  
  isDragging.value = true
  startTime.value = Date.now()
  currentY = buttonPosition.value
  startY = e.clientY
  initialY = e.clientY - currentY
  floatingBtn.value.style.transition = 'none'
}

const dragEnd = (e: MouseEvent) => {
  if (!isDragging.value || !floatingBtn.value) return

  const endTime = Date.now()
  const moveDistance = Math.abs(e.clientY - startY)
  const isClick = moveDistance < DRAG_THRESHOLD && (endTime - startTime.value) < CLICK_TIMEOUT

  isDragging.value = false
  floatingBtn.value.style.transition = ''

  if (isClick) {
    emit('click')
    return
  }

  // 计算吸附位置
  const snapPosition = calculateSnapPosition(currentY)
  updateButtonPosition(snapPosition)
}

// 通用拖动处理函数
const handleDrag = (clientY: number) => {
  if (!isDragging.value || !floatingBtn.value) return

  // 计算新的Y坐标
  currentY = clientY - initialY

  // 确保不会拖出屏幕
  const maxY = window.innerHeight - floatingBtn.value.offsetHeight - BUTTON_MARGIN
  currentY = Math.min(Math.max(BUTTON_MARGIN, currentY), maxY)

  floatingBtn.value.style.top = `${currentY}px`
}

const drag = (e: MouseEvent) => {
  e.preventDefault()
  handleDrag(e.clientY)
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value || !floatingBtn.value || e.touches.length !== 1) return
  e.preventDefault()
  handleDrag(e.touches[0].clientY)
}

// 触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
  if (!floatingBtn.value || e.touches.length !== 1) return
  
  isDragging.value = true
  startTime.value = Date.now()
  currentY = buttonPosition.value
  startY = e.touches[0].clientY
  initialY = e.touches[0].clientY - currentY
  floatingBtn.value.style.transition = 'none'
}

const handleTouchEnd = (e: TouchEvent) => {
  if (!isDragging.value || !floatingBtn.value) return

  const endTime = Date.now()
  const moveDistance = Math.abs(e.changedTouches[0].clientY - startY)
  const isClick = moveDistance < DRAG_THRESHOLD && (endTime - startTime.value) < CLICK_TIMEOUT

  isDragging.value = false
  floatingBtn.value.style.transition = ''

  if (isClick) {
    emit('click')
    return
  }

  // 计算吸附位置
  const snapPosition = calculateSnapPosition(currentY)
  updateButtonPosition(snapPosition)
}

onMounted(() => {
  // 检测设备类型
  checkMobile()
  window.addEventListener('resize', checkMobile)

  if (floatingBtn.value) {
    // 设置初始位置（考虑边界）
    const buttonHeight = floatingBtn.value.offsetHeight
    const maxY = window.innerHeight - buttonHeight - BUTTON_MARGIN
    const initialY = Math.min(Math.max(BUTTON_MARGIN, buttonPosition.value), maxY)
    
    // 设置初始状态（在视图外）
    floatingBtn.value.style.transform = 'translateX(100%)'
    updateButtonPosition(initialY)

    // 触发入场动画
    requestAnimationFrame(() => {
      if (floatingBtn.value) {
        floatingBtn.value.style.transform = 'translateX(0)'
        // 动画结束后标记入场完成
        setTimeout(() => {
          isEntering.value = false
        }, 300)
      }
    })
    
    // 添加触摸事件监听
    floatingBtn.value.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    
    // 桌面端事件
    floatingBtn.value.addEventListener('mousedown', dragStart)
    document.addEventListener('mousemove', drag)
    document.addEventListener('mouseup', dragEnd)
  }

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)

  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  if (floatingBtn.value) {
    // 移除触摸事件监听
    floatingBtn.value.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    
    // 移除桌面端事件
    floatingBtn.value.removeEventListener('mousedown', dragStart)
    document.removeEventListener('mousemove', drag)
    document.removeEventListener('mouseup', dragEnd)
  }

  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('resize', handleResize)

  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
.cookie-share-floating-btn {
  position: fixed !important;
  right: -24px !important;
  width: 36px !important;
  height: 48px !important;
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.15),
              0 2px 8px rgba(0, 0, 0, 0.1),
              inset -1px 0 0 rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-right: none !important;
  border-radius: 24px 0 0 24px !important;
  cursor: pointer !important;
  z-index: 2147483645 !important;
  padding: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: rgba(0, 0, 0, 0.75) !important;
  touch-action: none !important;
  -webkit-tap-highlight-color: transparent !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  
  /* 优化动画效果 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease !important;
  transform: translateX(0) !important;
  will-change: transform, right, background-color, color, box-shadow !important;
  backface-visibility: hidden !important;
  -webkit-backface-visibility: hidden !important;
  -webkit-transform-style: preserve-3d !important;
  
  /* 添加渐变边框效果 */
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.95),
    rgba(240, 240, 240, 0.95)
  ) !important;
}

/* 移动端样式调整 */
@media (max-width: 768px) {
  .cookie-share-floating-btn {
    width: 32px !important;
    height: 42px !important;
    right: -20px !important;
    padding: 6px !important;
    box-shadow: -1px 0 8px rgba(0, 0, 0, 0.12),
                0 1px 6px rgba(0, 0, 0, 0.08),
                inset -1px 0 0 rgba(0, 0, 0, 0.05) !important;
  }

  .cookie-share-floating-btn:hover {
    right: -10px !important;
  }

  .cookie-share-floating-btn:active {
    right: -6px !important;
  }

  .cookie-share-floating-btn svg {
    width: 20px !important;
    height: 20px !important;
  }
}

/* 移动端点击态优化 */
@media (hover: none) {
  .cookie-share-floating-btn:hover {
    right: -24px !important;
    transform: none !important;
    background: rgba(255, 255, 255, 0.95) !important;
  }
}

/* 拖拽时禁用所有过渡效果 */
.cookie-share-floating-btn[style*="transition: none"] {
  transition: none !important;
  animation: none !important;
  right: -24px !important;
  transform: translateX(0) !important;
}

/* 非拖拽状态下的悬停效果 */
.cookie-share-floating-btn:not([style*="transition: none"]):hover {
  right: -12px !important;
  background: rgba(255, 255, 255, 0.98) !important;
  color: rgba(0, 0, 0, 0.85) !important;
  transform: translateX(-2px) !important;
  box-shadow: -3px 0 16px rgba(0, 0, 0, 0.18),
              0 3px 12px rgba(0, 0, 0, 0.12),
              inset -1px 0 0 rgba(0, 0, 0, 0.08) !important;
  
  /* 悬停时的渐变效果 */
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.98),
    rgba(245, 245, 245, 0.98)
  ) !important;
}

/* 非拖拽状态下的点击效果 */
.cookie-share-floating-btn:not([style*="transition: none"]):active {
  right: -8px !important;
  transform: translateX(-4px) scale(0.98) !important;
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: -1px 0 8px rgba(0, 0, 0, 0.15),
              0 1px 4px rgba(0, 0, 0, 0.1),
              inset -1px 0 0 rgba(0, 0, 0, 0.08) !important;
  
  /* 点击时的渐变效果 */
  background-image: linear-gradient(
    to bottom,
    rgba(240, 240, 240, 0.95),
    rgba(235, 235, 235, 0.95)
  ) !important;
}

.cookie-share-floating-btn svg {
  width: 24px !important;
  height: 24px !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  opacity: 0.85 !important;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1)) !important;
}

/* 悬停时图标效果 */
.cookie-share-floating-btn:hover svg {
  transform: translateX(-2px) !important;
  opacity: 0.95 !important;
}

/* 点击时图标效果 */
.cookie-share-floating-btn:active svg {
  transform: translateX(-1px) scale(0.95) !important;
  opacity: 1 !important;
}

/* 暗色背景适配 */
@media (prefers-color-scheme: dark) {
  .cookie-share-floating-btn {
    background: rgba(245, 245, 245, 0.98) !important;
    box-shadow: -2px 0 16px rgba(0, 0, 0, 0.25),
                0 2px 12px rgba(0, 0, 0, 0.2),
                inset -1px 0 0 rgba(0, 0, 0, 0.1) !important;
  }
}
</style> 