'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Partner } from '@/types/features/partners/partner'
import { getPartnerTypeLabel, getStatusLabel } from '@/types/features/partners/partner'
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

interface PartnerTableProps {
  data: Partner[]
  isLoading: boolean
  error: Error | null
  onEdit: (partner: Partner) => void
  onDelete: (partner: Partner) => void
  onView: (partner: Partner) => void
  onRowClick: (partner: Partner) => void
  // ソート関連
  sortField?: keyof Partner | null
  sortDirection?: 'asc' | 'desc'
  onSort?: (field: keyof Partner) => void
  // フィルター関連
  columnFilters?: Record<string, string>
  onColumnFilterChange?: (columnId: string, value: string) => void
  // ページネーション
  currentPage?: number
  totalCount?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function PartnerTable({
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
  currentPage = 1,
  totalCount = 0,
  pageSize = 20,
  onPageChange,
  onPageSizeChange
}: PartnerTableProps) {
  // 列幅管理
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    partner_code: 150,
    partner_name: 250,
    partner_type: 120,
    phone: 150,
    email: 200,
    is_active: 100,
    actions: 120,
  })

  // 初期列幅
  const initialColumnWidths = useMemo(() => ({
    partner_code: 150,
    partner_name: 250,
    partner_type: 120,
    phone: 150,
    email: 200,
    is_active: 100,
    actions: 120,
  }), [])

  // 列幅変更ハンドラー
  const handleColumnResize = useCallback((columnKey: string, newWidth: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: Math.max(60, Math.min(800, newWidth))
    }))
  }, [])

  // 現在の列幅を計算
  const currentColumnWidths = useMemo(() => {
    return Object.keys(initialColumnWidths).reduce((acc, key) => {
      const columnKey = key as keyof typeof initialColumnWidths
      acc[key] = columnWidths[key] || initialColumnWidths[columnKey]
      return acc
    }, {} as Record<string, number>)
  }, [columnWidths, initialColumnWidths])

  // テーブル全体の幅を計算
  const totalTableWidth = useMemo(() => {
    return Object.values(currentColumnWidths).reduce((sum, width) => sum + width, 0)
  }, [currentColumnWidths])

  // ソートアイコン取得
  const getSortIcon = (field: keyof Partner) => {
    if (sortField !== field) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  // ソートハンドラー
  const handleSort = (field: keyof Partner) => {
    if (onSort) {
      onSort(field)
    }
  }

  // フィルターハンドラー
  const handleColumnFilter = (columnId: string, value: string) => {
    if (onColumnFilterChange) {
      onColumnFilterChange(columnId, value)
    }
  }

  // ページネーションハンドラー
  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize)
    }
  }

  // ローディング状態
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm p-8">
        <div className="text-center text-red-600">
          <p>エラーが発生しました: {error.message}</p>
        </div>
      </div>
    )
  }

  // データが空の場合
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm p-8">
        <div className="text-center text-gray-600">
          <p>取引先データが見つかりません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
      {/* テーブル */}
      <div className="overflow-x-auto" style={{ minWidth: totalTableWidth }}>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th 
                className="relative p-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                style={{ 
                  width: currentColumnWidths.partner_code,
                  minWidth: 60,
                  maxWidth: 800
                }}
                onClick={() => handleSort('partner_code')}
              >
                <div className="flex items-center space-x-2">
                  <span>取引先コード</span>
                  <span className="text-gray-400">{getSortIcon('partner_code')}</span>
                  {/* 列フィルター */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-5 w-5 p-0 hover:bg-gray-200 ${
                          columnFilters.partner_code ? 'text-blue-600' : 'text-gray-400'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <Input
                        placeholder="検索..."
                        value={columnFilters.partner_code || ''}
                        onChange={(e) => handleColumnFilter('partner_code', e.target.value)}
                        className="mb-2"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <CustomColumnResizer
                  currentWidth={currentColumnWidths.partner_code}
                  onResize={(width) => handleColumnResize('partner_code', width)}
                />
              </th>
              <th 
                className="relative p-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                style={{ 
                  width: currentColumnWidths.partner_name,
                  minWidth: 60,
                  maxWidth: 800
                }}
                onClick={() => handleSort('partner_name')}
              >
                <div className="flex items-center space-x-2">
                  <span>取引先名</span>
                  <span className="text-gray-400">{getSortIcon('partner_name')}</span>
                  {/* 列フィルター */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-5 w-5 p-0 hover:bg-gray-200 ${
                          columnFilters.partner_name ? 'text-blue-600' : 'text-gray-400'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <Input
                        placeholder="検索..."
                        value={columnFilters.partner_name || ''}
                        onChange={(e) => handleColumnFilter('partner_name', e.target.value)}
                        className="mb-2"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <CustomColumnResizer
                  currentWidth={currentColumnWidths.partner_name}
                  onResize={(width) => handleColumnResize('partner_name', width)}
                />
              </th>
              <th 
                className="relative p-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                style={{ 
                  width: currentColumnWidths.partner_type,
                  minWidth: 60,
                  maxWidth: 800
                }}
                onClick={() => handleSort('partner_type')}
              >
                <div className="flex items-center space-x-2">
                  <span>取引先区分</span>
                  <span className="text-gray-400">{getSortIcon('partner_type')}</span>
                  {/* 列フィルター */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-5 w-5 p-0 hover:bg-gray-200 ${
                          columnFilters.partner_type ? 'text-blue-600' : 'text-gray-400'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <Input
                        placeholder="検索..."
                        value={columnFilters.partner_type || ''}
                        onChange={(e) => handleColumnFilter('partner_type', e.target.value)}
                        className="mb-2"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <CustomColumnResizer
                  currentWidth={currentColumnWidths.partner_type}
                  onResize={(width) => handleColumnResize('partner_type', width)}
                />
              </th>
              <th 
                className="relative p-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                style={{ 
                  width: currentColumnWidths.phone,
                  minWidth: 60,
                  maxWidth: 800
                }}
                onClick={() => handleSort('phone')}
              >
                <div className="flex items-center space-x-2">
                  <span>電話番号</span>
                  <span className="text-gray-400">{getSortIcon('phone')}</span>
                  {/* 列フィルター */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-5 w-5 p-0 hover:bg-gray-200 ${
                          columnFilters.phone ? 'text-blue-600' : 'text-gray-400'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <Input
                        placeholder="検索..."
                        value={columnFilters.phone || ''}
                        onChange={(e) => handleColumnFilter('phone', e.target.value)}
                        className="mb-2"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <CustomColumnResizer
                  currentWidth={currentColumnWidths.phone}
                  onResize={(width) => handleColumnResize('phone', width)}
                />
              </th>
              <th 
                className="relative p-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                style={{ 
                  width: currentColumnWidths.email,
                  minWidth: 60,
                  maxWidth: 800
                }}
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center space-x-2">
                  <span>メールアドレス</span>
                  <span className="text-gray-400">{getSortIcon('email')}</span>
                  {/* 列フィルター */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-5 w-5 p-0 hover:bg-gray-200 ${
                          columnFilters.email ? 'text-blue-600' : 'text-gray-400'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <Input
                        placeholder="検索..."
                        value={columnFilters.email || ''}
                        onChange={(e) => handleColumnFilter('email', e.target.value)}
                        className="mb-2"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <CustomColumnResizer
                  currentWidth={currentColumnWidths.email}
                  onResize={(width) => handleColumnResize('email', width)}
                />
              </th>
              <th 
                className="relative p-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                style={{ 
                  width: currentColumnWidths.is_active,
                  minWidth: 60,
                  maxWidth: 800
                }}
                onClick={() => handleSort('is_active')}
              >
                <div className="flex items-center space-x-2">
                  <span>状態</span>
                  <span className="text-gray-400">{getSortIcon('is_active')}</span>
                  {/* 列フィルター */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-5 w-5 p-0 hover:bg-gray-200 ${
                          columnFilters.is_active ? 'text-blue-600' : 'text-gray-400'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <Input
                        placeholder="検索..."
                        value={columnFilters.is_active || ''}
                        onChange={(e) => handleColumnFilter('is_active', e.target.value)}
                        className="mb-2"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <CustomColumnResizer
                  currentWidth={currentColumnWidths.is_active}
                  onResize={(width) => handleColumnResize('is_active', width)}
                />
              </th>
              <th 
                className="relative p-3 text-left font-medium text-gray-900"
                style={{ 
                  width: currentColumnWidths.actions,
                  minWidth: 60,
                  maxWidth: 800
                }}
              >
                <span>操作</span>
                <CustomColumnResizer
                  currentWidth={currentColumnWidths.actions}
                  onResize={(width) => handleColumnResize('actions', width)}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((partner) => (
              <tr
                key={partner.id}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => onRowClick(partner)}
              >
                <td 
                  className="p-3 text-sm text-gray-900 min-w-0 truncate"
                  style={{ 
                    width: currentColumnWidths.partner_code,
                    minWidth: 60,
                    maxWidth: 800
                  }}
                >
                  {partner.partner_code}
                </td>
                <td 
                  className="p-3 text-sm text-gray-900 min-w-0 truncate"
                  style={{ 
                    width: currentColumnWidths.partner_name,
                    minWidth: 60,
                    maxWidth: 800
                  }}
                >
                  <div className="space-y-1">
                    <div className="font-medium">{partner.partner_name}</div>
                    {partner.partner_name_kana && (
                      <div className="text-xs text-gray-500">{partner.partner_name_kana}</div>
                    )}
                  </div>
                </td>
                <td 
                  className="p-3 text-sm text-gray-900 min-w-0 truncate"
                  style={{ 
                    width: currentColumnWidths.partner_type,
                    minWidth: 60,
                    maxWidth: 800
                  }}
                >
                  <Badge variant="outline">
                    {getPartnerTypeLabel(partner.partner_type)}
                  </Badge>
                </td>
                <td 
                  className="p-3 text-sm text-gray-900 min-w-0 truncate"
                  style={{ 
                    width: currentColumnWidths.phone,
                    minWidth: 60,
                    maxWidth: 800
                  }}
                >
                  {partner.phone || '-'}
                </td>
                <td 
                  className="p-3 text-sm text-gray-900 min-w-0 truncate"
                  style={{ 
                    width: currentColumnWidths.email,
                    minWidth: 60,
                    maxWidth: 800
                  }}
                >
                  {partner.email || '-'}
                </td>
                <td 
                  className="p-3 text-sm text-gray-900 min-w-0 truncate"
                  style={{ 
                    width: currentColumnWidths.is_active,
                    minWidth: 60,
                    maxWidth: 800
                  }}
                >
                  <Badge variant={partner.is_active ? 'default' : 'secondary'}>
                    {getStatusLabel(partner.status)}
                  </Badge>
                </td>
                <td 
                  className="p-3 text-sm text-gray-900 min-w-0 truncate"
                  style={{ 
                    width: currentColumnWidths.actions,
                    minWidth: 60,
                    maxWidth: 800
                  }}
                >
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(partner)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(partner)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(partner)}
                      className="h-8 w-8 p-0"
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

      {/* ページネーション */}
      {onPageChange && onPageSizeChange && (
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                表示件数:
              </span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} / {totalCount}件
              </span>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  前へ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage * pageSize >= totalCount}
                >
                  次へ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
