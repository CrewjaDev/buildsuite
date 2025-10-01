'use client'

import { useState, useEffect } from 'react'
import { Estimate } from '@/types/features/estimates/estimate'
import { EstimateInfoCard } from './EstimateInfoCard'
import { EstimateAmountCard } from './EstimateAmountCard'
import { EstimateBreakdownStructureCard } from '../EstimateBreakdowns/EstimateBreakdownStructureCard'
import { EstimateItemsCard } from './EstimateItemsCard'
import EstimateBasicInfoEditDialog from './EstimateBasicInfoEditDialog'
import EstimateBreakdownEditDialog from './EstimateBreakdownEditDialog'
import { EstimateApprovalProcessDialog } from './EstimateApprovalProcessDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, CheckCircle, XCircle, RotateCcw, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { estimateApprovalService } from '@/services/features/estimates/estimateApprovalService'

interface EstimateDetailViewProps {
  estimate: Estimate
  onDataUpdate?: () => void
}

export function EstimateDetailView({ estimate, onDataUpdate }: EstimateDetailViewProps) {
  const [showBasicInfoEditDialog, setShowBasicInfoEditDialog] = useState(false)
  const [showBreakdownEditDialog, setShowBreakdownEditDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'return'>('approve')
  const [isApprover, setIsApprover] = useState(false)
  const [approverLoading, setApproverLoading] = useState(true)
  
  const { hasPermission, effectivePermissions } = useAuth()

  // 承認者ステータスをチェック
  useEffect(() => {
    const checkApproverStatus = async () => {
      if (!estimate.approval_request_id) {
        setIsApprover(false)
        setApproverLoading(false)
        return
      }

      try {
        setApproverLoading(true)
        const response = await estimateApprovalService.checkApproverStatus(estimate.id)
        setIsApprover(response.data?.is_approver || false)
      } catch (error) {
        console.error('承認者ステータスの取得に失敗しました:', error)
        setIsApprover(false)
      } finally {
        setApproverLoading(false)
      }
    }

    checkApproverStatus()
  }, [estimate.id, estimate.approval_request_id])

  // 承認可能かどうかの判定
  const canApprove = () => {
    // 承認依頼が存在し、pending状態で、現在のユーザーが承認者
    return estimate.approval_request_id && 
           estimate.approval_status === 'pending' && 
           isApprover && 
           !approverLoading
  }

  // 承認状態バッジの取得
  const getApprovalStatusBadge = () => {
    if (!estimate.approval_request_id) return null

    const statusMap = {
      'pending': { label: '承認待ち', variant: 'default' as const, icon: Clock },
      'approved': { label: '承認済み', variant: 'default' as const, icon: CheckCircle },
      'rejected': { label: '却下', variant: 'destructive' as const, icon: XCircle },
      'returned': { label: '差し戻し', variant: 'secondary' as const, icon: RotateCcw }
    }

    const status = estimate.approval_status || 'pending'
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending
    const IconComponent = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-4 w-4" />
        {config.label}
      </Badge>
    )
  }

  // 承認処理ダイアログを開く
  const handleApprovalAction = (action: 'approve' | 'reject' | 'return') => {
    setApprovalAction(action)
    setShowApprovalDialog(true)
  }

  // 承認処理完了時のコールバック
  const handleApprovalSuccess = () => {
    onDataUpdate?.()
  }

  return (
    <div className="space-y-4">
      {/* 基本情報 */}
      <Card>
        <div className="px-6 pt-2 pb-0 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold leading-none tracking-tight">基本情報</h3>
            {getApprovalStatusBadge()}
          </div>
          <div className="flex items-center gap-2">
            {/* 承認機能ボタン */}
            {canApprove() && (
              <div className="flex gap-2">
                {/* 一時的な回避策: 権限が取得されていない場合は、承認状態のみで表示 */}
                {(effectivePermissions && effectivePermissions.length === 0) || hasPermission('estimate.approval.approve') ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprovalAction('approve')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    承認
                  </Button>
                ) : null}
                {(effectivePermissions && effectivePermissions.length === 0) || hasPermission('estimate.approval.reject') ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleApprovalAction('reject')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    却下
                  </Button>
                ) : null}
                {(effectivePermissions && effectivePermissions.length === 0) || hasPermission('estimate.approval.return') ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleApprovalAction('return')}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    差し戻し
                  </Button>
                ) : null}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBasicInfoEditDialog(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              編集
            </Button>
          </div>
        </div>
        <CardContent className="pt-0">
          <EstimateInfoCard estimate={estimate} />
        </CardContent>
      </Card>

      {/* 金額情報 */}
      <EstimateAmountCard estimate={estimate} />

      {/* 見積内訳構造 */}
      <Card>
        <div className="px-6 pt-2 pb-0 flex justify-between items-center">
          <h3 className="text-lg font-semibold leading-none tracking-tight">見積内訳構造</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBreakdownEditDialog(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            編集
          </Button>
        </div>
        <CardContent className="pt-0">
          <EstimateBreakdownStructureCard estimate={estimate} />
        </CardContent>
      </Card>

      {/* 見積明細 */}
      <EstimateItemsCard estimate={estimate} isReadOnly={true} />

      {/* メタ情報 */}
      <Card>
        <div className="px-6 pt-2 pb-0">
          <h3 className="text-lg font-semibold leading-none tracking-tight">メタ情報</h3>
        </div>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">作成</span>
              <span className="text-sm text-gray-900 ml-2">
                {estimate.created_at ? new Date(estimate.created_at).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : '-'}
              </span>
              <span className="text-sm text-gray-900 ml-2">
                {estimate.created_by_name || '-'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">更新</span>
              <span className="text-sm text-gray-900 ml-2">
                {estimate.updated_at ? new Date(estimate.updated_at).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : '-'}
              </span>
              <span className="text-sm text-gray-900 ml-2">
                {estimate.updated_by_name || '-'}
              </span>
            </div>
            {estimate.approved_by_name && (
              <div>
                <span className="text-sm font-medium text-gray-700">承認</span>
                <span className="text-sm text-gray-900 ml-2">
                  {estimate.approved_at ? new Date(estimate.approved_at).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }) : '-'}
                </span>
                <span className="text-sm text-gray-900 ml-2">
                  {estimate.approved_by_name}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 基本情報編集ダイアログ */}
      <EstimateBasicInfoEditDialog
        estimate={estimate}
        isOpen={showBasicInfoEditDialog}
        onClose={() => setShowBasicInfoEditDialog(false)}
        onSuccess={() => {
          // 親コンポーネントにデータ更新を通知
          onDataUpdate?.()
        }}
      />

      {/* 見積内訳編集ダイアログ */}
      <EstimateBreakdownEditDialog
        estimate={estimate}
        isOpen={showBreakdownEditDialog}
        onClose={() => setShowBreakdownEditDialog(false)}
        onSuccess={() => {
          // 親コンポーネントにデータ更新を通知
          onDataUpdate?.()
        }}
      />

      {/* 承認処理ダイアログ */}
      <EstimateApprovalProcessDialog
        estimate={estimate}
        action={approvalAction}
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        onSuccess={handleApprovalSuccess}
      />
    </div>
  )
}