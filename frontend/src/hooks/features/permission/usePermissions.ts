import { useQuery } from '@tanstack/react-query'
import { permissionService } from '@/services/features/permission/permissionService'

// 権限一覧取得用のクエリキー
export const permissionKeys = {
  all: ['permissions'] as const,
  lists: () => [...permissionKeys.all, 'list'] as const,
  list: (filters: Record<string, string | number | undefined>) => [...permissionKeys.lists(), { filters }] as const,
}

// 権限一覧取得用のカスタムフック
export function usePermissions(params?: {
  search?: string
  module?: string
  per_page?: number
}) {
  return useQuery({
    queryKey: permissionKeys.list(params || {}),
    queryFn: async () => {
      const response = await permissionService.getPermissions(params || { per_page: 1000 })
      // APIレスポンスの構造に応じて適切なデータを取得
      const permissionsData = response.data?.data || response.data || []
      return Array.isArray(permissionsData) ? permissionsData : []
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}

// 権限詳細取得用のカスタムフック（将来の拡張用）
export function usePermission(id: number) {
  return useQuery({
    queryKey: [...permissionKeys.all, 'detail', id],
    queryFn: async () => {
      const response = await permissionService.getPermission(id)
      return response.data
    },
    enabled: !!id, // idが存在する場合のみ実行
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
