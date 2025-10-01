import api from '@/lib/api'
import { UserApprovalStatus } from '@/types/features/estimates/estimate'

export interface ApprovalProcessRequest {
  action: 'approve' | 'reject' | 'return'
  comment?: string
}

export interface ApprovalProcessResponse {
  success: boolean
  message: string
  data?: {
    status: string
    approved_at?: string
    approved_by?: number
    comment?: string
  }
}

class EstimateApprovalService {
  /**
   * 見積の承認処理を実行
   */
  async processApproval(
    estimateId: string | number,
    action: 'approve' | 'reject' | 'return',
    comment?: string
  ): Promise<ApprovalProcessResponse> {
    try {
      const response = await api.post(`/estimates/${estimateId}/approval/${action}`, {
        comment: comment || ''
      })

      return {
        success: true,
        message: response.data.message || '処理が完了しました',
        data: response.data.data
      }
    } catch (error: unknown) {
      console.error('承認処理エラー:', error)
      
      const errorMessage = (error && typeof error === 'object' && 'response' in error) 
        ? (error as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message || 
          (error as { response?: { data?: { message?: string; error?: string } } }).response?.data?.error || 
          '承認処理に失敗しました'
        : '承認処理に失敗しました'
      
      throw new Error(errorMessage)
    }
  }

  /**
   * 見積の承認状態を取得
   */
  async getApprovalStatus(estimateId: string | number) {
    try {
      const response = await api.get(`/estimates/${estimateId}/approval/status`)
      return response.data
    } catch (error: unknown) {
      console.error('承認状態取得エラー:', error)
      throw new Error('承認状態の取得に失敗しました')
    }
  }

  /**
   * 承認履歴を取得
   */
  async getApprovalHistory(estimateId: string | number) {
    try {
      const response = await api.get(`/estimates/${estimateId}/approval/history`)
      return response.data
    } catch (error: unknown) {
      console.error('承認履歴取得エラー:', error)
      throw new Error('承認履歴の取得に失敗しました')
    }
  }

  /**
   * 現在のユーザーが承認者かどうかをチェック
   */
  async checkApproverStatus(estimateId: string | number) {
    try {
      const response = await api.get(`/estimates/${estimateId}/approval/approver-status`)
      return response.data
    } catch (error: unknown) {
      console.error('承認者ステータス取得エラー:', error)
      throw new Error('承認者ステータスの取得に失敗しました')
    }
  }

  /**
   * 見積の承認依頼を作成
   */
  async createApprovalRequest(
    estimateId: string | number,
    approvalFlowId: number
  ): Promise<ApprovalProcessResponse> {
    try {
      const requestData = { approval_flow_id: approvalFlowId }
      
      console.log('バックエンドへ送信する直前のinterface構造:', {
        estimateId,
        approvalFlowId,
        url: `/estimates/${estimateId}/approval/request`,
        requestData,
        requestDataType: typeof requestData,
        requestDataKeys: Object.keys(requestData),
        requestDataValues: Object.values(requestData)
      })
      
      const response = await api.post(`/estimates/${estimateId}/approval/request`, requestData)

      return {
        success: true,
        message: response.data.message || '承認依頼を作成しました',
        data: response.data.data
      }
    } catch (error: unknown) {
      console.error('承認依頼作成エラー:', error)
      
      const errorMessage = (error && typeof error === 'object' && 'response' in error) 
        ? (error as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message || 
          (error as { response?: { data?: { message?: string; error?: string } } }).response?.data?.error || 
          '承認依頼の作成に失敗しました'
        : '承認依頼の作成に失敗しました'
      
      throw new Error(errorMessage)
    }
  }

  /**
   * ユーザー別承認状態を取得
   */
  async getUserApprovalStatus(estimateId: string | number): Promise<UserApprovalStatus> {
    try {
      const response = await api.get(`/estimates/${estimateId}/approval/user-status`)
      return response.data
    } catch (error: unknown) {
      console.error('ユーザー承認状態取得エラー:', error)
      
      const errorMessage = (error && typeof error === 'object' && 'response' in error) 
        ? (error as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message || 
          (error as { response?: { data?: { message?: string; error?: string } } }).response?.data?.error || 
          'ユーザー承認状態の取得に失敗しました'
        : 'ユーザー承認状態の取得に失敗しました'
      
      throw new Error(errorMessage)
    }
  }
}

export const estimateApprovalService = new EstimateApprovalService()