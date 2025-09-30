import { useQuery } from '@tanstack/react-query'
import { roleService } from '@/services/features/permission/permissionService'

// 役割一覧取得用のクエリキー
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (filters: Record<string, string | number | boolean | undefined>) => [...roleKeys.lists(), { filters }] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: number) => [...roleKeys.details(), id] as const,
}

// 役割一覧取得用のカスタムフック
export function useRoles(params?: {
  search?: string
  is_active?: boolean
  sort_by?: string
  sort_direction?: string
  per_page?: number
  page?: number
}) {
  return useQuery({
    queryKey: roleKeys.list(params || {}),
    queryFn: async () => {
      const response = await roleService.getRoles(params)
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

// 役割詳細取得用のカスタムフック
export function useRole(id: number) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: async () => {
      const response = await roleService.getRole(id)
      return response.data
    },
    enabled: !!id, // idが存在する場合のみ実行
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
