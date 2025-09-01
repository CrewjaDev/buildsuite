import api from '@/lib/api'
import { UserDetail } from '@/types/user'

export interface UsersResponse {
  users: UserDetail[]
  totalCount: number
}

export interface UserSearchParams {
  page?: number
  pageSize?: number
  search?: string
  is_active?: boolean
  system_level?: string
  department_id?: number
  role_id?: number
  is_locked?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface SystemLevel {
  id: number
  code: string
  name: string
  display_name: string
  description: string
  priority: number
  is_system: boolean
  is_active: boolean
}

export interface UserOptions {
  roles: Array<{
    id: number
    name: string
    display_name: string
    priority: number
  }>
  departments: Array<{
    id: number
    name: string
    code: string
  }>
  system_levels: SystemLevel[]
  positions: Array<{
    id: number
    code: string
    name: string
    display_name: string
    description: string
    level: number
    sort_order: number
    is_active: boolean
  }>
}

export const userService = {
  // ユーザー一覧取得
  async getUsers(params: UserSearchParams): Promise<UsersResponse> {
    const response = await api.get('/users', { params })
    return response.data
  },

  // 特定ユーザー取得
  async getUser(id: number): Promise<UserDetail> {
    const response = await api.get(`/users/${id}`)
    return response.data.data
  },

  // 新規ユーザー作成
  async createUser(userData: Partial<UserDetail>): Promise<UserDetail> {
    const response = await api.post('/users', userData)
    return response.data
  },

  // ユーザー更新
  async updateUser(id: number, userData: Partial<UserDetail>): Promise<UserDetail> {
    const response = await api.put(`/users/${id}`, userData)
    return response.data.data
  },

  // ユーザー削除
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  // システム権限レベル一覧取得
  async getSystemLevels(): Promise<SystemLevel[]> {
    const response = await api.get('/system-levels')
    return response.data.data
  },

  // ユーザー編集用オプションデータ取得
  async getOptions(): Promise<{ success: boolean; data: UserOptions }> {
    const response = await api.get('/users/options')
    return response.data
  },

  // パスワード変更
  async changePassword(id: number, password: string, passwordConfirmation: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/users/${id}/reset-password`, {
      password,
      password_confirmation: passwordConfirmation
    })
    return response.data
  }
}
