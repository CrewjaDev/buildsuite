'use client'

import { useState, useCallback, useEffect } from 'react'
import { UserManagementUser } from '@/types/userManagement'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Edit, Trash2, Eye, Search } from 'lucide-react'

// カスタム列幅調整コンポーネント
interface CustomColumnResizerProps {
  currentWidth: number
  onResize: (newWidth: number) => void
}

function CustomColumnResizer({ currentWidth, onResize }: CustomColumnResizerProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    setStartX(e.clientX)
    setStartWidth(currentWidth)
  }, [currentWidth])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    const deltaX = e.clientX - startX
    const newWidth = Math.max(60, startWidth + deltaX)
    onResize(newWidth)
  }, [isResizing, startX, startWidth, onResize])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500"
      onMouseDown={handleMouseDown}
    />
  )
}

interface UserTableProps {
  data: UserManagementUser[]
  isLoading: boolean
  error: Error | null
  onEdit: (user: UserManagementUser) => void
  onDelete: (user: UserManagementUser) => void
  onView: (user: UserManagementUser) => void
  onRowClick: (user: UserManagementUser) => void
  onPageSizeChange: (pageSize: number) => void
  onPageChange: (page: number) => void
  currentPage?: number
  totalCount?: number
  pageSize?: number
  sortField?: keyof UserManagementUser
  sortDirection?: 'asc' | 'desc'
  onSort?: (field: keyof UserManagementUser) => void
  columnFilters?: Record<string, string>
  onColumnFilterChange?: (filters: Record<string, string>) => void
}

