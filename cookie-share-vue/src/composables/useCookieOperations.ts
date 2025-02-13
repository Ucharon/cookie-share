import { ref } from 'vue'
import { useGMValue } from './useGMValue'
import { ElMessage } from 'element-plus'
import type { Cookie, CookieListResponse, GMXMLHttpRequestResponse, ServerConfig } from '../types/cookie'

export function useCookieOperations() {
  const loading = ref(false)
  const receiving = ref(false)
  const cookieList = ref<Cookie[]>([])
  const lastUpdateTime = ref<Date>()

  const { value: serverConfig } = useGMValue<ServerConfig>('cookie_share_server_config', {
    url: '',
    password: '',
    remember: false
  })

  const loadCookieList = async (retryCount = 3) => {
    if (!serverConfig.value?.url || loading.value) return
    
    loading.value = true
    try {
      const currentHost = window.location.hostname.split('.').slice(-2).join('.')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
      
      if (serverConfig.value.password) {
        headers['X-Admin-Password'] = serverConfig.value.password
      }

      const response = await new Promise<GMXMLHttpRequestResponse>((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `${serverConfig.value.url}/admin/list-cookies-by-host/${encodeURIComponent(currentHost)}`,
          headers,
          crossDomain: true,
          anonymous: true,
          credentials: 'omit',
          responseType: 'json',
          timeout: 10000,
          onload: resolve,
          onerror: reject,
          ontimeout: () => reject(new Error('请求超时'))
        })
      })

      const data = response.response as CookieListResponse
      if (response.status === 200 && data?.success) {
        cookieList.value = data.cookies
        lastUpdateTime.value = new Date()
      } else {
        throw new Error((data as any)?.message || response.statusText || `HTTP错误 ${response.status}`)
      }
    } catch (error: unknown) {
      console.error('Cookie列表加载失败:', error)
      if (retryCount > 0) {
        ElMessage.warning(`加载失败，正在尝试重新加载（剩余重试次数：${retryCount}）`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return loadCookieList(retryCount - 1)
      }
      ElMessage.error(`加载失败: ${error instanceof Error ? error.message : '未知错误'}`)
      cookieList.value = []
    } finally {
      loading.value = false
    }
  }

  const receiveCookie = async (cookieId: string) => {
    if (!serverConfig.value?.url || receiving.value) return false
    
    receiving.value = true
    try {
      // 添加进度提示
      ElMessage.info('开始导入Cookie，请稍候...')
      
      const response = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `${serverConfig.value.url}/receive-cookies/${cookieId}`,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(serverConfig.value.password ? {
              'X-Admin-Password': serverConfig.value.password
            } : {})
          },
          crossDomain: true,
          anonymous: true,
          credentials: 'omit',
          responseType: 'json',
          timeout: 10000,
          onload: resolve,
          onerror: reject,
          ontimeout: () => reject(new Error('请求超时'))
        })
      }) as any

      if (response.status >= 200 && response.status < 300) {
        if (!response.response?.success || !Array.isArray(response.response.cookies)) {
          throw new Error('服务器返回数据格式错误')
        }

        if (!response.response.cookies.length) {
          throw new Error('没有可导入的Cookie')
        }

        // 清除现有的 cookies
        await new Promise((resolve) => {
          (window as any).GM_cookie.list({}, (cookies: any[]) => {
            const deletePromises = cookies.map(cookie => 
              new Promise<void>((resolveDelete) => {
                if (cookie.name === 'XSRF-TOKEN') {
                  resolveDelete()
                  return
                }
                
                (window as any).GM_cookie.delete({
                  name: cookie.name,
                  domain: cookie.domain,
                  path: cookie.path || '/'
                }, () => resolveDelete())
              })
            )
            Promise.all(deletePromises).then(resolve)
          })
        })

        // 设置新的 cookies
        let importedCount = 0
        for (const cookie of response.response.cookies) {
          if (cookie?.name && cookie?.value) {
            try {
              await new Promise((resolve, reject) => {
                (window as any).GM_cookie.set({
                  name: cookie.name,
                  value: cookie.value,
                  domain: cookie.domain.startsWith('.') 
                    ? cookie.domain 
                    : `.${cookie.domain.split('.').slice(-2).join('.')}`,
                  path: cookie.path || '/',
                  secure: cookie.secure,
                  httpOnly: cookie.httpOnly,
                  sameSite: cookie.sameSite || 'Lax',
                  expirationDate: cookie.expirationDate
                }, (success: boolean, error: any) => {
                  if (error) {
                    if (cookie.name === 'XSRF-TOKEN') {
                      console.warn('跳过设置受保护的XSRF-TOKEN')
                      resolve(true)
                      return
                    }
                    reject(error)
                  } else {
                    resolve(true)
                  }
                })
              })
              importedCount++
            } catch (error) {
              console.error('设置cookie出错:', cookie.name, error)
            }
          }
        }

        if (importedCount === 0) {
          throw new Error('没有成功导入的Cookie')
        }

        ElMessage.success(`成功导入${importedCount}个Cookie`)
        return true
      } else {
        const errorData = response.responseText ? JSON.parse(response.responseText) : {}
        throw new Error(errorData?.message || `HTTP错误 ${response.status}`)
      }
    } catch (error: unknown) {
      console.error('获取Cookie失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      if (errorMessage.includes('XSRF-TOKEN')) {
        ElMessage.warning('系统保护Cookie已跳过，不影响正常使用')
      } else {
        ElMessage.error(`获取失败: ${errorMessage}`)
      }
      return false
    } finally {
      receiving.value = false
    }
  }

  return {
    loading,
    receiving,
    cookieList,
    lastUpdateTime,
    loadCookieList,
    receiveCookie
  }
} 