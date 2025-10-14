// 見積基本情報のReact Queryフック
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { estimateService } from '@/services/features/estimates/estimateService'
import {
  CreateEstimateRequest,
  UpdateEstimateRequest,
  EstimateSearchParams,
} from '@/types/features/estimates/estimate'

// 見積一覧取得フック
export const useEstimates = (params: EstimateSearchParams = {}) => {
  return useQuery({
    queryKey: ['estimates', params],
    queryFn: () => estimateService.getEstimates(params),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    placeholderData: (previousData) => previousData, // ページネーション時に前のデータを保持
  })
}

// 見積詳細取得フック
export const useEstimate = (id: string) => {
  return useQuery({
    queryKey: ['estimate', id],
    queryFn: () => estimateService.getEstimate(id),
    enabled: !!id, // idが存在する時のみ実行
    staleTime: 10 * 60 * 1000, // 10分間キャッシュ
    retry: false, // リトライを完全に無効化
    refetchOnWindowFocus: false, // ウィンドウフォーカス時の再取得を無効化
    refetchOnMount: false, // マウント時の再取得を無効化
  })
}

// 見積作成フック
export const useCreateEstimate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateEstimateRequest) => estimateService.createEstimate(data),
    onSuccess: (newEstimate) => {
      // 見積一覧のキャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      // 見積統計のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-stats'] })
      // 新しく作成された見積のキャッシュを設定（削除されたデータのキャッシュは設定しない）
      queryClient.setQueryData(['estimate', newEstimate.id], newEstimate)
    },
  })
}

// 見積更新フック
export const useUpdateEstimate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEstimateRequest }) => 
      estimateService.updateEstimate(id, data),
    onSuccess: (updatedEstimate) => {
      // 見積詳細のキャッシュを更新
      queryClient.setQueryData(['estimate', updatedEstimate.id], updatedEstimate)
      // 見積一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      // 見積統計のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-stats'] })
    },
  })
}

// 見積削除フック
export const useDeleteEstimate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => estimateService.deleteEstimate(id),
    onSuccess: (_, deletedId) => {
      // 削除成功をログ出力
      console.log('見積削除成功:', deletedId)
      
      // 見積一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      // 見積統計のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-stats'] })
      // 承認関連のクエリも無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-approval'] })
      // 見積明細関連のクエリも無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-items'] })
      queryClient.invalidateQueries({ queryKey: ['estimate-breakdowns'] })
      
      // 削除された見積データへのアクセスを防ぐため、関連するクエリをすべて削除
      // 詳細ページから離脱した後に実行されるように遅延実行
      setTimeout(() => {
        queryClient.removeQueries({ queryKey: ['estimate', deletedId] })
        queryClient.removeQueries({ queryKey: ['estimate-items', deletedId] })
        queryClient.removeQueries({ queryKey: ['estimate-breakdowns', deletedId] })
        queryClient.removeQueries({ queryKey: ['estimate-approval', deletedId] })
      }, 100)
    },
    onError: (error: unknown) => {
      console.error('見積削除エラー:', error)
      // エラーログを出力（トーストは呼び出し元で処理）
    },
  })
}

// 見積統計取得フック
export const useEstimateStats = () => {
  return useQuery({
    queryKey: ['estimate-stats'],
    queryFn: () => estimateService.getEstimateStats(),
    staleTime: 10 * 60 * 1000, // 10分間キャッシュ
  })
}

// 見積番号生成フック
export const useGenerateEstimateNumber = () => {
  return useMutation({
    mutationFn: () => estimateService.generateEstimateNumber(),
  })
}

// 見積複製フック
export const useDuplicateEstimate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => estimateService.duplicateEstimate(id),
    onSuccess: (duplicatedEstimate) => {
      // 見積一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      // 見積統計のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-stats'] })
      // 複製された見積のキャッシュを設定
      queryClient.setQueryData(['estimate', duplicatedEstimate.id], duplicatedEstimate)
    },
  })
}

// 見積ステータス更新フック
export const useUpdateEstimateStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      estimateService.updateEstimateStatus(id, status),
    onSuccess: (updatedEstimate) => {
      // 見積詳細のキャッシュを更新
      queryClient.setQueryData(['estimate', updatedEstimate.id], updatedEstimate)
      // 見積一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      // 見積統計のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['estimate-stats'] })
    },
  })
}
