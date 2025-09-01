// 工事分類のReact Queryフック
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { constructionClassificationService } from '@/services/features/estimates/constructionClassificationService'
import {
  CreateConstructionClassificationRequest,
  UpdateConstructionClassificationRequest,
  ConstructionClassificationSearchParams,
} from '@/types/features/estimates/constructionClassification'

// 工事分類一覧取得フック
export const useConstructionClassifications = (params: ConstructionClassificationSearchParams = {}) => {
  return useQuery({
    queryKey: ['construction-classifications', params],
    queryFn: () => constructionClassificationService.getConstructionClassifications(params),
    staleTime: 30 * 60 * 1000, // 30分間キャッシュ（マスターデータなので長め）
    placeholderData: (previousData) => previousData, // ページネーション時に前のデータを保持
  })
}

// 工事分類詳細取得フック
export const useConstructionClassification = (id: number) => {
  return useQuery({
    queryKey: ['construction-classification', id],
    queryFn: () => constructionClassificationService.getConstructionClassification(id),
    enabled: !!id, // idが存在する時のみ実行
    staleTime: 30 * 60 * 1000, // 30分間キャッシュ
  })
}

// 工事分類作成フック
export const useCreateConstructionClassification = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateConstructionClassificationRequest) => 
      constructionClassificationService.createConstructionClassification(data),
    onSuccess: (newConstructionClassification) => {
      // 工事分類一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['construction-classifications'] })
      // 工事分類オプションのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['construction-classification-options'] })
      // 新しく作成された工事分類のキャッシュを設定
      queryClient.setQueryData(['construction-classification', newConstructionClassification.id], newConstructionClassification)
    },
  })
}

// 工事分類更新フック
export const useUpdateConstructionClassification = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateConstructionClassificationRequest }) => 
      constructionClassificationService.updateConstructionClassification(id, data),
    onSuccess: (updatedConstructionClassification) => {
      // 工事分類詳細のキャッシュを更新
      queryClient.setQueryData(['construction-classification', updatedConstructionClassification.id], updatedConstructionClassification)
      // 工事分類一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['construction-classifications'] })
      // 工事分類オプションのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['construction-classification-options'] })
    },
  })
}

// 工事分類削除フック
export const useDeleteConstructionClassification = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => constructionClassificationService.deleteConstructionClassification(id),
    onSuccess: (_, deletedId) => {
      // 工事分類詳細のキャッシュを削除
      queryClient.removeQueries({ queryKey: ['construction-classification', deletedId] })
      // 工事分類一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['construction-classifications'] })
      // 工事分類オプションのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['construction-classification-options'] })
    },
  })
}

// 工事分類オプション取得フック（ドロップダウン用）
export const useConstructionClassificationOptions = () => {
  return useQuery({
    queryKey: ['construction-classification-options'],
    queryFn: () => constructionClassificationService.getConstructionClassificationOptions(),
    staleTime: 60 * 60 * 1000, // 1時間キャッシュ（マスターデータなので長め）
  })
}
