'use client'

import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import { Header } from '@tanstack/react-table'

interface ColumnResizerProps<T = unknown> {
  header: Header<T, unknown>
  className?: string
}

export const ColumnResizer = <T = unknown,>({ header, className }: ColumnResizerProps<T>) => {
  const [isResizing, setIsResizing] = useState(false)
  const { getSize } = header
  const table = header.getContext().table

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!header.column.getCanResize()) return
    
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    const startX = e.clientX
    const startSize = getSize()

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const newSize = Math.max(60, startSize + deltaX)
      
      // 列幅を直接更新
      table.setColumnSizing(prev => ({
        ...prev,
        [header.column.id]: newSize
      }))
      
      console.log('Resizing column:', header.column.id, 'to', newSize)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      console.log('Resize completed for column:', header.column.id)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (!header.column.getCanResize()) {
    return null
  }

  return (
    <div
      className={`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none z-10 ${
        isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-gray-200'
      } ${className || ''}`}
      onMouseDown={handleMouseDown}
      title="列幅を調整"
    >
      <GripVertical className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 hover:text-gray-500" />
    </div>
  )
}
