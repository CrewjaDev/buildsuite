'use client'

import { useState } from 'react'
import { EstimateBreakdownTree } from '@/types/features/estimates/estimateBreakdown'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/estimateUtils'
import { 
  ChevronRight, 
  ChevronDown, 
  TreePine
} from 'lucide-react'

interface EstimateBreakdownTreeViewProps {
  breakdowns: EstimateBreakdownTree[]
  currentTab?: 'large' | 'medium' | 'small'
}

export function EstimateBreakdownTreeView({ 
  breakdowns,
  currentTab
}: EstimateBreakdownTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const toggleExpanded = (breakdownId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(breakdownId)) {
      newExpanded.delete(breakdownId)
    } else {
      newExpanded.add(breakdownId)
    }
    setExpandedNodes(newExpanded)
  }

  const getBreakdownTypeLabel = (type: string) => {
    switch (type) {
      case 'large': return '大内訳'
      case 'medium': return '中内訳'
      case 'small': return '小内訳'
      default: return type
    }
  }

  const getBreakdownTypeColor = (type: string) => {
    switch (type) {
      case 'large': return 'bg-blue-100 text-blue-800'
      case 'medium': return 'bg-green-100 text-green-800'
      case 'small': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderBreakdownNode = (breakdown: EstimateBreakdownTree, level: number = 0) => {
    const hasChildren = (breakdown.children?.length || 0) > 0 || (breakdown.items?.length || 0) > 0
    const isExpanded = expandedNodes.has(breakdown.id)

    return (
      <div key={breakdown.id}>
        <div 
          className="grid grid-cols-[100px_100px_minmax(150px,_1fr)_80px_80px_100px_minmax(100px,_1fr)_100px_minmax(100px,_1fr)_100px] gap-x-2 p-2 text-sm border-b hover:bg-gray-50"
        >
          {/* 工法 */}
          <div className="col-span-1 text-xs text-gray-700">
            <div style={{ paddingLeft: `${level * 20}px` }} className="text-left">
              {currentTab === breakdown.breakdown_type ? (
                // 現在のタブと同レベルの内訳の内容を工法欄に表示
                <>
                  <div className="font-medium">{breakdown.name}</div>
                  {breakdown.description && (
                    <div className="text-xs text-gray-500 mt-1">{breakdown.description}</div>
                  )}
                </>
              ) : (
                // 上位の内訳がある場合はバッジと内容を表示
                <>
                  <div className="flex items-center gap-2 mb-1">
                    {hasChildren && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => toggleExpanded(breakdown.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    {currentTab !== breakdown.breakdown_type && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getBreakdownTypeColor(breakdown.breakdown_type)}`}
                      >
                        {getBreakdownTypeLabel(breakdown.breakdown_type)}
                      </Badge>
                    )}
                  </div>
                  <div className="font-medium">{breakdown.name}</div>
                  {breakdown.description && (
                    <div className="text-xs text-gray-500 mt-1">{breakdown.description}</div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* 工事分類 */}
          <div className="col-span-1 text-xs text-gray-700">
            -
          </div>
          
          {/* 摘要 */}
          <div className="col-span-1">
            -
          </div>
          
          {/* 数量 */}
          <div className="text-center">-</div>
          
          {/* 単価 */}
          <div className="text-right">-</div>
          
          {/* 金額 */}
          <div className="text-right font-medium">
            {formatCurrency(breakdown.calculated_amount)}
          </div>
          
          {/* 備考 */}
          <div className="col-span-1 text-xs text-gray-700">-</div>
          
          {/* 発注先 */}
          <div className="col-span-1 text-xs text-gray-700">-</div>
          
          {/* 発注依頼内容 */}
          <div className="col-span-1 text-xs text-gray-700">-</div>
          
          {/* 予想原価 */}
          <div className="text-right">
            {breakdown.direct_amount > 0 ? formatCurrency(breakdown.direct_amount) : '-'}
          </div>
        </div>

        {/* 子内訳を常に表示（明細アイテムは表示しない） */}
        {breakdown.children?.map(child => 
          renderBreakdownNode(child, level + 1)
        )}
      </div>
    )
  }

  if (breakdowns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TreePine className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>見積内訳が設定されていません</p>
        <p className="text-sm mt-1">「内訳追加」ボタンから内訳構造を作成してください</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* テーブルヘッダー */}
      <div className="grid grid-cols-[100px_100px_minmax(150px,_1fr)_80px_80px_100px_minmax(100px,_1fr)_100px_minmax(100px,_1fr)_100px] gap-x-2 p-2 text-xs font-semibold text-gray-600 border-b bg-gray-50">
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
      </div>
      
      {/* 内訳データ */}
      {breakdowns.map(breakdown => renderBreakdownNode(breakdown))}
    </div>
  )
}
