'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import employeeService from '@/services/features/employees/employeeService'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EmployeeDetailView } from './EmployeeDetailView'
import { EmployeeDetailEdit } from './EmployeeDetailEdit'
import { EmployeeDetailHeader } from './EmployeeDetailHeader'
import { SystemAccessForm } from '../EmployeeSystemAccess/SystemAccessForm'

export function EmployeeDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const employeeId = Number(params?.id)
  
  // 初期モードの決定: modeパラメータが指定されていない場合は照会モード
  const initialMode = searchParams?.get('mode') === 'edit' ? 'edit' : searchParams?.get('mode') === 'system-access' ? 'system-access' : 'view'
  const [mode, setMode] = useState<'view' | 'edit' | 'system-access'>(initialMode)

  // データ取得
  const { data: employee, isLoading, error, refetch } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeeService.getEmployee(employeeId),
    enabled: !!employeeId,
  })
  
  // ページ初期表示時のスクロール位置調整
  useEffect(() => {
    // ページの先頭にスクロール
    window.scrollTo(0, 0)
  }, [])
  
  // URLのmodeパラメータと内部状態を同期
  useEffect(() => {
    if (searchParams?.get('mode') !== mode) {
      const newUrl = new URL(window.location.href)
      if (mode === 'edit') {
        newUrl.searchParams.set('mode', 'edit')
      } else if (mode === 'system-access') {
        newUrl.searchParams.set('mode', 'system-access')
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">社員情報を読み込んでいます...</p>
        </div>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <p>Error loading employee: {error.message}</p>
      </div>
    )
  }

  // 社員データがない場合
  if (!employee) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Employee not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* ヘッダーコンポーネント */}
      <EmployeeDetailHeader 
        employee={employee}
        onEditClick={() => setMode('edit')}
        onSystemAccessClick={() => setMode('system-access')}
        onDeleteSuccess={() => {
          // 削除成功時の処理（必要に応じて実装）
        }}
        canEdit={true}
        canDelete={true}
        canManageSystemAccess={true}
      />

      {/* メインコンテンツ */}
      <div className="container mx-auto py-6">
        {/* タブナビゲーション */}
        <Tabs value={mode} onValueChange={(value) => setMode(value as 'view' | 'edit' | 'system-access')} className="w-full">
        <TabsList>
          <TabsTrigger value="view">照会</TabsTrigger>
          <TabsTrigger value="edit">編集</TabsTrigger>
          <TabsTrigger value="system-access">権限設定</TabsTrigger>
        </TabsList>

        {/* 照会タブコンテンツ */}
        <TabsContent value="view" className="mt-4">
          <EmployeeDetailView employee={employee} />
        </TabsContent>

        {/* 編集タブコンテンツ */}
        <TabsContent value="edit" className="mt-4">
          <EmployeeDetailEdit 
            employee={employee} 
            onCancel={() => setMode('view')}
            onSuccess={() => {
              setMode('view')
              // 編集完了後、照会タブに遷移
            }}
          />
        </TabsContent>

        {/* 権限管理タブコンテンツ */}
        <TabsContent value="system-access" className="mt-4">
          <div className="w-full max-w-4xl">
            <SystemAccessForm 
              employee={employee}
              onSuccess={() => {
                // データを再取得
                refetch()
                // 権限更新完了後、照会タブに切り替え
                setMode('view')
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}