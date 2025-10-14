'use client'

import { useState } from 'react'
import { EstimateItem } from '@/types/features/estimates/estimateItem'
import { useEstimateItems, useCreateEstimateItem, useUpdateEstimateItem, useDeleteEstimateItem } from '@/hooks/features/estimates/useEstimateItems'
import { useEstimateBreakdowns } from '@/hooks/features/estimates/useEstimateBreakdowns'
import { EstimateItemList } from './EstimateItemList'
import { EstimateItemForm } from './EstimateItemForm'
import { useToast } from '@/components/ui/toast'
import { CreateEstimateItemRequest, UpdateEstimateItemRequest } from '@/types/features/estimates/estimateItem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'

interface EstimateItemsCardProps {
  estimateId: string
  isReadOnly?: boolean
}

export function EstimateItemsCard({ estimateId, isReadOnly = false }: EstimateItemsCardProps) {
  const { addToast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<EstimateItem | null>(null)

  // データ取得
  const { data: items, isLoading, error } = useEstimateItems(estimateId)
  const { data: breakdowns } = useEstimateBreakdowns(estimateId)
  
  // ミューテーション
  const createItemMutation = useCreateEstimateItem()
  const updateItemMutation = useUpdateEstimateItem()
  const deleteItemMutation = useDeleteEstimateItem()

  const handleAddItem = () => {
    setEditingItem(null)
    setShowForm(true)
  }

  const handleEditItem = (item: EstimateItem) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('この明細を削除しますか？')) {
      return
    }

    try {
      await deleteItemMutation.mutateAsync(itemId)
      addToast({
        title: "明細を削除しました",
        description: "見積明細が正常に削除されました。",
        type: "success"
      })
    } catch (error: unknown) {
      console.error('明細削除エラー:', error)
      
      // APIから返される詳細なエラーメッセージを取得
      let errorMessage = "明細の削除中にエラーが発生しました。"
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } }
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      addToast({
        title: "削除に失敗しました",
        description: errorMessage,
        type: "error"
      })
    }
  }


  const handleSubmit = async (data: CreateEstimateItemRequest | UpdateEstimateItemRequest) => {
    try {
      if (editingItem) {
        // 更新
        await updateItemMutation.mutateAsync({
          id: editingItem.id,
          data: data as UpdateEstimateItemRequest
        })
        addToast({
          title: "明細を更新しました",
          description: "見積明細が正常に更新されました。",
          type: "success"
        })
      } else {
        // 作成
        await createItemMutation.mutateAsync(data as CreateEstimateItemRequest)
        addToast({
          title: "明細を追加しました",
          description: "見積明細が正常に追加されました。",
          type: "success"
        })
      }
      setShowForm(false)
      setEditingItem(null)
    } catch (error: unknown) {
      console.error('明細操作エラー:', error)
      
      // APIから返される詳細なエラーメッセージを取得
      let errorMessage = editingItem ? "明細の更新中にエラーが発生しました。" : "明細の追加中にエラーが発生しました。"
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } }
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      addToast({
        title: editingItem ? "更新に失敗しました" : "追加に失敗しました",
        description: errorMessage,
        type: "error"
      })
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingItem(null)
  }




  if (!estimateId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>見積情報が読み込まれていません</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-600">見積明細を読み込み中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>見積明細の読み込みでエラーが発生しました</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            見積明細
          </CardTitle>
          {!isReadOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              明細追加
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <EstimateItemForm
            item={editingItem || undefined}
            estimateId={estimateId}
            breakdowns={breakdowns || []}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createItemMutation.isPending || updateItemMutation.isPending}
          />
        ) : (
          <EstimateItemList
            items={items || []}
            breakdowns={breakdowns || []}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            isReadOnly={isReadOnly}
          />
        )}
      </CardContent>
    </Card>
  )
}
