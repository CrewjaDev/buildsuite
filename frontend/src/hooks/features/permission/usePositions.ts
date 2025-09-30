import { useQuery } from '@tanstack/react-query'
import { positionService } from '@/services/features/permission/permissionService'

// 職位一覧取得用のクエリキー
export const positionKeys = {
  all: ['positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  list: (filters: Record<string, string | number | boolean | undefined>) => [...positionKeys.lists(), { filters }] as const,
  details: () => [...positionKeys.all, 'detail'] as const,
  detail: (id: number) => [...positionKeys.details(), id] as const,
}

// 職位一覧取得用のカスタムフック
export function usePositions(params?: {
  search?: string
  is_active?: boolean
  level?: number
  sort_by?: string
  sort_direction?: string
  per_page?: number
  page?: number
}) {
  return useQuery({
    queryKey: positionKeys.list(params || {}),
    queryFn: async () => {
      const response = await positionService.getPositions(params)
      // ページネーションされたレスポンスからデータを抽出
      if (response?.data) {
        return response.data // ページネーションされたデータ
      }
      return response || []
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}

// 職位詳細取得用のカスタムフック
export function usePosition(id: number) {
  return useQuery({
    queryKey: positionKeys.detail(id),
    queryFn: async () => {
      const response = await positionService.getPosition(id)
      return response.data
    },
    enabled: !!id, // idが存在する場合のみ実行
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
