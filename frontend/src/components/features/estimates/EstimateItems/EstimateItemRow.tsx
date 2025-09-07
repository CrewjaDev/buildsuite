'use client'

import { useState } from 'react'
import { EstimateItem } from '@/types/features/estimates/estimateItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/estimateUtils'

interface EstimateItemRowProps {
  item: EstimateItem
  level: number
  isExpanded: boolean
  hasChildren: boolean
  onToggleExpanded: () => void
  onDelete: (itemId: string) => void
  onAddChild: (parentId: string) => void
  onUpdate: (itemId: string, field: string, value: string | number) => void
  isReadOnly?: boolean
}

export function EstimateItemRow({
  item,
  level,
  isExpanded,
  hasChildren,
  onToggleExpanded,
  onDelete,
  onAddChild,
  onUpdate,
  isReadOnly = false
}: EstimateItemRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState({
    item_type: item.item_type,
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unit_price,
  })

  const indentLevel = level * 24

  const handleEdit = () => {
    setIsEditing(true)
    setEditValues({
      item_type: item.item_type,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })
  }

  const handleSave = () => {
    // 変更があったフィールドのみ更新
    Object.entries(editValues).forEach(([field, value]) => {
      if (value !== (item as unknown as Record<string, unknown>)[field]) {
        onUpdate(item.id, field, value)
      }
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValues({
      item_type: item.item_type,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })
    setIsEditing(false)
  }

  const calculateAmount = () => {
    return editValues.quantity * editValues.unit_price
  }

  return (
    <div 
      className="flex items-center py-3 px-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
      style={{ paddingLeft: `${16 + indentLevel}px` }}
    >
      {/* 展開/折りたたみボタン */}
      <div className="flex items-center w-8">
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleExpanded}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}
      </div>

      {/* アイテム情報 */}
      <div className="flex-1 grid grid-cols-12 gap-4 items-center">
        {/* アイテムタイプ */}
        <div className="col-span-2">
          {isEditing ? (
            <Input
              value={editValues.item_type}
              onChange={(e) => setEditValues(prev => ({ ...prev, item_type: e.target.value }))}
              className="h-8 text-sm"
            />
          ) : (
            <span className="text-sm font-medium text-gray-900">
              {item.item_type}
            </span>
          )}
        </div>

        {/* アイテム名 */}
        <div className="col-span-4">
          {isEditing ? (
            <Input
              value={editValues.name}
              onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
              className="h-8 text-sm"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900">
                {item.name}
              </span>
              {item.item_type === 'group' && (
                <Badge variant="secondary" className="text-xs">
                  グループ
                </Badge>
              )}
            </div>
          )}
          {item.description && (
            <p className="text-xs text-gray-500 mt-1">
              {item.description}
            </p>
          )}
        </div>

        {/* 単位 */}
        <div className="col-span-1 text-center">
          {isEditing ? (
            <Input
              value={editValues.unit}
              onChange={(e) => setEditValues(prev => ({ ...prev, unit: e.target.value }))}
              className="h-8 text-sm text-center"
            />
          ) : (
            <span className="text-sm text-gray-600">
              {item.unit}
            </span>
          )}
        </div>

        {/* 数量 */}
        <div className="col-span-1 text-right">
          {isEditing ? (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editValues.quantity}
              onChange={(e) => setEditValues(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
              className="h-8 text-sm text-right"
            />
          ) : (
            <span className="text-sm text-gray-900">
              {item.quantity.toLocaleString()}
            </span>
          )}
        </div>

        {/* 単価 */}
        <div className="col-span-1 text-right">
          {isEditing ? (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editValues.unit_price}
              onChange={(e) => setEditValues(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
              className="h-8 text-sm text-right"
            />
          ) : (
            <span className="text-sm text-gray-900">
              {formatCurrency(item.unit_price)}
            </span>
          )}
        </div>

        {/* 金額 */}
        <div className="col-span-2 text-right">
          <span className="text-sm font-medium text-gray-900">
            {isEditing ? formatCurrency(calculateAmount()) : formatCurrency(item.amount)}
          </span>
        </div>

        {/* アクションボタン */}
        {!isReadOnly && (
          <div className="col-span-1 flex items-center justify-end gap-1">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                  onClick={handleSave}
                  title="保存"
                >
                  ✓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-600 hover:text-gray-700"
                  onClick={handleCancel}
                  title="キャンセル"
                >
                  ✕
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onAddChild(item.id)}
                  title="子アイテムを追加"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleEdit}
                  title="編集"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onDelete(item.id)}
                  title="削除"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
