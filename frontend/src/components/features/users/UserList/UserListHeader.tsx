'use client'

import { Button } from '@/components/ui/button'
import { Plus, Download, Upload } from 'lucide-react'

interface UserListHeaderProps {
  totalCount: number
  onCreateNew: () => void
  onImport: () => void
  onExport: () => void
}

export function UserListHeader({ 
  totalCount, 
  onCreateNew, 
  onImport, 
  onExport 
}: UserListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
        <p className="text-gray-600">
          ユーザーの登録・管理を行います
          {totalCount > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              （{totalCount}件）
            </span>
          )}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* インポートボタン */}
        <Button
          variant="outline"
          size="sm"
          onClick={onImport}
          className="flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>インポート</span>
        </Button>
        
        {/* エクスポートボタン */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>エクスポート</span>
        </Button>
        
        {/* 新規作成ボタン */}
        <Button
          onClick={onCreateNew}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>新規作成</span>
        </Button>
      </div>
    </div>
  )
}
