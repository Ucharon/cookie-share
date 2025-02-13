export interface SavedCookie {
  id: string
  url: string
  note?: string
  order: number
  lastUsed?: number
  pinned?: boolean
}

export interface Cookie {
  id: string
  url: string
}

export interface CookieListResponse {
  success: boolean
  cookies: Cookie[]
}

export interface GMXMLHttpRequestResponse {
  status: number
  statusText: string
  response: any
  responseText: string
}

export interface ServerConfig {
  url: string
  password: string
  remember: boolean
}

export interface FormInstance {
  validate: () => Promise<boolean>
}

export interface FormRules {
  [key: string]: {
    required?: boolean
    message?: string
    trigger?: string
    pattern?: RegExp
    validator?: (rule: any, value: any, callback: (error?: Error) => void) => void
  }[]
} 