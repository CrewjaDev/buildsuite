import api from '@/lib/api'
import { 
  Estimate, 
  EstimateItem, 
  Partner, 
  ProjectType, 
  ConstructionClassification,
  EstimateSearchParams,
  EstimateItemSearchParams,
  PartnerSearchParams,
  EstimatesResponse,
  PartnersResponse
} from '../types'

// ===== 見積関連のAPI =====

export const estimateService = {
  // 見積一覧取得
  async getEstimates(params: EstimateSearchParams): Promise<EstimatesResponse> {
    const response = await api.get('/estimates', { params })
    return response.data
  },

  // 見積詳細取得
  async getEstimate(id: string): Promise<Estimate> {
    const response = await api.get(`/estimates/${id}`)
    return response.data.data
  },

  // 見積作成
  async createEstimate(estimateData: Partial<Estimate>): Promise<Estimate> {
    const response = await api.post('/estimates', estimateData)
    return response.data.data
  },

  // 見積更新
  async updateEstimate(id: string, estimateData: Partial<Estimate>): Promise<Estimate> {
    const response = await api.put(`/estimates/${id}`, estimateData)
    return response.data.data
  },

  // 見積削除
  async deleteEstimate(id: string): Promise<void> {
    await api.delete(`/estimates/${id}`)
  },

  // 見積明細一覧取得
  async getEstimateItems(params: EstimateItemSearchParams): Promise<EstimatesResponse> {
    const response = await api.get('/estimate-items', { params })
    return response.data
  },

  // 見積明細作成
  async createEstimateItem(itemData: Partial<EstimateItem>): Promise<EstimateItem> {
    const response = await api.post('/estimate-items', itemData)
    return response.data.data
  },

  // 見積明細更新
  async updateEstimateItem(id: string, itemData: Partial<EstimateItem>): Promise<EstimateItem> {
    const response = await api.put(`/estimate-items/${id}`, itemData)
    return response.data.data
  },

  // 見積明細削除
  async deleteEstimateItem(id: string): Promise<void> {
    await api.delete(`/estimate-items/${id}`)
  },
}

// ===== マスタデータ関連のAPI =====

export const partnerService = {
  // 取引先一覧取得
  async getPartners(params: PartnerSearchParams): Promise<PartnersResponse> {
    const response = await api.get('/partners', { params })
    return response.data
  },

  // 取引先詳細取得
  async getPartner(id: string): Promise<Partner> {
    const response = await api.get(`/partners/${id}`)
    return response.data.data
  },

  // 取引先作成
  async createPartner(partnerData: Partial<Partner>): Promise<Partner> {
    const response = await api.post('/partners', partnerData)
    return response.data.data
  },

  // 取引先更新
  async updatePartner(id: string, partnerData: Partial<Partner>): Promise<Partner> {
    const response = await api.put(`/partners/${id}`, partnerData)
    return response.data.data
  },

  // 取引先削除
  async deletePartner(id: string): Promise<void> {
    await api.delete(`/partners/${id}`)
  },
}

export const projectTypeService = {
  // プロジェクトタイプ一覧取得
  async getProjectTypes(): Promise<ProjectType[]> {
    const response = await api.get('/project-types')
    return response.data.data
  },

  // プロジェクトタイプ詳細取得
  async getProjectType(id: string): Promise<ProjectType> {
    const response = await api.get(`/project-types/${id}`)
    return response.data.data
  },
}

export const constructionClassificationService = {
  // 工事分類一覧取得
  async getConstructionClassifications(): Promise<ConstructionClassification[]> {
    const response = await api.get('/construction-classifications')
    return response.data.data
  },

  // 工事分類詳細取得
  async getConstructionClassification(id: string): Promise<ConstructionClassification> {
    const response = await api.get(`/construction-classifications/${id}`)
    return response.data.data
  },
}
