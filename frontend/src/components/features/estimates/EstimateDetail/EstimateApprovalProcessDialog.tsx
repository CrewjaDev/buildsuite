'use client'

import { useState } from 'react'
import { Estimate } from '@/types/features/estimates/estimate'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { estimateApprovalService } from '@/services/features/estimates/estimateApprovalService'

interface EstimateApprovalProcessDialogProps {
  estimate: Estimate
  action: 'approve' | 'reject' | 'return'
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const actionConfig = {
  approve: {
    title: '承認',
    description: 'この見積書を承認しますか？',
    icon: CheckCircle,
    buttonText: '承認する',
    buttonVariant: 'default' as const,
    buttonClassName: 'bg-green-600 hover:bg-green-700',
    confirmText: '承認'
  },
  reject: {
    title: '却下',
    description: 'この見積書を却下しますか？',
    icon: XCircle,
    buttonText: '却下する',
    buttonVariant: 'destructive' as const,
    buttonClassName: '',
    confirmText: '却下'
  },
  return: {
    title: '差し戻し',
    description: 'この見積書を差し戻しますか？',
    icon: RotateCcw,
    buttonText: '差し戻す',
    buttonVariant: 'secondary' as const,
    buttonClassName: '',
    confirmText: '差し戻し'
  }
}

export function EstimateApprovalProcessDialog({
  estimate,
  action,
  open,
  onOpenChange,
  onSuccess
}: EstimateApprovalProcessDialogProps) {
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

  const config = actionConfig[action]
  const IconComponent = config.icon

  const handleSubmit = async () => {
    if (submitting) return

    try {
      setSubmitting(true)

      // 承認処理APIを呼び出し
      await estimateApprovalService.processApproval(estimate.id, action, comment)

      addToast({
        title: `${config.confirmText}しました`,
        description: `見積書「${estimate.project_name}」を${config.confirmText}しました。`,
        type: 'success',
      })

      // ダイアログを閉じる
      onOpenChange(false)
      
      // コメントをクリア
      setComment('')
      
      // 親コンポーネントに成功を通知
      onSuccess?.()

    } catch (error) {
      console.error(`${config.confirmText}処理に失敗しました:`, error)
      
      addToast({
        title: `${config.confirmText}に失敗しました`,
        description: 'エラーが発生しました。もう一度お試しください。',
        type: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (submitting) return
    
    setComment('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 見積情報 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">見積情報</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">見積番号:</span> {estimate.estimate_number || '-'}</p>
              <p><span className="font-medium">プロジェクト名:</span> {estimate.project_name}</p>
              <p><span className="font-medium">総額:</span> ¥{estimate.total_amount?.toLocaleString() || '0'}</p>
            </div>
          </div>

          {/* コメント入力 */}
          <div className="space-y-2">
            <Label htmlFor="comment">
              {config.confirmText}コメント {action === 'approve' ? '(任意)' : '(推奨)'}
            </Label>
            <Textarea
              id="comment"
              placeholder={`${config.confirmText}理由やコメントを入力してください...`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
          >
            キャンセル
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleSubmit}
            disabled={submitting}
            className={config.buttonClassName}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                処理中...
              </>
            ) : (
              <>
                <IconComponent className="h-4 w-4 mr-2" />
                {config.buttonText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
