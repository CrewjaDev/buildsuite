'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, FileText, Clock, CheckCircle, Loader2, ArrowRight, XCircle, RotateCcw } from 'lucide-react'
import { HeaderUser } from '@/types/user'
import { dashboardService, type DashboardStats } from '@/services/features/dashboard/dashboardService'
import { approvalRequestService } from '@/services/features/approvals/approvalRequests'
import { useToast } from '@/components/ui/toast'

interface UserDashboardProps {
  user: HeaderUser
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [approvalCounts, setApprovalCounts] = useState({
    pending: 0,
    reviewing: 0,
    approved: 0,
    rejected: 0,
    returned: 0
  })
  const [approvalLoading, setApprovalLoading] = useState(false)
  const { addToast } = useToast()

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const data = await dashboardService.getUserStats()
      setStats(data)
    } catch (error) {
      console.error('ダッシュボードデータの取得に失敗しました:', error)
      addToast({
        title: 'エラー',
        description: 'ダッシュボードデータの取得に失敗しました',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  const fetchApprovalCounts = useCallback(async () => {
    try {
      setApprovalLoading(true)
      const counts = await approvalRequestService.getAllCounts()
      setApprovalCounts(counts)
    } catch (error) {
      console.error('承認件数の取得に失敗しました:', error)
      addToast({
        title: 'エラー',
        description: '承認件数の取得に失敗しました',
        type: 'error',
      })
    } finally {
      setApprovalLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchStats()
    // 承認者権限がある場合のみ承認件数を取得
    if (user.permissions?.includes('approval.usage')) {
      fetchApprovalCounts()
    }
  }, [fetchStats, fetchApprovalCounts, user.permissions])


  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}分前`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}時間前`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}日前`
    }
  }

  const handleViewEstimate = (estimateId: string) => {
    router.push(`/estimates/${estimateId}`)
  }

  const handleViewApprovalRequest = (requestId: number) => {
    router.push(`/approvals/${requestId}`)
  }

  const handleViewAllApprovals = () => {
    router.push('/approval-dashboard')
  }

  // ビジネスコード別のページ遷移
  const handleBusinessCodeClick = (businessCode: string) => {
    const routes: { [key: string]: string } = {
      'estimate': '/estimates',
      'budget': '/budgets',
      'purchase': '/purchases',
      'construction': '/constructions',
      'general': '/general'
    }
    
    const route = routes[businessCode]
    if (route) {
      router.push(route)
    }
  }

  // ビジネスコードの表示名を取得
  const getBusinessCodeDisplayName = (businessCode: string): string => {
    const displayNames: { [key: string]: string } = {
      'estimate': '見積管理',
      'budget': '予算管理',
      'purchase': '発注管理',
      'construction': '工事管理',
      'general': '一般管理'
    }
    return displayNames[businessCode] || businessCode
  }

  // ビジネスコードのカテゴリを取得
  const getBusinessCodeCategory = (businessCode: string): string => {
    const categories: { [key: string]: string } = {
      'estimate': '財務',
      'budget': '財務',
      'purchase': '財務',
      'construction': '工事',
      'general': '一般'
    }
    return categories[businessCode] || 'その他'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">ダッシュボードデータを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">データの読み込みに失敗しました</p>
          <Button onClick={fetchStats} className="mt-4">
            再試行
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* ユーザー情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>ようこそ、{user?.name || 'ユーザー'}さん</span>
            <Badge variant="secondary">{user?.primary_department?.name || '部署未設定'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">今日も一日お疲れ様です。</p>
        </CardContent>
      </Card>

      {/* 承認管理カード（承認者権限がある場合のみ表示） */}
      {user.permissions?.includes('approval.usage') && (
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewAllApprovals}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>承認管理</span>
              <Badge variant="outline">承認者</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-600">承認待ち</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {approvalLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : approvalCounts.pending}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600">審査中</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {approvalLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : approvalCounts.reviewing}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-600">承認済み</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {approvalLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : approvalCounts.approved}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-600">却下</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {approvalLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : approvalCounts.rejected}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RotateCcw className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-600">差戻し</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {approvalLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : approvalCounts.returned}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center mt-4 text-sm text-blue-600">
              <span>承認一覧を表示</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ビジネスコード別統計カード */}
      {Object.entries(stats.business_codes).map(([businessCode, businessStats]) => (
        <Card 
          key={businessCode}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleBusinessCodeClick(businessCode)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{getBusinessCodeDisplayName(businessCode)}</span>
              <Badge variant="outline">{getBusinessCodeCategory(businessCode)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {/* 作業中 */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FileText className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-medium text-gray-600">作業中</span>
                </div>
                <div className="text-lg font-bold text-blue-600">{businessStats.total.draft_count}</div>
                <div className="text-xs text-gray-500">今月: {businessStats.monthly.draft_count}</div>
              </div>
              
              {/* 承認待ち */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs font-medium text-gray-600">承認待ち</span>
                </div>
                <div className="text-lg font-bold text-yellow-600">{businessStats.total.pending_approval_count}</div>
                <div className="text-xs text-gray-500">今月: {businessStats.monthly.pending_approval_count}</div>
              </div>
              
              {/* 承認済み */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-medium text-gray-600">承認済み</span>
                </div>
                <div className="text-lg font-bold text-green-600">{businessStats.total.approved_count}</div>
                <div className="text-xs text-gray-500">今月: {businessStats.monthly.approved_count}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center mt-4 text-sm text-blue-600">
              <span>詳細を表示</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 最近の活動 */}
      {stats.recent_activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近の活動</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_activities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activity.type === 'estimate_created' && (
                      <FileText className="h-4 w-4 text-blue-500" />
                    )}
                    {activity.type === 'approval_request_created' && (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (activity.estimate_id) {
                        handleViewEstimate(activity.estimate_id)
                      } else if (activity.request_id) {
                        handleViewApprovalRequest(activity.request_id)
                      }
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    詳細
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
