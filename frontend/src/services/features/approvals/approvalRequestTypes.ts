import api from '@/lib/api'
import type {
  ApprovalRequestType,
  CreateApprovalRequestTypeRequest,
  UpdateApprovalRequestTypeRequest,
  ApprovalFlow
} from '@/types/features/approvals/approvalRequestTypes'

class ApprovalRequestTypeService {
  /**
   * 承認依頼タイプ一覧を取得
   */
  async getApprovalRequestTypes(): Promise<ApprovalRequestType[]> {
    const response = await api.get('/approval-request-types')
    return response.data.data
  }

  /**
   * 承認依頼タイプを作成
   */
  async createApprovalRequestType(data: CreateApprovalRequestTypeRequest): Promise<ApprovalRequestType> {
    const response = await api.post('/approval-request-types', data)
    return response.data.data
  }

  /**
   * 承認依頼タイプの詳細を取得
   */
  async getApprovalRequestType(id: number): Promise<ApprovalRequestType> {
    const response = await api.get(`/approval-request-types/${id}`)
    return response.data.data
  }

  /**
   * 承認依頼タイプを更新
   */
  async updateApprovalRequestType(id: number, data: UpdateApprovalRequestTypeRequest): Promise<ApprovalRequestType> {
    const response = await api.put(`/approval-request-types/${id}`, data)
    return response.data.data
  }

  /**
   * 承認依頼タイプを削除
   */
  async deleteApprovalRequestType(id: number): Promise<void> {
    await api.delete(`/approval-request-types/${id}`)
  }

  /**
   * 承認フロー一覧を取得（選択用）
   */
  async getApprovalFlows(): Promise<ApprovalFlow[]> {
    const response = await api.get('/approval-request-types/approval-flows')
    return response.data.data
  }
}

export const approvalRequestTypeService = new ApprovalRequestTypeService()
