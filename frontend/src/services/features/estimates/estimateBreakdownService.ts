import api from '@/lib/api'
import { 
  EstimateBreakdown, 
  EstimateBreakdownTree, 
  CreateEstimateBreakdownRequest, 
  UpdateEstimateBreakdownRequest,
  EstimateBreakdownOrderRequest 
} from '@/types/features/estimates/estimateBreakdown'

export const estimateBreakdownService = {
  // 見積内訳一覧取得
  async getBreakdowns(estimateId: string): Promise<EstimateBreakdown[]> {
    const response = await api.get(`/estimate-breakdowns?estimate_id=${estimateId}`)
    return response.data.data
  },

  // 見積内訳ツリー取得
  async getBreakdownTree(estimateId: string): Promise<EstimateBreakdownTree[]> {
    const response = await api.get(`/estimate-breakdowns/tree?estimate_id=${estimateId}`)
    return response.data.data
  },

  // 見積内訳詳細取得
  async getBreakdown(breakdownId: string): Promise<EstimateBreakdown> {
    const response = await api.get(`/estimate-breakdowns/${breakdownId}`)
    return response.data.data
  },

  // 見積内訳作成
  async createBreakdown(data: CreateEstimateBreakdownRequest): Promise<EstimateBreakdown> {
    const response = await api.post('/estimate-breakdowns', data)
    return response.data
  },

  // 見積内訳更新
  async updateBreakdown(breakdownId: string, data: UpdateEstimateBreakdownRequest): Promise<EstimateBreakdown> {
    const response = await api.put(`/estimate-breakdowns/${breakdownId}`, data)
    return response.data
  },

  // 見積内訳削除
  async deleteBreakdown(breakdownId: string): Promise<void> {
    await api.delete(`/estimate-breakdowns/${breakdownId}`)
  },

  // 見積内訳順序更新
  async updateBreakdownOrder(estimateId: string, orders: EstimateBreakdownOrderRequest[]): Promise<void> {
    await api.post('/estimate-breakdowns/order', {
      estimate_id: estimateId,
      orders
    })
  },

  // 金額再計算
  async recalculateAmounts(estimateId: string): Promise<void> {
    await api.post(`/estimate-breakdowns/${estimateId}/recalculate`)
  }
}
