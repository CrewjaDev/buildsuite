import api from '@/lib/api'
import type {
  ApprovalHistory,
  ApprovalRequestListItem,
  ApprovalRequestDetail,
  ApprovalActionRequest,
  ApprovalActionResponse
} from '@/types/features/approvals'

class ApprovalRequestService {
  /**
   * 承認待ちの依頼一覧を取得
   */
  async getPendingRequests(): Promise<ApprovalRequestListItem[]> {
    const response = await api.get('/approval-requests/pending')
    return response.data
  }

  /**
   * 承認依頼の詳細を取得
   */
  async getApprovalRequestDetail(id: number): Promise<ApprovalRequestDetail> {
    const response = await api.get(`/approval-requests/${id}`)
    return response.data
  }

  /**
   * 承認処理
   */
  async approveRequest(id: number, data: ApprovalActionRequest): Promise<ApprovalActionResponse> {
    const response = await api.post(`/approval-requests/${id}/approve`, data)
    return response.data
  }

  /**
   * 却下処理
   */
  async rejectRequest(id: number, data: ApprovalActionRequest): Promise<ApprovalActionResponse> {
    const response = await api.post(`/approval-requests/${id}/reject`, data)
    return response.data
  }

  /**
   * 差し戻し処理
   */
  async returnRequest(id: number, data: ApprovalActionRequest): Promise<ApprovalActionResponse> {
    const response = await api.post(`/approval-requests/${id}/return`, data)
    return response.data
  }

  /**
   * 承認履歴を取得
   */
  async getApprovalHistory(id: number): Promise<ApprovalHistory[]> {
    const response = await api.get(`/approval-requests/${id}/history`)
    return response.data
  }

  /**
   * 自分の承認履歴を取得
   */
  async getMyApprovalHistory(): Promise<ApprovalHistory[]> {
    const response = await api.get('/approval-requests/my-history')
    return response.data
  }
}

export const approvalRequestService = new ApprovalRequestService()
