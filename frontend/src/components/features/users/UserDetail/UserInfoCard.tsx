'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserDetail } from './hooks/useUserDetail'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface UserInfoCardProps {
  user: UserDetail
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  // 性別の表示
  const getGenderDisplay = (gender: string) => {
    switch (gender) {
      case 'male':
        return '男性'
      case 'female':
        return '女性'
      case 'other':
        return 'その他'
      default:
        return '未設定'
    }
  }

  // ステータスの表示
  const getStatusDisplay = (isActive: boolean) => {
    return isActive ? '有効' : '無効'
  }

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日', { locale: ja })
    } catch {
      return '未設定'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>基本情報</span>
          <Badge variant={user.is_active ? 'default' : 'secondary'}>
            {getStatusDisplay(user.is_active)}
          </Badge>
        </CardTitle>
        <CardDescription>ユーザーの基本情報を表示します</CardDescription>
      </CardHeader>
              <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">社員ID</label>
              <p className="text-sm">{user.employee_id || '未設定'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">社員名（漢字）</label>
              <p className="text-sm">{user.name || '未設定'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">社員名（カナ）</label>
              <p className="text-sm">{user.name_kana || '未設定'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">性別</label>
              <p className="text-sm">{getGenderDisplay(user.gender || '')}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">生年月日</label>
              <p className="text-sm">{user.birth_date ? formatDate(user.birth_date) : '未設定'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">メールアドレス</label>
              <p className="text-sm">{user.email || '未設定'}</p>
            </div>
          </div>
        </CardContent>
    </Card>
  )
}
