'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserDetail } from './hooks/useUserDetail'

interface UserContactCardProps {
  user: UserDetail
}

export function UserContactCard({ user }: UserContactCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>連絡先情報</CardTitle>
        <CardDescription>電話番号と住所情報を表示します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">電話番号</label>
            <p className="text-sm">{user.phone || '未設定'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">携帯電話</label>
            <p className="text-sm">{user.mobile_phone || '未設定'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">郵便番号</label>
            <p className="text-sm">{user.postal_code || '未設定'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">都道府県</label>
            <p className="text-sm">{user.prefecture || '未設定'}</p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">住所</label>
          <p className="text-sm">{user.address || '未設定'}</p>
        </div>
      </CardContent>
    </Card>
  )
}
