// 工事分類のAPIサービス
import api from '@/lib/api'
import {
  ConstructionClassification,
  CreateConstructionClassificationRequest,
  UpdateConstructionClassificationRequest,
  ConstructionClassificationSearchParams,
  ConstructionClassificationsResponse,
  ConstructionClassificationOption
} from '@/types/features/estimates/constructionClassification'

export const constructionClassificationService = {
  // 工事分類一覧取得
  async getConstructionClassifications(params: ConstructionClassificationSearchParams = {}): Promise<ConstructionClassificationsResponse> {
    const response = await api.get('/api/construction-classifications', { params })
    return response.data
  },

  // 工事分類詳細取得
  async getConstructionClassification(id: number): Promise<ConstructionClassification> {
    const response = await api.get(`/api/construction-classifications/${id}`)
    return response.data
  },

  // 工事分類作成
  async createConstructionClassification(data: CreateConstructionClassificationRequest): Promise<ConstructionClassification> {
    const response = await api.post('/api/construction-classifications', data)
    return response.data
  },

  // 工事分類更新
  async updateConstructionClassification(id: number, data: UpdateConstructionClassificationRequest): Promise<ConstructionClassification> {
    const response = await api.put(`/api/construction-classifications/${id}`, data)
    return response.data
  },

  // 工事分類削除
  async deleteConstructionClassification(id: number): Promise<void> {
    await api.delete(`/api/construction-classifications/${id}`)
  },

  // 工事分類オプション取得（ドロップダウン用）
  async getConstructionClassificationOptions(): Promise<ConstructionClassificationOption[]> {
    const response = await api.get('/api/construction-classifications/options')
    return response.data
  }
}
