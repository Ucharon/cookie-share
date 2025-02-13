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
      GM_cookie.list({}, (cookies) => {
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
            session: 'session' in cookie 
              ? cookie.session 
              : (cookie.expirationDate === undefined || cookie.expirationDate === 0),
            expirationDate: cookie.expirationDate,
          }))
        )
      })
    })
  }

  const set = (cookie: Cookie): Promise<void> => {
    return new Promise((resolve, reject) => {
      GM_cookie.set(
        {
          name: cookie.name,
          value: cookie.value,
          domain: `.${cookie.domain.split('.').slice(-2).join('.')}`,
          path: cookie.path || '/',
          secure: cookie.secure,
          httpOnly: cookie.httpOnly || false,
          sameSite: 'Lax',
          expirationDate: cookie.expirationDate,
        },
        (success, error) => {
          if (success) {
            resolve()
          } else {
            reject(error)
          }
        }
      )
    })
  }

  const clearAll = (): Promise<void> => {
    return new Promise((resolve) => {
      GM_cookie.list({}, (cookies) => {
        let deletedCount = 0
        const totalCookies = cookies.length

        if (totalCookies === 0) {
          resolve()
          return
        }

        cookies.forEach((cookie) => {
          GM_cookie.delete(
            {
              name: cookie.name,
              domain: cookie.domain,
              path: cookie.path || '/',
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