'use client'

import { useState } from 'react'
import { Estimate, UserApprovalStatus } from '@/types/features/estimates/estimate'
import { EstimateInfoCard } from './EstimateInfoCard'
import { EstimateAmountCard } from './EstimateAmountCard'
import { EstimateBreakdownStructureCard } from '../EstimateBreakdowns/EstimateBreakdownStructureCard'
import { EstimateItemsCard } from './EstimateItemsCard'
import EstimateBasicInfoEditDialog from './EstimateBasicInfoEditDialog'
import EstimateBreakdownEditDialog from './EstimateBreakdownEditDialog'
import { EstimateApprovalProcessDialog } from './EstimateApprovalProcessDialog'
import { EstimateApprovalRequestDialog } from './EstimateApprovalRequestDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { useDeleteEstimate } from '@/hooks/features/estimates/useEstimates'
import { useToast } from '@/components/ui/toast'

interface EstimateDetailViewProps {
  estimate: Estimate
  userApprovalStatus?: UserApprovalStatus | null
  onDataUpdate?: () => void
  onDeleteSuccess?: () => void
}

export function EstimateDetailView({ estimate, userApprovalStatus, onDataUpdate, onDeleteSuccess }: EstimateDetailViewProps) {
  const [showBasicInfoEditDialog, setShowBasicInfoEditDialog] = useState(false)
  const [showBreakdownEditDialog, setShowBreakdownEditDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showApprovalRequestDialog, setShowApprovalRequestDialog] = useState(false)
  
  const { addToast } = useToast()
  const deleteEstimateMutation = useDeleteEstimate()
  




  // 編集可能かどうかの判定
  const canEdit = () => {
    // ユーザー承認状態が存在し、編集権限がある場合
    return userApprovalStatus && 
           (userApprovalStatus.status === 'pending' || 
            userApprovalStatus.status === 'not_started' ||
            userApprovalStatus.status === 'rejected' ||
            userApprovalStatus.status === 'returned')
  }




  // 承認処理完了時のコールバック
  const handleApprovalSuccess = async () => {
    // 親コンポーネントにデータ更新を通知
    onDataUpdate?.()
  }

  // 削除処理
  const handleDelete = async () => {
    if (!estimate || !window.confirm('この見積を削除しますか？この操作は取り消せません。')) {
      return
    }

    try {
      await deleteEstimateMutation.mutateAsync(estimate.id)
      addToast({
        title: "見積を削除しました",
        description: "見積が正常に削除されました。",
        type: "success"
      })
      onDeleteSuccess?.()
    } catch {
      addToast({
        title: "削除に失敗しました",
        description: "見積の削除中にエラーが発生しました。",
        type: "error"
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* 見積番号と名称 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{estimate.estimate_number}</h1>
            <p className="text-lg text-gray-700">{estimate.project_name || '見積案件名'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">見積状態:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              estimate.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              estimate.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
              estimate.status === 'approved' ? 'bg-green-100 text-green-800' :
              estimate.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {estimate.status === 'draft' ? '下書き' :
               estimate.status === 'submitted' ? '提出済み' :
               estimate.status === 'approved' ? '承認済み' :
               estimate.status === 'rejected' ? '却下' :
               estimate.status}
            </span>
            
            {/* アクションボタン - 右端に配置 */}
            <div className="flex gap-2 ml-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={!estimate.can_delete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <div className="px-6 pt-2 pb-0 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold leading-none tracking-tight">基本情報</h3>
          </div>
          <div className="flex items-center gap-2">
            {canEdit() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBasicInfoEditDialog(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                編集
              </Button>
            )}
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
        action="approve"
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        onSuccess={handleApprovalSuccess}
      />

      {/* 承認依頼作成ダイアログ */}
      <EstimateApprovalRequestDialog
        estimate={estimate}
        open={showApprovalRequestDialog}
        onOpenChange={setShowApprovalRequestDialog}
        onSuccess={() => {
          // 親コンポーネントにデータ更新を通知
          onDataUpdate?.()
        }}
      />
    </div>
  )
}