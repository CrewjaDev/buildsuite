'use client'

import { useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useEstimate } from '@/hooks/features/estimates/useEstimates'
import { EstimateDetailEdit } from '@/components/features/estimates/EstimateDetail/EstimateDetailEdit'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function EstimateEditPage() {
  const router = useRouter()
  const params = useParams()
  const estimateId = params.id as string
  
  // データ取得
  const { data: estimate, isLoading, error } = useEstimate(estimateId)

  // イベントハンドラー
  const handleBack = useCallback(() => {
    router.push(`/estimates/${estimateId}`)
  }, [router, estimateId])

  const handleSave = useCallback(() => {
    router.push(`/estimates/${estimateId}`)
  }, [router, estimateId])

  const handleCancel = useCallback(() => {
    router.push(`/estimates/${estimateId}`)
  }, [router, estimateId])

  // ローディング状態
  if (isLoading) {
    return (
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="w-full max-w-none px-4 py-6">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">読み込み中...</span>
          </div>
        </div>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="w-full max-w-none px-4 py-6">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-600 mb-2">エラーが発生しました</p>
              <p className="text-gray-600 text-sm">{error.message}</p>
              <Button onClick={handleBack} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                詳細に戻る
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // データが存在しない場合
  if (!estimate) {
    return (
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="w-full max-w-none px-4 py-6">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-gray-600 mb-4">見積が見つかりません</p>
              <Button onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                詳細に戻る
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="w-full max-w-none px-4 py-6 space-y-6">
        {/* ページヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              詳細に戻る
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {estimate.estimate_number || '見積編集'}
              </h1>
              <p className="text-gray-600">
                {estimate.project_name || 'プロジェクト名未設定'}
              </p>
            </div>
          </div>
        </div>

        {/* 編集フォーム */}
        <EstimateDetailEdit
          estimate={estimate}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
