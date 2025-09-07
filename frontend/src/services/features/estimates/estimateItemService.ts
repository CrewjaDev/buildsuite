// 見積明細のAPIサービス
import api from '@/lib/api'
import {
  EstimateItem,
  CreateEstimateItemRequest,
  UpdateEstimateItemRequest,
  EstimateItemSearchParams,
  EstimateItemsResponse,
  EstimateItemStats
} from '@/types/features/estimates/estimateItem'

export const estimateItemService = {
  // 見積明細一覧取得
  async getEstimateItems(params: EstimateItemSearchParams): Promise<EstimateItemsResponse> {
    const response = await api.get('/estimate-items', { params })
    return response.data
  },

  // 見積明細詳細取得
  async getEstimateItem(id: string): Promise<EstimateItem> {
    const response = await api.get(`/estimate-items/${id}`)
    return response.data.data
  },

  // 見積明細作成
  async createEstimateItem(data: CreateEstimateItemRequest): Promise<EstimateItem> {
    const response = await api.post('/estimate-items', data)
    return response.data
  },

  // 見積明細更新
  async updateEstimateItem(id: string, data: UpdateEstimateItemRequest): Promise<EstimateItem> {
    const response = await api.put(`/estimate-items/${id}`, data)
    return response.data
  },

  // 見積明細削除
  async deleteEstimateItem(id: string): Promise<void> {
    await api.delete(`/estimate-items/${id}`)
  },

  // 見積明細一覧取得（見積ID指定）
  async getEstimateItemsByEstimateId(estimateId: string): Promise<EstimateItem[]> {
    const response = await api.get(`/estimate-items?estimate_id=${estimateId}`)
    return response.data.data
  },

  // 見積明細統計取得
  async getEstimateItemStats(estimateId: string): Promise<EstimateItemStats> {
    const response = await api.get(`/estimates/${estimateId}/items/stats`)
    return response.data
  },

  // 見積明細一括更新（並び順）
  async updateEstimateItemOrder(estimateId: string, items: { id: string; display_order: number }[]): Promise<void> {
    await api.put(`/estimates/${estimateId}/items/order`, { items })
  },

  // 見積明細一括削除
  async deleteEstimateItems(estimateId: string, itemIds: string[]): Promise<void> {
    await api.delete(`/estimates/${estimateId}/items`, { data: { item_ids: itemIds } })
  }
}
