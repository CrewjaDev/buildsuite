'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  History
} from 'lucide-react'
import type { ApprovalRequest, ApprovalHistory } from '@/types/features/approvals/approvalRequests'
import { ApprovalRequestList } from './ApprovalRequestList'
import { ApprovalRequestCreateDialog } from './ApprovalRequestCreateDialog'
import { approvalRequestService } from '@/services/features/approvals/approvalRequests'
import { useToast } from '@/components/ui/toast'

export function ApprovalRequestManagement() {
  const [activeTab, setActiveTab] = useState('list')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [histories, setHistories] = useState<ApprovalHistory[]>([])
  const [loadingHistories, setLoadingHistories] = useState(false)
  const { addToast } = useToast()

  const handleCreateRequest = () => {
    setIsCreateDialogOpen(true)
  }

  const handleViewDetail = async (request: ApprovalRequest) => {
    // 詳細情報を個別に取得
    try {
      console.log('承認依頼詳細を取得中...', request.id)
      const response = await approvalRequestService.getApprovalRequest(request.id)
      console.log('承認依頼詳細のレスポンス:', response)
      console.log('requester_name:', response.data.requester_name)
      setSelectedRequest(response.data)
    } catch (error) {
      console.error('承認依頼詳細の取得に失敗しました:', error)
      // エラーの場合は一覧のデータを使用
      setSelectedRequest(request)
    }
    
    setIsDetailDialogOpen(true)
    
    // 承認履歴を取得
    setLoadingHistories(true)
    try {
      const requestHistories = await approvalRequestService.getApprovalHistories(request.id)
      setHistories(requestHistories)
    } catch (error) {
      console.error('承認履歴の読み込みに失敗しました:', error)
      addToast({
        type: 'error',
        title: '承認履歴の読み込みに失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000
      })
    } finally {
      setLoadingHistories(false)
    }
  }

  const handleCreateSuccess = () => {
    // 一覧を更新するためにタブを切り替え
    setActiveTab('list')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '承認待ち', variant: 'default' as const, icon: Clock },
      approved: { label: '承認済み', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: '却下', variant: 'destructive' as const, icon: XCircle },
      returned: { label: '差し戻し', variant: 'secondary' as const, icon: AlertCircle },
      cancelled: { label: 'キャンセル', variant: 'outline' as const, icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: '低', variant: 'outline' as const },
      normal: { label: '通常', variant: 'secondary' as const },
      high: { label: '高', variant: 'default' as const },
      urgent: { label: '緊急', variant: 'destructive' as const }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  const getActionBadge = (action: string) => {
    const actionConfig = {
      approve: { label: '承認', variant: 'default' as const, icon: CheckCircle },
      reject: { label: '却下', variant: 'destructive' as const, icon: XCircle },
      return: { label: '差し戻し', variant: 'secondary' as const, icon: AlertCircle },
      cancel: { label: 'キャンセル', variant: 'outline' as const, icon: XCircle }
    }
    
    const config = actionConfig[action as keyof typeof actionConfig] || actionConfig.approve
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">承認依頼管理</h2>
          <p className="text-gray-600">承認依頼の作成、確認、管理を行います</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateRequest} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新規作成
          </Button>
        </div>
      </div>

      {/* タブナビゲーション */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            承認依頼一覧
          </TabsTrigger>
        </TabsList>

        {/* 承認依頼一覧タブ */}
        <TabsContent value="list" className="space-y-6">
          <ApprovalRequestList 
            onViewDetail={handleViewDetail}
            onCreateRequest={handleCreateRequest}
          />
        </TabsContent>
      </Tabs>

      {/* 承認依頼作成ダイアログ */}
      <ApprovalRequestCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 承認依頼詳細ダイアログ */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>承認依頼詳細</DialogTitle>
            <DialogDescription>
              {selectedRequest?.title} の詳細情報と承認履歴
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* 基本情報 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">基本情報</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ID</label>
                      <p className="text-sm font-medium">{selectedRequest.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">ステータス</label>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">優先度</label>
                      <div className="mt-1">{getPriorityBadge(selectedRequest.priority)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">依頼タイプ</label>
                      <p className="text-sm">{selectedRequest.request_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">承認フロー</label>
                      <p className="text-sm">{selectedRequest.approval_flow?.name || '不明'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">依頼者</label>
                      <p className="text-sm">{selectedRequest.requester_name || '不明'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">作成日時</label>
                      <p className="text-sm">{formatDate(selectedRequest.created_at)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">有効期限</label>
                      <p className="text-sm">{selectedRequest.expires_at ? formatDate(selectedRequest.expires_at) : '-'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">説明</label>
                    <p className="text-sm mt-1">{selectedRequest.description || '-'}</p>
                  </div>
                  

                  {/* 承認ステップ進行状況 */}
                  {selectedRequest.approval_flow && (selectedRequest.approval_flow as Record<string, unknown>)?.approval_steps && Array.isArray((selectedRequest.approval_flow as Record<string, unknown>).approval_steps) ? (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500">承認ステップ進行状況</label>
                      <div className="mt-1 space-y-2">
                        {((selectedRequest.approval_flow as Record<string, unknown>).approval_steps as Record<string, unknown>[]).filter((step: Record<string, unknown>) => (step.step as number) > 0).map((step: Record<string, unknown>, index: number) => {
                          const stepNumber = (step.step as number) ?? (index + 1)
                          const isCurrentStep = stepNumber === selectedRequest.current_step
                          const isCompleted = stepNumber < selectedRequest.current_step
                          const isPending = stepNumber === selectedRequest.current_step && selectedRequest.status === 'pending'
                          
                          return (
                            <div key={stepNumber} className={`p-3 rounded border ${
                              isCurrentStep ? 'border-blue-500 bg-blue-50' : 
                              isCompleted ? 'border-green-500 bg-green-50' : 
                              'border-gray-200 bg-gray-50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                    isCurrentStep ? 'bg-blue-500 text-white' :
                                    isCompleted ? 'bg-green-500 text-white' :
                                    'bg-gray-300 text-gray-600'
                                  }`}>
                                    {isCompleted ? '✓' : stepNumber}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {stepNumber === 0 ? '承認依頼者' : `ステップ ${stepNumber}`}
                                    </p>
                                    <p className="text-sm text-gray-600">{(step.name as string) || '承認ステップ'}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {isCurrentStep && isPending && (
                                    <Badge variant="default" className="bg-blue-500">進行中</Badge>
                                  )}
                                  {isCompleted && (
                                    <Badge variant="default" className="bg-green-500">完了</Badge>
                                  )}
                                  {!isCurrentStep && !isCompleted && (
                                    <Badge variant="outline">待機中</Badge>
                                  )}
                                </div>
                              </div>
                              
                              {/* 承認者情報 */}
                              {step.approvers && Array.isArray(step.approvers) && (step.approvers as Record<string, unknown>[]).length > 0 ? (
                                <div className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">承認者: </span>
                                  <span className="inline-flex flex-wrap gap-1">
                                    {(step.approvers as Record<string, unknown>[]).map((approver: Record<string, unknown>, approverIndex: number) => (
                                      <Badge key={approverIndex} variant="secondary" className="text-xs">
                                        {(approver.display_name as string) || (approver.value as string)}
                                      </Badge>
                                    ))}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
                  
                  {selectedRequest.request_data && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500">依頼データ</label>
                      <pre className="text-sm mt-1 p-3 bg-gray-50 rounded border overflow-x-auto">
                        {JSON.stringify(selectedRequest.request_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 承認履歴 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    承認履歴
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingHistories ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">承認履歴を読み込み中...</p>
                    </div>
                  ) : histories.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      承認履歴がありません
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {histories.map((history) => (
                        <div key={history.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getActionBadge(history.action)}
                              <div>
                                <p className="text-sm font-medium">
                                  ステップ {history.step}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {history.actor?.name || '不明'} - {formatDate(history.acted_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                          {history.comment && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              {history.comment}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
