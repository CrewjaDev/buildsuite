'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, FileText, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { HeaderUser } from '@/types/user'
import { dashboardService, type DashboardStats, type Activity } from '@/services/features/dashboard/dashboardService'
import { useToast } from '@/components/ui/toast'

interface UserDashboardProps {
  user: HeaderUser
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) {
      return `¥${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `¥${(amount / 1000).toFixed(0)}K`
    }
    return `¥${amount.toLocaleString()}`
  }

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

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.estimates.has_permission && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">作成中見積</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.estimates.draft_count}</div>
                <p className="text-xs text-muted-foreground">今月の作成数</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.estimates.pending_approval_count}</div>
                <p className="text-xs text-muted-foreground">承認待ちの件数</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">承認済み</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.estimates.approved_count}</div>
                <p className="text-xs text-muted-foreground">今月の承認数</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総見積金額</CardTitle>
                <span className="text-muted-foreground">¥</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(stats.estimates.total_amount)}</div>
                <p className="text-xs text-muted-foreground">今月の合計</p>
              </CardContent>
            </Card>
          </>
        )}

        {stats.approvals.has_permission && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">私の承認待ち</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approvals.my_pending_requests}</div>
                <p className="text-xs text-muted-foreground">承認待ちの件数</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">私の承認済み</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approvals.my_approved_requests}</div>
                <p className="text-xs text-muted-foreground">今月の承認済み</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

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
