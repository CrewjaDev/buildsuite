'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Estimate } from '@/types/features/estimates/estimate'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useDeleteEstimate } from '@/hooks/features/estimates/useEstimates'
import { useToast } from '@/components/ui/toast'
import { EstimateApprovalRequestButton } from './EstimateApprovalRequestButton'

interface EstimateDetailHeaderProps {
  estimate: Estimate
  onDeleteSuccess: () => void
  canDelete?: boolean
  onApprovalRequestCreated?: () => void
}

export function EstimateDetailHeader({ 
  estimate, 
  onDeleteSuccess,
  canDelete = true,
  onApprovalRequestCreated
}: EstimateDetailHeaderProps) {
  const router = useRouter()
  const { addToast } = useToast()
  
  // ミューテーション
  const deleteEstimateMutation = useDeleteEstimate()

  // イベントハンドラー
  const handleBack = useCallback(() => {
    router.push('/estimates')
  }, [router])

  const handleDelete = useCallback(async () => {
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
      onDeleteSuccess()
    } catch {
      addToast({
        title: "削除に失敗しました",
        description: "見積の削除中にエラーが発生しました。",
        type: "error"
      })
    }
  }, [estimate, deleteEstimateMutation, addToast, onDeleteSuccess])


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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {estimate.estimate_number || '見積詳細'}
            </h1>
            <p className="text-gray-600">
              {estimate.project_name || 'プロジェクト名未設定'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between lg:justify-end gap-4">
          <Badge 
            variant={estimate.status === 'approved' ? 'default' : 
                    estimate.status === 'rejected' ? 'destructive' : 
                    estimate.status === 'submitted' ? 'secondary' : 'outline'}
          >
            {estimate.status === 'draft' ? '下書き' :
             estimate.status === 'submitted' ? '提出済み' :
             estimate.status === 'approved' ? '承認済み' :
             estimate.status === 'rejected' ? '却下' : '不明'}
          </Badge>
          
          {/* アクションボタン - 右上に配置 */}
          <div className="flex flex-wrap gap-2">
            <EstimateApprovalRequestButton
              estimate={estimate}
              onApprovalRequestCreated={onApprovalRequestCreated}
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={!canDelete || !estimate.can_delete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
