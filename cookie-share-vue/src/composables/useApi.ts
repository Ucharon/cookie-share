interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

interface CookieData {
  id: string
  url: string
  cookies: GMCookie[]
}

interface ListCookiesResponse {
  success: boolean
  cookies: Array<{
    id: string
    url: string
  }>
}

export function useApi() {
  const validateUrl = (url: string): string => {
    try {
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url
      }
      url = url.replace(/\/+$/, '')
      new URL(url)
      return url
    } catch (e) {
      throw new Error('无效的 URL 格式')
    }
  }

  const sendCookies = async (cookieId: string, customUrl: string): Promise<ApiResponse> => {
    try {
      const cookies = await new Promise<GMCookie[]>((resolve) => {
        GM_cookie.list({}, resolve)
      })

      if (!cookies.length) {
        return {
          success: false,
          message: '当前页面没有可发送的 Cookie',
        }
      }

      const formattedUrl = validateUrl(customUrl)
      const currentHost = window.location.hostname.split('.').slice(-2).join('.')
      const data: CookieData = {
        id: cookieId,
        url: `https://${currentHost}`,
        cookies: cookies,
      }

      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'POST',
          url: `${formattedUrl}/send-cookies`,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          data: JSON.stringify(data),
          responseType: 'json',
          timeout: 10000,
          onload: (response) => {
            if (response.status >= 200 && response.status < 300) {
              resolve(response.response || { success: true })
            } else {
              reject(
                new Error(
                  `服务器返回错误: ${response.status}\n${response.responseText}`
                )
              )
            }
          },
          onerror: () => reject(new Error('网络请求失败')),
          ontimeout: () => reject(new Error('请求超时')),
        })
      })
    } catch (error) {
      console.error('发送 Cookie 时出错:', error)
      throw error
    }
  }

  const receiveCookies = async (cookieId: string, customUrl: string): Promise<ApiResponse> => {
    try {
      const formattedUrl = validateUrl(customUrl)
      const response = await new Promise<GMXMLHttpRequestResponse>((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `${formattedUrl}/receive-cookies/${cookieId}`,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseType: 'json',
          timeout: 10000,
          onload: resolve,
          onerror: () => reject(new Error('请求失败')),
          ontimeout: () => reject(new Error('请求超时')),
        })
      })

      if (!response?.response?.success || !Array.isArray(response.response.cookies)) {
        throw new Error('无效的数据格式')
      }

      // 清除现有的 Cookie
      await new Promise<void>((resolve) => {
        GM_cookie.list({}, async function(cookies) {
          for (const cookie of cookies) {
            await new Promise<void>((resolve) => {
              GM_cookie.remove({
                name: cookie.name,
                domain: cookie.domain,
                path: cookie.path,
              }, resolve)
            })
          }
          resolve()
        })
      })

      // 导入新的 Cookie
      let importedCount = 0
      for (const cookie of response.response.cookies) {
        if (cookie?.name && cookie?.value) {
          await new Promise<void>((resolve) => {
            GM_cookie.set(cookie, resolve)
          })
          importedCount++
        }
      }

      if (importedCount === 0) {
        throw new Error('没有成功导入的 Cookie')
      }

      setTimeout(() => window.location.reload(), 500)
      return {
        success: true,
        message: `成功导入 ${importedCount} 个 Cookie`,
      }
    } catch (error) {
      console.error('接收 Cookie 时出错:', error)
      throw error
    }
  }

  const listCookies = async (host: string, password: string): Promise<ListCookiesResponse> => {
    const customUrl = GM_getValue('cookie_share_custom_url', '')
    if (!customUrl) {
      throw new Error('未设置服务器地址')
    }

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: `${customUrl}/admin/list-cookies-by-host/${encodeURIComponent(host)}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password,
        },
        onload: (response) => {
          try {
            const data = JSON.parse(response.responseText)
            if (response.status !== 200) {
              throw new Error(data.message || '获取 Cookie 列表失败')
            }
            resolve(data)
          } catch (error) {
            reject(error)
          }
        },
        onerror: () => reject(new Error('网络请求失败')),
      })
    })
  }

  return {
    sendCookies,
    receiveCookies,
    listCookies,
  }
} 