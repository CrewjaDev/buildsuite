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
   * 承認待ち件数を取得（ダッシュボード用）
   */
  async getPendingCount(): Promise<number> {
    const response = await api.get('/approval-requests/pending-count')
    return response.data.count
  }

  /**
   * 承認済み件数を取得（ダッシュボード用）
   */
  async getApprovedCount(): Promise<number> {
    const response = await api.get('/approval-requests/approved-count')
    return response.data.count
  }

  /**
   * 却下件数を取得（ダッシュボード用）
   */
  async getRejectedCount(): Promise<number> {
    const response = await api.get('/approval-requests/rejected-count')
    return response.data.count
  }

  /**
   * 差戻し件数を取得（ダッシュボード用）
   */
  async getReturnedCount(): Promise<number> {
    const response = await api.get('/approval-requests/returned-count')
    return response.data.count
  }

  /**
   * 承認件数一括取得（ダッシュボード用）
   */
  async getAllCounts(): Promise<{
    pending: number
    approved: number
    rejected: number
    returned: number
  }> {
    const response = await api.get('/approval-requests/counts')
    return response.data.counts
  }

  /**
   * 承認依頼一覧を取得
   */
  async getApprovalRequests(params?: {
    page?: number
    per_page?: number
    filter?: ApprovalRequestFilter
    sort?: string
  }): Promise<ApprovalRequestListResponse> {
    // フィルターパラメータを展開して送信
    const apiParams: Record<string, unknown> = {
      page: params?.page,
      per_page: params?.per_page,
      sort: params?.sort
    }

    // フィルターパラメータを展開
    if (params?.filter) {
      const { filter } = params
      if (filter.status) apiParams.status = filter.status
      if (filter.request_type) apiParams.request_type = filter.request_type
      if (filter.priority) apiParams.priority = filter.priority
      if (filter.requested_by) apiParams.requested_by = filter.requested_by
      if (filter.approval_flow_id) apiParams.approval_flow_id = filter.approval_flow_id
      if (filter.created_from) apiParams.created_from = filter.created_from
      if (filter.created_to) apiParams.created_to = filter.created_to
      if (filter.expires_from) apiParams.expires_from = filter.expires_from
      if (filter.expires_to) apiParams.expires_to = filter.expires_to
    }

    const response = await api.get('/approval-requests', { params: apiParams })
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