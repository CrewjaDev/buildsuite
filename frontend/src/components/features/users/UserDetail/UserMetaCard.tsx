'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserDetail } from './hooks/useUserDetail'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface UserMetaCardProps {
  user: UserDetail
}

export function UserMetaCard({ user }: UserMetaCardProps) {
  // 日付フォーマット
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: ja })
    } catch {
      return '未設定'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>メタ情報</CardTitle>
        <CardDescription>アカウントの作成・更新履歴を表示します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">登録日時</label>
            <p className="text-sm">{user.created_at ? formatDateTime(user.created_at) : '未設定'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">登録者</label>
            <p className="text-sm">システム管理者</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">最終更新日時</label>
            <p className="text-sm">{user.updated_at ? formatDateTime(user.updated_at) : '未設定'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">更新者</label>
            <p className="text-sm">システム管理者</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
