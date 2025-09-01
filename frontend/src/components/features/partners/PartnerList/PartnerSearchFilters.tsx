'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, X } from 'lucide-react'

interface PartnerSearchFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: Record<string, string | number | boolean | null | undefined>
  onFilterChange: (filters: Record<string, string | number | boolean | null | undefined>) => void
  onClearFilters: () => void
}

export function PartnerSearchFilters({
  searchValue,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters
}: PartnerSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // フィルターオプション
  const filterOptions = useMemo(() => [
    {
      key: 'partner_type',
      label: '取引先区分',
      options: [
        { value: '', label: 'すべて' },
        { value: 'customer', label: '顧客' },
        { value: 'supplier', label: '仕入先' },
        { value: 'both', label: '両方' },
      ],
    },
    {
      key: 'is_active',
      label: 'ステータス',
      options: [
        { value: '', label: 'すべて' },
        { value: 'true', label: '有効' },
        { value: 'false', label: '無効' },
      ],
    },
    {
      key: 'is_subcontractor',
      label: '外注フラグ',
      options: [
        { value: '', label: 'すべて' },
        { value: 'true', label: '外注先' },
        { value: 'false', label: '外注先以外' },
      ],
    },
  ], [])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters }
    if (value === '') {
      delete newFilters[key]
    } else {
      // ブール値の場合は適切に変換
      if (key === 'is_active' || key === 'is_subcontractor') {
        newFilters[key] = value === 'true'
      } else {
        newFilters[key] = value
      }
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
            placeholder="取引先コード、取引先名、メールアドレスで検索..."
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
                  value={filters[filter.key]?.toString() || ''}
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
              const option = filterOption?.options.find(o => o.value === value?.toString())
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
