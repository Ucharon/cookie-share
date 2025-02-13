import { ref, watch } from 'vue'

export function useGMValue<T>(key: string, defaultValue: T) {
  const value = ref<T>(GM_getValue(key, defaultValue))

  watch(value, (newValue) => {
    GM_setValue(key, newValue)
  })

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