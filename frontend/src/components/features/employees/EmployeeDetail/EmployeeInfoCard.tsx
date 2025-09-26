'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Employee } from '@/types/features/employees'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface EmployeeInfoCardProps {
  employee: Employee
}

export function EmployeeInfoCard({ employee }: EmployeeInfoCardProps) {
  // 性別の表示
  const getGenderDisplay = (gender: string | undefined) => {
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
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '未設定'
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
          <Badge variant={employee.is_active ? 'default' : 'secondary'}>
            {getStatusDisplay(employee.is_active)}
          </Badge>
        </CardTitle>
        <CardDescription>
          社員の基本的な個人情報
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">社員ID</label>
            <p className="text-sm text-gray-900">{employee.employee_id}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">氏名</label>
            <p className="text-sm text-gray-900">{employee.name}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">氏名（カナ）</label>
            <p className="text-sm text-gray-900">{employee.name_kana || '未設定'}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">性別</label>
            <p className="text-sm text-gray-900">{getGenderDisplay(employee.gender)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">生年月日</label>
            <p className="text-sm text-gray-900">{formatDate(employee.birth_date)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">ステータス</label>
            <div>
              <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                {getStatusDisplay(employee.is_active)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
