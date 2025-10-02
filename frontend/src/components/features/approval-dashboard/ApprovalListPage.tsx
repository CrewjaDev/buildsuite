'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  Search, 
  Loader2, 
  ArrowLeft,
  Eye,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react'
import { approvalRequestService } from '@/services/features/approvals/approvalRequests'
import type { ApprovalRequest } from '@/types/features/approvals/approvalRequests'
import { useToast } from '@/components/ui/toast'

export default function ApprovalListPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [activeTab, setActiveTab] = useState('pending')
  const { addToast } = useToast()

  const fetchRequests = useCallback(async (status: string) => {
    try {
      setLoading(true)
      const response = await approvalRequestService.getApprovalRequests({
        page: 1,
        per_page: 100,
        filter: {
          status: [status],
          request_type: typeFilter === 'all' ? undefined : [typeFilter],
          priority: priorityFilter === 'all' ? undefined : [priorityFilter]
        },
        sort: `${sortBy}:${sortOrder}`
      })
      setRequests(response.data)
    } catch (error) {
      console.error(`${status}一覧の取得に失敗しました:`, error)
      addToast({
        title: 'エラー',
        description: `${status}一覧の取得に失敗しました`,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [typeFilter, priorityFilter, sortBy, sortOrder, addToast])

  useEffect(() => {
    fetchRequests(activeTab)
  }, [fetchRequests, activeTab])

  const handleViewDetail = (request: ApprovalRequest) => {
    // 関連業務の詳細ページへ遷移
    switch (request.request_type) {
      case 'estimate':
        router.push(`/estimates/${request.request_id}`)
        break
      case 'budget':
        router.push(`/budgets/${request.request_id}`)
        break
      case 'construction':
        router.push(`/constructions/${request.request_id}`)
        break
      default:
        addToast({
          title: 'エラー',
          description: '未対応の依頼タイプです',
          type: 'error',
        })
    }
  }

  const getStatusBadge = (requestStatus: string) => {
    const statusConfig = {
      pending: { label: '承認待ち', variant: 'default' as const, icon: Clock },
      approved: { label: '承認済み', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: '却下', variant: 'destructive' as const, icon: XCircle },
      returned: { label: '差し戻し', variant: 'secondary' as const, icon: RotateCcw },
      cancelled: { label: 'キャンセル', variant: 'outline' as const, icon: XCircle }
    }
    
    const config = statusConfig[requestStatus as keyof typeof statusConfig] || statusConfig.pending
    const StatusIcon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <StatusIcon className="h-3 w-3" />
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

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      estimate: '見積',
      budget: '予算',
      construction: '工事',
      general: '一般'
    }
    return typeLabels[type as keyof typeof typeLabels] || type
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

  const getTabTitle = (status: string) => {
    const titles = {
      pending: '承認待ち',
      approved: '承認済み',
      rejected: '却下',
      returned: '差戻し'
    }
    return titles[status as keyof typeof titles] || status
  }

  const getTabIcon = (status: string) => {
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      returned: RotateCcw
    }
    return icons[status as keyof typeof icons] || Clock
  }

  const getTabIconColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-500',
      approved: 'text-green-500',
      rejected: 'text-red-500',
      returned: 'text-orange-500'
    }
    return colors[status as keyof typeof colors] || 'text-gray-500'
  }

  // 検索フィルタリング
  const filteredRequests = requests.filter(request => {
    if (!searchTerm) return true
    return (
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.description && request.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  const renderRequestList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">読み込み中...</span>
        </div>
      )
    }

    if (filteredRequests.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {getTabTitle(activeTab)}の依頼がありません
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {filteredRequests.map((request) => {
          const TabIcon = getTabIcon(activeTab)
          const iconColor = getTabIconColor(activeTab)
          
          return (
            <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <TabIcon className={`h-4 w-4 ${iconColor}`} />
                  <div>
                    <p className="font-medium">{request.title}</p>
                    <p className="text-sm text-gray-500">
                      {request.requester_name} - {formatDate(request.created_at)}
                    </p>
                    {request.description && (
                      <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(request.status)}
                      {getPriorityBadge(request.priority)}
                      <Badge variant="outline">
                        {getTypeLabel(request.request_type)}
                      </Badge>
                      {request.approval_flow && (
                        <Badge variant="secondary">
                          {request.approval_flow.name}
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        ステップ {request.current_step}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewDetail(request)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  詳細
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">承認管理</h2>
            <p className="text-gray-600">承認依頼を状態別に確認・処理できます</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRequests(activeTab)}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '更新'}
          </Button>
        </div>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">フィルター・検索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="依頼タイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="estimate">見積</SelectItem>
                <SelectItem value="budget">予算</SelectItem>
                <SelectItem value="construction">工事</SelectItem>
                <SelectItem value="general">一般</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="優先度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="low">低</SelectItem>
                <SelectItem value="normal">通常</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="urgent">緊急</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}:${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split(':')
              setSortBy(field)
              setSortOrder(order)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="並び順" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at:desc">作成日時（新しい順）</SelectItem>
                <SelectItem value="created_at:asc">作成日時（古い順）</SelectItem>
                <SelectItem value="expires_at:asc">有効期限（近い順）</SelectItem>
                <SelectItem value="priority:desc">優先度（高い順）</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* タブ分けされた承認一覧 */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  承認待ち
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  承認済み
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  却下
                </TabsTrigger>
                <TabsTrigger value="returned" className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-orange-500" />
                  差戻し
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value="pending">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">承認待ち一覧 ({filteredRequests.length}件)</h3>
                </div>
                {renderRequestList()}
              </TabsContent>
              
              <TabsContent value="approved">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">承認済み一覧 ({filteredRequests.length}件)</h3>
                </div>
                {renderRequestList()}
              </TabsContent>
              
              <TabsContent value="rejected">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">却下一覧 ({filteredRequests.length}件)</h3>
                </div>
                {renderRequestList()}
              </TabsContent>
              
              <TabsContent value="returned">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">差戻し一覧 ({filteredRequests.length}件)</h3>
                </div>
                {renderRequestList()}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
