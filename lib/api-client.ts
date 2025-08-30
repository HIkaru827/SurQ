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
 * 便利なヘルパー関数
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (!auth?.currentUser) {
    throw new Error('User not authenticated')
  }

  const token = await auth.currentUser.getIdToken()
  
  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })
}