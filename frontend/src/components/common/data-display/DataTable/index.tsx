'use client'

import { StickyHeaderTable } from './StickyHeaderTable'
import { SearchFilters } from './SearchFilters'
import { PaginationControls } from './PaginationControls'
import { DataTableProps } from './types'

interface DataTableWithControlsProps<T> extends DataTableProps<T> {
  // 検索・フィルター関連
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: Record<string, string | number | boolean | null | undefined>
  onFilterChange?: (filters: Record<string, string | number | boolean | null | undefined>) => void
  searchPlaceholder?: string
  filterOptions?: {
    key: string
    label: string
    options: { value: string; label: string }[]
  }[]
  
  // ページネーション関連
  currentPage?: number
  totalCount?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  
  // レイアウト関連
  showSearch?: boolean
  showPagination?: boolean
  className?: string
}

export const DataTable = <T,>({
  data,
  columns,
  isLoading = false,
  error = null,
  enableColumnResizing = true,
  enableSorting = true,
  enableColumnFilters = true,
  onRowClick,
  
  // 検索・フィルター関連
  searchValue = '',
  onSearchChange,
  filters = {},
  onFilterChange,
  searchPlaceholder = '検索...',
  filterOptions = [],
  
  // ページネーション関連
  currentPage = 1,
  totalCount = 0,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  
  // レイアウト関連
  showSearch = true,
  showPagination = true,
  className = ''
}: DataTableWithControlsProps<T>) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* 検索・フィルターエリア */}
      {showSearch && (onSearchChange || onFilterChange) && (
        <SearchFilters
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          filters={filters}
          onFilterChange={onFilterChange}
          placeholder={searchPlaceholder}
          filterOptions={filterOptions}
        />
      )}

      {/* テーブル */}
      <StickyHeaderTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        error={error}
        enableColumnResizing={enableColumnResizing}
        enableSorting={enableSorting}
        enableColumnFilters={enableColumnFilters}
        onRowClick={onRowClick}
      />

      {/* ページネーション */}
      {showPagination && onPageChange && (
        <PaginationControls
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
};

// 個別コンポーネントのエクスポート
export { StickyHeaderTable } from './StickyHeaderTable'
export { SearchFilters } from './SearchFilters'
export { PaginationControls } from './PaginationControls'
export { ColumnResizer } from './ColumnResizer'
export type { DataTableProps } from './types'
