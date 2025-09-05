import api from '@/lib/api'

export interface Position {
  id: number
  code: string
  name: string
  display_name: string
  description?: string
  level: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PositionsResponse {
  success: boolean
  data: {
    data: Position[]
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const positionService = {
  /**
   * 職位一覧を取得
   */
  async getPositions(): Promise<PositionsResponse> {
    const response = await api.get('/positions')
    return response.data
  },

  /**
   * アクティブな職位のみを取得
   */
  async getActivePositions(): Promise<Position[]> {
    const response = await api.get('/positions?is_active=true')
    return response.data.data.data
  },
}
