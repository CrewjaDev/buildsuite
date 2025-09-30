import api from './api'
import { UserDetail } from '@/types/user'

export interface LoginCredentials {
  login_id: string
  password: string
}

export interface LoginResponse {
  user: UserDetail
  token: string
  effectivePermissions: string[]
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/login', credentials)
      
      // レスポンス形式を確認して適切に処理
      if (response.data.success && response.data.data) {
        // バックエンドの形式: { success: true, data: { user: {...}, token: "...", effective_permissions: [...] } }
        return {
          user: response.data.data.user,
          token: response.data.data.token,
          effectivePermissions: response.data.data.effective_permissions || []
        }
      } else {
        // 直接形式: { user: {...}, token: "...", effective_permissions: [...] }
        return {
          user: response.data.user,
          token: response.data.token,
          effectivePermissions: response.data.effective_permissions || []
        }
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

  async me(): Promise<{ user: UserDetail; effectivePermissions: string[] }> {
    try {
      const response = await api.get('/auth/me')
      
      // レスポンス形式を確認して適切に処理
      if (response.data.success && response.data.data) {
        return {
          user: response.data.data.user,
          effectivePermissions: response.data.data.effective_permissions || []
        }
      } else {
        return {
          user: response.data.user,
          effectivePermissions: response.data.effective_permissions || []
        }
      }
    } catch (error) {
      console.error('Me error:', error)
      throw error
    }
  },
}
