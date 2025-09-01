'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUsers } from '@/hooks/useUsers'
import { UserDetail } from '@/types/user'
import { UserListHeader } from '@/components/features/users/UserList/UserListHeader'
import { UserSearchFilters } from '@/components/features/users/UserList/UserSearchFilters'
import { UserTable } from '@/components/features/users/UserList/UserTable'

export default function UsersPage() {
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
  }), [currentPage, pageSize, searchValue, filters])

  // データ取得
  const { data, isLoading, error, refetch } = useUsers(searchParams)

  // イベントハンドラー
  const handleEditUser = useCallback((user: UserDetail) => {
    console.log('編集:', user)
    // 詳細ページの編集モードに遷移
    router.push(`/users/${user.id}?mode=edit`)
  }, [router])

  const handleDeleteUser = useCallback((user: UserDetail) => {
    console.log('削除:', user)
    // TODO: 削除確認モーダルを開く
  }, [])

  const handleRowClick = useCallback((user: UserDetail) => {
    console.log('行クリック:', user)
    // 詳細ページに遷移
    router.push(`/users/${user.id}`)
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
      router.replace('/users', { scroll: false }) // パラメータをクリア
    }
  }, [urlSearchParams, refetch, router])

  // デバッグ用：データをコンソールに出力（クライアントサイドでのみ）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Users data:', data)
    }
  }, [data])

  // 新しいコンポーネント用のハンドラー
  const handleCreateNew = useCallback(() => {
    router.push('/users/create')
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

  const [sortField, setSortField] = useState<keyof UserDetail | undefined>()
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  const handleSort = useCallback((field: keyof UserDetail) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField, sortDirection])

  const handleColumnFilterChange = useCallback((filters: Record<string, string>) => {
    setColumnFilters(filters)
  }, [])

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="w-full max-w-none px-4 py-6 space-y-6">
        {/* ヘッダー */}
        <UserListHeader
          totalCount={data?.totalCount || 0}
          onCreateNew={handleCreateNew}
          onImport={handleImport}
          onExport={handleExport}
        />

        {/* 検索・フィルター */}
        <UserSearchFilters
          searchValue={searchValue}
          filters={filters}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onClearFilters={() => setFilters({})}
        />

        {/* データテーブル */}
        <div className="w-full">
          <UserTable
            data={data?.users || []}
            isLoading={isLoading}
            error={error}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onView={handleRowClick}
            onRowClick={handleRowClick}
            onPageSizeChange={handlePageSizeChange}
            onPageChange={setCurrentPage}
            currentPage={currentPage}
            totalCount={data?.totalCount || 0}
            pageSize={pageSize}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            columnFilters={columnFilters}
            onColumnFilterChange={handleColumnFilterChange}
          />
        </div>
      </div>
    </div>
  )
}
