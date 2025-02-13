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

// 模拟GM_setValue
const GM_setValue = (name: string, value: any) => {
  const storage = getGMStorage()
  storage[name] = value
  updateGMStorage(storage)
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

// GM_cookie 的模拟实现
window.GM_cookie = {
  list: (details: GMCookieDetails, callback: (cookies: GMCookie[]) => void) => {
    callback([])
  },
  set: (details: GMCookie, callback?: () => void) => {
    callback?.()
  },
  delete: (details: GMCookieDetails, callback?: () => void) => {
    callback?.()
  }
}

// GM_xmlhttpRequest 的模拟实现
window.GM_xmlhttpRequest = (details: GMXMLHttpRequestDetails) => {
  const xhr = new XMLHttpRequest()
  xhr.open(details.method || 'GET', details.url)

  if (details.headers) {
    Object.entries(details.headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value)
    })
  }

  xhr.onload = () => {
    details.onload?.({
      status: xhr.status,
      statusText: xhr.statusText,
      responseText: xhr.responseText,
      response: xhr.response,
      responseHeaders: xhr.getAllResponseHeaders(),
      readyState: xhr.readyState,
      finalUrl: details.url,
      context: details.context,
      responseXML: xhr.responseXML
    })
  }

  xhr.onerror = () => details.onerror?.({
    status: xhr.status,
    statusText: xhr.statusText,
    responseText: xhr.responseText,
    response: xhr.response,
    responseHeaders: xhr.getAllResponseHeaders(),
    readyState: xhr.readyState,
    finalUrl: details.url,
    context: details.context,
    responseXML: xhr.responseXML
  })

  xhr.ontimeout = () => details.ontimeout?.({
    status: xhr.status,
    statusText: xhr.statusText,
    responseText: xhr.responseText,
    response: xhr.response,
    responseHeaders: xhr.getAllResponseHeaders(),
    readyState: xhr.readyState,
    finalUrl: details.url,
    context: details.context,
    responseXML: xhr.responseXML
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