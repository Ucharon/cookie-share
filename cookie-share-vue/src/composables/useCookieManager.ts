interface Cookie {
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

export function useCookieManager() {
  const getAll = (): Promise<Cookie[]> => {
    return new Promise((resolve) => {
      GM_cookie.list({}, function (cookies) {
        resolve(
          cookies.map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path || '/',
            secure: cookie.secure,
            sameSite: 'Lax',
            hostOnly: cookie.hostOnly,
            httpOnly: cookie.httpOnly,
            session: cookie.session,
            expirationDate: cookie.expirationDate,
          }))
        )
      })
    })
  }

  const set = (cookie: Cookie): Promise<void> => {
    return new Promise((resolve) => {
      GM_cookie.set(
        {
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path || '/',
          secure: cookie.secure,
          httpOnly: cookie.httpOnly || false,
          expirationDate: cookie.expirationDate || undefined,
        },
        resolve
      )
    })
  }

  const clearAll = (): Promise<void> => {
    return new Promise((resolve) => {
      GM_cookie.list({}, function (cookies) {
        let deletedCount = 0
        const totalCookies = cookies.length

        if (totalCookies === 0) {
          resolve()
          return
        }

        cookies.forEach((cookie) => {
          GM_cookie.remove(
            {
              name: cookie.name,
              domain: cookie.domain,
              path: cookie.path,
            },
            () => {
              deletedCount++
              if (deletedCount === totalCookies) {
                resolve()
              }
            }
          )
        })
      })
    })
  }

  return {
    getAll,
    set,
    clearAll,
  }
} 