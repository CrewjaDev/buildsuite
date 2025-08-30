'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, SortingState, ColumnFiltersState, ColumnOrderState, ColumnSizingState, ColumnResizeMode, Updater } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'

import { DataTableProps } from './types'

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

// SortableTableHeadコンポーネント
const SortableTableHead = ({ header, children, ...props }: { header: unknown; children: React.ReactNode; [key: string]: unknown }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: (header as { id: string }).id })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-move p-1 hover:bg-gray-100 rounded flex-shrink-0">
          <span>⋮⋮</span>
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </TableHead>
  )
}

export const StickyHeaderTable = <T,>({
  data,
  columns,
  isLoading = false,
  error = null,
  enableColumnResizing = true,
  enableSorting = true,
  enableColumnFilters = true,
  onRowClick,
  className = ''
}: DataTableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  const headerScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleColumnSizingChange = (updater: Updater<ColumnSizingState>) => {
    setColumnSizing(updater)
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: handleColumnSizingChange,
    state: {
      sorting,
      columnFilters,
      columnOrder,
      columnSizing,
    },
    enableColumnResizing: enableColumnResizing,
    columnResizeMode: 'onChange' as ColumnResizeMode,
    defaultColumn: {
      size: 150,
      minSize: 60,
      maxSize: 800,
    },
    enableSorting,
    enableColumnFilters,
    debugTable: false,
    debugHeaders: false,
    debugColumns: false,
  });

  // 動的列幅状態管理
  const [dynamicColumnWidths, setDynamicColumnWidths] = useState<Record<string, number>>({})
  
  // 初期列幅設定
  const initialColumnWidths = useMemo(() => {
    const headers = table.getHeaderGroups()[0]?.headers || []
    return headers.reduce((acc, header) => {
      let width: number
      
      // 列の種類に基づいて初期幅を設定
      switch (header.id) {
        case 'employee_id':
          width = 120
          break
        case 'name':
          width = 200
          break
        case 'gender':
          width = 120
          break
        case 'department':
          width = 150
          break
        case 'position':
          width = 120
          break
        case 'job_title':
          width = 120
          break
        case 'hire_date':
          width = 150
          break
        case 'status':
          width = 130
          break
        case 'actions':
          width = 120
          break
        default:
          width = 120 // デフォルト幅
      }
      
      acc[header.id] = width
      return acc
    }, {} as Record<string, number>)
  }, [table])

  // 現在の列幅を取得（固定値px、制限なし）
  const getCurrentColumnWidths = useCallback(() => {
    const headers = table.getHeaderGroups()[0]?.headers || []
    return headers.reduce((acc, header) => {
      acc[header.id] = dynamicColumnWidths[header.id] || initialColumnWidths[header.id] || 120
      return acc
    }, {} as Record<string, number>)
  }, [table, dynamicColumnWidths, initialColumnWidths])

  const currentColumnWidths = useMemo(() => getCurrentColumnWidths(), [getCurrentColumnWidths])

  // テーブル全体の幅を計算
  const totalTableWidth = Object.values(currentColumnWidths).reduce((sum: number, width: number) => sum + width, 0)
  
  useEffect(() => {
    if (data.length > 0) {
      setColumnSizing({})
    }
  }, [data])

  // 列幅変更ハンドラー
  const handleColumnResize = useCallback((columnId: string, newWidth: number) => {
    const minWidth = 60 // 最小幅
    const clampedWidth = Math.max(minWidth, newWidth) // 最大幅制限を削除
    
    setDynamicColumnWidths(prev => ({
      ...prev,
      [columnId]: clampedWidth
    }))
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      const headers = table.getHeaderGroups()[0]?.headers || []
      const oldIndex = headers.findIndex(header => header.id === active.id)
      const newIndex = headers.findIndex(header => header.id === over?.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const currentOrder = headers.map(header => header.id)
        const newColumnOrder = [...currentOrder]
        const [removed] = newColumnOrder.splice(oldIndex, 1)
        newColumnOrder.splice(newIndex, 0, removed)
        
        setColumnOrder(newColumnOrder)
      }
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">エラーが発生しました: {error.message}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">データがありません</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      {/* 独立したスティッキーヘッダー */}
      <div 
        className="sticky top-0 z-50 bg-white border-b-2 border-gray-200"
        style={{
          position: 'sticky',
          top: '0px',
          zIndex: 50,
          backgroundColor: 'white',
          borderBottom: '2px solid #e5e7eb',
          WebkitPosition: '-webkit-sticky'
        } as React.CSSProperties}
      >
        <div 
          ref={headerScrollRef}
          className="w-full"
          style={{
            width: `${totalTableWidth}px`,
            overflow: 'visible'
          }}
        >
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={table.getHeaderGroups()[0]?.headers.map(header => header.id) || []}
              strategy={horizontalListSortingStrategy}
            >
              <Table 
                className="table-fixed"
                style={{ 
                    width: `${totalTableWidth}px`,
                    minWidth: `${totalTableWidth}px`,
                    tableLayout: 'fixed'
                }}
              >
                <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <SortableTableHead 
                        key={header.id}
                        header={header}
                        className="bg-gray-50 select-none relative p-1"
                        style={{ 
                              width: `${currentColumnWidths[header.id] || 120}px`,
                              minWidth: `${currentColumnWidths[header.id] || 120}px`,
                              maxWidth: `${currentColumnWidths[header.id] || 120}px`
                        }}
                      >
                        <div className="flex items-center justify-between h-full w-full">
                          <div 
                            className={`flex items-center gap-1 flex-1 ${enableSorting && header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-100 p-0.5 rounded' : ''}`}
                            onClick={header.column.getCanSort() ? () => header.column.toggleSorting() : undefined}
                          >
                            <span className="font-semibold text-gray-900">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                            {enableSorting && header.column.getCanSort() && (
                              <div className="flex flex-col flex-shrink-0">
                                {header.column.getIsSorted() === 'asc' && <span>↑</span>}
                                {header.column.getIsSorted() === 'desc' && <span>↓</span>}
                                {!header.column.getIsSorted() && <span>↕</span>}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {enableColumnFilters && header.column.getCanFilter() && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-5 w-5 p-0 ${header.column.getFilterValue() ? 'text-blue-600' : 'text-gray-400'}`}
                                  >
                                    <Search className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3" align="center" side="bottom">
                                  <div className="space-y-3">
                                    <div className="text-sm font-medium">フィルター</div>
                                      <Input
                                        placeholder="フィルター..."
                                        value={(header.column.getFilterValue() as string) ?? ''}
                                        onChange={(event) =>
                                          header.column.setFilterValue(event.target.value)
                                        }
                                        className="h-8 text-xs"
                                      />
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                            
                                                            {enableColumnResizing && (
                                  <CustomColumnResizer 
                                    currentWidth={currentColumnWidths[header.id] || 120}
                                    onResize={(newWidth) => handleColumnResize(header.id, newWidth)}
                                  />
                                )}
                          </div>
                        </div>
                      </SortableTableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
            </Table>
          </SortableContext>
        </DndContext>
      </div>
    </div>

      {/* データ行（動的幅） */}
      <div className={`w-full ${className}`} style={{ overflow: 'visible' }}>
      <div 
        ref={bodyScrollRef}
        className="w-full border rounded-lg border-t-0 scrollbar-hidden"
        style={{
          width: `${totalTableWidth}px`,
          overflow: 'visible',
          overflowX: 'hidden',
          overflowY: 'visible',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}
      >
        <Table 
          className="table-fixed"
          style={{ 
            width: `${totalTableWidth}px`,
            minWidth: `${totalTableWidth}px`,
            tableLayout: 'fixed'
          }}
        >
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow 
                key={row.id} 
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell 
                    key={cell.id}
                    style={{ 
                      width: `${currentColumnWidths[cell.column.id] || 120}px`,
                      minWidth: `${currentColumnWidths[cell.column.id] || 120}px`,
                      maxWidth: `${currentColumnWidths[cell.column.id] || 120}px`
                    }}
                    className="min-w-0"
                  >
                    <div className="min-w-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </div>
    </div>
  );
};

