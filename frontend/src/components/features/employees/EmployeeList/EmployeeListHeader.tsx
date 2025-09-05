'use client'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Upload, Download } from 'lucide-react'

interface EmployeeListHeaderProps {
  totalCount: number
  onCreateNew: () => void
  onImport: () => void
  onExport: () => void
}

export function EmployeeListHeader({ 
  totalCount, 
  onCreateNew, 
  onImport, 
  onExport 
}: EmployeeListHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl font-bold">社員管理</CardTitle>
            <Badge variant="secondary" className="text-sm">
              {totalCount}件
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onImport}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              インポート
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              エクスポート
            </Button>
            <Button
              onClick={onCreateNew}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              新規社員登録
            </Button>
          </div>
        </div>
        <CardDescription>
          社員の基本情報とシステム利用権限を管理します
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
