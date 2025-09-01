'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useEstimates } from '@/hooks/features/estimates/useEstimates'
import { Estimate, EstimateSearchParams, EstimatesResponse } from '@/types/features/estimates/estimate'
import { EstimateListHeader } from '@/components/features/estimates/EstimateList/EstimateListHeader'
import { EstimateSearchFilters } from '@/components/features/estimates/EstimateList/EstimateSearchFilters'
import { EstimateTable } from '@/components/features/estimates/EstimateList/EstimateTable'

export default function EstimatesPage() {
  const router = useRouter()
  
  // 状態管理
  const [searchParams, setSearchParams] = useState<EstimateSearchParams>({
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const [searchValue, setSearchValue] = useState('')
  const [filters, setFilters] = useState<Record<string, string | number | boolean | null | undefined>>({})

  // データ取得
  const { data, isLoading, error } = useEstimates({
    ...searchParams,
    search: searchValue || undefined,
    ...filters
  }) as { data: EstimatesResponse | undefined; isLoading: boolean; error: Error | null }

  // イベントハンドラー
  const handleEditEstimate = useCallback((estimate: Estimate) => {
    console.log('編集:', estimate)
    router.push(`/estimates/${estimate.id}?mode=edit`)
  }, [router])

  const handleDeleteEstimate = useCallback((estimate: Estimate) => {
    console.log('削除:', estimate)
    // TODO: 削除確認モーダルを開く
  }, [])

  const handleViewEstimate = useCallback((estimate: Estimate) => {
    console.log('詳細表示:', estimate)
    router.push(`/estimates/${estimate.id}`)
  }, [router])

  const handleRowClick = useCallback((estimate: Estimate) => {
    console.log('行クリック:', estimate)
    router.push(`/estimates/${estimate.id}`)
  }, [router])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    console.log('ページサイズ変更:', newPageSize)
    setSearchParams(prev => ({
      ...prev,
      per_page: newPageSize,
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

  const handleClearFilters = useCallback(() => {
    setFilters({})
    setSearchValue('')
  }, [])

  const handleCreateNew = useCallback(() => {
    router.push('/estimates/create')
  }, [router])

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="w-full max-w-none px-4 py-6 space-y-6">
        {/* ページヘッダー */}
        <EstimateListHeader
          totalCount={data?.meta?.total || 0}
          onCreateNew={handleCreateNew}
        />

        {/* 検索・フィルター */}
        <EstimateSearchFilters
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* データテーブル */}
        <div className="w-full">
          <EstimateTable
            data={data?.data || []}
            isLoading={isLoading}
            error={error}
            onEdit={handleEditEstimate}
            onDelete={handleDeleteEstimate}
            onView={handleViewEstimate}
            onRowClick={handleRowClick}
            // ページネーション
            currentPage={searchParams.page}
            totalCount={data?.meta?.total || 0}
            pageSize={searchParams.per_page}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  )
}
