import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { estimateBreakdownService } from '@/services/features/estimates/estimateBreakdownService'
import { 
  CreateEstimateBreakdownRequest,
  UpdateEstimateBreakdownRequest,
  EstimateBreakdownOrderRequest
} from '@/types/features/estimates/estimateBreakdown'

// 見積内訳一覧取得
export function useEstimateBreakdowns(estimateId: string) {
  return useQuery({
    queryKey: ['estimate-breakdowns', estimateId],
    queryFn: () => estimateBreakdownService.getBreakdowns(estimateId),
    enabled: !!estimateId,
  })
}

// 見積内訳ツリー取得
export function useEstimateBreakdownTree(estimateId: string) {
  return useQuery({
    queryKey: ['estimate-breakdown-tree', estimateId],
    queryFn: () => estimateBreakdownService.getBreakdownTree(estimateId),
    enabled: !!estimateId,
  })
}

// 見積内訳詳細取得
export function useEstimateBreakdown(breakdownId: string) {
  return useQuery({
    queryKey: ['estimate-breakdown', breakdownId],
    queryFn: () => estimateBreakdownService.getBreakdown(breakdownId),
    enabled: !!breakdownId,
  })
}

// 見積内訳作成
export function useCreateEstimateBreakdown() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEstimateBreakdownRequest) => 
      estimateBreakdownService.createBreakdown(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdowns', data.estimate_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdown-tree', data.estimate_id] 
      })
      toast.success('見積内訳を作成しました')
    },
    onError: (error: Error) => {
      console.error('見積内訳作成エラー:', error)
      toast.error('見積内訳の作成に失敗しました')
    },
  })
}

// 見積内訳更新
export function useUpdateEstimateBreakdown() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ breakdownId, data }: { 
      breakdownId: string
      data: UpdateEstimateBreakdownRequest 
    }) => estimateBreakdownService.updateBreakdown(breakdownId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdowns', data.estimate_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdown-tree', data.estimate_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdown', data.id] 
      })
      toast.success('見積内訳を更新しました')
    },
    onError: (error: Error) => {
      console.error('見積内訳更新エラー:', error)
      toast.error('見積内訳の更新に失敗しました')
    },
  })
}

// 見積内訳削除
export function useDeleteEstimateBreakdown() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ breakdownId }: { 
      breakdownId: string
      estimateId: string 
    }) => estimateBreakdownService.deleteBreakdown(breakdownId),
    onSuccess: (_, { estimateId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdowns', estimateId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdown-tree', estimateId] 
      })
      toast.success('見積内訳を削除しました')
    },
    onError: (error: Error) => {
      console.error('見積内訳削除エラー:', error)
      toast.error('見積内訳の削除に失敗しました')
    },
  })
}

// 見積内訳順序更新
export function useUpdateEstimateBreakdownOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ estimateId, orders }: { 
      estimateId: string
      orders: EstimateBreakdownOrderRequest[] 
    }) => estimateBreakdownService.updateBreakdownOrder(estimateId, orders),
    onSuccess: (_, { estimateId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdowns', estimateId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdown-tree', estimateId] 
      })
      toast.success('見積内訳の順序を更新しました')
    },
    onError: (error: Error) => {
      console.error('見積内訳順序更新エラー:', error)
      toast.error('見積内訳の順序更新に失敗しました')
    },
  })
}

// 金額再計算
export function useRecalculateEstimateBreakdownAmounts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (estimateId: string) => 
      estimateBreakdownService.recalculateAmounts(estimateId),
    onSuccess: (_, estimateId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdowns', estimateId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdown-tree', estimateId] 
      })
      toast.success('金額を再計算しました')
    },
    onError: (error: Error) => {
      console.error('金額再計算エラー:', error)
      toast.error('金額の再計算に失敗しました')
    },
  })
}
