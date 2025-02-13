<template>
  <el-popover
    v-model:visible="showPopover"
    :width="300"
    trigger="hover"
    :placement="position.side === 'left' ? 'right' : 'left'"
    :show-arrow="true"
    :offset="12"
    popper-class="cookie-list-popover"
    @show="handlePopoverShow"
    :hide-after="0"
  >
    <template #reference>
      <button
        v-show="isVisible"
        class="cookie-share-floating-btn"
        :data-side="position.side"
        @mousedown="handleMouseDown"
        @touchstart="handleTouchStart"
        @click="handleClick"
        ref="floatingBtn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path
            fill="currentColor"
            :d="position.side === 'left' 
              ? 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z'
              : 'M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z'"
          />
        </svg>
      </button>
    </template>

    <div class="quick-cookie-list">
      <div class="quick-cookie-header">
        <span class="title">快速导入</span>
        <el-button 
          type="primary" 
          link 
          :loading="loading" 
          @click="loadCookieList"
          class="refresh-btn"
        >
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>

      <div v-if="loading" class="loading-state">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="savedCookies.length === 0" class="empty-state">
        <p>从主面板添加常用 Cookie</p>
        <el-button 
          type="primary" 
          size="small" 
          @click="$emit('open-main-panel')"
          class="empty-action"
        >
          打开主面板
        </el-button>
      </div>

      <draggable
        v-else
        v-model="savedCookies"
        class="cookie-items"
        item-key="id"
        handle=".drag-handle"
        @start="dragStart"
        @end="handleDragEnd"
        ghost-class="ghost-class"
        drag-class="dragging"
      >
        <template #item="{ element }">
          <div class="cookie-item">
            <el-icon class="drag-handle"><Rank /></el-icon>
            <div class="cookie-info" @click="handleEdit(element)">
              <div class="cookie-id">{{ element.id }}</div>
              <div class="cookie-note" v-if="element.note">{{ element.note }}</div>
              <div class="cookie-url">{{ element.url }}</div>
            </div>
            <div class="cookie-actions">
              <el-button
                type="primary"
                link
                size="small"
                :loading="receiving"
                @click="handleQuickImport(element.id)"
              >
                导入
              </el-button>
              <el-button
                type="danger"
                link
                size="small"
                @click="handleDelete(element.id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑 Cookie"
      width="300px"
      append-to-body
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="Cookie ID">
          <el-input v-model="editForm.id" disabled />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="editForm.note" 
            placeholder="输入备注"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">确定</el-button>
      </template>
    </el-dialog>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useGMValue } from '../composables/useGMValue'
import { useCookieOperations } from '../composables/useCookieOperations'
import { Refresh, Loading, Delete, Rank } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import { useLocalCookies } from '../composables/useLocalCookies'
import { useDraggable } from '../composables/useDraggable'
import type { SavedCookie } from '../types/cookie'

const props = defineProps<{
  autoHideFullscreen?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'open-main-panel'): void
}>()

const floatingBtn = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const isEntering = ref(true) // 控制入场动画
const isMobile = ref(false) // 是否为移动端
const startTime = ref(0) // 记录点击开始时间
const { value: showFloatingButton } = useGMValue('cookie_share_show_floating_button', true)
const { 
  position,
  isDragging: draggableIsDragging,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd
} = useDraggable(window.innerHeight / 2)

const showPopover = ref(false)
const {
  loading,
  receiving,
  cookieList,
  lastUpdateTime,
  loadCookieList,
  receiveCookie
} = useCookieOperations()

const {
  savedCookies,
  addCookie,
  removeCookie,
  updateCookie,
  reorderCookies,
  updateLastUsed
} = useLocalCookies()

const showEditDialog = ref(false)
const editForm = ref({
  id: '',
  note: ''
})

// 检测是否为移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768 || 'ontouchstart' in window
}

// 计算边缘吸附区域
const EDGE_THRESHOLD = 50 // 距离边缘多少像素触发吸附
const BUTTON_MARGIN = isMobile.value ? 12 : 20 // 按钮距离边缘的最小距离
const DRAG_THRESHOLD = isMobile.value ? 10 : 5 // 点击判定阈值
const CLICK_TIMEOUT = 200 // 点击判定时间阈值（毫秒）

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
const updateButtonPosition = () => {
  if (!floatingBtn.value) return
  
  floatingBtn.value.style.top = `${position.value.y}px`
  if (position.value.side === 'left') {
    floatingBtn.value.style.left = '-24px'
    floatingBtn.value.style.right = 'auto'
  } else {
    floatingBtn.value.style.right = '-24px'
    floatingBtn.value.style.left = 'auto'
  }
}

