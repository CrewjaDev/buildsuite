'use client'

import { Button } from '@/components/ui/button'
import { Plus, Download, Upload } from 'lucide-react'

interface EstimateListHeaderProps {
  totalCount: number
  onCreateNew: () => void
  onExport?: () => void
  onImport?: () => void
}

export function EstimateListHeader({
  totalCount,
  onCreateNew,
  onExport,
  onImport
}: EstimateListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">見積管理</h1>
        <p className="text-gray-600">
          見積書の作成・管理を行います
          {totalCount > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              （{totalCount}件）
            </span>
          )}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        {onImport && (
          <Button
            variant="outline"
            onClick={onImport}
            className="hidden sm:flex"
          >
            <Upload className="h-4 w-4 mr-2" />
            インポート
          </Button>
        )}
        
        {onExport && (
          <Button
            variant="outline"
            onClick={onExport}
            className="hidden sm:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            エクスポート
          </Button>
        )}
        
        <Button 
          onClick={onCreateNew}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          新規見積作成
        </Button>
      </div>
    </div>
  )
}
