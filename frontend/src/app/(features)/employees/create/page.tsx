'use client'

import { EmployeeCreateForm } from '@/components/features/employees/EmployeeCreate/EmployeeCreateForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function EmployeeCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">新規社員登録</h1>
        <p className="text-gray-600">社員の基本情報を登録します</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>社員基本情報登録</CardTitle>
          <CardDescription>
            社員の基本情報のみを登録します。システム利用権限は後から編集画面で設定してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeCreateForm 
            onSuccess={() => {
              // 成功時の処理（一覧画面に戻るなど）
              window.location.href = '/employees'
            }}
            onCancel={() => {
              // キャンセル時の処理
              window.history.back()
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
