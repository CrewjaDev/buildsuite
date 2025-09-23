import api from '@/lib/api'
import type {
  ApprovalFlow,
  ApprovalFlowTemplate,
  CreateApprovalFlowRequest,
  UpdateApprovalFlowRequest
} from '@/types/features/approvals/approvalFlows'

class ApprovalFlowService {
  /**
   * 承認フロー一覧を取得
   */
  async getApprovalFlows(): Promise<ApprovalFlow[]> {
    const response = await api.get('/approval-flows')
    return response.data.data
  }

  /**
   * 利用可能な承認フローを取得
   */
  async getAvailableFlows(params: {
    request_type: string
    amount?: number
    project_type?: number
    department_id?: number
  }): Promise<ApprovalFlow[]> {
    const response = await api.get('/approval-flows/available', { params })
    return response.data.data
  }

  /**
   * 承認フローテンプレート一覧を取得
   */
  async getTemplates(): Promise<Record<string, ApprovalFlowTemplate>> {
    const response = await api.get('/approval-flows/templates')
    return response.data.data
  }

  /**
   * 承認フローを新規作成
   */
  async createApprovalFlow(data: CreateApprovalFlowRequest): Promise<ApprovalFlow> {
    const response = await api.post('/approval-flows', data)
    return response.data.data
  }

  /**
   * テンプレートから承認フローを作成
   */
  async createFromTemplate(data: CreateApprovalFlowRequest): Promise<ApprovalFlow> {
    const response = await api.post('/approval-flows/create-from-template', data)
    return response.data.data
  }

  /**
   * 承認フロー詳細を取得
   */
  async getApprovalFlow(id: number): Promise<ApprovalFlow> {
    const response = await api.get(`/approval-flows/${id}`)
    return response.data.data
  }

  /**
   * 承認フローを更新
   */
  async updateApprovalFlow(id: number, data: UpdateApprovalFlowRequest): Promise<ApprovalFlow> {
    const response = await api.put(`/approval-flows/${id}`, data)
    return response.data.data
  }

  /**
   * 承認フローを削除
   */
  async deleteApprovalFlow(id: number): Promise<void> {
    await api.delete(`/approval-flows/${id}`)
  }
}

export const approvalFlowService = new ApprovalFlowService()
