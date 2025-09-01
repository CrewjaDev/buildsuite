'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, X } from 'lucide-react'

interface EstimateSearchFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: Record<string, string | number | boolean | null | undefined>
  onFilterChange: (filters: Record<string, string | number | boolean | null | undefined>) => void
  onClearFilters: () => void
}

export function EstimateSearchFilters({
  searchValue,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters
}: EstimateSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // フィルターオプション
  const filterOptions = useMemo(() => [
    {
      key: 'status',
      label: 'ステータス',
      options: [
        { value: '', label: 'すべて' },
        { value: 'draft', label: '下書き' },
        { value: 'submitted', label: '提出済み' },
        { value: 'approved', label: '承認済み' },
        { value: 'rejected', label: '却下' },
        { value: 'expired', label: '期限切れ' },
      ],
    },
    {
      key: 'partner_type',
      label: '取引先タイプ',
      options: [
        { value: '', label: 'すべて' },
        { value: 'customer', label: '得意先' },
        { value: 'supplier', label: '仕入先' },
        { value: 'both', label: '両方' },
      ],
    },
  ], [])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters }
    if (value === '') {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    onFilterChange(newFilters)
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">検索・フィルター</CardTitle>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                クリア
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-1" />
              {isExpanded ? '折りたたむ' : '詳細フィルター'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="見積番号、プロジェクト名、取引先名で検索..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 詳細フィルター */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {filterOptions.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                <Select
                  value={filters[filter.key] as string || ''}
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

        {/* アクティブフィルター表示 */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-gray-600">適用中のフィルター:</span>
            {Object.entries(filters).map(([key, value]) => {
              const filterOption = filterOptions.find(f => f.key === key)
              const option = filterOption?.options.find(o => o.value === value)
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {filterOption?.label}: {option?.label}
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
