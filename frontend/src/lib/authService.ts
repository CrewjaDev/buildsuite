import api from './api'

export interface LoginCredentials {
  login_id: string
  password: string
}

export interface LoginResponse {
  user: {
    id: number
    name: string
    email: string
  }
  token: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/login', credentials)
      
      // レスポンス形式を確認して適切に処理
      if (response.data.success && response.data.data) {
        // バックエンドの形式: { success: true, data: { user: {...}, token: "..." } }
        return {
          user: response.data.data.user,
          token: response.data.data.token
        }
      } else {
        // 直接形式: { user: {...}, token: "..." }
        return response.data
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  },

  async me(): Promise<LoginResponse['user']> {
    try {
      const response = await api.get('/auth/me')
      
      // レスポンス形式を確認して適切に処理
      if (response.data.success && response.data.data) {
        return response.data.data
      } else {
        return response.data
      }
    } catch (error) {
      console.error('Me error:', error)
      throw error
    }
  },
}
