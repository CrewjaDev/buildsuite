'use client'

import { useState } from 'react'
import { Column } from '@tanstack/react-table'
import { GripVertical } from 'lucide-react'

interface ColumnResizerProps {
  column: Column<unknown>
  className?: string
}

export const ColumnResizer = ({ column, className }: ColumnResizerProps) => {
  const [isResizing, setIsResizing] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    
    const startX = e.pageX
    const startWidth = column.getSize()
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.pageX - startX
        const newWidth = Math.max(50, startWidth + deltaX) // 最小幅50px
        try {
          ;(column as unknown as { setSize: (size: number) => void }).setSize(newWidth)
        } catch (error) {
          console.log('列幅調整エラー:', error)
        }
      }
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none ${
        isResizing ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'
      } ${className || ''}`}
      onMouseDown={handleMouseDown}
    >
      <GripVertical className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
    </div>
  )
}
