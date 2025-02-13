declare function GM_getValue<T>(key: string, defaultValue: T): T
declare function GM_setValue(key: string, value: any): void
declare function GM_deleteValue(key: string): void
declare function GM_listValues(): string[]
declare function GM_addValueChangeListener(
  name: string,
  callback: (name: string, oldValue: any, newValue: any, remote: boolean) => void
): number
declare function GM_removeValueChangeListener(listenerId: number): void
declare function GM_notification(details: {
  text?: string
  title?: string
  image?: string
  highlight?: boolean
  silent?: boolean
  timeout?: number
  onclick?: () => void
  ondone?: () => void
}): void

// Cookie 相关类型
interface GMCookie {
  name: string
  value: string
  domain: string
  path?: string
  secure?: boolean
  sameSite?: 'Lax' | 'Strict' | 'None'
  hostOnly?: boolean
  httpOnly?: boolean
  session?: boolean
  expirationDate?: number
}

interface GMCookieDetails {
  url?: string
  name?: string
  domain?: string
  path?: string
}

declare namespace GM_cookie {
  function list(details: GMCookieDetails, callback: (cookies: GMCookie[]) => void): void
  function set(details: GMCookie, callback?: () => void): void
  function remove(details: GMCookieDetails, callback?: () => void): void
}

// XMLHttpRequest 相关类型
interface GMXMLHttpRequestDetails {
  method?: string
  url: string
  headers?: { [key: string]: string }
  data?: string
  binary?: boolean
  timeout?: number
  context?: any
  responseType?: string
  overrideMimeType?: string
  anonymous?: boolean
  fetch?: boolean
  username?: string
  password?: string
  onabort?: (response: GMXMLHttpRequestResponse) => void
  onerror?: (response: GMXMLHttpRequestResponse) => void
  onload?: (response: GMXMLHttpRequestResponse) => void
  onprogress?: (response: GMXMLHttpRequestProgressResponse) => void
  ontimeout?: (response: GMXMLHttpRequestResponse) => void
  onreadystatechange?: (response: GMXMLHttpRequestResponse) => void
}

interface GMXMLHttpRequestResponse {
  finalUrl: string
  readyState: number
  status: number
  statusText: string
  responseHeaders: string
  response: any
  responseText: string
  responseXML: Document | null
  context: any
}

interface GMXMLHttpRequestProgressResponse extends GMXMLHttpRequestResponse {
  done: number
  lengthComputable: boolean
  loaded: number
  position: number
  total: number
  totalSize: number
}

declare function GM_xmlhttpRequest(details: GMXMLHttpRequestDetails): { abort: () => void } 