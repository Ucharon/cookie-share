// 存储模拟
const store = new Map<string, any>()

// GM_getValue 的模拟实现
window.GM_getValue = <T>(key: string, defaultValue: T): T => {
  return store.has(key) ? store.get(key) : defaultValue
}

// GM_setValue 的模拟实现
window.GM_setValue = (key: string, value: any): void => {
  store.set(key, value)
}

// GM_deleteValue 的模拟实现
window.GM_deleteValue = (key: string): void => {
  store.delete(key)
}

// GM_listValues 的模拟实现
window.GM_listValues = (): string[] => {
  return Array.from(store.keys())
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