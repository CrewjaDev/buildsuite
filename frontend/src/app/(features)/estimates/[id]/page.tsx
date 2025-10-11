'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useEstimate } from '@/hooks/features/estimates/useEstimates'
import { estimateApprovalService } from '@/services/features/estimates/estimateApprovalService'
import { UserApprovalStatus } from '@/types/features/estimates/estimate'
import { EstimateDetailView } from '@/components/features/estimates/EstimateDetail/EstimateDetailView'
import { EstimateDetailHeader } from '@/components/features/estimates/EstimateDetail/EstimateDetailHeader'
import { useToast } from '@/components/ui/toast'

export default function EstimateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const estimateId = params?.id as string
  
  
  const [userApprovalStatus, setUserApprovalStatus] = useState<UserApprovalStatus | null>(null)

  // データ取得
  const { data: estimate, isLoading, error } = useEstimate(estimateId)
  
  // ページ初期表示時のスクロール位置調整
  useEffect(() => {
    // ページの先頭にスクロール
    window.scrollTo(0, 0)
  }, [])
  

  // ユーザー承認状態を取得
  useEffect(() => {
    const fetchUserApprovalStatus = async () => {
      if (estimate?.approval_request_id) {
        try {
          const status = await estimateApprovalService.getUserApprovalStatus(estimate.id)
          setUserApprovalStatus(status)
        } catch (error) {
          console.error('ユーザー承認状態の取得に失敗:', error)
          setUserApprovalStatus(null)
        }
      } else {
        setUserApprovalStatus(null)
      }
    }
    
    if (estimate) {
      fetchUserApprovalStatus()
    }
  }, [estimate])

  // 審査開始処理
  const handleStartReviewing = async () => {
    if (!estimate?.approval_request_id) return
    
    try {
      await estimateApprovalService.startReviewing(estimate.approval_request_id)
      // ユーザー承認状態を再取得
      const status = await estimateApprovalService.getUserApprovalStatus(estimate.id)
      setUserApprovalStatus(status)
      queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] })
    } catch (error) {
      console.error('審査開始エラー:', error)
    }
  }

  // 承認処理
  const handleApprovalAction = async (action: 'approve' | 'reject' | 'return') => {
    if (!estimate?.id) return
    
    try {
      await estimateApprovalService.processApproval(estimate.id, action)
      // ユーザー承認状態を再取得
      const status = await estimateApprovalService.getUserApprovalStatus(estimate.id)
      setUserApprovalStatus(status)
      queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] })
      
      // 成功トーストを表示
      const actionMessages = {
        approve: '承認しました',
        reject: '却下しました',
        return: '差し戻しました'
      }
      addToast({
        title: '承認処理完了',
        description: actionMessages[action],
        type: 'success'
      })
    } catch (error) {
      console.error('承認処理エラー:', error)
      addToast({
        title: 'エラー',
        description: '承認処理に失敗しました',
        type: 'error'
      })
    }
  }

  // ローディング状態
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-600">見積情報を読み込み中...</span>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <p>見積情報の読み込みでエラーが発生しました: {error.message}</p>
      </div>
    )
  }

  // 見積データがない場合
  if (!estimate) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>見積が見つかりません。</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* ヘッダーコンポーネント */}
      <EstimateDetailHeader 
        estimate={estimate}
        userApprovalStatus={userApprovalStatus}
        onStartReviewing={handleStartReviewing}
        onApprovalAction={handleApprovalAction}
        onApprovalRequestCreated={() => {
          // 承認依頼作成後、見積データを再取得
          queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] })
        }}
      />

      {/* メインコンテンツ */}
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="w-full max-w-none px-4 py-6">
          {/* 見積詳細ビュー */}
          <EstimateDetailView 
            estimate={estimate}
            userApprovalStatus={userApprovalStatus}
            onDataUpdate={() => {
              // 見積詳細のキャッシュを無効化してデータを再取得
              queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] })
            }}
            onDeleteSuccess={() => {
              // 削除成功時は一覧ページに戻る
              router.push('/estimates')
            }}
          />
        </div>
      </div>
    </div>
  )
}
