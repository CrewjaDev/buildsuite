import axios from 'axios'

// タイムアウト通知用のグローバル関数
let timeoutNotificationCallback: (() => void) | null = null

export const setTimeoutNotificationCallback = (callback: (() => void) | null) => {
  timeoutNotificationCallback = callback
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CSRFトークン用
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10), // 通常: 30秒
})

// リクエストインターセプター
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // CSRFトークンの処理（必要に応じて）
  const xsrfToken = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN'))?.split('=')[1]
  if (xsrfToken) {
    config.headers['X-XSRF-TOKEN'] = xsrfToken
  }
  
  return config
})

// レスポンスインターセプター
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const axiosError = error as { 
      response?: { data?: unknown; status?: number }; 
      message?: string;
      code?: string;
    }
    
    console.error('API Error:', axiosError.response?.data || axiosError.message || 'Unknown error')
    
    // タイムアウトエラーと接続エラーの検出
    if (axiosError.code === 'ECONNABORTED' || 
        (axiosError.message && axiosError.message.includes('timeout')) ||
        axiosError.code === 'ERR_BAD_RESPONSE' ||
        axiosError.response?.status === 502) {
      console.error('API Timeout/Connection Error detected')
      if (timeoutNotificationCallback) {
        timeoutNotificationCallback()
      }
      return Promise.reject(error)
    }
    
    if (axiosError.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    
    if (axiosError.response?.status === 419) {
      // CSRFトークンエラー
      console.warn('CSRF token expired')
    }
    
    return Promise.reject(error)
  }
)

export default api
