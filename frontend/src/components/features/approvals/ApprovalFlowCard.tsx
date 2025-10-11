'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, RotateCcw, Clock, Play } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { UserApprovalStatus } from '@/types/features/estimates/estimate'

interface ApprovalFlowCardProps {
  // 業務データの基本情報
  businessDataType: 'estimate' | 'purchase' | 'contract' | 'construction'
  approvalRequestId?: string | number | null
  
  // 承認フロー関連の情報
  approvalStatus?: string
  currentStep?: number
  totalSteps?: number
  userApprovalStatus?: UserApprovalStatus | null
  
  // コールバック関数
  onStartReviewing?: () => Promise<void>
  onApprovalAction?: (action: 'approve' | 'reject' | 'return') => Promise<void>
  onDataUpdate?: () => void
}

export function ApprovalFlowCard({
  businessDataType,
  approvalRequestId,
  approvalStatus,
  currentStep,
  totalSteps,
  userApprovalStatus: propUserApprovalStatus,
  onStartReviewing,
  onApprovalAction,
  onDataUpdate
}: ApprovalFlowCardProps) {
  const { hasPermission } = useAuth()

  // プロパティから渡されたuserApprovalStatusを使用
  const userApprovalStatus = propUserApprovalStatus

  // 承認可能かどうかの判定
  const canApprove = () => {
    const result = userApprovalStatus?.status === 'pending' && 
           userApprovalStatus?.can_act === true
    console.log('ApprovalFlowCard canApprove:', {
      userApprovalStatus,
      result
    })
    return result
  }


  // 審査開始可能かどうかの判定
  const canStartReviewing = () => {
    const result = (
      approvalRequestId &&
      userApprovalStatus?.status === 'pending' &&
      userApprovalStatus?.can_act === true &&
      userApprovalStatus?.sub_status !== 'reviewing'
    )
    console.log('ApprovalFlowCard canStartReviewing:', {
      approvalRequestId,
      userApprovalStatus,
      result
    })
    return result
  }

  // ステータスバッジの取得
  const getStatusBadge = () => {
    if (!approvalRequestId) {
      return <Badge variant="outline" className="text-xs px-2 py-0.5">承認依頼なし</Badge>
    }

    const status = userApprovalStatus?.status || approvalStatus
    const step = userApprovalStatus?.step || currentStep || 0
    const total = userApprovalStatus?.total_steps || totalSteps || 0

    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5">
            <Clock className="h-3 w-3 mr-1" />
            承認待ち {step}/{total}
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
            <CheckCircle className="h-3 w-3 mr-1" />
            承認済み
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 text-xs px-2 py-0.5">
            <XCircle className="h-3 w-3 mr-1" />
            却下
          </Badge>
        )
      case 'returned':
        return (
          <Badge className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5">
            <RotateCcw className="h-3 w-3 mr-1" />
            差し戻し
          </Badge>
        )
      default:
        return <Badge variant="outline" className="text-xs px-2 py-0.5">不明</Badge>
    }
  }

  // 審査開始処理
  const handleStartReviewing = async () => {
    if (onStartReviewing) {
      try {
        await onStartReviewing()
        onDataUpdate?.()
      } catch (error) {
        console.error('審査開始エラー:', error)
      }
    }
  }

  // 承認処理
  const handleApprovalAction = async (action: 'approve' | 'reject' | 'return') => {
    if (onApprovalAction) {
      try {
        await onApprovalAction(action)
        onDataUpdate?.()
      } catch (error) {
        console.error('承認処理エラー:', error)
      }
    }
  }

  return (
    <Card className="border border-red-300 bg-red-50/20">
      <CardHeader className="pb-1 px-3 pt-2">
        <CardTitle className="text-xs flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            承認フロー
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-2">
        <div className="space-y-1">
          {/* 審査開始ボタン */}
          {canStartReviewing() && (
            <Button
              variant="default"
              size="sm"
              onClick={handleStartReviewing}
              className="w-full h-6 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className="h-3 w-3 mr-1" />
              審査開始
            </Button>
          )}

          {/* 承認処理ボタン */}
          {canApprove() && userApprovalStatus?.sub_status === 'reviewing' && (
            <div className="flex gap-1">
              {hasPermission(`${businessDataType}.approval.approve`) && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApprovalAction('approve')}
                  className="flex-1 h-6 text-xs bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  承認
                </Button>
              )}
              {hasPermission(`${businessDataType}.approval.reject`) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleApprovalAction('reject')}
                  className="flex-1 h-6 text-xs"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  却下
                </Button>
              )}
              {hasPermission(`${businessDataType}.approval.return`) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleApprovalAction('return')}
                  className="flex-1 h-6 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  差し戻し
                </Button>
              )}
            </div>
          )}

          {/* 承認フロー情報 */}
          {approvalRequestId && userApprovalStatus && (
            <div className="text-xs text-gray-600">
              <div>ステップ: {userApprovalStatus.step}/{userApprovalStatus.total_steps} - {userApprovalStatus.step_name}</div>
              {userApprovalStatus.message && (
                <div className="text-xs text-gray-500">{userApprovalStatus.message}</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