// 处理窗口大小变化
const handleResize = () => {
  if (!floatingBtn.value) return

  const buttonHeight = floatingBtn.value.offsetHeight
  const maxY = window.innerHeight - buttonHeight - BUTTON_MARGIN
  
  // 如果之前位置靠近边缘，保持吸附
  if (position.value.y <= EDGE_THRESHOLD + BUTTON_MARGIN) {
    updateButtonPosition()
  } else if (position.value.y >= maxY - EDGE_THRESHOLD) {
    updateButtonPosition()
  } else {
    updateButtonPosition()
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

const handlePopoverShow = () => {
  loadCookieList()
}

const handleEdit = (cookie: SavedCookie) => {
  editForm.value = {
    id: cookie.id,
    note: cookie.note || ''
  }
  showEditDialog.value = true
}

const handleSaveEdit = () => {
  if (editForm.value.note && editForm.value.note.length > 50) {
    ElMessage.warning('备注不能超过50个字符')
    return
  }
  
  updateCookie(editForm.value.id, {
    note: editForm.value.note
  })
  showEditDialog.value = false
  ElMessage.success('备注已更新')
}

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个快捷导入项吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    removeCookie(id)
  } catch {
    // 用户取消删除
  }
}

const handleDragEnd = (evt: any) => {
  // 恢复页面滚动
  document.body.style.overflow = ''
  
  if (evt.oldIndex !== evt.newIndex) {
    reorderCookies(evt.oldIndex, evt.newIndex)
    // 添加触摸反馈
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    ElMessage.success('排序已更新')
  }
}

const handleQuickImport = async (cookieId: string) => {
  const success = await receiveCookie(cookieId)
  if (success) {
    updateLastUsed(cookieId)
    setTimeout(() => window.location.reload(), 1000)
  }
}

// 添加 dragStart 函数用于列表拖拽
const dragStart = () => {
  // 阻止页面滚动
  document.body.style.overflow = 'hidden'
  // 添加触摸反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

// 添加点击处理
const handleClick = () => {
  if (!draggableIsDragging.value) {
    emit('click')
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  if (floatingBtn.value) {
    // 设置初始位置
    const buttonHeight = floatingBtn.value.offsetHeight
    const maxY = window.innerHeight - buttonHeight - BUTTON_MARGIN
    const initialY = Math.min(Math.max(BUTTON_MARGIN, window.innerHeight / 2), maxY)
    
    // 应用初始位置
    position.value = {
      x: position.value.x,
      y: initialY,
      side: position.value.side
    }
    
    // 设置初始状态（在视图外）
    floatingBtn.value.style.transform = position.value.side === 'left' 
      ? 'translateX(-100%)' 
      : 'translateX(100%)'
    updateButtonPosition()

    // 触发入场动画
    requestAnimationFrame(() => {
      if (floatingBtn.value) {
        floatingBtn.value.style.transform = 'translateX(0)'
        setTimeout(() => {
          isEntering.value = false
        }, 300)
      }
    })

    // 添加拖动事件监听器
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)

  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  if (floatingBtn.value) {
    // 移除旧的事件监听器
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }

  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('resize', handleResize)

  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
})

// 监听位置变化
watch(() => position.value, () => {
  updateButtonPosition()
}, { deep: true })
</script>

<style scoped>
.cookie-share-floating-btn {
  position: fixed !important;
  width: 36px !important;
  height: 48px !important;
  background: rgba(255, 255, 255, 0.95) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: transform, left, right, background-color, color, box-shadow !important;
}

/* 左侧样式 */
.cookie-share-floating-btn[data-side="left"] {
  border-radius: 0 24px 24px 0 !important;
  border-left: none !important;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15),
              0 2px 8px rgba(0, 0, 0, 0.1),
              inset 1px 0 0 rgba(0, 0, 0, 0.05) !important;
}

/* 右侧样式 */
.cookie-share-floating-btn[data-side="right"] {
  border-radius: 24px 0 0 24px !important;
  border-right: none !important;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.15),
              0 2px 8px rgba(0, 0, 0, 0.1),
              inset -1px 0 0 rgba(0, 0, 0, 0.05) !important;
}

/* 左侧悬停效果 */
.cookie-share-floating-btn[data-side="left"]:not([style*="transition: none"]):hover {
  left: -12px !important;
  transform: translateX(2px) !important;
}

/* 右侧悬停效果 */
.cookie-share-floating-btn[data-side="right"]:not([style*="transition: none"]):hover {
  right: -12px !important;
  transform: translateX(-2px) !important;
}

/* 拖动时禁用过渡效果 */
.cookie-share-floating-btn[style*="transition: none"] {
  transition: none !important;
}

