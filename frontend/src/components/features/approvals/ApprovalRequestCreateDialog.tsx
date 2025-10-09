'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, CheckCircle } from 'lucide-react'
import type { 
  CreateApprovalRequestRequest
} from '@/types/features/approvals/approvalRequests'
import type { ApprovalFlow, ApprovalStep } from '@/types/features/approvals/approvalFlows'
import { approvalRequestService } from '@/services/features/approvals/approvalRequests'
import { useToast } from '@/components/ui/toast'

interface ApprovalRequestCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ApprovalRequestCreateDialog({ isOpen, onClose, onSuccess }: ApprovalRequestCreateDialogProps) {
  const [formData, setFormData] = useState<CreateApprovalRequestRequest>({
    approval_flow_id: 0,
    request_type: 'estimate',
    request_id: '',
    title: '',
    description: '',
    priority: 'normal',
    expires_at: ''
  })
  const [availableFlows, setAvailableFlows] = useState<ApprovalFlow[]>([])
  const [selectedFlow, setSelectedFlow] = useState<ApprovalFlow | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingFlows, setLoadingFlows] = useState(false)
  const { addToast } = useToast()

  const loadAvailableFlows = useCallback(async () => {
    setLoadingFlows(true)
    try {
      const flows = await approvalRequestService.getAvailableFlows(formData.request_type)
      setAvailableFlows(flows)
    } catch (error) {
      console.error('承認フローの読み込みに失敗しました:', error)
      addToast({
        type: 'error',
        title: '承認フローの読み込みに失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000
      })
    } finally {
      setLoadingFlows(false)
    }
  }, [formData.request_type, addToast])

  // 利用可能な承認フローを取得
  useEffect(() => {
    if (isOpen) {
      loadAvailableFlows()
    }
  }, [isOpen, loadAvailableFlows])

  const handleFlowSelect = (flowId: string) => {
    const flow = availableFlows.find(f => f.id.toString() === flowId)
    setSelectedFlow(flow || null)
    setFormData(prev => ({ ...prev, approval_flow_id: parseInt(flowId) }))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      addToast({
        type: 'error',
        title: 'バリデーションエラー',
        description: 'タイトルを入力してください',
        duration: 4000
      })
      return
    }

    if (!formData.approval_flow_id) {
      addToast({
        type: 'error',
        title: 'バリデーションエラー',
        description: '承認フローを選択してください',
        duration: 4000
      })
      return
    }

    setLoading(true)
    try {
      await approvalRequestService.createApprovalRequest(formData)
      
      addToast({
        type: 'success',
        title: '承認依頼を作成しました',
        description: `${formData.title} が正常に作成されました`,
        duration: 4000
      })

      // フォームをリセット
      setFormData({
        approval_flow_id: 0,
        request_type: 'estimate',
        request_id: '',
        title: '',
        description: '',
        priority: 'normal',
        expires_at: ''
      })
      setSelectedFlow(null)
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('承認依頼の作成に失敗しました:', error)
      addToast({
        type: 'error',
        title: '承認依頼の作成に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const getRequestTypeLabel = (requestType: string) => {
    const labels: Record<string, string> = {
      estimate: '見積',
      budget: '予算',
      purchase: '発注',
      contract: '契約',
      general: '一般'
    }
    return labels[requestType] || requestType
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>承認依頼を作成</DialogTitle>
          <DialogDescription>
            新しい承認依頼を作成します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="request_type">依頼タイプ *</Label>
                  <Select 
                    value={formData.request_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, request_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estimate">見積</SelectItem>
                      <SelectItem value="budget">予算</SelectItem>
                      <SelectItem value="purchase">発注</SelectItem>
                      <SelectItem value="contract">契約</SelectItem>
                      <SelectItem value="general">一般</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">優先度</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'low' | 'normal' | 'high' | 'urgent' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="normal">通常</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="urgent">緊急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="title">タイトル *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="承認依頼のタイトルを入力"
                />
              </div>
              
              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="承認依頼の説明を入力"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="request_id">依頼ID</Label>
                  <Input
                    id="request_id"
                    value={formData.request_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, request_id: e.target.value }))}
                    placeholder="関連する依頼IDを入力（任意）"
                  />
                </div>
                
                <div>
                  <Label htmlFor="expires_at">有効期限</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 承認フロー選択 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                承認フロー選択
              </CardTitle>
              <CardDescription>
                この依頼に適用する承認フローを選択してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingFlows ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">承認フローを読み込み中...</p>
                </div>
              ) : availableFlows.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {getRequestTypeLabel(formData.request_type)} タイプの利用可能な承認フローがありません
                </div>
              ) : (
                <div className="space-y-3">
                  {availableFlows.map((flow) => (
                    <div
                      key={flow.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedFlow?.id === flow.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleFlowSelect(flow.id.toString())}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{flow.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{flow.description}</p>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Badge variant="outline">{getRequestTypeLabel(flow.flow_type)}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {flow.approval_steps?.filter(step => step.step !== 0).length || 0} ステップ
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              優先度: {flow.priority}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <input
                            type="radio"
                            checked={selectedFlow?.id === flow.id}
                            onChange={() => handleFlowSelect(flow.id.toString())}
                            className="h-4 w-4 text-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 選択された承認フローの詳細 */}
          {selectedFlow && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  選択された承認フロー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{selectedFlow.name}</h4>
                    <p className="text-sm text-gray-600">{selectedFlow.description}</p>
                  </div>
                  
                  {selectedFlow.approval_steps && selectedFlow.approval_steps.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">承認ステップ</h5>
                      <div className="space-y-2">
                        {selectedFlow.approval_steps.map((step: ApprovalStep, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <Badge variant="outline">{step.step}</Badge>
                            <span className="text-sm font-medium">{step.name}</span>
                            <span className="text-sm text-gray-500">
                              ({step.approvers?.length || 0} 名の承認者)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedFlow.conditions && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">適用条件</h5>
                      <div className="text-sm text-gray-600">
                        {selectedFlow.conditions.amount_min && (
                          <p>最小金額: {selectedFlow.conditions.amount_min.toLocaleString()}円</p>
                        )}
                        {selectedFlow.conditions.amount_max && (
                          <p>最大金額: {selectedFlow.conditions.amount_max.toLocaleString()}円</p>
                        )}
                        {selectedFlow.conditions.departments && selectedFlow.conditions.departments.length > 0 && (
                          <p>対象部署: {selectedFlow.conditions.departments.length} 部署</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !formData.title.trim() || !formData.approval_flow_id}
          >
            {loading ? '作成中...' : '作成'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
