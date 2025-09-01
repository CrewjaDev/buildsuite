'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, FileText, Clock, CheckCircle } from 'lucide-react'
import { HeaderUser } from '@/types/user'

interface UserDashboardProps {
  user: HeaderUser
}

export default function UserDashboard({ user }: UserDashboardProps) {
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">作成中見積</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">今月の作成数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">承認待ちの件数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認済み</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">今月の承認数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総見積金額</CardTitle>
            <span className="text-muted-foreground">¥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5M</div>
            <p className="text-xs text-muted-foreground">今月の合計</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近の活動 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の活動</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium">見積書「新築マンション工事」を作成</p>
                  <p className="text-sm text-gray-500">2時間前</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                詳細
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium">見積書「オフィスリニューアル」が承認されました</p>
                  <p className="text-sm text-gray-500">1日前</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                詳細
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="font-medium">見積書「店舗改装工事」が承認待ちです</p>
                  <p className="text-sm text-gray-500">3日前</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                詳細
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
