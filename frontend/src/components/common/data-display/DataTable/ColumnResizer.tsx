'use client'

import { useState } from 'react'
import { GripVertical } from 'lucide-react'

interface ColumnResizerProps {
  column: unknown
  className?: string
}

export const ColumnResizer = ({ column, className }: ColumnResizerProps) => {
  const [isResizing, setIsResizing] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    
    const startX = e.pageX
    const startWidth = (column as { getSize: () => number }).getSize()
    let isDragging = true
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.pageX - startX
        const columnInstance = column as unknown as { 
          setSize?: (size: number) => void; 
          columnDef?: { size?: number; minSize?: number };
          getSize: () => number;
        }
        const minSize = columnInstance.columnDef?.minSize || 50
        const newWidth = Math.max(minSize, startWidth + deltaX)
        console.log('列幅調整中:', { startWidth, deltaX, newWidth })
        try {
          // TanStack Table v8での列幅設定方法
          const columnId = (column as unknown as { id: string }).id
          
          // 列幅を設定
          if (columnInstance.setSize) {
            columnInstance.setSize(newWidth)
          } else if (columnInstance.columnDef) {
            columnInstance.columnDef.size = newWidth
          }
          
          // テーブルの状態を直接更新
          const table = (column as unknown as { table?: { setColumnSizing: (sizing: Record<string, number>) => void } }).table
          if (table?.setColumnSizing) {
            table.setColumnSizing({ [columnId]: newWidth })
          }
          
          // デバッグ情報
          console.log('列幅設定完了:', { columnId, newWidth, columnInstance })
        } catch (error) {
          console.log('列幅調整エラー:', error)
        }
      }
    }
    
    const handleMouseUp = () => {
      isDragging = false
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      className={`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none z-10 ${
        isResizing ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'
      } ${className || ''}`}
      onMouseDown={handleMouseDown}
    >
      <GripVertical className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
    </div>
  )
}
