import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CSRFトークン用
  timeout: 10000,
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
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    
    if (error.response?.status === 419) {
      // CSRFトークンエラー
      console.warn('CSRF token expired')
    }
    
    return Promise.reject(error)
  }
)

export default api