/* 移动端样式调整 */
@media (max-width: 768px) {
  .cookie-share-floating-btn {
    width: 32px !important;
    height: 42px !important;
    padding: 6px !important;
  }

  /* 左侧移动端样式 */
  .cookie-share-floating-btn[data-side="left"] {
    left: -20px !important;
    box-shadow: 1px 0 8px rgba(0, 0, 0, 0.12),
                0 1px 6px rgba(0, 0, 0, 0.08),
                inset 1px 0 0 rgba(0, 0, 0, 0.05) !important;
  }

  /* 右侧移动端样式 */
  .cookie-share-floating-btn[data-side="right"] {
    right: -20px !important;
    box-shadow: -1px 0 8px rgba(0, 0, 0, 0.12),
                0 1px 6px rgba(0, 0, 0, 0.08),
                inset -1px 0 0 rgba(0, 0, 0, 0.05) !important;
  }

  /* 左侧悬停效果 */
  .cookie-share-floating-btn[data-side="left"]:hover {
    left: -10px !important;
  }

  /* 右侧悬停效果 */
  .cookie-share-floating-btn[data-side="right"]:hover {
    right: -10px !important;
  }

  /* 左侧点击效果 */
  .cookie-share-floating-btn[data-side="left"]:active {
    left: -6px !important;
  }

  /* 右侧点击效果 */
  .cookie-share-floating-btn[data-side="right"]:active {
    right: -6px !important;
  }

  .cookie-share-floating-btn svg {
    width: 20px !important;
    height: 20px !important;
  }
}

/* 移动端点击态优化 */
@media (hover: none) {
  .cookie-share-floating-btn[data-side="left"]:hover {
    left: -24px !important;
    transform: none !important;
  }

  .cookie-share-floating-btn[data-side="right"]:hover {
    right: -24px !important;
    transform: none !important;
  }

  .cookie-share-floating-btn:hover {
    background: rgba(255, 255, 255, 0.95) !important;
  }
}

.quick-cookie-list {
  padding: 12px;
}

.quick-cookie-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quick-cookie-header .title {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.loading-state {
  gap: 8px;
}

.loading-icon {
  animation: rotating 2s linear infinite;
}

.cookie-items {
  max-height: 300px;
  overflow-y: auto;
  position: relative;
}

.cookie-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s ease;
  background: var(--el-bg-color);
  will-change: transform, opacity;
}

.cookie-item:hover {
  background-color: var(--el-fill-color-light);
}

.drag-handle {
  cursor: move;
  padding: 4px;
  margin-right: 8px;
  color: var(--el-text-color-secondary);
}

.cookie-info {
  flex: 1;
  min-width: 0;
  margin-right: 12px;
}

.cookie-id {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cookie-note {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin: 2px 0;
}

.cookie-url {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cookie-actions {
  display: flex;
  gap: 4px;
}

.update-time {
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

@keyframes rotating {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}

:global(.cookie-list-popover) {
  padding: 0 !important;
}

:global(.cookie-list-popover .el-popover__title) {
  margin: 0;
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .cookie-share-floating-btn {
    background: rgba(245, 245, 245, 0.98) !important;
    box-shadow: -2px 0 16px rgba(0, 0, 0, 0.25),
                0 2px 12px rgba(0, 0, 0, 0.2),
                inset -1px 0 0 rgba(0, 0, 0, 0.1) !important;
  }

  .cookie-share-floating-btn[data-side="left"] {
    box-shadow: 2px 0 16px rgba(0, 0, 0, 0.25),
                0 2px 12px rgba(0, 0, 0, 0.2),
                inset 1px 0 0 rgba(0, 0, 0, 0.1) !important;
  }
}

/* 拖拽时的样式 */
.dragging {
  background: var(--el-color-primary-light-9);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  opacity: 0.9;
  transform: scale(1.02);
}

/* 占位符样式 */
.ghost-class {
  background: var(--el-color-primary-light-9);
  border: 2px dashed var(--el-color-primary);
  opacity: 0.5;
}

/* 添加/删除动画 */
.cookie-item {
  animation: slide-in 0.3s ease;
}

.cookie-item.v-leave-active {
  animation: slide-out 0.3s ease;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(10px);
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .cookie-item {
    padding: 12px;
  }
  
  .drag-handle {
    padding: 8px;
  }
  
  /* 增加触摸区域 */
  .drag-handle {
    position: relative;
  }
  
  .drag-handle::before {
    content: '';
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
  }
}

/* 添加移动端弹出层高度限制 */
@media (max-width: 768px) {
  :global(.cookie-list-popover) {
    max-height: 60vh !important;
    overflow-y: auto !important;
  }
  
  .cookie-items {
    max-height: 50vh !important;
  }
}

/* 优化按钮拖动时的页面滚动 */
.cookie-share-floating-btn {
  touch-action: none !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
}

.empty-action {
  margin-top: 8px;
}
</style> 