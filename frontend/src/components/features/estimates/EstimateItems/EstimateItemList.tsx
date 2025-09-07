'use client'

import type { EstimateItem } from '@/types/features/estimates/estimateItem'
import type { EstimateBreakdown } from '@/types/features/estimates/estimateBreakdown'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/estimateUtils'

interface EstimateItemListProps {
  items: EstimateItem[]
  breakdowns?: EstimateBreakdown[]
  onEditItem: (item: EstimateItem) => void
  onDeleteItem: (itemId: string) => void
  isReadOnly?: boolean
}

export function EstimateItemList({ 
  items, 
  breakdowns,
  onEditItem, 
  onDeleteItem, 
  isReadOnly = false 
}: EstimateItemListProps) {
  const handleDelete = async (item: EstimateItem) => {
    if (confirm(`「${item.name}」を削除しますか？`)) {
      onDeleteItem(item.id)
    }
  }


  // 安全な配列として処理
  const safeItems = Array.isArray(items) ? items : []


  if (safeItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>見積明細が設定されていません</p>
        <p className="text-sm mt-1">「明細追加」ボタンから明細を追加してください</p>
      </div>
    )
  }

  // 階層構造で表示するための関数
  const renderHierarchicalItems = () => {
    if (!breakdowns || breakdowns.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>内訳情報が読み込まれていません</p>
        </div>
      )
    }

    // ルートレベルの内訳（parent_idがnull）を取得
    const rootBreakdowns = breakdowns.filter(b => !b.parent_id)
    
    return (
      <div className="space-y-0">
        {/* テーブルヘッダー */}
        <div className="grid grid-cols-[100px_100px_minmax(150px,_1fr)_80px_80px_100px_minmax(100px,_1fr)_100px_minmax(100px,_1fr)_100px_80px] gap-x-2 p-2 text-xs font-semibold text-gray-600 border-b bg-gray-50">
          <div className="col-span-1">工法</div>
          <div className="col-span-1">工事分類</div>
          <div className="col-span-1">摘要</div>
          <div className="text-center">数量</div>
          <div className="text-right">単価</div>
          <div className="text-right">金額</div>
          <div className="col-span-1">備考</div>
          <div className="col-span-1">発注先</div>
          <div className="col-span-1">発注依頼内容</div>
          <div className="text-right">予想原価</div>
          {!isReadOnly && <div className="col-span-1">操作</div>}
        </div>
        
        {/* 階層データ */}
        {rootBreakdowns.map(breakdown => 
          renderBreakdownHierarchy(breakdown, 0)
        )}
      </div>
    )
  }

  // 内訳の階層を再帰的にレンダリング
  const renderBreakdownHierarchy = (breakdown: EstimateBreakdown, level: number) => {
    const breakdownItems = safeItems.filter(item => item.breakdown_id === breakdown.id)
    
    // 子内訳を取得
    const childBreakdowns = breakdowns?.filter(child => child.parent_id === breakdown.id) || []
    
    // 明細の金額と予想原価を集計
    const itemsAmount = breakdownItems.reduce((sum, item) => sum + (item.amount || 0), 0)
    const itemsEstimatedCost = breakdownItems.reduce((sum, item) => sum + (item.estimated_cost || 0), 0)
    
    // 子内訳の集計値を再帰的に計算
    const calculateChildTotals = (childBreakdowns: EstimateBreakdown[]): { amount: number, estimatedCost: number } => {
      return childBreakdowns.reduce((totals, child) => {
        const childItems = safeItems.filter(item => item.breakdown_id === child.id)
        const childItemsAmount = childItems.reduce((sum, item) => sum + (item.amount || 0), 0)
        const childItemsEstimatedCost = childItems.reduce((sum, item) => sum + (item.estimated_cost || 0), 0)
        
        // 子内訳の子内訳も再帰的に集計
        const grandChildBreakdowns = breakdowns?.filter(grandChild => grandChild.parent_id === child.id) || []
        const grandChildTotals = calculateChildTotals(grandChildBreakdowns)
        
        return {
          amount: totals.amount + childItemsAmount + grandChildTotals.amount,
          estimatedCost: totals.estimatedCost + childItemsEstimatedCost + grandChildTotals.estimatedCost
        }
      }, { amount: 0, estimatedCost: 0 })
    }
    
    const childTotals = calculateChildTotals(childBreakdowns)
    
    // 下位層がない内訳の場合は、内訳自身の金額を優先
    const hasChildren = childBreakdowns.length > 0 || breakdownItems.length > 0
    
    // 総合計（明細 + 子内訳）または内訳自身の金額
    const totalAmount = hasChildren 
      ? itemsAmount + childTotals.amount 
      : (breakdown.calculated_amount || breakdown.direct_amount || 0)
    const totalEstimatedCost = hasChildren 
      ? itemsEstimatedCost + childTotals.estimatedCost 
      : (breakdown.direct_amount || 0)
    
    return (
      <div key={breakdown.id}>
        {/* 内訳行 */}
        <div 
          className="grid grid-cols-[100px_100px_minmax(150px,_1fr)_80px_80px_100px_minmax(100px,_1fr)_100px_minmax(100px,_1fr)_100px_80px] gap-x-2 p-2 text-sm border-b bg-green-50 hover:bg-green-100"
        >
          {/* 工法から単価までを統合して内訳名称を表示 */}
          <div className="col-span-5 text-left">
            <div className="flex items-center gap-2 text-left" style={{ paddingLeft: `${level * 20}px` }}>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  breakdown.breakdown_type === 'large' ? 'bg-blue-100 text-blue-800' :
                  breakdown.breakdown_type === 'medium' ? 'bg-green-100 text-green-800' :
                  breakdown.breakdown_type === 'small' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {breakdown.breakdown_type === 'large' ? '大内訳' :
                 breakdown.breakdown_type === 'medium' ? '中内訳' :
                 breakdown.breakdown_type === 'small' ? '小内訳' :
                 breakdown.breakdown_type}
              </Badge>
              <span className="font-medium">{breakdown.name}</span>
            </div>
            {breakdown.description && (
              <div className="text-xs text-gray-500 mt-1 text-left" style={{ paddingLeft: `${level * 20}px` }}>{breakdown.description}</div>
            )}
          </div>
          {/* 金額列（6番目の列）に金額を表示 - 明細行と同じ位置に配置 */}
          <div className="text-right font-medium">
            {formatCurrency(totalAmount)}
          </div>
          <div className="col-span-1 text-xs text-gray-700">-</div>
          <div className="col-span-1 text-xs text-gray-700">-</div>
          <div className="col-span-1 text-xs text-gray-700">-</div>
          <div className="text-right">
            {totalEstimatedCost > 0 ? formatCurrency(totalEstimatedCost) : '-'}
          </div>
          {!isReadOnly && <div className="col-span-1"></div>}
        </div>
        
        {/* 明細アイテム */}
        {breakdownItems.map((item) => (
          <div 
            key={item.id} 
            className="grid grid-cols-[100px_100px_minmax(150px,_1fr)_80px_80px_100px_minmax(100px,_1fr)_100px_minmax(100px,_1fr)_100px_80px] gap-x-2 p-2 text-sm border-b bg-white hover:bg-gray-50" 
          >
            <div className="col-span-1 text-xs text-gray-700">{item.construction_method || '-'}</div>
            <div className="col-span-1 text-xs text-gray-700">
              {item.construction_classification_name || '-'}
            </div>
            <div className="col-span-1 text-left">
              <div className="font-medium text-left">{item.name}</div>
              {item.description && (
                <div className="text-xs text-gray-500 mt-1 text-left">{item.description}</div>
              )}
            </div>
            <div className="text-center">{item.quantity > 0 ? `${item.quantity.toLocaleString()} ${item.unit || ''}` : '-'}</div>
            <div className="text-right">{item.unit_price > 0 ? formatCurrency(item.unit_price) : '-'}</div>
            <div className="text-right">{item.amount > 0 ? formatCurrency(item.amount) : '-'}</div>
            <div className="col-span-1 text-xs text-gray-700">{item.remarks || '-'}</div>
            <div className="col-span-1 text-xs text-gray-700">{item.supplier?.name || '-'}</div>
            <div className="col-span-1 text-xs text-gray-700">{item.order_request_content || '-'}</div>
            <div className="text-right">{item.estimated_cost > 0 ? formatCurrency(item.estimated_cost) : '-'}</div>
            {!isReadOnly && (
              <div className="col-span-1 flex justify-center items-center gap-1">
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
                  onClick={() => handleDelete(item)}
                  title="削除"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
        
        {/* 子内訳を再帰的に表示 */}
        {breakdowns
          ?.filter(child => child.parent_id === breakdown.id)
          .map(child => renderBreakdownHierarchy(child, level + 1))
        }
      </div>
    )
  }

  return renderHierarchicalItems()
}
