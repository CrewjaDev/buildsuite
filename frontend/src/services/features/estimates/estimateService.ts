// 見積基本情報のAPIサービス
import api from '@/lib/api'
import {
  Estimate,
  CreateEstimateRequest,
  UpdateEstimateRequest,
  EstimateSearchParams,
  EstimatesResponse,
  EstimateStats
} from '@/types/features/estimates/estimate'

export const estimateService = {
  // 見積一覧取得
  async getEstimates(params: EstimateSearchParams = {}): Promise<EstimatesResponse> {
    const response = await api.get('/estimates', { params })
    return response.data
  },

  // 見積詳細取得
  async getEstimate(id: string): Promise<Estimate> {
    const response = await api.get(`/estimates/${id}`)
    return response.data.data
  },

  // 見積作成
  async createEstimate(data: CreateEstimateRequest): Promise<Estimate> {
    const response = await api.post('/estimates', data)
    return response.data.data
  },

  // 見積更新
  async updateEstimate(id: string, data: UpdateEstimateRequest): Promise<Estimate> {
    const response = await api.put(`/estimates/${id}`, data)
    return response.data.data
  },

  // 見積削除
  async deleteEstimate(id: string): Promise<void> {
    await api.delete(`/estimates/${id}`)
  },

  // 見積統計取得
  async getEstimateStats(): Promise<EstimateStats> {
    const response = await api.get('/estimates/stats')
    return response.data
  },

  // 見積番号生成
  async generateEstimateNumber(): Promise<{ estimate_number: string }> {
    const response = await api.post('/estimates/generate-number')
    return response.data
  },

  // 見積複製
  async duplicateEstimate(id: string): Promise<Estimate> {
    const response = await api.post(`/estimates/${id}/duplicate`)
    return response.data
  },

  // 見積ステータス更新
  async updateEstimateStatus(id: string, status: string): Promise<Estimate> {
    const response = await api.patch(`/estimates/${id}/status`, { status })
    return response.data
  }
}
