'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Settings, Users, BarChart3, Shield } from 'lucide-react'
import { HeaderUser } from '@/types/user'

interface AdminDashboardProps {
  user: HeaderUser
}

export default function AdminDashboard({}: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      {/* 管理者情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>システム管理者ダッシュボード</span>
            <Badge variant="destructive">システム管理者</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">システム全体の管理と監視を行えます。</p>
        </CardContent>
      </Card>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">アクティブユーザー</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総見積数</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">今月の作成数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">承認待ちの件数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総見積金額</CardTitle>
            <span className="text-muted-foreground">¥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1B</div>
            <p className="text-xs text-muted-foreground">今月の合計</p>
          </CardContent>
        </Card>
      </div>

      {/* システム管理 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>システム設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                ユーザー管理
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                権限管理
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                システム設定
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>システム状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">データベース</span>
                <Badge variant="default">正常</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API サーバー</span>
                <Badge variant="default">正常</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">ファイルストレージ</span>
                <Badge variant="default">正常</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">バックアップ</span>
                <Badge variant="secondary">実行中</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近のシステムログ */}
      <Card>
        <CardHeader>
          <CardTitle>最近のシステムログ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium">新規ユーザー登録: 田中太郎</p>
                  <p className="text-sm text-gray-500">30分前</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                詳細
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium">権限変更: 佐藤次郎 (管理者に昇格)</p>
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
                <Settings className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="font-medium">システム設定更新: 承認フロー設定</p>
                  <p className="text-sm text-gray-500">1日前</p>
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
