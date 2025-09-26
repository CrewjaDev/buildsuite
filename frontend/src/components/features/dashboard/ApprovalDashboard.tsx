'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { HeaderUser } from '@/types/user'
import { approvalRequestService } from '@/services/features/approvals/approvalRequests'
import { useToast } from '@/components/ui/toast'

interface ApprovalDashboardProps {
  user: HeaderUser
}

export default function ApprovalDashboard({}: ApprovalDashboardProps) {
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  const fetchPendingCount = useCallback(async () => {
    try {
      setLoading(true)
      const count = await approvalRequestService.getPendingCount()
      setPendingCount(count)
    } catch (error) {
      console.error('承認待ち件数の取得に失敗しました:', error)
      addToast({
        title: 'エラー',
        description: '承認待ち件数の取得に失敗しました',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchPendingCount()
  }, [fetchPendingCount])

  const handleViewPendingApprovals = () => {
    router.push('/approvals/pending')
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

      {/* 承認待ちカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewPendingApprovals}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">承認待ちの件数</p>
            <div className="flex items-center mt-2 text-sm text-blue-600">
              <span>詳細を見る</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認済み</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">今月の承認件数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">却下・差し戻し</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">今月の却下・差し戻し件数</p>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
