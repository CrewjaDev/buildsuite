'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Employee } from '@/services/features/employees/employeeService'

interface EmployeeContactCardProps {
  employee: Employee
}

export function EmployeeContactCard({ employee }: EmployeeContactCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>連絡先情報</CardTitle>
        <CardDescription>
          社員の連絡先と住所情報
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">メールアドレス</label>
            <p className="text-sm text-gray-900">{employee.email || '未設定'}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">電話番号</label>
            <p className="text-sm text-gray-900">{employee.phone || '未設定'}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">携帯電話</label>
            <p className="text-sm text-gray-900">{employee.mobile_phone || '未設定'}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">郵便番号</label>
            <p className="text-sm text-gray-900">{employee.postal_code || '未設定'}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">都道府県</label>
            <p className="text-sm text-gray-900">{employee.prefecture || '未設定'}</p>
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <label className="text-sm font-medium text-gray-700">住所</label>
            <p className="text-sm text-gray-900">{employee.address || '未設定'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
