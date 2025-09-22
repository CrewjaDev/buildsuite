'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Clock, CheckCircle, XCircle, RotateCcw, Search, Loader2, FileText } from 'lucide-react'
import { HeaderUser } from '@/types/user'
import { approvalRequestService } from '@/services/features/approvals/approvalRequests'
import type { ApprovalRequestListItem } from '@/types/features/approvals'
import { useToast } from '@/components/ui/toast'

interface ApprovalDashboardProps {
  user: HeaderUser
}

export default function ApprovalDashboard({}: ApprovalDashboardProps) {
  const [requests, setRequests] = useState<ApprovalRequestListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestListItem | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'return'>('approve')
  const [comment, setComment] = useState('')
  const [processing, setProcessing] = useState(false)
  const { addToast } = useToast()

  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoading(true)
      const data = await approvalRequestService.getPendingRequests()
      setRequests(data)
    } catch (error) {
      console.error('承認依頼の取得に失敗しました:', error)
      addToast({
        title: 'エラー',
        description: '承認依頼の取得に失敗しました',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  // 承認待ちの依頼を取得
  useEffect(() => {
    fetchPendingRequests()
  }, [fetchPendingRequests])

  // 検索フィルタリング
  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.created_by_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 承認操作を実行
  const handleAction = async () => {
    if (!selectedRequest) return

    try {
      setProcessing(true)
      const data = { comment: comment.trim() || undefined }

      switch (actionType) {
        case 'approve':
          await approvalRequestService.approveRequest(selectedRequest.id, data)
          addToast({
            title: '承認完了',
            description: '承認依頼を承認しました',
            type: 'success',
          })
          break
        case 'reject':
          await approvalRequestService.rejectRequest(selectedRequest.id, data)
          addToast({
            title: '却下完了',
            description: '承認依頼を却下しました',
            type: 'success',
          })
          break
        case 'return':
          await approvalRequestService.returnRequest(selectedRequest.id, data)
          addToast({
            title: '差し戻し完了',
            description: '承認依頼を差し戻しました',
            type: 'success',
          })
          break
      }

      // 一覧を更新
      await fetchPendingRequests()
      setActionDialogOpen(false)
      setComment('')
      setSelectedRequest(null)
    } catch (error) {
      console.error('承認操作に失敗しました:', error)
      addToast({
        title: 'エラー',
        description: '承認操作に失敗しました',
        type: 'error',
      })
    } finally {
      setProcessing(false)
    }
  }

  // アクションダイアログを開く
  const openActionDialog = (request: ApprovalRequestListItem, type: 'approve' | 'reject' | 'return') => {
    setSelectedRequest(request)
    setActionType(type)
    setComment('')
    setActionDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* 承認者情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>承認者ダッシュボード</span>
            <Badge variant="outline">承認者</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">承認待ちの依頼を確認・処理できます。</p>
        </CardContent>
      </Card>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
            <p className="text-xs text-muted-foreground">承認待ちの件数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高優先度</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.filter(r => r.priority === 'high').length}</div>
            <p className="text-xs text-muted-foreground">高優先度の件数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">見積関連</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.filter(r => r.request_type === 'estimate').length}</div>
            <p className="text-xs text-muted-foreground">見積関連の件数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日の依頼</CardTitle>
            <span className="text-muted-foreground">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(r => {
                const today = new Date().toDateString()
                const requestDate = new Date(r.created_at).toDateString()
                return today === requestDate
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">今日の依頼件数</p>
          </CardContent>
        </Card>
      </div>

      {/* 承認待ち一覧 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>承認待ちの依頼</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPendingRequests}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '更新'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">読み込み中...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? '検索条件に一致する承認依頼がありません' : '承認待ちの依頼がありません'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="font-medium">{request.title}</p>
                      <p className="text-sm text-gray-500">
                        {request.created_by_name} - {new Date(request.created_at).toLocaleString('ja-JP')}
                      </p>
                      {request.amount && (
                        <p className="text-sm text-gray-500">金額: ¥{request.amount.toLocaleString()}</p>
                      )}
                      {request.project_name && (
                        <p className="text-sm text-gray-500">プロジェクト: {request.project_name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={request.priority === 'high' ? 'destructive' : 'secondary'}>
                          {request.priority === 'high' ? '高' : request.priority === 'medium' ? '中' : '低'}
                        </Badge>
                        <Badge variant="outline">
                          {request.request_type === 'estimate' ? '見積' : request.request_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      詳細
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => openActionDialog(request, 'approve')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      承認
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => openActionDialog(request, 'reject')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      却下
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => openActionDialog(request, 'return')}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      差し戻し
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 承認履歴 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の承認履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium">見積書「アパート修繕工事」を承認</p>
                  <p className="text-sm text-gray-500">1日前 - コメント: 内容確認済み</p>
                </div>
              </div>
              <Badge variant="default">承認</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="font-medium">見積書「倉庫建設工事」を却下</p>
                  <p className="text-sm text-gray-500">2日前 - コメント: 金額見直しが必要</p>
                </div>
              </div>
              <Badge variant="destructive">却下</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RotateCcw className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="font-medium">見積書「駐車場整備工事」を差し戻し</p>
                  <p className="text-sm text-gray-500">3日前 - コメント: 詳細資料の追加が必要</p>
                </div>
              </div>
              <Badge variant="secondary">差し戻し</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 承認操作ダイアログ */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && '承認'}
              {actionType === 'reject' && '却下'}
              {actionType === 'return' && '差し戻し'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{selectedRequest.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedRequest.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  依頼者: {selectedRequest.created_by_name}
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">
                コメント {actionType === 'approve' ? '(任意)' : '(推奨)'}
              </label>
              <Textarea
                placeholder={
                  actionType === 'approve' ? '承認コメントを入力してください' :
                  actionType === 'reject' ? '却下理由を入力してください' :
                  '差し戻し理由を入力してください'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
                disabled={processing}
              >
                キャンセル
              </Button>
              <Button
                variant={actionType === 'approve' ? 'default' : actionType === 'reject' ? 'destructive' : 'secondary'}
                onClick={handleAction}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    処理中...
                  </>
                ) : (
                  <>
                    {actionType === 'approve' && <CheckCircle className="h-4 w-4 mr-2" />}
                    {actionType === 'reject' && <XCircle className="h-4 w-4 mr-2" />}
                    {actionType === 'return' && <RotateCcw className="h-4 w-4 mr-2" />}
                    {actionType === 'approve' && '承認'}
                    {actionType === 'reject' && '却下'}
                    {actionType === 'return' && '差し戻し'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
