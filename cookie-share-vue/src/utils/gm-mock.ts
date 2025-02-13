// 新增文件：模拟油猴API的本地存储实现
interface GMValueStorage {
  [key: string]: any
}

const GM_MOCK_STORAGE_KEY = '__GM_MOCK_STORAGE__'

function getGMStorage(): GMValueStorage {
  const storage = localStorage.getItem(GM_MOCK_STORAGE_KEY)
  return storage ? JSON.parse(storage) : {}
}

function updateGMStorage(storage: GMValueStorage) {
  localStorage.setItem(GM_MOCK_STORAGE_KEY, JSON.stringify(storage))
}

// 添加模拟的监听器存储
const valueChangeListeners: Record<string, Array<Function>> = {}

// 模拟 GM_addValueChangeListener
window.GM_addValueChangeListener = (name: string, callback: Function) => {
  if (!valueChangeListeners[name]) {
    valueChangeListeners[name] = []
  }
  valueChangeListeners[name].push(callback)
  return valueChangeListeners[name].length - 1 // 返回监听器ID
}

// 修改 GM_setValue 实现
const GM_setValue = (name: string, value: any) => {
  const oldValue = GM_getValue(name, undefined)
  const storage = getGMStorage()
  storage[name] = value
  updateGMStorage(storage)
  
  // 触发监听器
  if (valueChangeListeners[name]) {
    valueChangeListeners[name].forEach(cb => 
      cb(name, oldValue, value, false)
    )
  }
}

// 模拟GM_getValue
const GM_getValue = <T>(name: string, defaultValue: T): T => {
  const storage = getGMStorage()
  return storage[name] ?? defaultValue
}

// 模拟GM_deleteValue
const GM_deleteValue = (name: string) => {
  const storage = getGMStorage()
  delete storage[name]
  updateGMStorage(storage)
}

// 模拟 GM_removeValueChangeListener
window.GM_removeValueChangeListener = (listenerId: number) => {
  Object.keys(valueChangeListeners).forEach(key => {
    const listeners = valueChangeListeners[key]
    if (listeners && listenerId < listeners.length) {
      listeners.splice(listenerId, 1)
    }
  })
}

// 挂载到window对象
if (import.meta.env.DEV) {
  window.GM_setValue = GM_setValue
  window.GM_getValue = GM_getValue
  window.GM_deleteValue = GM_deleteValue
  window.GM_registerMenuCommand = () => {} // 空实现
}

// GM_listValues 的模拟实现
window.GM_listValues = (): string[] => {
  return Array.from(getGMStorage().keys())
}

// 在文件顶部添加模拟存储
let mockCookies: any[] = []

// 添加模拟cookie存储
let mockCookieStore: GMCookie[] = [];

// 修改 GM_cookie 的模拟实现
window.GM_cookie = {
  list: (details: { domain?: string; name?: string; path?: string }, callback: (cookies: GMCookie[]) => void) => {
    try {
      // 从实际的document.cookie中获取cookies
      const allCookies = document.cookie.split(';').map(cookie => {
        const [name, value] = cookie.trim().split('=')
        return {
          name,
          value,
          domain: window.location.hostname,
          path: '/',
          secure: window.location.protocol === 'https:',
          sameSite: 'Lax' as const,
          httpOnly: false
        }
      })

      // 根据条件过滤
      const filtered = allCookies.filter(c => {
        if (details.domain && c.domain !== details.domain) return false
        if (details.name && c.name !== details.name) return false
        if (details.path && c.path !== details.path) return false
        return true
      })

      callback(filtered)
    } catch (error) {
      console.error('Error listing cookies:', error)
      callback([])
    }
  },

  set: (details: GMCookie, callback: (success: boolean, error?: any) => void) => {
    try {
      // 构建cookie字符串
      let cookieStr = `${details.name}=${details.value}`
      if (details.domain) cookieStr += `; domain=${details.domain}`
      if (details.path) cookieStr += `; path=${details.path}`
      if (details.secure) cookieStr += `; secure`
      if (details.sameSite) cookieStr += `; samesite=${details.sameSite.toLowerCase()}`
      if (details.expirationDate) {
        cookieStr += `; expires=${new Date(details.expirationDate * 1000).toUTCString()}`
      }

      // 实际设置cookie
      document.cookie = cookieStr
      callback(true)
    } catch (error) {
      console.error('Error setting cookie:', error)
      callback(false, error)
    }
  },

  delete: (details: { name: string; domain: string; path?: string }, callback: (success: boolean) => void) => {
    try {
      // 通过设置过期时间来删除cookie
      document.cookie = `${details.name}=; domain=${details.domain}; path=${details.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      callback(true)
    } catch (error) {
      console.error('Error deleting cookie:', error)
      callback(false)
    }
  }
}

// GM_xmlhttpRequest 的模拟实现
window.GM_xmlhttpRequest = (details: GMXMLHttpRequestDetails) => {
  const xhr = new XMLHttpRequest()
  
  // 修改凭证处理逻辑
  xhr.withCredentials = details.credentials === 'include'
  
  xhr.open(details.method || 'GET', details.url, true)

  if (details.headers) {
    Object.entries(details.headers).forEach(([key, value]) => {
      try {
        xhr.setRequestHeader(key, value)
      } catch (e) {
        console.warn(`无法设置请求头 ${key}: ${value}`)
      }
    })
  }

  // 修改响应处理
  xhr.onload = () => {
    const response = {
      status: xhr.status,
      statusText: xhr.statusText,
      responseText: xhr.responseText,
      response: details.responseType === 'json' && xhr.responseText 
        ? JSON.parse(xhr.responseText)
        : xhr.response,
      responseHeaders: xhr.getAllResponseHeaders(),
      readyState: xhr.readyState,
      finalUrl: details.url
    }
    details.onload?.(response)
  }

  // 移除context相关的不存在属性
  xhr.onerror = () => details.onerror?.({
    status: xhr.status,
    statusText: xhr.statusText,
    responseText: xhr.responseText,
    response: xhr.response,
    responseHeaders: xhr.getAllResponseHeaders(),
    readyState: xhr.readyState,
    finalUrl: details.url
  })

  xhr.ontimeout = () => details.ontimeout?.({
    status: xhr.status,
    statusText: xhr.statusText,
    responseText: xhr.responseText,
    response: xhr.response,
    responseHeaders: xhr.getAllResponseHeaders(),
    readyState: xhr.readyState,
    finalUrl: details.url
  })

  xhr.send(details.data)

  return {
    abort: () => xhr.abort()
  }
}

// GM_notification 的模拟实现
window.GM_notification = (details: {
  text?: string
  title?: string
  image?: string
  highlight?: boolean
  silent?: boolean
  timeout?: number
  onclick?: () => void
  ondone?: () => void
}) => {
  console.log('通知:', details.title, details.text)
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(details.title || '', {
      body: details.text,
      icon: details.image,
      silent: details.silent
    })

    if (details.onclick) {
      notification.onclick = details.onclick
    }

    if (details.timeout) {
      setTimeout(() => {
        notification.close()
        details.ondone?.()
      }, details.timeout)
    }
  }
} 