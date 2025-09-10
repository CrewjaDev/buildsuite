'use client'

import { useState } from 'react'
import { Estimate } from '@/types/features/estimates/estimate'
import { EstimateItem } from '@/types/features/estimates/estimateItem'
import { useEstimateItemTree } from '@/hooks/features/estimates/useEstimateItems'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils/estimateUtils'
import { Edit, Save, X, ArrowUp, ArrowDown } from 'lucide-react'

interface EstimateBreakdownEditCardProps {
  estimate: Estimate
}

export function EstimateBreakdownEditCard({ estimate }: EstimateBreakdownEditCardProps) {
  const { data: items, isLoading } = useEstimateItemTree(estimate.id)
  const [activeTab, setActiveTab] = useState('small')
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string | number>>({})

  // アイテムを階層別に分類（breakdown_idの有無で判定）
  const smallItems = items?.filter(item => item.breakdown_id) || []
  const mediumItems = items?.filter(item => !item.breakdown_id && item.construction_method) || []
  const largeItems = items?.filter(item => !item.breakdown_id && !item.construction_method) || []

  const handleEdit = (item: EstimateItem) => {
    setEditingItem(item.id)
    setEditValues({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      construction_method: item.construction_method || '',
      remarks: item.remarks || '',
      order_request_content: item.order_request_content || '',
    })
  }

  const handleSave = (itemId: string) => {
    // TODO: 更新処理を実装
    console.log('Save item:', itemId, editValues)
    setEditingItem(null)
    setEditValues({})
  }

  const handleCancel = () => {
    setEditingItem(null)
    setEditValues({})
  }

  const handleMoveUp = (itemId: string) => {
    // TODO: 上移動処理を実装
    console.log('Move up:', itemId)
  }

  const handleMoveDown = (itemId: string) => {
    // TODO: 下移動処理を実装
    console.log('Move down:', itemId)
  }

  const renderEditableTable = (items: EstimateItem[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          データがありません
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300">
              <th className="text-left p-3 text-sm font-medium text-gray-600 border-r border-gray-300">工法</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600 border-r border-gray-300">工事分類</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600 border-r border-gray-300">摘要</th>
              <th className="text-center p-3 text-sm font-medium text-gray-600 border-r border-gray-300">数量</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600 border-r border-gray-300">単価</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600 border-r border-gray-300">金額</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600 border-r border-gray-300">備考</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600 border-r border-gray-300">発注先</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600 border-r border-gray-300">発注依頼内容</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600 border-r border-gray-300">予想原価</th>
              <th className="text-center p-3 text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-300 hover:bg-gray-50">
                <td className="p-3 text-sm border-r border-gray-300">
                  {editingItem === item.id ? (
                    <Input
                      value={editValues.construction_method || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, construction_method: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  ) : (
                    item.construction_method || '-'
                  )}
                </td>
                <td className="p-3 text-sm border-r border-gray-300">
                  {item.construction_classification_id ? '分類' : '-'}
                </td>
                <td className="p-3 text-sm border-r border-gray-300">
                  {editingItem === item.id ? (
                    <div className="space-y-1">
                      <Input
                        value={editValues.name || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                        className="h-8 text-sm"
                        placeholder="項目名"
                      />
                      <Input
                        value={editValues.description || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                        className="h-8 text-sm"
                        placeholder="説明"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-3 text-sm text-center border-r border-gray-300">
                  {editingItem === item.id ? (
                    <div className="space-y-1">
                      <Input
                        type="number"
                        value={editValues.quantity || 0}
                        onChange={(e) => setEditValues(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                        className="h-8 text-sm w-20"
                        min="0"
                        step="0.01"
                      />
                      <Input
                        value={editValues.unit || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, unit: e.target.value }))}
                        className="h-8 text-sm w-16"
                        placeholder="単位"
                      />
                    </div>
                  ) : (
                    item.quantity > 0 ? `${item.quantity.toLocaleString()} ${item.unit}` : '-'
                  )}
                </td>
                <td className="p-3 text-sm text-right border-r border-gray-300">
                  {editingItem === item.id ? (
                    <Input
                      type="number"
                      value={editValues.unit_price || 0}
                      onChange={(e) => setEditValues(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                      className="h-8 text-sm w-24"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    item.unit_price > 0 ? formatCurrency(item.unit_price) : '-'
                  )}
                </td>
                <td className="p-3 text-sm text-right border-r border-gray-300 font-medium">
                  {formatCurrency(item.amount)}
                </td>
                <td className="p-3 text-sm border-r border-gray-300">
                  {editingItem === item.id ? (
                    <Input
                      value={editValues.remarks || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, remarks: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="備考"
                    />
                  ) : (
                    item.remarks || '-'
                  )}
                </td>
                <td className="p-3 text-sm border-r border-gray-300">
                  {item.supplier_id ? '発注先' : '-'}
                </td>
                <td className="p-3 text-sm border-r border-gray-300">
                  {editingItem === item.id ? (
                    <Input
                      value={editValues.order_request_content || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, order_request_content: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="発注依頼内容"
                    />
                  ) : (
                    item.order_request_content || '-'
                  )}
                </td>
                <td className="p-3 text-sm text-right border-r border-gray-300">
                  {formatCurrency(item.estimated_cost)}
                </td>
                <td className="p-3 text-sm text-center">
                  <div className="flex items-center justify-center gap-1">
                    {editingItem === item.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                          onClick={() => handleSave(item.id)}
                          title="保存"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-600 hover:text-gray-700"
                          onClick={handleCancel}
                          title="キャンセル"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEdit(item)}
                          title="編集"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleMoveUp(item.id)}
                            title="上に移動"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                        )}
                        {index < items.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleMoveDown(item.id)}
                            title="下に移動"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>見積内訳（編集）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>見積内訳（編集）</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="small" disabled={smallItems.length === 0}>
              小内訳 {smallItems.length > 0 && `(${smallItems.length})`}
            </TabsTrigger>
            <TabsTrigger value="medium" disabled={mediumItems.length === 0}>
              中内訳 {mediumItems.length > 0 && `(${mediumItems.length})`}
            </TabsTrigger>
            <TabsTrigger value="large" disabled={largeItems.length === 0}>
              大内訳 {largeItems.length > 0 && `(${largeItems.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="small" className="mt-4">
            {renderEditableTable(smallItems)}
          </TabsContent>

          <TabsContent value="medium" className="mt-4">
            {renderEditableTable(mediumItems)}
          </TabsContent>

          <TabsContent value="large" className="mt-4">
            {renderEditableTable(largeItems)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
