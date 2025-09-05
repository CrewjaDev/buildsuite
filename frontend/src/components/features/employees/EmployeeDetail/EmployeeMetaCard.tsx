'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Employee } from '@/services/features/employees/employeeService'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface EmployeeMetaCardProps {
  employee: Employee
}

export function EmployeeMetaCard({ employee }: EmployeeMetaCardProps) {
  // 日時フォーマット
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '未設定'
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm:ss', { locale: ja })
    } catch {
      return '未設定'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>メタ情報</CardTitle>
        <CardDescription>
          データの作成・更新履歴
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">作成日時</label>
            <p className="text-sm text-gray-900">{formatDateTime(employee.created_at)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">最終更新日時</label>
            <p className="text-sm text-gray-900">{formatDateTime(employee.updated_at)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">レコードID</label>
            <p className="text-sm text-gray-900">{employee.id}</p>
          </div>


        </div>
      </CardContent>
    </Card>
  )
}
