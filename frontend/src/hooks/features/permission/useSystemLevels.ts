import { useQuery } from '@tanstack/react-query'
import { systemLevelService } from '@/services/features/permission/permissionService'

// システム権限レベル一覧取得用のクエリキー
export const systemLevelKeys = {
  all: ['systemLevels'] as const,
  lists: () => [...systemLevelKeys.all, 'list'] as const,
  list: (filters: Record<string, string | number | boolean | undefined>) => [...systemLevelKeys.lists(), { filters }] as const,
  details: () => [...systemLevelKeys.all, 'detail'] as const,
  detail: (id: number) => [...systemLevelKeys.details(), id] as const,
}

// システム権限レベル一覧取得用のカスタムフック
export function useSystemLevels(params?: {
  search?: string
  is_active?: boolean
  sort_by?: string
  sort_direction?: string
  per_page?: number
  page?: number
}) {
  return useQuery({
    queryKey: systemLevelKeys.list(params || {}),
    queryFn: async () => {
      const response = await systemLevelService.getSystemLevels(params)
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

// システム権限レベル詳細取得用のカスタムフック
export function useSystemLevel(id: number) {
  return useQuery({
    queryKey: systemLevelKeys.detail(id),
    queryFn: async () => {
      const response = await systemLevelService.getSystemLevel(id)
      return response.data
    },
    enabled: !!id, // idが存在する場合のみ実行
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
