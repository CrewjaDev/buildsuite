'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useEstimates } from '@/hooks/features/estimates/useEstimates'
import { Estimate, EstimateSearchParams, EstimatesResponse, EstimateStatus } from '@/types/features/estimates/estimate'
import { EstimateListHeader } from '@/components/features/estimates/EstimateList/EstimateListHeader'
import { EstimateSearchFilters } from '@/components/features/estimates/EstimateList/EstimateSearchFilters'
import { EstimateStatusTabs } from '@/components/features/estimates/EstimateList/EstimateStatusTabs'
import { EstimateTable } from '@/components/features/estimates/EstimateList/EstimateTable'
import { EstimateCreateDialog } from '@/components/features/estimates/EstimateCreate/EstimateCreateDialog'

export default function EstimatesPage() {
  const router = useRouter()
  
  // 状態管理
  const [activeTab, setActiveTab] = useState<EstimateStatus | 'all'>('all')
  const [searchParams, setSearchParams] = useState<EstimateSearchParams>({
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const [searchValue, setSearchValue] = useState('')
  const [filters, setFilters] = useState<Record<string, string | number | boolean | null | undefined>>({})
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // 全データ取得（カウンタ計算用）
  const { data: allData } = useEstimates({
    ...searchParams,
    search: searchValue || undefined,
    per_page: 1000, // 全データを取得するため大きな値を設定
    ...filters
  }) as { data: EstimatesResponse | undefined; isLoading: boolean; error: Error | null }

  // 表示用データ取得（アクティブタブでフィルタリング）
  const { data, isLoading, error } = useEstimates({
    ...searchParams,
    search: searchValue || undefined,
    status: activeTab === 'all' ? undefined : activeTab,
    ...filters
  }) as { data: EstimatesResponse | undefined; isLoading: boolean; error: Error | null }


  // 各ステータスの件数を計算（検索条件・フィルター適用後）
  const calculateStatusCounts = useCallback(() => {
    if (!allData?.data) {
      return {
        all: 0,
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        expired: 0
      }
    }

    const counts = {
      all: allData.data.length,
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      expired: 0
    }

    allData.data.forEach(estimate => {
      switch (estimate.status) {
        case 'draft':
          counts.draft++
          break
        case 'submitted':
          counts.submitted++
          break
        case 'approved':
          counts.approved++
          break
        case 'rejected':
          counts.rejected++
          break
        case 'expired':
          counts.expired++
          break
      }
    })

    return counts
  }, [allData?.data])

  const statusCounts = calculateStatusCounts()

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
    setIsCreateDialogOpen(true)
  }, [])

  const handleCreateDialogClose = useCallback(() => {
    setIsCreateDialogOpen(false)
  }, [])

  const handleCreateSuccess = useCallback((estimateId: string) => {
    setIsCreateDialogOpen(false)
    router.push(`/estimates/${estimateId}`)
  }, [router])

  const handleTabChange = useCallback((tab: EstimateStatus | 'all') => {
    setActiveTab(tab)
    setSearchParams(prev => ({
      ...prev,
      page: 1 // タブ切り替え時は1ページ目に戻る
    }))
  }, [])

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
          activeTab={activeTab}
        />

        {/* ステータス別タブ */}
        <EstimateStatusTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={statusCounts}
          showOnlyMine={filters.show_only_mine === true}
          onShowOnlyMineChange={(checked: boolean) => {
            const newFilters = { ...filters }
            if (checked) {
              newFilters.show_only_mine = true
            } else {
              delete newFilters.show_only_mine
            }
            handleFilterChange(newFilters)
          }}
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

      {/* 新規作成ダイアログ */}
      <EstimateCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={handleCreateDialogClose}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
