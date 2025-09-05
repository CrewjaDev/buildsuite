'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import employeeService, { type Employee, type EmployeeSearchParams } from '@/services/features/employees/employeeService'
import { EmployeeListHeader } from './EmployeeListHeader'
import { EmployeeSearchFilters } from './EmployeeSearchFilters'
import { EmployeeTable } from './EmployeeTable'

export function EmployeeListPage() {
  const router = useRouter()
  
  // 状態管理
  const [searchValue, setSearchValue] = useState('')
  const [filters, setFilters] = useState<Record<string, string | number | boolean | null | undefined>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 検索パラメータ
  const searchParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    search: searchValue || undefined,
    ...filters
  } as EmployeeSearchParams), [currentPage, pageSize, searchValue, filters])

  // データ取得
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employees', searchParams],
    queryFn: () => employeeService.getEmployees(searchParams),
  })

  // イベントハンドラー
  const handleEditEmployee = useCallback((employee: Employee) => {
    console.log('編集:', employee)
    // 詳細ページの編集モードに遷移
    router.push(`/employees/${employee.id}?mode=edit`)
  }, [router])

  const handleViewEmployee = useCallback((employee: Employee) => {
    console.log('詳細表示:', employee)
    // 詳細ページに遷移
    router.push(`/employees/${employee.id}`)
  }, [router])

  const handleSystemAccess = useCallback((employee: Employee) => {
    console.log('システム権限管理:', employee)
    // システム権限管理ページに遷移
    router.push(`/employees/${employee.id}?mode=system-access`)
  }, [router])

  const handleRowClick = useCallback((employee: Employee) => {
    console.log('行クリック:', employee)
    // 詳細ページに遷移
    router.push(`/employees/${employee.id}`)
  }, [router])

  // ページがフォーカスされた時、可視性が変更された時にデータを再取得
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      const handleFocus = () => { refetch() }
      const handleVisibilityChange = () => { if (!document.hidden) { refetch() } }
      const handleRouteChange = () => { refetch() }

      window.addEventListener('focus', handleFocus)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('popstate', handleRouteChange)
      
      return () => {
        window.removeEventListener('focus', handleFocus)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('popstate', handleRouteChange)
      }
    }
  }, [refetch])

  // refreshパラメータを監視してデータを強制的に再取得
  const urlSearchParams = useSearchParams()
  useEffect(() => {
    if (urlSearchParams.get('refresh') === 'true') {
      refetch()
      router.replace('/employees', { scroll: false }) // パラメータをクリア
    }
  }, [urlSearchParams, refetch, router])

  // デバッグ用：データをコンソールに出力（クライアントサイドでのみ）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Employees data:', data)
    }
  }, [data])

  // 新しいコンポーネント用のハンドラー
  const handleCreateNew = useCallback(() => {
    router.push('/employees/create')
  }, [router])

  const handleImport = useCallback(() => {
    console.log('インポート機能')
    // TODO: インポート機能を実装
  }, [])

  const handleExport = useCallback(() => {
    console.log('エクスポート機能')
    // TODO: エクスポート機能を実装
  }, [])

  // 不足しているハンドラーと状態
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
    setCurrentPage(1)
  }, [])

  const handleFilterChange = useCallback((newFilters: Record<string, string | number | boolean | null | undefined>) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }, [])

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="w-full max-w-none px-4 py-6 space-y-6">
        {/* ヘッダー */}
        <EmployeeListHeader
          totalCount={data?.totalCount || 0}
          onCreateNew={handleCreateNew}
          onImport={handleImport}
          onExport={handleExport}
        />

        {/* 検索・フィルター */}
        <EmployeeSearchFilters
          searchValue={searchValue}
          filters={filters}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onClearFilters={() => setFilters({})}
        />

        {/* データテーブル */}
        <div className="w-full">
          <EmployeeTable
            data={data?.employees || []}
            isLoading={isLoading}
            error={error}
            onEdit={handleEditEmployee}
            onView={handleViewEmployee}
            onSystemAccess={handleSystemAccess}
            onRowClick={handleRowClick}
            onPageSizeChange={handlePageSizeChange}
            onPageChange={setCurrentPage}
            currentPage={currentPage}
            totalCount={data?.totalCount || 0}
            pageSize={pageSize}
          />
        </div>
      </div>
    </div>
  )
}