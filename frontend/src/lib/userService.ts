import api from './api'

export interface User {
  id: number
  employee_id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
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
  }
}
