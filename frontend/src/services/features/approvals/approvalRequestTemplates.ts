import api from '@/lib/api'
import type {
  ApprovalRequestTemplate,
  CreateApprovalRequestTemplateRequest,
  UpdateApprovalRequestTemplateRequest
} from '@/types/features/approvals/approvalRequestTemplates'

class ApprovalRequestTemplateService {
  /**
   * 承認依頼テンプレート一覧を取得
   */
  async getApprovalRequestTemplates(): Promise<ApprovalRequestTemplate[]> {
    const response = await api.get('/approval-request-templates')
    return response.data.data
  }

  /**
   * 承認依頼テンプレートを作成
   */
  async createApprovalRequestTemplate(data: CreateApprovalRequestTemplateRequest): Promise<ApprovalRequestTemplate> {
    const response = await api.post('/approval-request-templates', data)
    return response.data.data
  }

  /**
   * 承認依頼テンプレートの詳細を取得
   */
  async getApprovalRequestTemplate(id: number): Promise<ApprovalRequestTemplate> {
    const response = await api.get(`/approval-request-templates/${id}`)
    return response.data.data
  }

  /**
   * 承認依頼テンプレートを更新
   */
  async updateApprovalRequestTemplate(id: number, data: UpdateApprovalRequestTemplateRequest): Promise<ApprovalRequestTemplate> {
    const response = await api.put(`/approval-request-templates/${id}`, data)
    return response.data.data
  }

  /**
   * 承認依頼テンプレートを削除
   */
  async deleteApprovalRequestTemplate(id: number): Promise<void> {
    await api.delete(`/approval-request-templates/${id}`)
  }
}

export const approvalRequestTemplateService = new ApprovalRequestTemplateService()
