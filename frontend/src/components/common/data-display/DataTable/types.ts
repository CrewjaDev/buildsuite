import { ColumnDef } from '@tanstack/react-table'

// 汎用データテーブルのプロパティ型
export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  error?: Error | null
  enableSorting?: boolean
  enableColumnFilters?: boolean
  enableColumnResizing?: boolean
  enablePagination?: boolean
  enableSelection?: boolean
  onRowClick?: (row: T) => void
  onSelectionChange?: (selectedRows: T[]) => void
  className?: string
}

// 検索・フィルターのプロパティ型
export interface SearchFiltersProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: Record<string, string | number | boolean | null | undefined>
  onFilterChange?: (filters: Record<string, string | number | boolean | null | undefined>) => void
  placeholder?: string
  className?: string
}

// ページネーションのプロパティ型
export interface PaginationControlsProps {
  currentPage: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
}

// テーブルツールバーのプロパティ型
export interface TableToolbarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  selectedRows?: unknown[]
  onClearSelection?: () => void
  actions?: React.ReactNode
  className?: string
}

// 列幅調整のプロパティ型
export interface ColumnResizerProps {
  column: unknown
  className?: string
}
