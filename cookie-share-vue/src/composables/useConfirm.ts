import { h, render } from 'vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  closeOnClickOverlay?: boolean
}

export function useConfirm() {
  const show = (options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const normalizedOptions: ConfirmOptions = typeof options === 'string'
        ? { message: options }
        : options

      // 创建容器
      const container = document.createElement('div')
      document.body.appendChild(container)

      // 创建 vnode
      const vnode = h(ConfirmDialog, {
        ...normalizedOptions,
        onConfirm: () => {
          render(null, container)
          container.remove()
          resolve(true)
        },
        onCancel: () => {
          render(null, container)
          container.remove()
          resolve(false)
        }
      })

      // 渲染组件
      render(vnode, container)
    })
  }

  return {
    show,
    confirm: (message: string) => show({ message }),
    delete: (message: string) => show({
      title: '确认删除',
      message,
      confirmText: '删除',
      cancelText: '取消'
    })
  }
} 