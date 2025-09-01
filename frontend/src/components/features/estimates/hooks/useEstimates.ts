import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  estimateService, 
  partnerService, 
  projectTypeService, 
  constructionClassificationService
} from '../utils/api'
import { 
  EstimateSearchParams, 
  EstimateItemSearchParams, 
  PartnerSearchParams,
  Estimate,
  EstimateItem
} from '../types'
import { toast } from 'sonner'

// エラーハンドリング用の型定義
interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

// ===== 見積関連のフック =====

// 見積一覧取得フック
export const useEstimates = (params: EstimateSearchParams) => {
  return useQuery({
    queryKey: ['estimates', params],
    queryFn: () => estimateService.getEstimates(params),
    staleTime: 5 * 60 * 1000, // 5分
    gcTime: 10 * 60 * 1000, // 10分
  })
}

// 見積詳細取得フック
export const useEstimate = (id: string) => {
  return useQuery({
    queryKey: ['estimate', id],
    queryFn: () => estimateService.getEstimate(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5分
    gcTime: 10 * 60 * 1000, // 10分
  })
}

// 見積作成フック
export const useCreateEstimate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: estimateService.createEstimate,
    onSuccess: (data) => {
      toast.success('見積を作成しました')
      // 見積一覧を更新
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      // 作成された見積の詳細をキャッシュに追加
      queryClient.setQueryData(['estimate', data.id], data)
    },
    onError: (error: unknown) => {
      console.error('見積作成エラー:', error)
      toast.error((error as ApiError)?.response?.data?.message || '見積の作成に失敗しました')
    },
  })
}

// 見積更新フック
export const useUpdateEstimate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Estimate> }) =>
      estimateService.updateEstimate(id, data),
    onSuccess: (data, variables) => {
      toast.success('見積を更新しました')
      // 見積一覧と詳細を更新
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      queryClient.setQueryData(['estimate', variables.id], data)
    },
    onError: (error: unknown) => {
      console.error('見積更新エラー:', error)
      toast.error((error as ApiError)?.response?.data?.message || '見積の更新に失敗しました')
    },
  })
}

// 見積削除フック
export const useDeleteEstimate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: estimateService.deleteEstimate,
    onSuccess: (data, variables) => {
      toast.success('見積を削除しました')
      // 見積一覧を更新
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      // 削除された見積の詳細をキャッシュから削除
      queryClient.removeQueries({ queryKey: ['estimate', variables] })
    },
    onError: (error: unknown) => {
      console.error('見積削除エラー:', error)
      toast.error((error as ApiError)?.response?.data?.message || '見積の削除に失敗しました')
    },
  })
}

// ===== 見積明細関連のフック =====

// 見積明細一覧取得フック
export const useEstimateItems = (params: EstimateItemSearchParams) => {
  return useQuery({
    queryKey: ['estimateItems', params],
    queryFn: () => estimateService.getEstimateItems(params),
    staleTime: 5 * 60 * 1000, // 5分
    gcTime: 10 * 60 * 1000, // 10分
  })
}

// 見積明細作成フック
export const useCreateEstimateItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: estimateService.createEstimateItem,
    onSuccess: () => {
      toast.success('見積明細を作成しました')
      // 見積明細一覧を更新
      queryClient.invalidateQueries({ queryKey: ['estimateItems'] })
      // 関連する見積の詳細も更新
      queryClient.invalidateQueries({ queryKey: ['estimate'] })
    },
    onError: (error: unknown) => {
      console.error('見積明細作成エラー:', error)
      toast.error((error as ApiError)?.response?.data?.message || '見積明細の作成に失敗しました')
    },
  })
}

// 見積明細更新フック
export const useUpdateEstimateItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EstimateItem> }) =>
      estimateService.updateEstimateItem(id, data),
    onSuccess: () => {
      toast.success('見積明細を更新しました')
      // 見積明細一覧を更新
      queryClient.invalidateQueries({ queryKey: ['estimateItems'] })
      // 関連する見積の詳細も更新
      queryClient.invalidateQueries({ queryKey: ['estimate'] })
    },
    onError: (error: unknown) => {
      console.error('見積明細更新エラー:', error)
      toast.error((error as ApiError)?.response?.data?.message || '見積明細の更新に失敗しました')
    },
  })
}

// 見積明細削除フック
export const useDeleteEstimateItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: estimateService.deleteEstimateItem,
    onSuccess: () => {
      toast.success('見積明細を削除しました')
      // 見積明細一覧を更新
      queryClient.invalidateQueries({ queryKey: ['estimateItems'] })
      // 関連する見積の詳細も更新
      queryClient.invalidateQueries({ queryKey: ['estimate'] })
    },
    onError: (error: unknown) => {
      console.error('見積明細削除エラー:', error)
      toast.error((error as ApiError)?.response?.data?.message || '見積明細の削除に失敗しました')
    },
  })
}

// ===== マスタデータ関連のフック =====

// 取引先一覧取得フック
export const usePartners = (params: PartnerSearchParams) => {
  return useQuery({
    queryKey: ['partners', params],
    queryFn: () => partnerService.getPartners(params),
    staleTime: 10 * 60 * 1000, // 10分（マスタデータは長め）
    gcTime: 30 * 60 * 1000, // 30分
  })
}

// プロジェクトタイプ一覧取得フック
export const useProjectTypes = () => {
  return useQuery({
    queryKey: ['projectTypes'],
    queryFn: () => projectTypeService.getProjectTypes(),
    staleTime: 10 * 60 * 1000, // 10分
    gcTime: 30 * 60 * 1000, // 30分
  })
}

// 工事分類一覧取得フック
export const useConstructionClassifications = () => {
  return useQuery({
    queryKey: ['constructionClassifications'],
    queryFn: () => constructionClassificationService.getConstructionClassifications(),
    staleTime: 10 * 60 * 1000, // 10分
    gcTime: 30 * 60 * 1000, // 30分
  })
}
