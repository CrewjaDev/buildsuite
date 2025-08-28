'use client'

import { useState } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, Column, SortingState, ColumnFiltersState, ColumnOrderState, ColumnSizingState } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { ColumnResizer } from './ColumnResizer'
import { DataTableProps } from './types'

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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    state: {
      sorting,
      columnFilters,
      columnOrder,
      columnSizing,
    },
    enableColumnResizing,
    columnResizeMode: 'onChange',
    enableSorting,
    enableColumnFilters,
  });

  // 列の順序を管理
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
    <div className={`relative border rounded-lg overflow-hidden ${className}`}>
      {/* スティッキーヘッダー */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={table.getHeaderGroups()[0]?.headers.map(header => header.id) || []}
            strategy={horizontalListSortingStrategy}
          >
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                  <SortableTableHead 
                    key={header.id}
                    header={header}
                    className="bg-gray-50 font-semibold text-gray-900 select-none relative"
                    style={{ 
                      width: header.getSize(),
                      minWidth: header.getSize(),
                      maxWidth: header.getSize()
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className={`flex items-center gap-2 ${enableSorting && header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-100 p-1 rounded' : ''}`}
                        onClick={header.column.getCanSort() ? () => header.column.toggleSorting() : undefined}
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {enableSorting && header.column.getCanSort() && (
                          <div className="flex flex-col">
                            {header.column.getIsSorted() === 'asc' && <span>↑</span>}
                            {header.column.getIsSorted() === 'desc' && <span>↓</span>}
                            {!header.column.getIsSorted() && <span>↕</span>}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        
                        {/* フィルターアイコン */}
                        {enableColumnFilters && header.column.getCanFilter() && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 w-6 p-0 ${header.column.getFilterValue() ? 'text-blue-600' : 'text-gray-400'}`}
                              >
                                <Filter className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" align="center" side="bottom">
                              <div className="space-y-3">
                                <div className="text-sm font-medium">フィルター</div>
                                
                                {/* ステータス列の場合はセレクトボックス */}
                                {header.column.id === 'status' ? (
                                  <Select
                                    value={(header.column.getFilterValue() as string) ?? 'all'}
                                    onValueChange={(value) => {
                                      console.log('ステータスフィルター変更:', value)
                                      header.column.setFilterValue(value === 'all' ? '' : value)
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="ステータス" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">すべて</SelectItem>
                                      <SelectItem value="active">有効</SelectItem>
                                      <SelectItem value="inactive">無効</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : header.column.id === 'createdAt' ? (
                                  /* 作成日列の場合は日付範囲入力 */
                                  <div className="space-y-2">
                                    <div>
                                      <div className="text-xs text-gray-500 mb-1">開始日</div>
                                      <Input
                                        type="text"
                                        placeholder="____/__/__"
                                        value={((header.column.getFilterValue() as { from?: string; to?: string })?.from) ?? ''}
                                        onChange={(event) => {
                                          const currentFilter = header.column.getFilterValue() as { from?: string; to?: string } || {}
                                          header.column.setFilterValue({
                                            ...currentFilter,
                                            from: event.target.value
                                          })
                                        }}
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-500 mb-1">終了日</div>
                                      <Input
                                        type="text"
                                        placeholder="____/__/__"
                                        value={((header.column.getFilterValue() as { from?: string; to?: string })?.to) ?? ''}
                                        onChange={(event) => {
                                          const currentFilter = header.column.getFilterValue() as { from?: string; to?: string } || {}
                                          header.column.setFilterValue({
                                            ...currentFilter,
                                            to: event.target.value
                                          })
                                        }}
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <Input
                                    placeholder="フィルター..."
                                    value={(header.column.getFilterValue() as string) ?? ''}
                                    onChange={(event) =>
                                      header.column.setFilterValue(event.target.value)
                                    }
                                    className="h-8 text-xs"
                                  />
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                        
                        {/* 列幅調整 */}
                        {enableColumnResizing && (
                          <ColumnResizer column={header.column as unknown as Column<unknown>} />
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

      {/* スクロール可能なデータ行 */}
      <div className="overflow-auto max-h-[600px]">
        <Table>
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
                      width: cell.column.getSize(),
                      minWidth: cell.column.getSize(),
                      maxWidth: cell.column.getSize()
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
