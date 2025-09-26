'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Employee } from '@/types/features/employees'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface EmployeeWorkCardProps {
  employee: Employee
}

export function EmployeeWorkCard({ employee }: EmployeeWorkCardProps) {
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
        <CardTitle>勤務情報</CardTitle>
        <CardDescription>
          所属部署、職位、勤務に関する情報
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">所属部署</label>
            <p className="text-sm text-gray-900">{employee.department.name}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">職位</label>
            <p className="text-sm text-gray-900">{employee.position?.name || '未設定'}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">役職</label>
            <p className="text-sm text-gray-900">{employee.job_title || '未設定'}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">入社日</label>
            <p className="text-sm text-gray-900">{formatDate(employee.hire_date)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">勤続年数</label>
            <p className="text-sm text-gray-900">
              {employee.service_years !== null && employee.service_months !== null
                ? `${employee.service_years}年${employee.service_months}ヶ月`
                : '未設定'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
