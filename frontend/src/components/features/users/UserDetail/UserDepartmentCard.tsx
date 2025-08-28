'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserDetail } from './hooks/useUserDetail'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface UserDepartmentCardProps {
  user: UserDetail
}

export function UserDepartmentCard({ user }: UserDepartmentCardProps) {
  // 日付フォーマット
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日', { locale: ja })
    } catch {
      return '未設定'
    }
  }

  // 勤続年数計算
  const calculateServiceYears = (hireDate: string) => {
    try {
      const hire = new Date(hireDate)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - hire.getTime())
      const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365))
      return `${diffYears}年`
    } catch {
      return '未設定'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>所属情報</CardTitle>
        <CardDescription>所属部署と職位情報を表示します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">所属部署</label>
            <p className="text-sm">{user.primary_department?.name || '未設定'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">役職</label>
            <p className="text-sm">{user.job_title || '未設定'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">職位</label>
            <p className="text-sm">{user.position?.display_name || '未設定'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">入社年月日</label>
            <p className="text-sm">{user.hire_date ? formatDate(user.hire_date) : '未設定'}</p>
          </div>

        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">勤続年数</label>
          <p className="text-sm">
            {user.hire_date ? calculateServiceYears(user.hire_date) : '未設定'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
