'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useUserDetail } from '@/components/features/users/UserDetail/hooks/useUserDetail'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UserDetailView } from '@/components/features/users/UserDetail/UserDetailView'
import { UserDetailEdit } from '@/components/features/users/UserDetail/UserDetailEdit'
import { UserPasswordCard } from '@/components/features/users/UserDetail/UserPasswordCard'
import { UserDetailHeader } from '@/components/features/users/UserDetail/UserDetailHeader'

export default function UserDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const userId = Number(params.id)
  
  // 初期モードの決定: modeパラメータが指定されていない場合は照会モード
  const initialMode = searchParams.get('mode') === 'edit' ? 'edit' : searchParams.get('mode') === 'password' ? 'password' : 'view'
  const [mode, setMode] = useState<'view' | 'edit' | 'password'>(initialMode)

  // データ取得
  const { data: user, isLoading, error } = useUserDetail(userId)
  
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
      } else if (mode === 'password') {
        newUrl.searchParams.set('mode', 'password')
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
        <p>Loading user details...</p>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <p>Error loading user: {error.message}</p>
      </div>
    )
  }

  // ユーザーデータがない場合
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>User not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* ヘッダーコンポーネント */}
      <UserDetailHeader 
        user={user}
        onEditClick={() => setMode('edit')}
        onDeleteSuccess={() => {
          // 削除成功時の処理（必要に応じて実装）
        }}
        canEdit={true}
        canDelete={true}
        canManagePermissions={true}
      />

      {/* メインコンテンツ */}
      <div className="container mx-auto py-6">
        {/* タブナビゲーション */}
        <Tabs value={mode} onValueChange={(value) => setMode(value as 'view' | 'edit' | 'password')} className="w-full">
        <TabsList>
          <TabsTrigger value="view">照会</TabsTrigger>
          <TabsTrigger value="edit">編集</TabsTrigger>
          <TabsTrigger value="password">パスワード設定</TabsTrigger>
        </TabsList>

        {/* 照会タブコンテンツ */}
        <TabsContent value="view" className="mt-4">
          <UserDetailView user={user} />
        </TabsContent>

        {/* 編集タブコンテンツ */}
        <TabsContent value="edit" className="mt-4">
          <UserDetailEdit 
            user={user} 
            onCancel={() => setMode('view')}
            onSuccess={() => {
              setMode('view')
              // 編集完了後、照会タブに遷移
              // 一覧ページに戻る際はrefresh=trueパラメータを付けて遷移
            }}
          />
        </TabsContent>

        {/* パスワード設定タブコンテンツ */}
        <TabsContent value="password" className="mt-4">
          <UserPasswordCard 
            user={user}
            onSuccess={() => {
              // 成功時の処理（必要に応じて実装）
            }}
          />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}