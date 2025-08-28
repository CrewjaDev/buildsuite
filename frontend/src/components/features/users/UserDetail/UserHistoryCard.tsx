'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserDetail } from './hooks/useUserDetail'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface UserHistoryCardProps {
  user: UserDetail
}

export function UserHistoryCard({ user }: UserHistoryCardProps) {
  // 日付フォーマット
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: ja })
    } catch {
      return '未設定'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>アカウント情報</CardTitle>
        <CardDescription>ログイン情報とセキュリティ状態を表示します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">メールアドレス</label>
            <p className="text-sm">{user.email || '未設定'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">最終ログイン日時</label>
            <p className="text-sm">{user.last_login_at ? formatDate(user.last_login_at) : '未ログイン'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">ログイン失敗回数</label>
            <p className="text-sm">{user.failed_login_attempts || 0}回</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">パスワード有効期限</label>
            <p className="text-sm">
              {user.is_password_expired ? (
                <Badge variant="destructive">期限切れ</Badge>
              ) : (
                '有効'
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 履歴情報カード（作成・更新履歴）
export function UserTimelineCard({ user }: UserHistoryCardProps) {
  // 日付フォーマット
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: ja })
    } catch {
      return '未設定'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>履歴情報</CardTitle>
        <CardDescription>アカウントの作成・更新履歴を表示します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">作成日時</label>
            <p className="text-sm">{user.created_at ? formatDate(user.created_at) : '未設定'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">更新日時</label>
            <p className="text-sm">{user.updated_at ? formatDate(user.updated_at) : '未設定'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
