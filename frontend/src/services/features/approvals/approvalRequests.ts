import api from '@/lib/api'
import type {
  ApprovalRequest,
  ApprovalHistory,
  CreateApprovalRequestRequest,
  UpdateApprovalRequestRequest,
  ApprovalActionRequest,
  ApprovalRequestFilter,
  ApprovalRequestListResponse
} from '@/types/features/approvals/approvalRequests'
import type { ApprovalFlow } from '@/types/features/approvals/approvalFlows'

class ApprovalRequestService {
  /**
   * 承認依頼一覧を取得
   */
  async getApprovalRequests(params?: {
    page?: number
    per_page?: number
    filter?: ApprovalRequestFilter
    sort?: string
  }): Promise<ApprovalRequestListResponse> {
    const response = await api.get('/approval-requests', { params })
    return response.data
  }

  /**
   * 承認依頼詳細を取得
   */
  async getApprovalRequest(id: number): Promise<{ success: boolean; data: ApprovalRequest }> {
    const response = await api.get(`/approval-requests/${id}`)
    return response.data
  }

  /**
   * 承認依頼を作成
   */
  async createApprovalRequest(data: CreateApprovalRequestRequest): Promise<ApprovalRequest> {
    const response = await api.post('/approval-requests', data)
    return response.data.data
  }

  /**
   * 承認依頼を更新
   */
  async updateApprovalRequest(id: number, data: UpdateApprovalRequestRequest): Promise<ApprovalRequest> {
    const response = await api.put(`/approval-requests/${id}`, data)
    return response.data.data
  }

  /**
   * 承認依頼を削除
   */
  async deleteApprovalRequest(id: number): Promise<void> {
    await api.delete(`/approval-requests/${id}`)
  }

  /**
   * 承認処理を実行
   */
  async performApprovalAction(id: number, data: ApprovalActionRequest): Promise<ApprovalRequest> {
    const response = await api.post(`/approval-requests/${id}/action`, data)
    return response.data.data
  }

  /**
   * 承認履歴を取得
   */
  async getApprovalHistories(id: number): Promise<ApprovalHistory[]> {
    const response = await api.get(`/approval-requests/${id}/histories`)
    return response.data.data
  }

  /**
   * 利用可能な承認フローを取得
   */
  async getAvailableFlows(requestType?: string): Promise<ApprovalFlow[]> {
    const response = await api.get('/approval-flows/available', {
      params: { request_type: requestType }
    })
    return response.data.data
  }

  /**
   * 承認依頼タイプ一覧を取得
   */
  async getRequestTypes(): Promise<string[]> {
    const response = await api.get('/approval-request-types')
    return response.data.data
  }
}

export const approvalRequestService = new ApprovalRequestService()