import api from '@/lib/api'
import type {
  EstimateApprovalRequest,
  EstimateApprovalAction,
  ApprovalRequest
} from '@/types/features/approvals/estimateApprovals'

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
