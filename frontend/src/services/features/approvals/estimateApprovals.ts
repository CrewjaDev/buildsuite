import api from '@/lib/api'

export interface EstimateApprovalRequest {
  estimate_id: number
  comment?: string
}

export interface EstimateApprovalAction {
  estimate_id: number
  comment?: string
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
  returned_at?: string
  cancelled_at?: string
  current_step_id?: number
  requestedBy?: {
    id: number
    name: string
  }
  currentStep?: {
    id: number
    step_order: number
    step_name: string
    approver_type: string
    approver_id: string
    status: string
  }
  flow?: {
    id: number
    name: string
    description?: string
  }
}

export interface ApprovalHistory {
  id: number
  approval_request_id: number
  approval_step_id: number
  approver_id: number
  action: 'approved' | 'rejected' | 'returned' | 'cancelled'
  comment?: string
  approved_at: string
  approver?: {
    id: number
    name: string
  }
  step?: {
    id: number
    step_name: string
    step_order: number
  }
}

export const estimateApprovalsApi = {
      // 承認依頼を作成
      async requestApproval(estimateId: number, data: EstimateApprovalRequest): Promise<ApprovalRequest> {
        const response = await api.post(`/estimates/${estimateId}/approval/request`, data)
        return response.data
      },

      // 承認処理
      async approve(estimateId: number, data: EstimateApprovalAction): Promise<void> {
        await api.post(`/estimates/${estimateId}/approval/approve`, data)
      },

      // 却下処理
      async reject(estimateId: number, data: EstimateApprovalAction): Promise<void> {
        await api.post(`/estimates/${estimateId}/approval/reject`, data)
      },

      // 差し戻し処理
      async return(estimateId: number, data: EstimateApprovalAction): Promise<void> {
        await api.post(`/estimates/${estimateId}/approval/return`, data)
      },

      // 承認依頼キャンセル
      async cancel(estimateId: number, data: EstimateApprovalAction): Promise<void> {
        await api.post(`/estimates/${estimateId}/approval/cancel`, data)
      }
}
