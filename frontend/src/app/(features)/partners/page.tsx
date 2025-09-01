'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePartners } from '@/hooks/features/partners/usePartners'
import { Partner, PartnerSearchParams, PartnersResponse } from '@/types/features/partners/partner'
import { PartnerListHeader } from '@/components/features/partners/PartnerList/PartnerListHeader'
import { PartnerSearchFilters } from '@/components/features/partners/PartnerList/PartnerSearchFilters'
import { PartnerTable } from '@/components/features/partners/PartnerList/PartnerTable'

export default function PartnersPage() {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  
  // 状態管理
  const [searchParams, setSearchParams] = useState<PartnerSearchParams>({
    page: 1,
    pageSize: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const [searchValue, setSearchValue] = useState('')
  const [filters, setFilters] = useState<Record<string, string | number | boolean | null | undefined>>({})
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  // データ取得
  const { data, isLoading, error, refetch } = usePartners({
    ...searchParams,
    search: searchValue || undefined,
    ...filters
  }) as { data: PartnersResponse | undefined; isLoading: boolean; error: Error | null; refetch: () => void }

  // イベントハンドラー
  const handleEditPartner = useCallback((partner: Partner) => {
    console.log('編集:', partner)
    router.push(`/partners/${partner.id}?mode=edit`)
  }, [router])

  const handleDeletePartner = useCallback((partner: Partner) => {
    console.log('削除:', partner)
    // TODO: 削除確認モーダルを開く
  }, [])

  const handleViewPartner = useCallback((partner: Partner) => {
    console.log('詳細表示:', partner)
    router.push(`/partners/${partner.id}`)
  }, [router])

  const handleRowClick = useCallback((partner: Partner) => {
    console.log('行クリック:', partner)
    router.push(`/partners/${partner.id}`)
  }, [router])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    console.log('ページサイズ変更:', newPageSize)
    setSearchParams(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1
    }))
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    console.log('検索変更:', value)
    setSearchValue(value)
    setSearchParams(prev => ({
      ...prev,
      page: 1
    }))
  }, [])

  const handleFilterChange = useCallback((newFilters: Record<string, string | number | boolean | null | undefined>) => {
    console.log('フィルター変更:', newFilters)
    setFilters(newFilters)
    setSearchParams(prev => ({
      ...prev,
      page: 1
    }))
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setSearchParams(prev => ({
      ...prev,
      page: newPage
    }))
  }, [])

  // ソート機能
  const handleSort = useCallback((field: keyof Partner) => {
    setSearchParams(prev => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1
    }))
  }, [])

  // 列フィルター機能
  const handleColumnFilterChange = useCallback((columnId: string, value: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev }
      if (value === '') {
        delete newFilters[columnId]
      } else {
        newFilters[columnId] = value
      }
      return newFilters
    })
    setSearchParams(prev => ({
      ...prev,
      page: 1
    }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({})
    setSearchValue('')
  }, [])

  const handleCreateNew = useCallback(() => {
    router.push('/partners/create')
  }, [router])

  // ページがフォーカスされた時、可視性が変更された時にデータを再取得
  useEffect(() => {
    const handleFocus = () => {
      refetch()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch()
      }
    }

    // ナビゲーション完了時にもデータを再取得
    const handleRouteChange = () => {
      refetch()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('popstate', handleRouteChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [refetch])

  // refreshパラメータを監視してデータを強制的に再取得
  useEffect(() => {
    if (urlSearchParams.get('refresh') === 'true') {
      refetch()
      // パラメータをクリア
      router.replace('/partners', { scroll: false })
    }
  }, [urlSearchParams, refetch, router])

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="w-full max-w-none px-4 py-6 space-y-6">
        {/* ページヘッダー */}
        <PartnerListHeader
          totalCount={data?.totalCount || 0}
          onCreateNew={handleCreateNew}
        />

        {/* 検索・フィルター */}
        <PartnerSearchFilters
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* 取引先テーブル */}
        <PartnerTable
          data={data?.partners || []}
          isLoading={isLoading}
          error={error}
          onEdit={handleEditPartner}
          onDelete={handleDeletePartner}
          onView={handleViewPartner}
          onRowClick={handleRowClick}
          onPageSizeChange={handlePageSizeChange}
          onPageChange={handlePageChange}
          // ソート機能
          sortField={searchParams.sort_by as keyof Partner}
          sortDirection={searchParams.sort_order}
          onSort={handleSort}
          // 列フィルター機能
          columnFilters={columnFilters}
          onColumnFilterChange={handleColumnFilterChange}
        />
      </div>
    </div>
  )
}
