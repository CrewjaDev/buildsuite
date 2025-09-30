// 取引先のAPIサービス
import api from '@/lib/api'
import {
  Partner,
  CreatePartnerRequest,
  UpdatePartnerRequest,
  PartnerSearchParams,
  PartnersResponse,
  PartnerOption
} from '@/types/features/estimates/partner'

export const partnerService = {
  // 取引先一覧取得
  async getPartners(params: PartnerSearchParams = {}): Promise<PartnersResponse> {
    const response = await api.get('/partners', { params })
    return response.data
  },

  // 取引先詳細取得
  async getPartner(id: number): Promise<Partner> {
    const response = await api.get(`/partners/${id}`)
    return response.data
  },

  // 取引先作成
  async createPartner(data: CreatePartnerRequest): Promise<Partner> {
    const response = await api.post('/partners', data)
    return response.data
  },

  // 取引先更新
  async updatePartner(id: number, data: UpdatePartnerRequest): Promise<Partner> {
    const response = await api.put(`/partners/${id}`, data)
    return response.data
  },

  // 取引先削除
  async deletePartner(id: number): Promise<void> {
    await api.delete(`/partners/${id}`)
  },

  // 取引先オプション取得（ドロップダウン用）
  async getPartnerOptions(type?: string): Promise<PartnerOption[]> {
    const params = type ? { type } : { type: 'customer' } // デフォルトで顧客を取得
    const response = await api.get('/partners/options', { params })
    return response.data
  },

  // 取引先検索（オートコンプリート用）
  async searchPartners(query: string, type?: string): Promise<Partner[]> {
    const params = { search: query, is_active: true, ...(type && { type }) }
    const response = await api.get('/partners/search', { params })
    return response.data
  }
}
