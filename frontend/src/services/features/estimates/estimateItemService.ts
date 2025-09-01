// 見積明細のAPIサービス
import api from '@/lib/api'
import {
  EstimateItem,
  CreateEstimateItemRequest,
  UpdateEstimateItemRequest,
  EstimateItemSearchParams,
  EstimateItemsResponse,
  EstimateItemTree,
  EstimateItemStats
} from '@/types/features/estimates/estimateItem'

export const estimateItemService = {
  // 見積明細一覧取得
  async getEstimateItems(params: EstimateItemSearchParams): Promise<EstimateItemsResponse> {
    const response = await api.get('/estimate-items', { params })
    return response.data
  },

  // 見積明細詳細取得
  async getEstimateItem(id: number): Promise<EstimateItem> {
    const response = await api.get(`/estimate-items/${id}`)
    return response.data
  },

  // 見積明細作成
  async createEstimateItem(data: CreateEstimateItemRequest): Promise<EstimateItem> {
    const response = await api.post('/estimate-items', data)
    return response.data
  },

  // 見積明細更新
  async updateEstimateItem(id: number, data: UpdateEstimateItemRequest): Promise<EstimateItem> {
    const response = await api.put(`/estimate-items/${id}`, data)
    return response.data
  },

  // 見積明細削除
  async deleteEstimateItem(id: number): Promise<void> {
    await api.delete(`/estimate-items/${id}`)
  },

  // 見積明細ツリー取得
  async getEstimateItemTree(estimateId: number): Promise<EstimateItemTree[]> {
    const response = await api.get(`/estimates/${estimateId}/items/tree`)
    return response.data
  },

  // 見積明細統計取得
  async getEstimateItemStats(estimateId: number): Promise<EstimateItemStats> {
    const response = await api.get(`/estimates/${estimateId}/items/stats`)
    return response.data
  },

  // 見積明細一括更新（並び順）
  async updateEstimateItemOrder(estimateId: number, items: { id: number; sort_order: number }[]): Promise<void> {
    await api.put(`/estimates/${estimateId}/items/order`, { items })
  },

  // 見積明細一括削除
  async deleteEstimateItems(estimateId: number, itemIds: number[]): Promise<void> {
    await api.delete(`/estimates/${estimateId}/items`, { data: { item_ids: itemIds } })
  }
}
