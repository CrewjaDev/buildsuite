import api from '@/lib/api'

export interface AccessPolicy {
  id: number
  name: string
  description?: string
  business_code: string
  business_code_name?: string
  action: string
  resource_type: string
  conditions: Record<string, unknown>
  scope?: string
  effect: 'allow' | 'deny'
  priority: number
  is_active: boolean
  is_system: boolean
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PolicyOptions {
  business_codes: Array<{ code: string; name: string; description?: string }>
  actions: Record<string, string>
  resource_types: Record<string, string>
  operators: Record<string, string>
}

export interface CreatePolicyData {
  name: string
  description?: string
  business_code: string
  action: string
  resource_type: string
  conditions: Record<string, unknown>
  scope?: string
  effect: 'allow' | 'deny'
  priority: number
  is_active: boolean
  metadata?: Record<string, unknown>
}

export type UpdatePolicyData = Partial<CreatePolicyData>

export interface PolicyListResponse {
  success: boolean
  data: {
    data: AccessPolicy[]
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface PolicyResponse {
  success: boolean
  data: AccessPolicy
}

export interface OptionsResponse {
  success: boolean
  data: PolicyOptions
}

export interface TestConditionsRequest {
  conditions: Record<string, unknown>
  test_context: Record<string, unknown>
}

export interface TestConditionsResponse {
  success: boolean
  data: {
    result: boolean
    context: Record<string, unknown>
    conditions: Record<string, unknown>
  }
}

class ABACPolicyService {
  /**
   * ABACポリシー一覧を取得
   */
  async getPolicies(params?: {
    search?: string
    business_code?: string
    action?: string
    effect?: string
    is_active?: boolean
    sort_by?: string
    sort_direction?: 'asc' | 'desc'
    per_page?: number
    page?: number
  }): Promise<PolicyListResponse> {
    const response = await api.get('/access-policies', { params })
    return response.data
  }

  /**
   * 特定のABACポリシーを取得
   */
  async getPolicy(id: number): Promise<PolicyResponse> {
    const response = await api.get(`/access-policies/${id}`)
    return response.data
  }

  /**
   * 新しいABACポリシーを作成
   */
  async createPolicy(data: CreatePolicyData): Promise<PolicyResponse> {
    console.log('Creating policy with data:', JSON.stringify(data, null, 2))
    const response = await api.post('/access-policies', data)
    return response.data
  }

  /**
   * ABACポリシーを更新
   */
  async updatePolicy(id: number, data: UpdatePolicyData): Promise<PolicyResponse> {
    const response = await api.put(`/access-policies/${id}`, data)
    return response.data
  }

  /**
   * ABACポリシーを削除
   */
  async deletePolicy(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/access-policies/${id}`)
    return response.data
  }

  /**
   * ポリシー作成・編集用の選択肢データを取得
   */
  async getOptions(): Promise<OptionsResponse> {
    const response = await api.get('/access-policies/options')
    return response.data
  }

  /**
   * ポリシーの条件式をテスト
   */
  async testConditions(data: TestConditionsRequest): Promise<TestConditionsResponse> {
    const response = await api.post('/access-policies/test-conditions', data)
    return response.data
  }
}

export const abacPolicyService = new ABACPolicyService()
