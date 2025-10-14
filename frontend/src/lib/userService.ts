import api from './api'

export interface User {
  id: number
  login_id?: string
  employee_id: string
  name: string
  name_kana?: string
  email?: string
  birth_date?: string
  gender?: string
  phone?: string
  mobile_phone?: string
  postal_code?: string
  prefecture?: string
  address?: string
  department?: {
    id: number
    name: string
  }
  position?: {
    id: number
    code: string
    name: string
    display_name: string
    level: number
  }
  job_title?: string
  hire_date?: string
  service_years?: number
  service_months?: number
  system_level?: string
  is_active?: boolean
  is_admin?: boolean
  last_login_at?: string
  password_changed_at?: string
  password_expires_at?: string
  failed_login_attempts?: number
  locked_at?: string
  is_locked?: boolean
  is_password_expired?: boolean
  roles?: Array<{
    id: number
    name: string
    display_name: string
    priority: number
  }>
  departments?: Array<{
    id: number
    name: string
    code: string
    position?: string
    is_primary: boolean
  }>
  system_level_info?: {
    code: string
    name: string
    display_name: string
    priority: number
  }
  primary_department?: {
    id: number
    name: string
    code: string
    position?: string
    is_primary: boolean
  }
  status?: 'active' | 'inactive'
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
}

export interface UsersResponse {
  users: User[]
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
  async getUser(id: number): Promise<User> {
    const response = await api.get(`/users/${id}`)
    return response.data.data
  },

  // 新規ユーザー作成
  async createUser(userData: Partial<User>): Promise<User> {
    const response = await api.post('/users', userData)
    return response.data
  },

  // ユーザー更新
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
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
