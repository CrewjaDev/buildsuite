'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserApprovalStatus, Estimate } from '@/types/features/estimates/estimate'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, X, RotateCcw, Clock, FileText } from 'lucide-react'
import { EstimateApprovalRequestDialog } from './EstimateApprovalRequestDialog'
import { useAuth } from '@/hooks/useAuth'

interface EstimateDetailHeaderProps {
  estimate: Estimate
  userApprovalStatus?: UserApprovalStatus | null
  onStartReviewing?: () => void
  onApprovalAction?: (action: 'approve' | 'reject' | 'return') => void
  onApprovalRequestCreated?: () => void
}

export function EstimateDetailHeader({ 
  estimate,
  userApprovalStatus,
  onStartReviewing,
  onApprovalAction,
  onApprovalRequestCreated
}: EstimateDetailHeaderProps) {
  const router = useRouter()
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const { hasPermission } = useAuth()

  // イベントハンドラー
  const handleBack = useCallback(() => {
    router.push('/estimates')
  }, [router])

  // 承認依頼可能かどうかの判定
  const canRequestApproval = useCallback(() => {
    // 下書き状態かつ承認依頼が未作成の場合のみ表示
    const isDraft = estimate.status === 'draft'
    const noApprovalRequest = !estimate.approval_request_id
    const backendCheck = estimate.can_request_approval
    const frontendCheck = hasPermission('estimate.approval.request')
    
    return isDraft && noApprovalRequest && backendCheck && frontendCheck
  }, [estimate, hasPermission])

  // 承認依頼作成成功時のハンドラー
  const handleApprovalRequestSuccess = useCallback(() => {
    setShowApprovalDialog(false)
    onApprovalRequestCreated?.()
  }, [onApprovalRequestCreated])



  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            一覧に戻る
          </Button>
        </div>
        
        {/* 承認フロー状態とアクションボタン */}
        {userApprovalStatus && (
          <div className="flex items-center gap-4">
            {/* 承認フローステップインジケーター */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">承認フロー</span>
              <div className="flex items-center gap-2">
                {Array.from({ length: userApprovalStatus.total_steps }, (_, index) => {
                  const stepNumber = index + 1
                  const isCompleted = stepNumber < userApprovalStatus.step
                  const isCurrent = stepNumber === userApprovalStatus.step
                  
                  return (
                    <div key={stepNumber} className="flex items-center gap-1">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isCompleted
                            ? 'bg-green-500' // 完了済み：緑
                            : isCurrent
                            ? 'bg-blue-500' // 現在のステップ：青
                            : 'bg-gray-300' // 未開始：グレー
                        }`}
                      />
                      <span className="text-xs text-gray-600">ステップ{stepNumber}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* 承認フロー状態バッジ */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {userApprovalStatus.sub_status === 'reviewing' 
                  ? `審査中 ${userApprovalStatus.step}/${userApprovalStatus.total_steps}`
                  : `承認待ち ${userApprovalStatus.step}/${userApprovalStatus.total_steps}`
                }
              </span>
            </div>
            
            {/* アクションボタン */}
            {userApprovalStatus.status === 'pending' && userApprovalStatus.can_act && (
              <>
                {/* 審査開始ボタン - 承認待ち状態（sub_statusがnullまたは'reviewing'以外）の場合のみ表示 */}
                {(!userApprovalStatus.sub_status || userApprovalStatus.sub_status !== 'reviewing') && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onStartReviewing?.()}
                    className="h-8 px-3 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    審査開始
                  </Button>
                )}
                
                {/* 承認・却下・差し戻しボタン - 審査中状態（sub_statusが'reviewing'）の場合のみ表示 */}
                {userApprovalStatus.sub_status === 'reviewing' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onApprovalAction?.('approve')}
                      className="h-8 px-3 text-sm bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      承認
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onApprovalAction?.('reject')}
                      className="h-8 px-3 text-sm"
                    >
                      <X className="h-4 w-4 mr-1" />
                      却下
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApprovalAction?.('return')}
                      className="h-8 px-3 text-sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      差し戻し
                    </Button>
                  </>
                )}
                
                {/* 承認依頼ボタン - 下書き状態かつ承認依頼未作成の場合のみ表示 */}
                {canRequestApproval() && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setShowApprovalDialog(true)}
                    className="h-8 px-3 text-sm bg-gray-800 hover:bg-gray-900 text-white"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    承認依頼
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 承認依頼作成ダイアログ */}
      <EstimateApprovalRequestDialog
        estimate={estimate}
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        onSuccess={handleApprovalRequestSuccess}
      />
    </div>
  )
}
