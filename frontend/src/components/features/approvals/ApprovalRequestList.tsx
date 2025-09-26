'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ArrowUpDown,
  Plus
} from 'lucide-react'
import type { ApprovalRequest, ApprovalRequestFilter } from '@/types/features/approvals/approvalRequests'
import { approvalRequestService } from '@/services/features/approvals/approvalRequests'
import { useToast } from '@/components/ui/toast'

interface ApprovalRequestListProps {
  onViewDetail?: (request: ApprovalRequest) => void
  onCreateRequest?: () => void
}

export function ApprovalRequestList({ onViewDetail, onCreateRequest }: ApprovalRequestListProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<ApprovalRequestFilter>({})
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const { addToast } = useToast()

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const response = await approvalRequestService.getApprovalRequests({
        page: currentPage,
        per_page: 20,
        filter: {
          ...filter,
          ...(searchTerm && { search: searchTerm })
        },
        sort: `${sortBy}_${sortOrder}`
      })
      setRequests(response.data)
    } catch (error) {
      console.error('承認依頼の読み込みに失敗しました:', error)
      addToast({
        type: 'error',
        title: 'データの読み込みに失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, filter, sortBy, sortOrder, searchTerm, addToast])

  // データ読み込み
  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleViewDetail = useCallback(async (request: ApprovalRequest) => {
    if (onViewDetail) {
      onViewDetail(request)
    } else {
      try {
        console.log('承認依頼詳細を取得中...', request.id)
        // 詳細情報を個別に取得
        const response = await approvalRequestService.getApprovalRequest(request.id)
        console.log('承認依頼詳細のレスポンス:', response)
        setSelectedRequest(response.data)
        setIsDetailDialogOpen(true)
      } catch (error) {
        console.error('承認依頼詳細の取得に失敗しました:', error)
        addToast({
          type: 'error',
          title: 'データの取得に失敗しました',
          description: 'エラーが発生しました。もう一度お試しください。',
          duration: 5000
        })
      }
    }
  }, [onViewDetail, addToast])

  const handleSearch = () => {
    setCurrentPage(1)
    loadRequests()
  }

  const handleFilterChange = (key: keyof ApprovalRequestFilter, value: string | string[] | undefined) => {
    setFilter(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
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
          <h3 className="text-lg font-semibold">承認依頼一覧</h3>
          <p className="text-sm text-gray-600">承認依頼の一覧と管理を行います</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {requests.length} 件
          </Badge>
          {onCreateRequest && (
            <Button onClick={onCreateRequest} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              新規作成
            </Button>
          )}
        </div>
      </div>

      {/* 検索・フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            検索・フィルター
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="タイトル、説明で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch} variant="outline">
              検索
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">ステータス</label>
              <Select value={filter.status?.[0] || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : [value])}>
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="pending">承認待ち</SelectItem>
                  <SelectItem value="approved">承認済み</SelectItem>
                  <SelectItem value="rejected">却下</SelectItem>
                  <SelectItem value="returned">差し戻し</SelectItem>
                  <SelectItem value="cancelled">キャンセル</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">優先度</label>
              <Select value={filter.priority?.[0] || 'all'} onValueChange={(value) => handleFilterChange('priority', value === 'all' ? undefined : [value])}>
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="normal">通常</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="urgent">緊急</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">依頼タイプ</label>
              <Select value={filter.request_type?.[0] || 'all'} onValueChange={(value) => handleFilterChange('request_type', value === 'all' ? undefined : [value])}>
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="estimate">見積</SelectItem>
                  <SelectItem value="budget">予算</SelectItem>
                  <SelectItem value="purchase">発注</SelectItem>
                  <SelectItem value="contract">契約</SelectItem>
                  <SelectItem value="general">一般</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">並び順</label>
              <Select value={`${sortBy}_${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('_')
                setSortBy(field)
                setSortOrder(order as 'asc' | 'desc')
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at_desc">作成日時（新しい順）</SelectItem>
                  <SelectItem value="created_at_asc">作成日時（古い順）</SelectItem>
                  <SelectItem value="title_asc">タイトル（あいうえお順）</SelectItem>
                  <SelectItem value="title_desc">タイトル（逆順）</SelectItem>
                  <SelectItem value="priority_desc">優先度（高い順）</SelectItem>
                  <SelectItem value="priority_asc">優先度（低い順）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 承認依頼一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>承認依頼一覧</CardTitle>
          <CardDescription>
            {loading ? '読み込み中...' : `${requests.length} 件の承認依頼`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">読み込み中...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">承認依頼が見つかりません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-2">
                        タイトル
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>優先度</TableHead>
                    <TableHead>依頼タイプ</TableHead>
                    <TableHead>依頼者</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        作成日時
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>有効期限</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{request.title}</div>
                          {request.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {request.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {request.request_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.requester_name || '不明'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {request.expires_at ? formatDate(request.expires_at) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log('詳細ボタンがクリックされました', request.id)
                            handleViewDetail(request)
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 詳細ダイアログ */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>承認依頼詳細</DialogTitle>
            <DialogDescription>
              {selectedRequest?.title} の詳細情報
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
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
                  <label className="text-sm font-medium text-gray-500">依頼者</label>
                  <p className="text-sm">{selectedRequest.requester_name || '不明'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">現在のステップ</label>
                  <p className="text-sm">{selectedRequest.current_step}</p>
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
              
              <div>
                <label className="text-sm font-medium text-gray-500">説明</label>
                <p className="text-sm mt-1">{selectedRequest.description || '-'}</p>
              </div>
              
              {selectedRequest.request_data && (
                <div>
                  <label className="text-sm font-medium text-gray-500">依頼データ</label>
                  <pre className="text-sm mt-1 p-3 bg-gray-50 rounded border overflow-x-auto">
                    {JSON.stringify(selectedRequest.request_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
