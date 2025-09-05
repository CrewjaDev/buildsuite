'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, X } from 'lucide-react'

interface EmployeeSearchFiltersProps {
  searchValue: string
  filters: Record<string, string | number | boolean | null | undefined>
  onSearchChange: (value: string) => void
  onFilterChange: (filters: Record<string, string | number | boolean | null | undefined>) => void
  onClearFilters: () => void
}

export function EmployeeSearchFilters({
  searchValue,
  filters,
  onSearchChange,
  onFilterChange,
  onClearFilters
}: EmployeeSearchFiltersProps) {
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
      key: 'has_system_access',
      label: 'システム権限',
      options: [
        { value: '', label: 'すべて' },
        { value: 'true', label: '権限あり' },
        { value: 'false', label: '権限なし' }
      ]
    },
    {
      key: 'department_id',
      label: '所属部署',
      options: [
        { value: '', label: 'すべて' },
        { value: '1', label: '営業部' },
        { value: '2', label: '経理部' },
        { value: '3', label: '工事部' },
        { value: '4', label: '調査設計室' },
        { value: '5', label: '土木事業部' },
        { value: '6', label: '建設事業部' },
        { value: '7', label: '東京支店' },
        { value: '8', label: '福岡支店' }
      ]
    }
  ], [])

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== '' && value !== null && value !== undefined).length
  }, [filters])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value === '' ? undefined : value
    }
    onFilterChange(newFilters)
  }

  const handleClearFilters = () => {
    onClearFilters()
    setIsExpanded(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">検索・フィルター</CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                クリア ({activeFiltersCount})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1"
            >
              <Filter className="h-3 w-3" />
              詳細フィルター
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本検索 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="社員名、社員ID、メールアドレスで検索..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
          />
        </div>

        {/* 詳細フィルター */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {filterOptions.map((filterOption) => (
              <div key={filterOption.key} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {filterOption.label}
                </label>
                <Select
                  value={String(filters[filterOption.key] || '')}
                  onValueChange={(value) => handleFilterChange(filterOption.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOption.options.map((option) => (
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
