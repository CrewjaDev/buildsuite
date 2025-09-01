// 見積明細のReact Queryフック
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { estimateItemService } from '@/services/features/estimates/estimateItemService'
import {
  CreateEstimateItemRequest,
  UpdateEstimateItemRequest,
  EstimateItemSearchParams,
} from '@/types/features/estimates/estimateItem'

// 見積明細一覧取得フック
export const useEstimateItems = (params: EstimateItemSearchParams) => {
  return useQuery({
    queryKey: ['estimate-items', params],
    queryFn: () => estimateItemService.getEstimateItems(params),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  })
}

// 見積明細詳細取得フック
export const useEstimateItem = (id: number) => {
  return useQuery({
    queryKey: ['estimate-item', id],
    queryFn: () => estimateItemService.getEstimateItem(id),
    enabled: !!id, // idが存在する時のみ実行
    staleTime: 10 * 60 * 1000, // 10分間キャッシュ
  })
}

// 見積明細ツリー取得フック
export const useEstimateItemTree = (estimateId: number) => {
  return useQuery({
    queryKey: ['estimate-item-tree', estimateId],
    queryFn: () => estimateItemService.getEstimateItemTree(estimateId),
    enabled: !!estimateId, // estimateIdが存在する時のみ実行
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  })
}

// 見積明細統計取得フック
export const useEstimateItemStats = (estimateId: number) => {
  return useQuery({
    queryKey: ['estimate-item-stats', estimateId],
    queryFn: () => estimateItemService.getEstimateItemStats(estimateId),
    enabled: !!estimateId, // estimateIdが存在する時のみ実行
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  })
}

// 見積明細作成フック
export const useCreateEstimateItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateEstimateItemRequest) => estimateItemService.createEstimateItem(data),
    onSuccess: (newItem) => {
      // 見積明細一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-items'] })
      // 見積明細ツリーのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-item-tree', newItem.estimate_id] })
      // 見積明細統計のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-item-stats', newItem.estimate_id] })
      // 見積詳細のキャッシュを無効化（金額が変わるため）
      queryClient.invalidateQueries({ queryKey: ['estimate', newItem.estimate_id] })
    },
  })
}

// 見積明細更新フック
export const useUpdateEstimateItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEstimateItemRequest }) => 
      estimateItemService.updateEstimateItem(id, data),
    onSuccess: (updatedItem) => {
      // 見積明細詳細のキャッシュを更新
      queryClient.setQueryData(['estimate-item', updatedItem.id], updatedItem)
      // 見積明細一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-items'] })
      // 見積明細ツリーのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-item-tree', updatedItem.estimate_id] })
      // 見積明細統計のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-item-stats', updatedItem.estimate_id] })
      // 見積詳細のキャッシュを無効化（金額が変わるため）
      queryClient.invalidateQueries({ queryKey: ['estimate', updatedItem.estimate_id] })
    },
  })
}

// 見積明細削除フック
export const useDeleteEstimateItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => estimateItemService.deleteEstimateItem(id),
    onSuccess: (_, deletedId) => {
      // 見積明細詳細のキャッシュを削除
      queryClient.removeQueries({ queryKey: ['estimate-item', deletedId] })
      // 見積明細一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-items'] })
      // 見積明細ツリーのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-item-tree'] })
      // 見積明細統計のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-item-stats'] })
      // 見積詳細のキャッシュを無効化（金額が変わるため）
      queryClient.invalidateQueries({ queryKey: ['estimate'] })
    },
  })
}

// 見積明細一括更新（並び順）フック
export const useUpdateEstimateItemOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ estimateId, items }: { estimateId: number; items: { id: number; sort_order: number }[] }) => 
      estimateItemService.updateEstimateItemOrder(estimateId, items),
    onSuccess: (_, { estimateId }) => {
      // 見積明細一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-items'] })
      // 見積明細ツリーのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-item-tree', estimateId] })
    },
  })
}

// 見積明細一括削除フック
export const useDeleteEstimateItems = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ estimateId, itemIds }: { estimateId: number; itemIds: number[] }) => 
      estimateItemService.deleteEstimateItems(estimateId, itemIds),
    onSuccess: (_, { estimateId }) => {
      // 見積明細一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-items'] })
      // 見積明細ツリーのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-item-tree', estimateId] })
      // 見積明細統計のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-item-stats', estimateId] })
      // 見積詳細のキャッシュを無効化（金額が変わるため）
      queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] })
    },
  })
}
