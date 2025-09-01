'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { usePartner } from '@/hooks/features/partners/usePartners'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PartnerDetailView } from '@/components/features/partners/PartnerDetail/PartnerDetailView'
import { PartnerDetailEdit } from '@/components/features/partners/PartnerDetail/PartnerDetailEdit'
import { PartnerDetailHeader } from '@/components/features/partners/PartnerDetail/PartnerDetailHeader'

export default function PartnerDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const partnerId = Number(params.id)
  
  // 初期モードの決定: modeパラメータが指定されていない場合は照会モード
  const initialMode = searchParams.get('mode') === 'edit' ? 'edit' : 'view'
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode)

  // データ取得
  const { data: partner, isLoading, error } = usePartner(partnerId)
  
  // ページ初期表示時のスクロール位置調整
  useEffect(() => {
    // ページの先頭にスクロール
    window.scrollTo(0, 0)
  }, [])
  
  // URLのmodeパラメータと内部状態を同期
  useEffect(() => {
    if (searchParams.get('mode') !== mode) {
      const newUrl = new URL(window.location.href)
      if (mode === 'edit') {
        newUrl.searchParams.set('mode', 'edit')
      } else {
        newUrl.searchParams.delete('mode')
      }
      router.replace(newUrl.toString(), { scroll: false })
    }
  }, [mode, searchParams, router])

  // ローディング状態
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-600">取引先情報を読み込み中...</span>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <p>取引先情報の読み込みでエラーが発生しました: {error.message}</p>
      </div>
    )
  }

  // 取引先データがない場合
  if (!partner) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>取引先が見つかりません。</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* ヘッダーコンポーネント */}
      <PartnerDetailHeader 
        partner={partner}
        onEditClick={() => setMode('edit')}
        onDeleteSuccess={() => {
          // 削除成功時は一覧ページに戻る
          router.push('/partners')
        }}
        canEdit={true}
        canDelete={true}
      />

      {/* メインコンテンツ */}
      <div className="container mx-auto py-6">
        {/* タブナビゲーション */}
        <Tabs value={mode} onValueChange={(value) => setMode(value as 'view' | 'edit')} className="w-full">
          <TabsList>
            <TabsTrigger value="view">照会</TabsTrigger>
            <TabsTrigger value="edit">編集</TabsTrigger>
          </TabsList>

          {/* 照会タブコンテンツ */}
          <TabsContent value="view" className="mt-4">
            <PartnerDetailView partner={partner} />
          </TabsContent>

          {/* 編集タブコンテンツ */}
          <TabsContent value="edit" className="mt-4">
            <PartnerDetailEdit 
              partner={partner} 
              onCancel={() => setMode('view')}
              onSuccess={() => {
                setMode('view')
                // 編集完了後、一覧ページのデータも更新されるようにする
                // 成功メッセージを表示する場合はここでトースト通知を追加
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
