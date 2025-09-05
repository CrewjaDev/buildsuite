'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { UserCreateForm } from '@/components/features/users/UserCreate/UserCreateForm'

export default function UserCreatePage() {
  const router = useRouter()

  const handleSuccess = () => {
    // 作成成功後、一覧ページに戻る（refresh=trueでデータ更新）
    router.push('/users?refresh=true')
  }

  const handleCancel = () => {
    // キャンセル時、一覧ページに戻る
    router.push('/users')
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="w-full max-w-none px-4 py-6 space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>戻る</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ユーザー新規作成</h1>
              <p className="text-gray-600">新しいユーザーをシステムに登録します</p>
            </div>
          </div>
        </div>

        {/* 作成フォーム */}
        <div className="w-full">
          <UserCreateForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}
