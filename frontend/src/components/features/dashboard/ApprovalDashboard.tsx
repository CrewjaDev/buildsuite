'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { HeaderUser } from '@/types/user'

interface ApprovalDashboardProps {
  user: HeaderUser
}

export default function ApprovalDashboard({}: ApprovalDashboardProps) {
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
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">承認待ちの件数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月承認</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">承認済み件数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月却下</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">却下件数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均処理時間</CardTitle>
            <span className="text-muted-foreground">⏱</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3h</div>
            <p className="text-xs text-muted-foreground">平均処理時間</p>
          </CardContent>
        </Card>
      </div>

      {/* 承認待ち一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>承認待ちの依頼</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="font-medium">見積書「新築マンション工事」</p>
                  <p className="text-sm text-gray-500">田中太郎 - 2時間前</p>
                  <p className="text-sm text-gray-500">金額: ¥15,000,000</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  詳細
                </Button>
                <Button variant="default" size="sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  承認
                </Button>
                <Button variant="destructive" size="sm">
                  <XCircle className="h-4 w-4 mr-1" />
                  却下
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="font-medium">見積書「オフィスリニューアル」</p>
                  <p className="text-sm text-gray-500">佐藤次郎 - 4時間前</p>
                  <p className="text-sm text-gray-500">金額: ¥8,500,000</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  詳細
                </Button>
                <Button variant="default" size="sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  承認
                </Button>
                <Button variant="destructive" size="sm">
                  <XCircle className="h-4 w-4 mr-1" />
                  却下
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="font-medium">見積書「店舗改装工事」</p>
                  <p className="text-sm text-gray-500">鈴木一郎 - 1日前</p>
                  <p className="text-sm text-gray-500">金額: ¥3,200,000</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  詳細
                </Button>
                <Button variant="default" size="sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  承認
                </Button>
                <Button variant="destructive" size="sm">
                  <XCircle className="h-4 w-4 mr-1" />
                  却下
                </Button>
              </div>
            </div>
          </div>
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
    </div>
  )
}
