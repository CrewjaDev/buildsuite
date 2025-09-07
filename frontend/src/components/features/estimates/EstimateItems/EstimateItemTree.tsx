'use client'

import { useState } from 'react'
import type { EstimateItemTree } from '@/types/features/estimates/estimateItem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, GripVertical } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/estimateUtils'

interface EstimateItemTreeProps {
  items: EstimateItemTree[]
  onAddItem: (parentId?: string) => void
  onEditItem: (item: EstimateItemTree) => void
  onDeleteItem: (itemId: string) => void
  onUpdateItem?: (itemId: string, field: string, value: string | number) => void
  onMoveItem?: (itemId: string, direction: 'up' | 'down') => void
  isReadOnly?: boolean
}

export function EstimateItemTree({ 
  items, 
  onAddItem, 
  onEditItem, 
  onDeleteItem, 
  isReadOnly = false 
}: EstimateItemTreeProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const renderItem = (item: EstimateItemTree, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id)
    const hasChildren = item.children && item.children.length > 0
    const indentLevel = level * 24

    return (
      <div key={item.id} className="border-b border-gray-100 last:border-b-0">
        <div 
          className="flex items-center py-3 px-4 hover:bg-gray-50 transition-colors"
          style={{ paddingLeft: `${16 + indentLevel}px` }}
        >
          {/* 展開/折りたたみボタン */}
          <div className="flex items-center w-8">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleExpanded(item.id)}
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

          {/* ドラッグハンドル */}
          {!isReadOnly && (
            <div className="flex items-center mr-2">
              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
            </div>
          )}

          {/* アイテム情報 */}
          <div className="flex-1 grid grid-cols-12 gap-2 items-center">
            {/* 工法 */}
            <div className="col-span-1">
              <span className="text-xs text-gray-600">
                {item.construction_method || '-'}
              </span>
            </div>

            {/* 工事分類 */}
            <div className="col-span-1">
              <span className="text-xs text-gray-600">
                {item.construction_classification_id ? '分類' : '-'}
              </span>
            </div>

            {/* 摘要 */}
            <div className="col-span-2">
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
              {item.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {item.description}
                </p>
              )}
            </div>

            {/* 数量 */}
            <div className="col-span-1 text-center">
              <span className="text-sm text-gray-900">
                {item.quantity.toLocaleString()}
              </span>
            </div>

            {/* 単価 */}
            <div className="col-span-1 text-right">
              <span className="text-sm text-gray-900">
                {formatCurrency(item.unit_price)}
              </span>
            </div>

            {/* 金額 */}
            <div className="col-span-1 text-right">
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(item.amount)}
              </span>
            </div>

            {/* 備考 */}
            <div className="col-span-1">
              <span className="text-xs text-gray-600">
                {item.remarks || '-'}
              </span>
            </div>

            {/* 発注先 */}
            <div className="col-span-1">
              <span className="text-xs text-gray-600">
                {item.supplier_id ? '発注先' : '-'}
              </span>
            </div>

            {/* 発注依頼内容 */}
            <div className="col-span-1">
              <span className="text-xs text-gray-600">
                {item.order_request_content || '-'}
              </span>
            </div>

            {/* 予想原価 */}
            <div className="col-span-1 text-right">
              <span className="text-sm text-gray-600">
                {formatCurrency(item.estimated_cost)}
              </span>
            </div>

            {/* アクションボタン */}
            {!isReadOnly && (
              <div className="col-span-1 flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onAddItem(item.id)}
                  title="子アイテムを追加"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onEditItem(item)}
                  title="編集"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onDeleteItem(item.id)}
                  title="削除"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 子アイテム */}
        {hasChildren && isExpanded && (
          <div>
            {item.children?.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">見積明細</CardTitle>
          {!isReadOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddItem()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              明細を追加
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>見積明細がありません</p>
            {!isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddItem()}
                className="mt-2"
              >
                最初の明細を追加
              </Button>
            )}
          </div>
        ) : (
          <div>
            {/* ヘッダー */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600">
                <div className="col-span-1">工法</div>
                <div className="col-span-1">工事分類</div>
                <div className="col-span-2">摘要</div>
                <div className="col-span-1 text-center">数量</div>
                <div className="col-span-1 text-right">単価</div>
                <div className="col-span-1 text-right">金額</div>
                <div className="col-span-1">備考</div>
                <div className="col-span-1">発注先</div>
                <div className="col-span-1">発注依頼内容</div>
                <div className="col-span-1 text-right">予想原価</div>
                {!isReadOnly && <div className="col-span-1 text-center">操作</div>}
              </div>
            </div>

            {/* アイテム一覧 */}
            <div>
              {items.map(item => renderItem(item))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
