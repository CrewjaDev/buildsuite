'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function PaymentsPage() {
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="w-full max-w-none px-4 py-6 space-y-6">
        {/* ページヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">支払管理</h1>
            <p className="text-gray-600">支払通知書の作成・管理を行います</p>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            新規支払作成
          </Button>
        </div>

        {/* 支払一覧（実装予定） */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-gray-500">支払一覧の実装予定</p>
        </div>
      </div>
    </div>
  )
}
