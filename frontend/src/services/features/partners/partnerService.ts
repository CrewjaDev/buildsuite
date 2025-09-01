// 取引先管理のAPIサービス
import api from '@/lib/api'
import {
  Partner,
  CreatePartnerRequest,
  UpdatePartnerRequest,
  PartnerSearchParams,
  PartnersResponse,
  PartnerOptionsResponse
} from '@/types/features/partners/partner'

export const partnerService = {
  // 取引先一覧取得
  async getPartners(params: PartnerSearchParams = {}): Promise<PartnersResponse> {
    const response = await api.get('/partners', { params })
    return response.data
  },

  // 取引先詳細取得
  async getPartner(id: number): Promise<Partner> {
    const response = await api.get(`/partners/${id}`)
    return response.data.data
  },

  // 取引先作成
  async createPartner(data: CreatePartnerRequest): Promise<Partner> {
    const response = await api.post('/partners', data)
    return response.data.data
  },

  // 取引先更新
  async updatePartner(id: number, data: UpdatePartnerRequest): Promise<Partner> {
    const response = await api.put(`/partners/${id}`, data)
    return response.data.data
  },

  // 取引先削除
  async deletePartner(id: number): Promise<void> {
    await api.delete(`/partners/${id}`)
  },

  // 取引先オプションデータ取得
  async getPartnerOptions(): Promise<PartnerOptionsResponse> {
    const response = await api.get('/partners/options')
    return response.data
  },

  // 取引先アクティブ状態切り替え
  async togglePartnerActive(id: number): Promise<{ is_active: boolean; status: string }> {
    const response = await api.post(`/partners/${id}/toggle-active`)
    return response.data.data
  }
}
