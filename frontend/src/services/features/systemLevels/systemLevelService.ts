import api from '@/lib/api'

export interface SystemLevel {
  id: number
  code: string
  name: string
  display_name: string
  description?: string
  priority: number
  is_system: boolean
  is_active: boolean
  permissions_count: number
  users_count: number
  created_at: string
  updated_at: string
}

export interface SystemLevelsResponse {
  success: boolean
  data: {
    data: SystemLevel[]
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const systemLevelService = {
  /**
   * システム権限レベル一覧を取得
   */
  async getSystemLevels(): Promise<SystemLevelsResponse> {
    const response = await api.get('/system-levels')
    return response.data
  },

  /**
   * アクティブなシステム権限レベルのみを取得
   */
  async getActiveSystemLevels(): Promise<SystemLevel[]> {
    const response = await api.get('/system-levels?is_active=true')
    return response.data.data.data
  },
}
