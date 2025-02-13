import { ref } from 'vue'

interface Position {
  x: number
  y: number
  side: 'left' | 'right'
}

export function useDraggable(initialY: number) {
  // 默认位置在右侧
  const position = ref<Position>({
    x: window.innerWidth,
    y: initialY,
    side: 'right'
  })

  const isDragging = ref(false)
  const startX = ref(0)
  const startY = ref(0)
  const initialOffsetX = ref(0)
  const initialOffsetY = ref(0)

  // 配置参数
  const EDGE_THRESHOLD = 100 // 边缘吸附阈值
  const BUTTON_MARGIN = 20 // 按钮与边缘距离
  const BUTTON_WIDTH = 36 // 按钮宽度

  // 计算吸附位置
  const calculateSnapPosition = (x: number, y: number): Position => {
    const maxY = window.innerHeight - BUTTON_MARGIN
    const validY = Math.min(Math.max(BUTTON_MARGIN, y), maxY)

    // 判断是否需要吸附到左右边缘
    const isNearLeft = x < EDGE_THRESHOLD
    const isNearRight = x > window.innerWidth - EDGE_THRESHOLD - BUTTON_WIDTH

    return {
      x: isNearLeft ? 0 : isNearRight ? window.innerWidth : x,
      y: validY,
      side: isNearLeft ? 'left' : 'right'
    }
  }

  const handleMouseDown = (e: MouseEvent) => {
    isDragging.value = true
    startX.value = e.clientX
    startY.value = e.clientY
    initialOffsetX.value = e.clientX - position.value.x
    initialOffsetY.value = e.clientY - position.value.y
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return

    const newX = e.clientX - initialOffsetX.value
    const newY = e.clientY - initialOffsetY.value

    position.value = calculateSnapPosition(newX, newY)
  }

  const handleMouseUp = () => {
    if (!isDragging.value) return
    isDragging.value = false

    // 确保结束时吸附到边缘
    position.value = calculateSnapPosition(position.value.x, position.value.y)
  }

  // 处理触摸事件
  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return
    
    isDragging.value = true
    startX.value = e.touches[0].clientX
    startY.value = e.touches[0].clientY
    initialOffsetX.value = e.touches[0].clientX - position.value.x
    initialOffsetY.value = e.touches[0].clientY - position.value.y
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.value || e.touches.length !== 1) return
    e.preventDefault()

    const newX = e.touches[0].clientX - initialOffsetX.value
    const newY = e.touches[0].clientY - initialOffsetY.value

    position.value = calculateSnapPosition(newX, newY)
  }

  const handleTouchEnd = () => {
    if (!isDragging.value) return
    isDragging.value = false

    position.value = calculateSnapPosition(position.value.x, position.value.y)
  }

  return {
    position,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
} 