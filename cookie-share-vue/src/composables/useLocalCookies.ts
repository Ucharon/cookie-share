import { ref, computed } from 'vue'
import { useGMValue } from './useGMValue'
import type { SavedCookie, Cookie } from '../types/cookie'

export function useLocalCookies() {
  const { value: savedCookies } = useGMValue<SavedCookie[]>('cookie_share_saved_cookies', [])
  
  const sortedCookies = computed(() => {
    return [...savedCookies.value].sort((a, b) => a.order - b.order)
  })

  const addCookie = (cookie: Cookie, note?: string) => {
    const exists = savedCookies.value.find(c => c.id === cookie.id)
    if (!exists) {
      const maxOrder = Math.max(...savedCookies.value.map(c => c.order), -1)
      savedCookies.value.push({
        ...cookie,
        note,
        order: maxOrder + 1,
        lastUsed: Date.now()
      })
    }
  }

  const removeCookie = (id: string) => {
    const index = savedCookies.value.findIndex(c => c.id === id)
    if (index > -1) {
      savedCookies.value.splice(index, 1)
    }
  }

  const updateCookie = (id: string, updates: Partial<SavedCookie>) => {
    const cookie = savedCookies.value.find(c => c.id === id)
    if (cookie) {
      Object.assign(cookie, updates)
    }
  }

  const reorderCookies = (fromIndex: number, toIndex: number) => {
    const cookies = [...savedCookies.value]
    const [moved] = cookies.splice(fromIndex, 1)
    cookies.splice(toIndex, 0, moved)
    
    // 更新所有项的顺序并持久化
    const updatedCookies = cookies.map((cookie, index) => ({
      ...cookie,
      order: index
    }))
    
    savedCookies.value = updatedCookies
    GM_setValue('cookie_share_saved_cookies', updatedCookies)
  }

  const updateLastUsed = (id: string) => {
    const cookie = savedCookies.value.find(c => c.id === id)
    if (cookie) {
      cookie.lastUsed = Date.now()
    }
  }

  return {
    savedCookies: sortedCookies,
    addCookie,
    removeCookie,
    updateCookie,
    reorderCookies,
    updateLastUsed
  }
} 