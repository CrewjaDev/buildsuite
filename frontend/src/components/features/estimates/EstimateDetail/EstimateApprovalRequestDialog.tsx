'use client'

import { useState, useEffect, useCallback } from 'react'
import { Estimate } from '@/types/features/estimates/estimate'
import { ApprovalRequestTemplate } from '@/types/features/approvals/approvalRequestTemplates'
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
import { FileText, CheckCircle } from 'lucide-react'
import { approvalRequestTemplateService } from '@/services/features/approvals/approvalRequestTemplates'
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
  const [templates, setTemplates] = useState<ApprovalRequestTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ApprovalRequestTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const templatesData = await approvalRequestTemplateService.getApprovalRequestTemplates()
      // 見積関連のテンプレートのみフィルター
      const estimateTemplates = templatesData.filter(template => 
        template.request_type === 'estimate' || 
        (typeof template.request_type === 'object' && template.request_type?.code === 'estimate')
      )
      setTemplates(estimateTemplates)
    } catch (error) {
      console.error('テンプレートの取得に失敗しました:', error)
      addToast({
        type: 'error',
        title: 'エラー',
        description: 'テンプレートの取得に失敗しました',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  // テンプレート一覧の取得
  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open, loadTemplates])

  const handleTemplateSelect = (template: ApprovalRequestTemplate) => {
    setSelectedTemplate(template)
  }

  const handleSubmit = async () => {
    if (!selectedTemplate) return

    try {
      setSubmitting(true)
      
      // デバッグ: estimate.idの値を確認
      console.log('Estimate ID:', estimate.id, 'Type:', typeof estimate.id)
      console.log('Estimate created_by:', estimate.created_by)
      console.log('Current user info:', { 
        // 現在のユーザー情報を取得（認証コンテキストから）
        // 実際の実装では useAuth や useUser フックを使用
      })
      
      console.log('estimate.id:', estimate.id, 'type:', typeof estimate.id)
      
      if (!estimate.id) {
        throw new Error('見積IDが取得できません')
      }
      
      // UUIDは文字列のまま使用（数値に変換しない）
      const estimateId = estimate.id
      console.log('using estimateId as string:', estimateId)
      
      // 承認依頼の作成APIを呼び出し
      const result = await estimateApprovalService.createApprovalRequest(estimateId, {
        template_id: selectedTemplate.id,
        template_data: selectedTemplate.template_data
      })

      console.log('承認依頼作成結果:', result)

      addToast({
        type: 'success',
        title: '承認依頼を作成しました',
        description: '承認依頼が正常に作成されました',
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

  const getRequestTypeLabel = (requestType: string | object) => {
    if (typeof requestType === 'string') {
      switch (requestType) {
        case 'estimate': return '見積'
        case 'order': return '発注'
        case 'budget': return '予算'
        default: return requestType
      }
    }
    return (requestType as { name?: string })?.name || '未設定'
  }

  const getRequestTypeColor = (requestType: string | object) => {
    const type = typeof requestType === 'string' ? requestType : (requestType as { code?: string })?.code
    switch (type) {
      case 'estimate': return 'bg-blue-100 text-blue-800'
      case 'order': return 'bg-green-100 text-green-800'
      case 'budget': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
            使用するテンプレートを選択してください。
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
                    ¥{estimate.total_amount?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* テンプレート選択 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">承認依頼テンプレート</h3>
            
            {loading ? (
              <div className="text-center py-4 text-gray-500">
                テンプレートを読み込み中...
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge className={getRequestTypeColor(template.request_type)}>
                              {getRequestTypeLabel(template.request_type)}
                            </Badge>
                            {template.is_system && (
                              <Badge variant="outline">システム</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{template.description}</p>
                          {template.usage_count > 0 && (
                            <p className="text-xs text-gray-500">
                              使用回数: {template.usage_count}回
                            </p>
                          )}
                        </div>
                        {selectedTemplate?.id === template.id && (
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
              disabled={!selectedTemplate || submitting}
            >
              {submitting ? '作成中...' : '承認依頼を作成'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
