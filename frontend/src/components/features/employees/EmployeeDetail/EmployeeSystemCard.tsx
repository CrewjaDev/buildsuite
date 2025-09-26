'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Employee } from '@/types/features/employees'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface EmployeeSystemCardProps {
  employee: Employee
}

export function EmployeeSystemCard({ employee }: EmployeeSystemCardProps) {
  // 日付フォーマット
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '未設定'
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日', { locale: ja })
    } catch {
      return '未設定'
    }
  }

  if (!employee.has_system_access || !employee.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>システム権限</span>
            <Badge variant="secondary">権限なし</Badge>
          </CardTitle>
          <CardDescription>
            システム利用権限が付与されていません
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            この社員にはシステム利用権限が付与されていません。
            システム権限タブから権限を付与できます。
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>システム権限</span>
          <Badge variant="default">権限あり</Badge>
          {employee.user.is_admin && (
            <Badge variant="destructive">管理者</Badge>
          )}
        </CardTitle>
        <CardDescription>
          システム利用権限とアクセス情報
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">ログインID</label>
            <p className="text-sm text-gray-900">{employee.user.login_id}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">システム権限レベル</label>
            <p className="text-sm text-gray-900">
              {String(employee.user.system_level_info?.display_name || '未設定')}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">機能役割</label>
            <div className="flex flex-wrap gap-1">
              {employee.user.roles && employee.user.roles.length > 0 ? (
                employee.user.roles.map((role) => (
                  <Badge key={role.id} variant="outline">
                    {(role as { display_name?: string }).display_name || role.name || 'Unknown'}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">未設定</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">管理者権限</label>
            <div>
              <Badge variant={employee.user.is_admin ? 'destructive' : 'secondary'}>
                {employee.user.is_admin ? '管理者' : '一般ユーザー'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">最終ログイン</label>
            <p className="text-sm text-gray-900">{formatDate(employee.user.last_login_at)}</p>
          </div>

          {employee.user.is_locked && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">アカウント状態</label>
              <div>
                <Badge variant="destructive">ロック中</Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
