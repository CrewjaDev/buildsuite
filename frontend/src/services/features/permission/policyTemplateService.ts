import api from '@/lib/api'

export interface PolicyTemplate {
  id: number
  template_code: string
  name: string
  description?: string
  category: string
  condition_type: string
  condition_rule: {
    field?: string
    operator?: string
    value?: unknown
    [key: string]: unknown
  }
  parameters?: {
    required_fields: string[]
    configurable_values?: Record<string, {
      type: string
      label: string
      default?: unknown
      unit?: string
      description?: string
      min?: number
      max?: number
    }>
  }
  applicable_actions: string[]
  tags: string[]
  is_system: boolean
  is_active: boolean
  priority: number
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CreateTemplateData {
  template_code: string
  name: string
  description?: string
  category: string
  condition_type: string
  condition_rule: {
    field?: string
    operator?: string
    value?: unknown
    [key: string]: unknown
  }
  parameters?: Record<string, unknown>
  applicable_actions: string[]
  tags?: string[]
  is_system?: boolean
  is_active?: boolean
  priority?: number
  metadata?: Record<string, unknown>
}

export type UpdateTemplateData = Partial<CreateTemplateData>

export interface TemplateListResponse {
  success: boolean
  data: {
    data: PolicyTemplate[]
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface TemplateResponse {
  success: boolean
  data: PolicyTemplate
}

export interface GenerateConditionRequest {
  template_id: number
  parameters?: Record<string, unknown>
}

export interface GenerateConditionResponse {
  success: boolean
  data: {
    condition: Record<string, unknown>
    template: PolicyTemplate
  }
}

export interface GenerateCombinedConditionRequest {
  template_ids: number[]
  parameters?: Record<string, unknown>
  operator: 'and' | 'or'
}

export interface GenerateCombinedConditionResponse {
  success: boolean
  data: {
    condition: Record<string, unknown>
    templates: PolicyTemplate[]
  }
}

export interface TemplateStats {
  total: number
  active: number
  system: number
  custom: number
  by_category: Record<string, number>
  by_action: Record<string, number>
}

class PolicyTemplateService {
  /**
   * ポリシーテンプレート一覧を取得
   */
  async getTemplates(params?: {
    search?: string
    category?: string
    action?: string
    is_system?: boolean
    is_active?: boolean
    sort_by?: string
    sort_direction?: 'asc' | 'desc'
    per_page?: number
    page?: number
  }): Promise<TemplateListResponse> {
    const response = await api.get('/policy-templates', { params })
    return response.data
  }

  /**
   * 特定のポリシーテンプレートを取得
   */
  async getTemplate(id: number): Promise<TemplateResponse> {
    const response = await api.get(`/policy-templates/${id}`)
    return response.data
  }

  /**
   * 新しいポリシーテンプレートを作成
   */
  async createTemplate(data: CreateTemplateData): Promise<TemplateResponse> {
    const response = await api.post('/policy-templates', data)
    return response.data
  }

  /**
   * ポリシーテンプレートを更新
   */
  async updateTemplate(id: number, data: UpdateTemplateData): Promise<TemplateResponse> {
    const response = await api.put(`/policy-templates/${id}`, data)
    return response.data
  }

  /**
   * ポリシーテンプレートを削除
   */
  async deleteTemplate(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/policy-templates/${id}`)
    return response.data
  }

  /**
   * テンプレートのカテゴリ一覧を取得
   */
  async getCategories(): Promise<{ success: boolean; data: string[] }> {
    const response = await api.get('/policy-templates/categories')
    return response.data
  }

  /**
   * アクション別テンプレート一覧を取得
   */
  async getTemplatesByAction(action: string): Promise<{ success: boolean; data: PolicyTemplate[] }> {
    const response = await api.get(`/policy-templates/action/${action}`)
    return response.data
  }

  /**
   * テンプレートから条件式を生成
   */
  async generateCondition(data: GenerateConditionRequest): Promise<GenerateConditionResponse> {
    const response = await api.post('/policy-templates/generate-condition', data)
    return response.data
  }

  /**
   * 複数テンプレートから条件式を組み合わせて生成
   */
  async generateCombinedCondition(data: GenerateCombinedConditionRequest): Promise<GenerateCombinedConditionResponse> {
    const response = await api.post('/policy-templates/generate-combined-condition', data)
    return response.data
  }
}

export const policyTemplateService = new PolicyTemplateService()
