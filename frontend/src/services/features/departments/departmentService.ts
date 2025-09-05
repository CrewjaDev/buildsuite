import api from '@/lib/api'

export interface Department {
  id: number
  name: string
  code: string
  description?: string
  parent_id?: number
  level: number
  path: string
  sort_order: number
  manager_id?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DepartmentsResponse {
  success: boolean
  data: {
    data: Department[]
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const departmentService = {
  /**
   * 部署一覧を取得
   */
  async getDepartments(): Promise<DepartmentsResponse> {
    const response = await api.get('/departments')
    return response.data
  },

  /**
   * アクティブな部署のみを取得
   */
  async getActiveDepartments(): Promise<Department[]> {
    const response = await api.get('/departments?is_active=true')
    return response.data.data.data
  },
}
