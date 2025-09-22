import api from '@/lib/api'

export interface CreateApprovalRequestRequest {
  template_id?: number
  template_data?: Record<string, unknown>
  remarks?: string
}

export interface ApprovalRequest {
  id: number
  approval_flow_id: number
  requestable_type: string
  requestable_id: number
  requested_by: number
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled'
  requested_at: string
  approved_at?: string
  rejected_at?: string
  remarks?: string
  created_at: string
  updated_at: string
}

export const estimateApprovalService = {
  /**
   * 見積の承認依頼を作成
   */
  async createApprovalRequest(
    estimateId: string | number, 
    data: CreateApprovalRequestRequest
  ): Promise<ApprovalRequest> {
    const response = await api.post(`/estimates/${estimateId}/approval/request`, data)
    return response.data
  },

  /**
   * 見積の承認処理
   */
  async approveEstimate(estimateId: string | number, remarks?: string): Promise<ApprovalRequest> {
    const response = await api.post(`/estimates/${estimateId}/approval/approve`, {
      remarks
    })
    return response.data
  },

  /**
   * 見積の却下処理
   */
  async rejectEstimate(estimateId: string | number, remarks?: string): Promise<ApprovalRequest> {
    const response = await api.post(`/estimates/${estimateId}/approval/reject`, {
      remarks
    })
    return response.data
  },

  /**
   * 見積の差し戻し処理
   */
  async returnEstimate(estimateId: string | number, remarks?: string): Promise<ApprovalRequest> {
    const response = await api.post(`/estimates/${estimateId}/approval/return`, {
      remarks
    })
    return response.data
  },

  /**
   * 見積の承認依頼キャンセル
   */
  async cancelApprovalRequest(estimateId: string | number, remarks?: string): Promise<ApprovalRequest> {
    const response = await api.post(`/estimates/${estimateId}/approval/cancel`, {
      remarks
    })
    return response.data
  }
}
