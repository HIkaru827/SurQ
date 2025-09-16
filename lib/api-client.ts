import { auth } from './firebase'

/**
 * 認証付きAPI呼び出しのヘルパー関数
 */
export class AuthenticatedAPIClient {
  private static async getAuthToken(): Promise<string> {
    if (!auth?.currentUser) {
      throw new Error('User not authenticated')
    }
    
    const token = await auth.currentUser.getIdToken()
    return token
  }

  /**
   * 認証付きGETリクエスト
   */
  static async get(url: string): Promise<Response> {
    const token = await this.getAuthToken()
    
    return fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * 認証付きPOSTリクエスト
   */
  static async post(url: string, data: any): Promise<Response> {
    const token = await this.getAuthToken()
    
    return fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  }

  /**
   * 認証付きPUTリクエスト
   */
  static async put(url: string, data: any): Promise<Response> {
    const token = await this.getAuthToken()
    
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  }

  /**
   * 認証付きDELETEリクエスト
   */
  static async delete(url: string): Promise<Response> {
    const token = await this.getAuthToken()
    
    return fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }
}

/**
 * PWA対応の便利なヘルパー関数（リトライ機能付き）
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  if (!auth?.currentUser) {
    throw new Error('User not authenticated')
  }

  const token = await auth.currentUser.getIdToken()

  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // PWA環境での問題を検出
  const isPWA = window.matchMedia('(display-mode: standalone)').matches
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  if (isPWA || isMobile) {
    console.log('PWA/Mobile environment detected, using enhanced request handling')
  }

  const requestConfig: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // PWA環境でのタイムアウト設定を短くする
    ...(isPWA && {
      signal: AbortSignal.timeout(30000) // 30秒タイムアウト
    })
  }

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API request attempt ${attempt}/${maxRetries}:`, { url, method: options.method || 'GET' })

      const response = await fetch(url, requestConfig)

      console.log(`API response attempt ${attempt}:`, {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })

      // 成功した場合は即座に返す
      if (response.ok) {
        return response
      }

      // 4xx エラーの場合はリトライしない
      if (response.status >= 400 && response.status < 500) {
        return response
      }

      // 5xx エラーの場合はリトライする
      if (attempt < maxRetries) {
        console.log(`Server error (${response.status}), retrying in ${attempt * 1000}ms...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        continue
      }

      return response

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.error(`API request attempt ${attempt} failed:`, lastError)

      // ネットワークエラーやタイムアウトの場合はリトライ
      if (attempt < maxRetries) {
        console.log(`Network error, retrying in ${attempt * 1000}ms...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        continue
      }
    }
  }

  // すべてのリトライが失敗した場合
  throw lastError || new Error('All retry attempts failed')
}