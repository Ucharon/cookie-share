import { ref, h, render } from 'vue'
import Notification from '../components/Notification.vue'

interface NotificationOptions {
  message: string
  type?: 'success' | 'error'
  duration?: number
}

export function useNotification() {
  const show = (options: NotificationOptions | string) => {
    const normalizedOptions: NotificationOptions = typeof options === 'string'
      ? { message: options }
      : options

    // 创建一个容器
    const container = document.createElement('div')
    document.body.appendChild(container)

    // 创建 vnode
    const vnode = h(Notification, {
      ...normalizedOptions,
      onDestroy: () => {
        // 当组件被销毁时，移除容器
        render(null, container)
        container.remove()
      }
    })

    // 渲染组件
    render(vnode, container)
  }

  return {
    show,
    success: (message: string, duration?: number) => show({ message, type: 'success', duration }),
    error: (message: string, duration?: number) => show({ message, type: 'error', duration })
  }
} 