export function UserTable({
  data,
  isLoading,
  error,
  onEdit,
  onDelete,
  onView,
  onRowClick,
  onPageSizeChange,
  onPageChange,
  currentPage = 1,
  totalCount = 0,
  pageSize = 20,
  sortField,
  sortDirection,
  onSort,
  columnFilters = {},
  onColumnFilterChange
}: UserTableProps) {
  // 列幅管理
  const [columnWidths, setColumnWidths] = useState({
    employee_id: 120,
    name: 200,
    email: 250,
    department: 150,
    system_level: 120,
    is_active: 100,
    actions: 120
  })

  const handleColumnResize = useCallback((column: keyof typeof columnWidths, newWidth: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: newWidth
    }))
  }, [])

  const totalTableWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0)

  // ソートアイコン取得
  const getSortIcon = (field: keyof UserManagementUser) => {
    if (sortField !== field) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  // フィルターハンドラー
  const handleColumnFilter = useCallback((column: string, value: string) => {
    if (!onColumnFilterChange) return
    
    const newFilters = { ...columnFilters }
    if (value === '') {
      delete newFilters[column]
    } else {
      newFilters[column] = value
    }
    onColumnFilterChange(newFilters)
  }, [columnFilters, onColumnFilterChange])

  // ソートハンドラー
  const handleSort = useCallback((field: keyof UserManagementUser) => {
    if (onSort) {
      onSort(field)
    }
  }, [onSort])

  // ページネーションハンドラー
  const handlePageChange = useCallback((page: number) => {
    onPageChange(page)
  }, [onPageChange])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    onPageSizeChange(newPageSize)
  }, [onPageSizeChange])

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">データを読み込み中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm p-8">
        <div className="text-center text-red-600">
          <p>エラーが発生しました: {error.message}</p>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm p-8">
        <div className="text-center text-gray-500">
          <p>ユーザーデータがありません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto" style={{ minWidth: totalTableWidth }}>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th 
                className="relative p-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                style={{ width: columnWidths.employee_id, minWidth: 60, maxWidth: 800 }}
                onClick={() => handleSort('employee_id')}
              >
                <div className="flex items-center space-x-2">
                  <span>社員ID</span>
                  <span className="text-gray-400">{getSortIcon('employee_id')}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-5 w-5 p-0 hover:bg-gray-200 ${columnFilters.employee_id ? 'text-blue-600' : 'text-gray-400'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <Input 
                        placeholder="検索..." 
                        value={columnFilters.employee_id || ''} 
                        onChange={(e) => handleColumnFilter('employee_id', e.target.value)} 
                        className="mb-2" 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <CustomColumnResizer 
                  currentWidth={columnWidths.employee_id} 
                  onResize={(width) => handleColumnResize('employee_id', width)} 
                />
              </th>

              <th 
                className="relative p-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                style={{ width: columnWidths.name, minWidth: 60, maxWidth: 800 }}
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-2">
                  <span>社員名</span>
                  <span className="text-gray-400">{getSortIcon('name')}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-5 w-5 p-0 hover:bg-gray-200 ${columnFilters.name ? 'text-blue-600' : 'text-gray-400'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <Input 
                        placeholder="検索..." 
                        value={columnFilters.name || ''} 
                        onChange={(e) => handleColumnFilter('name', e.target.value)} 
                        className="mb-2" 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <CustomColumnResizer 
                  currentWidth={columnWidths.name} 
                  onResize={(width) => handleColumnResize('name', width)} 
                />
              </th>

              <th 
                className="relative p-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                style={{ width: columnWidths.email, minWidth: 60, maxWidth: 800 }}
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center space-x-2">
                  <span>メールアドレス</span>
                  <span className="text-gray-400">{getSortIcon('email')}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-5 w-5 p-0 hover:bg-gray-200 ${columnFilters.email ? 'text-blue-600' : 'text-gray-400'}`}
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
                  currentWidth={columnWidths.email} 
                  onResize={(width) => handleColumnResize('email', width)} 
                />
              </th>

              <th 
                className="relative p-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                style={{ width: columnWidths.department, minWidth: 60, maxWidth: 800 }}
                onClick={() => handleSort('primary_department')}
              >
                <div className="flex items-center space-x-2">
                  <span>所属部門</span>
                  <span className="text-gray-400">{getSortIcon('primary_department')}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-5 w-5 p-0 hover:bg-gray-200 ${columnFilters.department ? 'text-blue-600' : 'text-gray-400'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <Input 
                        placeholder="検索..." 
                        value={columnFilters.department || ''} 
                        onChange={(e) => handleColumnFilter('department', e.target.value)} 
                        className="mb-2" 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <CustomColumnResizer 
                  currentWidth={columnWidths.department} 
                  onResize={(width) => handleColumnResize('department', width)} 
                />
              </th>

              <th 
                className="relative p-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                style={{ width: columnWidths.system_level, minWidth: 60, maxWidth: 800 }}
                onClick={() => handleSort('system_level')}
              >
                <div className="flex items-center space-x-2">
                  <span>システム権限</span>
                  <span className="text-gray-400">{getSortIcon('system_level')}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-5 w-5 p-0 hover:bg-gray-200 ${columnFilters.system_level ? 'text-blue-600' : 'text-gray-400'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <Input 
                        placeholder="検索..." 
                        value={columnFilters.system_level || ''} 
                        onChange={(e) => handleColumnFilter('system_level', e.target.value)} 
                        className="mb-2" 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <CustomColumnResizer 
                  currentWidth={columnWidths.system_level} 
                  onResize={(width) => handleColumnResize('system_level', width)} 
                />
              </th>

              <th 
                className="relative p-3 text-left font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                style={{ width: columnWidths.is_active, minWidth: 60, maxWidth: 800 }}
                onClick={() => handleSort('is_active')}
              >
                <div className="flex items-center space-x-2">
                  <span>ステータス</span>
                  <span className="text-gray-400">{getSortIcon('is_active')}</span>
                </div>
                <CustomColumnResizer 
                  currentWidth={columnWidths.is_active} 
                  onResize={(width) => handleColumnResize('is_active', width)} 
                />
              </th>

              <th 
                className="relative p-3 text-left font-medium text-gray-900"
                style={{ width: columnWidths.actions, minWidth: 60, maxWidth: 800 }}
              >
                <span>アクション</span>
                <CustomColumnResizer 
                  currentWidth={columnWidths.actions} 
                  onResize={(width) => handleColumnResize('actions', width)} 
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick(user)}>
                <td className="p-3 text-sm text-gray-900 min-w-0 truncate" style={{ width: columnWidths.employee_id, minWidth: 60, maxWidth: 800 }}>
                  {user.employee_id}
                </td>
                <td className="p-3 text-sm text-gray-900 min-w-0 truncate" style={{ width: columnWidths.name, minWidth: 60, maxWidth: 800 }}>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{user.name}</div>
                    <div className="text-sm text-gray-500 truncate">{user.name_kana}</div>
                  </div>
                </td>
                <td className="p-3 text-sm text-gray-900 min-w-0 truncate" style={{ width: columnWidths.email, minWidth: 60, maxWidth: 800 }}>
                  {user.email}
                </td>
                <td className="p-3 text-sm text-gray-900 min-w-0 truncate" style={{ width: columnWidths.department, minWidth: 60, maxWidth: 800 }}>
                  {user.primary_department?.name || '未設定'}
                </td>
                <td className="p-3 text-sm text-gray-900 min-w-0 truncate" style={{ width: columnWidths.system_level, minWidth: 60, maxWidth: 800 }}>
                  {user.system_level}
                </td>
                <td className="p-3 text-sm text-gray-900 min-w-0 truncate" style={{ width: columnWidths.is_active, minWidth: 60, maxWidth: 800 }}>
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? '有効' : '無効'}
                  </Badge>
                </td>
                <td className="p-3 text-sm text-gray-900 min-w-0 truncate" style={{ width: columnWidths.actions, minWidth: 60, maxWidth: 800 }}>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onView(user)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(user)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(user)
                      }}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
      {totalCount > 0 && (
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} / {totalCount}件
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={10}>10件</option>
                <option value={20}>20件</option>
                <option value={50}>50件</option>
                <option value={100}>100件</option>
              </select>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  前へ
                </Button>
                <span className="px-3 py-1 text-sm">
                  {currentPage} / {Math.ceil(totalCount / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalCount / pageSize)}
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
