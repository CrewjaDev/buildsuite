'use client'

import { useState, useEffect, useCallback } from 'react'
import { Estimate } from '@/types/features/estimates/estimate'
import { ApprovalFlow } from '@/types/features/approvals/approvalFlows'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle, Users, DollarSign } from 'lucide-react'
import { approvalFlowService } from '@/services/features/approvals/approvalFlows'
import { estimateApprovalService } from '@/services/features/estimates/estimateApprovalService'
import { useToast } from '@/components/ui/toast'

interface EstimateApprovalRequestDialogProps {
  estimate: Estimate
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EstimateApprovalRequestDialog({
  estimate,
  open,
  onOpenChange,
  onSuccess
}: EstimateApprovalRequestDialogProps) {
  const [availableFlows, setAvailableFlows] = useState<ApprovalFlow[]>([])
  const [selectedFlow, setSelectedFlow] = useState<ApprovalFlow | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

  const loadAvailableFlows = useCallback(async () => {
    try {
      setLoading(true)
      const flowsData = await approvalFlowService.getAvailableFlows({
        request_type: 'estimate',
        amount: estimate.total_amount,
        project_type: estimate.project_type_id,
        // その他の条件は必要に応じて追加
      })
      console.log('取得した承認フローデータ:', flowsData)
      console.log('データの型:', typeof flowsData)
      console.log('配列かどうか:', Array.isArray(flowsData))
      
      // 配列でない場合は空配列を設定
      if (Array.isArray(flowsData)) {
        setAvailableFlows(flowsData)
      } else {
        console.warn('承認フローデータが配列ではありません:', flowsData)
        setAvailableFlows([])
      }
    } catch (error) {
      console.error('承認フローの取得に失敗しました:', error)
      addToast({
        type: 'error',
        title: 'エラー',
        description: '承認フローの取得に失敗しました',
        duration: 5000
      })
      setAvailableFlows([])
    } finally {
      setLoading(false)
    }
  }, [estimate.total_amount, estimate.project_type_id, addToast])

  // 利用可能な承認フローの取得
  useEffect(() => {
    if (open) {
      loadAvailableFlows()
    }
  }, [open, loadAvailableFlows])

  const handleFlowSelect = (flow: ApprovalFlow) => {
    setSelectedFlow(flow)
  }

  const handleSubmit = async () => {
    if (!selectedFlow) return

    try {
      setSubmitting(true)
      
      if (!estimate.id) {
        throw new Error('見積IDが取得できません')
      }
      
      // 承認依頼の作成APIを呼び出し（新しい動的フロー選択システム）
      const result = await estimateApprovalService.createApprovalRequest(estimate.id, {
        // 新しいシステムでは、バックエンドで自動的に承認フローが選択される
        // フロントエンドからは見積情報のみを送信
      })

      console.log('承認依頼作成結果:', result)

      addToast({
        type: 'success',
        title: '承認依頼を作成しました',
        description: `承認フロー「${selectedFlow.name}」で承認依頼が作成されました`,
        duration: 5000
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('承認依頼の作成に失敗しました:', error)
      addToast({
        type: 'error',
        title: 'エラー',
        description: '承認依頼の作成に失敗しました',
        duration: 5000
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getFlowTypeLabel = (flowType: string) => {
    switch (flowType) {
      case 'estimate': return '見積'
      case 'order': return '発注'
      case 'budget': return '予算'
      case 'construction': return '工事'
      default: return flowType
    }
  }

  const getFlowTypeColor = (flowType: string) => {
    switch (flowType) {
      case 'estimate': return 'bg-blue-100 text-blue-800'
      case 'order': return 'bg-green-100 text-green-800'
      case 'budget': return 'bg-purple-100 text-purple-800'
      case 'construction': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            承認依頼の作成
          </DialogTitle>
          <DialogDescription>
            見積「{estimate.estimate_number || estimate.project_name}」の承認依頼を作成します。
            適用される承認フローを確認してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 見積情報 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">対象見積</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">見積番号:</span>
                  <span className="text-sm">{estimate.estimate_number || '未設定'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">プロジェクト名:</span>
                  <span className="text-sm">{estimate.project_name || '未設定'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">見積金額:</span>
                  <span className="text-sm font-bold">
                    {formatAmount(estimate.total_amount || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 承認フロー選択 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">適用される承認フロー</h3>
            
            {loading ? (
              <div className="text-center py-4 text-gray-500">
                承認フローを読み込み中...
              </div>
            ) : availableFlows.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                適用可能な承認フローが見つかりません
              </div>
            ) : (
              <div className="space-y-3">
                {availableFlows.map((flow) => (
                  <Card 
                    key={flow.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedFlow?.id === flow.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleFlowSelect(flow)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{flow.name}</h4>
                            <Badge className={getFlowTypeColor(flow.flow_type)}>
                              {getFlowTypeLabel(flow.flow_type)}
                            </Badge>
                            {flow.is_system && (
                              <Badge variant="outline">システム</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{flow.description}</p>
                          
                          {/* 承認ステップ情報 */}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {flow.approval_steps?.length || 0}段階
                            </div>
                            {flow.conditions?.amount_min && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                最小: {formatAmount(flow.conditions.amount_min)}
                              </div>
                            )}
                            {flow.conditions?.amount_max && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                最大: {formatAmount(flow.conditions.amount_max)}
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedFlow?.id === flow.id && (
                          <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedFlow || submitting}
            >
              {submitting ? '作成中...' : '承認依頼を作成'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
