'use client'

import { useRouter } from 'next/navigation'
import { PartnerCreateForm } from '@/components/features/partners/PartnerCreate/PartnerCreateForm'

export default function PartnerCreatePage() {
  const router = useRouter()

  const handleSuccess = (partnerId: number) => {
    // 作成成功時は詳細ページに遷移
    router.push(`/partners/${partnerId}`)
  }

  const handleCancel = () => {
    // キャンセル時は一覧ページに戻る
    router.push('/partners')
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="w-full max-w-none px-4 py-6 space-y-6">
        {/* ページヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">新規取引先登録</h1>
            <p className="text-gray-600">
              新しい取引先の情報を入力して登録します
            </p>
          </div>
        </div>

        {/* 作成フォーム */}
        <PartnerCreateForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
