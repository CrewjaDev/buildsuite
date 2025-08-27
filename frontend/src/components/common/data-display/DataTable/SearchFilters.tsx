'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchFiltersProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: Record<string, string | number | boolean | null | undefined>
  onFilterChange?: (filters: Record<string, string | number | boolean | null | undefined>) => void
  placeholder?: string
  className?: string
  filterOptions?: {
    key: string
    label: string
    options: { value: string; label: string }[]
  }[]
}

export const SearchFilters = ({
  searchValue = '',
  onSearchChange,
  filters = {},
  onFilterChange,
  placeholder = '検索...',
  className = '',
  filterOptions = []
}: SearchFiltersProps) => {
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters }
    if (value === 'all') {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    onFilterChange?.(newFilters)
  }

  const clearAllFilters = () => {
    onSearchChange?.('')
    onFilterChange?.({})
  }

  const hasActiveFilters = searchValue || Object.keys(filters).length > 0

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {/* 検索フィールド */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* フィルターオプション */}
      {filterOptions.map((option) => (
        <div key={option.key} className="min-w-[150px]">
          <Select
            value={String(filters[option.key] || 'all')}
            onValueChange={(value) => handleFilterChange(option.key, value)}
          >
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={option.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {option.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      {/* フィルタークリアボタン */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          クリア
        </Button>
      )}
    </div>
  )
}
