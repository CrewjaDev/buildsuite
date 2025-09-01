'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Estimate } from '@/types/features/estimates/estimate'
import { 
  getEstimateStatusLabel, 
  getEstimateStatusColor, 
  formatCurrency, 
  formatDate 
} from '@/lib/utils/estimateUtils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Edit, Trash2, Eye, Search } from 'lucide-react'

// カスタム列幅調整コンポーネント
const CustomColumnResizer = ({ currentWidth, onResize }: { 
  currentWidth: number; 
  onResize: (newWidth: number) => void 
}) => {
  const [isResizing, setIsResizing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    setStartX(e.clientX)
    setStartWidth(currentWidth)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const deltaX = e.clientX - startX
      const newWidth = startWidth + deltaX
      onResize(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, startX, startWidth, onResize])

  return (
    <div
      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize ${isResizing ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'}`}
      onMouseDown={handleMouseDown}
      style={{ 
        transform: 'translateX(50%)',
        zIndex: 10
      }}
    />
  )
}

interface EstimateTableProps {
  data: Estimate[]
  isLoading: boolean
  error: Error | null
  onEdit: (estimate: Estimate) => void
  onDelete: (estimate: Estimate) => void
  onView: (estimate: Estimate) => void
  onRowClick: (estimate: Estimate) => void
  // ソート関連
  sortField?: keyof Estimate | null
  sortDirection?: 'asc' | 'desc'
  onSort?: (field: keyof Estimate) => void
  // フィルター関連
  columnFilters?: Record<string, string>
  onColumnFilterChange?: (columnId: string, value: string) => void
  // ページネーション
  currentPage?: number
  totalCount?: number
  pageSize?: number
  onPageChange?: (page: number) => void
}



export function EstimateTable({
  data,
  isLoading,
  error,
  onEdit,
  onDelete,
  onView,
  onRowClick,
  sortField,
  sortDirection,
  onSort,
  columnFilters = {},
  onColumnFilterChange,
  currentPage,
  totalCount,
  pageSize,
  onPageChange
}: EstimateTableProps) {
  // 列幅の状態管理
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})

  // 初期列幅設定
  const initialColumnWidths = useMemo(() => ({
    'estimate_number': 150,  // 見積番号
    'partner_name': 200,     // 受注先
    'project_name': 600,    // 工事名称
    'total_amount': 150,     // 見積総額
    'created_by_name': 150,  // 担当者
    'status': 120,           // 状態
    'actions': 120,          // 操作
  }), [])

  // 現在の列幅を取得
  const getCurrentColumnWidths = useCallback(() => {
    return Object.keys(initialColumnWidths).reduce((acc, key) => {
      const columnKey = key as keyof typeof initialColumnWidths
      acc[key] = columnWidths[key] || initialColumnWidths[columnKey]
      return acc
    }, {} as Record<string, number>)
  }, [columnWidths, initialColumnWidths])

  const currentColumnWidths = useMemo(() => getCurrentColumnWidths(), [getCurrentColumnWidths])

  // テーブル全体の幅を計算
  const totalTableWidth = useMemo(() => {
    return Object.values(currentColumnWidths).reduce((sum: number, width: number) => sum + width, 0)
  }, [currentColumnWidths])

  // 列幅が変更されたときにテーブル全体の幅を更新
  useEffect(() => {
    // 列幅の変更を監視してテーブル全体の幅を再計算
  }, [columnWidths])

  // 列幅変更ハンドラー
  const handleColumnResize = useCallback((columnId: string, newWidth: number) => {
    const minWidth = 80 // 最小幅
    const maxWidth = 800 // 最大幅
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    
    setColumnWidths(prev => ({
      ...prev,
      [columnId]: clampedWidth
    }))
  }, [])

  // ソートアイコンを取得する関数
  const getSortIcon = (field: keyof Estimate) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>
    }
    return sortDirection === 'asc' 
      ? <span className="text-gray-700">↑</span>
      : <span className="text-gray-700">↓</span>
  }

  // フィルターハンドラー
  const handleColumnFilterChange = (columnId: string, value: string) => {
    if (onColumnFilterChange) {
      onColumnFilterChange(columnId, value)
    }
  }

  // ソートハンドラー
  const handleSort = (field: keyof Estimate) => {
    if (onSort) {
      onSort(field)
    }
  }

  // ページネーション計算
  const totalPages = Math.ceil((totalCount || 0) / (pageSize || 20))
  const startIndex = ((currentPage || 1) - 1) * (pageSize || 20) + 1
  const endIndex = Math.min((currentPage || 1) * (pageSize || 20), totalCount || 0)

  if (isLoading) {
        return (
      <div className="w-full bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
          </div>
        )
  }

  if (error) {
        return (
      <div className="w-full bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-600 mb-2">エラーが発生しました</p>
            <p className="text-gray-600 text-sm">{error.message}</p>
          </div>
        </div>
          </div>
        )
  }

        return (
    <div className="w-full bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* 2段分割ヘッダー */}
      <div 
        className="overflow-x-auto"
        style={{
          width: '100%',
          minWidth: `${totalTableWidth}px`
        }}
      >
        <table 
          style={{ 
            width: `${totalTableWidth}px`,
            minWidth: `${totalTableWidth}px`
          }}
        >
          <thead>
            {/* 1段目ヘッダー */}
            <tr className="bg-gray-50 border-b">
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r relative"
                style={{ 
                  width: `${currentColumnWidths['estimate_number']}px`,
                  minWidth: `${currentColumnWidths['estimate_number']}px`,
                  maxWidth: `${currentColumnWidths['estimate_number']}px`
                }}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-1 cursor-pointer select-none hover:bg-gray-100 p-0.5 rounded flex-1"
                    onClick={() => handleSort('estimate_number')}
                  >
                    <span className="font-semibold text-gray-900">見積番号</span>
                    {getSortIcon('estimate_number')}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-5 w-5 p-0 ${columnFilters['estimate_number'] ? 'text-blue-600' : 'text-gray-400'}`}
                        >
                          <Search className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="center" side="bottom">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">フィルター</div>
                          <Input
                            placeholder="見積番号で検索..."
                            value={columnFilters['estimate_number'] || ''}
                            onChange={(event) => handleColumnFilterChange('estimate_number', event.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <CustomColumnResizer 
                  currentWidth={currentColumnWidths['estimate_number']}
                  onResize={(newWidth) => handleColumnResize('estimate_number', newWidth)}
                />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r relative"
                rowSpan={2}
                style={{ 
                  width: `${currentColumnWidths['partner_name']}px`,
                  minWidth: `${currentColumnWidths['partner_name']}px`,
                  maxWidth: `${currentColumnWidths['partner_name']}px`
                }}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-1 cursor-pointer select-none hover:bg-gray-100 p-0.5 rounded flex-1"
                    onClick={() => handleSort('partner_name')}
                  >
                    <span className="font-semibold text-gray-900">受注先</span>
                    {getSortIcon('partner_name')}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-5 w-5 p-0 ${columnFilters['partner_name'] ? 'text-blue-600' : 'text-gray-400'}`}
                        >
                          <Search className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="center" side="bottom">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">フィルター</div>
                          <Input
                            placeholder="受注先で検索..."
                            value={columnFilters['partner_name'] || ''}
                            onChange={(event) => handleColumnFilterChange('partner_name', event.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <CustomColumnResizer 
                  currentWidth={currentColumnWidths['partner_name']}
                  onResize={(newWidth) => handleColumnResize('partner_name', newWidth)}
                />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r relative"
                style={{ 
                  width: `${currentColumnWidths['project_name']}px`,
                  minWidth: `${currentColumnWidths['project_name']}px`,
                  maxWidth: `${currentColumnWidths['project_name']}px`
                }}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-1 cursor-pointer select-none hover:bg-gray-100 p-0.5 rounded flex-1"
                    onClick={() => handleSort('project_name')}
                  >
                    <span className="font-semibold text-gray-900">工事名称</span>
                    {getSortIcon('project_name')}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-5 w-5 p-0 ${columnFilters['project_name'] ? 'text-blue-600' : 'text-gray-400'}`}
                        >
                          <Search className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="center" side="bottom">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">フィルター</div>
                          <Input
                            placeholder="工事名称で検索..."
                            value={columnFilters['project_name'] || ''}
                            onChange={(event) => handleColumnFilterChange('project_name', event.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <CustomColumnResizer 
                  currentWidth={currentColumnWidths['project_name']}
                  onResize={(newWidth) => handleColumnResize('project_name', newWidth)}
                />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r relative"
                rowSpan={2}
                style={{ 
                  width: `${currentColumnWidths['total_amount']}px`,
                  minWidth: `${currentColumnWidths['total_amount']}px`,
                  maxWidth: `${currentColumnWidths['total_amount']}px`
                }}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-1 cursor-pointer select-none hover:bg-gray-100 p-0.5 rounded flex-1"
                    onClick={() => handleSort('total_amount')}
                  >
                    <span className="font-semibold text-gray-900">見積総額</span>
                    {getSortIcon('total_amount')}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-5 w-5 p-0 ${columnFilters['total_amount'] ? 'text-blue-600' : 'text-gray-400'}`}
                        >
                          <Search className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="center" side="bottom">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">フィルター</div>
                          <Input
                            placeholder="見積総額で検索..."
                            value={columnFilters['total_amount'] || ''}
                            onChange={(event) => handleColumnFilterChange('total_amount', event.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <CustomColumnResizer 
                  currentWidth={currentColumnWidths['total_amount']}
                  onResize={(newWidth) => handleColumnResize('total_amount', newWidth)}
                />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r relative"
                rowSpan={2}
                style={{ 
                  width: `${currentColumnWidths['created_by_name']}px`,
                  minWidth: `${currentColumnWidths['created_by_name']}px`,
                  maxWidth: `${currentColumnWidths['created_by_name']}px`
                }}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-1 cursor-pointer select-none hover:bg-gray-100 p-0.5 rounded flex-1"
                    onClick={() => handleSort('created_by_name')}
                  >
                    <span className="font-semibold text-gray-900">担当者</span>
                    {getSortIcon('created_by_name')}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-5 w-5 p-0 ${columnFilters['created_by_name'] ? 'text-blue-600' : 'text-gray-400'}`}
                        >
                          <Search className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="center" side="bottom">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">フィルター</div>
                          <Input
                            placeholder="担当者で検索..."
                            value={columnFilters['created_by_name'] || ''}
                            onChange={(event) => handleColumnFilterChange('created_by_name', event.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <CustomColumnResizer 
                  currentWidth={currentColumnWidths['created_by_name']}
                  onResize={(newWidth) => handleColumnResize('created_by_name', newWidth)}
                />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r relative"
                rowSpan={2}
                style={{ 
                  width: `${currentColumnWidths['status']}px`,
                  minWidth: `${currentColumnWidths['status']}px`,
                  maxWidth: `${currentColumnWidths['status']}px`
                }}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-1 cursor-pointer select-none hover:bg-gray-100 p-0.5 rounded flex-1"
                    onClick={() => handleSort('status')}
                  >
                    <span className="font-semibold text-gray-900">状態</span>
                    {getSortIcon('status')}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-5 w-5 p-0 ${columnFilters['status'] ? 'text-blue-600' : 'text-gray-400'}`}
                        >
                          <Search className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="center" side="bottom">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">フィルター</div>
                          <Input
                            placeholder="状態で検索..."
                            value={columnFilters['status'] || ''}
                            onChange={(event) => handleColumnFilterChange('status', event.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <CustomColumnResizer 
                  currentWidth={currentColumnWidths['status']}
                  onResize={(newWidth) => handleColumnResize('status', newWidth)}
                />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                rowSpan={2}
              >
                <span className="font-semibold text-gray-900">操作</span>
              </th>
            </tr>
            {/* 2段目ヘッダー */}
            <tr className="bg-gray-50 border-b">
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-1 cursor-pointer select-none hover:bg-gray-100 p-0.5 rounded flex-1"
                    onClick={() => handleSort('estimate_date')}
                  >
                    <span className="font-semibold text-gray-900">見積日</span>
                    {getSortIcon('estimate_date')}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-5 w-5 p-0 ${columnFilters['estimate_date'] ? 'text-blue-600' : 'text-gray-400'}`}
                        >
                          <Search className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="center" side="bottom">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">フィルター</div>
                          <Input
                            placeholder="見積日で検索..."
                            value={columnFilters['estimate_date'] || ''}
                            onChange={(event) => handleColumnFilterChange('estimate_date', event.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </th>
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-1 cursor-pointer select-none hover:bg-gray-100 p-0.5 rounded flex-1"
                    onClick={() => handleSort('project_description')}
                  >
                    <span className="font-semibold text-gray-900">工事場所</span>
                    {getSortIcon('project_description')}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-5 w-5 p-0 ${columnFilters['project_description'] ? 'text-blue-600' : 'text-gray-400'}`}
                        >
                          <Search className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="center" side="bottom">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">フィルター</div>
                          <Input
                            placeholder="工事場所で検索..."
                            value={columnFilters['project_description'] || ''}
                            onChange={(event) => handleColumnFilterChange('project_description', event.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((estimate) => (
              <tr 
                key={estimate.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onRowClick(estimate)}
              >
                                {/* 見積番号 / 見積日（2段表示） */}
                <td 
                  className="px-4 py-3 border-r"
                  style={{ 
                    width: `${currentColumnWidths['estimate_number']}px`,
                    minWidth: `${currentColumnWidths['estimate_number']}px`,
                    maxWidth: `${currentColumnWidths['estimate_number']}px`
                  }}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {estimate.estimate_number || '-'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {estimate.estimate_date ? formatDate(estimate.estimate_date) : '-'}
                    </div>
                  </div>
                </td>

                {/* 受注先（1段表示） */}
                <td 
                  className="px-4 py-3 border-r"
                  style={{ 
                    width: `${currentColumnWidths['partner_name']}px`,
                    minWidth: `${currentColumnWidths['partner_name']}px`,
                    maxWidth: `${currentColumnWidths['partner_name']}px`
                  }}
                >
                  <div className="text-sm text-gray-900 min-w-0 truncate">
                    {estimate.partner_name || '-'}
                  </div>
                </td>

                {/* 工事名称 / 工事場所（2段表示） */}
                <td 
                  className="px-4 py-3 border-r"
                  style={{ 
                    width: `${currentColumnWidths['project_name']}px`,
                    minWidth: `${currentColumnWidths['project_name']}px`,
                    maxWidth: `${currentColumnWidths['project_name']}px`
                  }}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm text-gray-900 truncate">
                      {estimate.project_name || '-'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {estimate.project_description || '-'}
                    </div>
                  </div>
                </td>

                {/* 見積総額（1段表示） */}
                <td 
                  className="px-4 py-3 border-r"
                  style={{ 
                    width: `${currentColumnWidths['total_amount']}px`,
                    minWidth: `${currentColumnWidths['total_amount']}px`,
                    maxWidth: `${currentColumnWidths['total_amount']}px`
                  }}
                >
                  <div className="text-sm font-medium text-gray-900 min-w-0 truncate">
                    {estimate.total_amount ? formatCurrency(estimate.total_amount) : '-'}
                  </div>
                </td>

                {/* 担当者（1段表示） */}
                <td 
                  className="px-4 py-3 border-r"
                  style={{ 
                    width: `${currentColumnWidths['created_by_name']}px`,
                    minWidth: `${currentColumnWidths['created_by_name']}px`,
                    maxWidth: `${currentColumnWidths['created_by_name']}px`
                  }}
                >
                  <div className="text-sm text-gray-900 min-w-0 truncate">
                    {estimate.created_by_name || '-'}
                  </div>
                </td>

                {/* 状態（1段表示） */}
                <td 
                  className="px-4 py-3 border-r"
                  style={{ 
                    width: `${currentColumnWidths['status']}px`,
                    minWidth: `${currentColumnWidths['status']}px`,
                    maxWidth: `${currentColumnWidths['status']}px`
                  }}
                >
                  <div className="min-w-0">
                    <Badge className={getEstimateStatusColor(estimate.status)}>
                      {getEstimateStatusLabel(estimate.status)}
                    </Badge>
                  </div>
                </td>

                {/* 操作（1段表示） */}
                <td 
                  className="px-4 py-3"
                  style={{ 
                    width: `${currentColumnWidths['actions']}px`,
                    minWidth: `${currentColumnWidths['actions']}px`,
                    maxWidth: `${currentColumnWidths['actions']}px`
                  }}
                >
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onView(estimate)
              }}
              className="h-8 w-8 p-0"
              title="詳細表示"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(estimate)
              }}
              className="h-8 w-8 p-0"
              title="編集"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(estimate)
              }}
              className="h-8 w-8 p-0"
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* データが空の場合 */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">見積データが見つかりません</p>
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {startIndex} - {endIndex} / {totalCount} 件
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(Math.max(1, (currentPage || 1) - 1))}
                disabled={currentPage === 1}
              >
                前へ
              </Button>
              <span className="text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(Math.min(totalPages, (currentPage || 1) + 1))}
                disabled={currentPage === totalPages}
              >
                次へ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
