import { ref, watch, onUnmounted } from 'vue'

export function useGMValue<T>(key: string, defaultValue: T) {
  const value = ref<T>(GM_getValue(key, defaultValue))

  // 添加值变化监听
  const listenerId = GM_addValueChangeListener(key, (name, oldVal, newVal, remote) => {
    value.value = newVal
  })

  onUnmounted(() => {
    GM_removeValueChangeListener(listenerId)
  })

  watch(value, (newValue) => {
    GM_setValue(key, newValue)
  }, { deep: true })

  return {
    value,
    reset: () => {
      value.value = defaultValue
    },
    remove: () => {
      GM_deleteValue(key)
      value.value = defaultValue
    }
  }
} 