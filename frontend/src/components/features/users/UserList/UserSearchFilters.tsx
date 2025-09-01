'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, X } from 'lucide-react'

interface UserSearchFiltersProps {
  searchValue: string
  filters: Record<string, string | number | boolean | null | undefined>
  onSearchChange: (value: string) => void
  onFilterChange: (filters: Record<string, string | number | boolean | null | undefined>) => void
  onClearFilters: () => void
}

export function UserSearchFilters({
  searchValue,
  filters,
  onSearchChange,
  onFilterChange,
  onClearFilters
}: UserSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const filterOptions = useMemo(() => [
    {
      key: 'is_active',
      label: 'ステータス',
      options: [
        { value: '', label: 'すべて' },
        { value: 'true', label: '有効' },
        { value: 'false', label: '無効' }
      ]
    },
    {
      key: 'is_admin',
      label: '管理者権限',
      options: [
        { value: '', label: 'すべて' },
        { value: 'true', label: '管理者' },
        { value: 'false', label: '一般ユーザー' }
      ]
    },
    {
      key: 'system_level',
      label: 'システム権限レベル',
      options: [
        { value: '', label: 'すべて' },
        { value: 'admin', label: '管理者' },
        { value: 'manager', label: 'マネージャー' },
        { value: 'user', label: '一般ユーザー' }
      ]
    }
  ], [])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters }
    if (value === '') {
      delete newFilters[key]
    } else {
      if (key === 'is_active' || key === 'is_admin') {
        newFilters[key] = value === 'true'
      } else {
        newFilters[key] = value
      }
    }
    onFilterChange(newFilters)
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-500" />
            <span>検索・フィルター</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>{isExpanded ? '折りたたむ' : '展開'}</span>
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
                <span>クリア</span>
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 検索入力 */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              placeholder="社員ID、社員名、メールアドレスで検索..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* フィルターオプション */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            {filterOptions.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                <Select
                  value={String(filters[filter.key] ?? '')}
                  onValueChange={(value) => handleFilterChange(filter.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`${filter.label}を選択`} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
