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
declare interface GMCookie {
  name: string
  value: string
  domain: string
  path?: string
  secure?: boolean
  sameSite?: 'Lax' | 'Strict' | 'None'
  httpOnly?: boolean
  expirationDate?: number
  hostOnly?: boolean
  storeId?: string
  session?: boolean
}

interface GMCookieDetails {
  url?: string
  name?: string
  domain?: string
  path?: string
}

declare interface GM_cookie {
  list: (
    details: { domain?: string; name?: string; path?: string },
    callback: (cookies: GMCookie[]) => void
  ) => void;
  set: (
    details: GMCookie,
    callback: (success: boolean, error?: any) => void
  ) => void;
  delete: (
    details: { name: string; domain: string; path?: string },
    callback: (success: boolean) => void
  ) => void;
}

// XMLHttpRequest 相关类型
declare interface GMXMLHttpRequestDetails {
  method?: string
  url: string
  headers?: Record<string, string>
  data?: string
  timeout?: number
  anonymous?: boolean
  crossDomain?: boolean
  onload?: (response: any) => void
  onerror?: (error: any) => void
  ontimeout?: () => void
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'document'
  credentials?: 'omit' | 'same-origin' | 'include'
}

declare function GM_xmlhttpRequest(details: GMXMLHttpRequestDetails): { abort: () => void }

declare interface Window {
  GM_setValue: typeof GM_setValue
  GM_getValue: typeof GM_getValue
  GM_deleteValue: typeof GM_deleteValue
  GM_registerMenuCommand: typeof GM_registerMenuCommand
  GM_cookie: GM_cookie
  GM_xmlhttpRequest: (details: GMXMLHttpRequestDetails) => { abort: () => void }
  GM_addValueChangeListener: typeof GM_addValueChangeListener
  GM_removeValueChangeListener: typeof GM_removeValueChangeListener
}

declare function GM_setValue<T>(name: string, value: T): void
declare function GM_getValue<T>(name: string, defaultValue: T): T
declare function GM_deleteValue(name: string): void
declare function GM_registerMenuCommand(
  name: string,
  onClick: () => void,
  accessKey?: string
): void

declare function GM_xmlhttpRequest(options: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  data?: string;
  timeout?: number;
}): Promise<{
  status: number;
  responseText: string;
}>;

declare interface GMXMLHttpRequestResponse {
  readonly status: number;
  readonly statusText: string;
  readonly responseHeaders: string;
  readonly responseText: string;
  readonly response: any;
  readonly finalUrl: string;
}

declare interface GMXMLHttpRequestProgress extends GMXMLHttpRequestResponse {
  readonly lengthComputable: boolean;
  readonly loaded: number;
  readonly total: number;
}

declare interface GMXMLHttpRequestContext {
  url: string;
  method: string;
  headers: Record<string, string>;
  data: string;
  timeout: number;
} 