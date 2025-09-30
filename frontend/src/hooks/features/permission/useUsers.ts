import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/features/permission/permissionService'

// ユーザー一覧取得用のクエリキー
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, string | number | boolean | undefined>) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
}

// ユーザー一覧取得用のカスタムフック
export function useUsers(params?: {
  search?: string
  is_active?: boolean
  system_level?: string
  department_id?: number
  position_id?: number
  sort_by?: string
  sort_direction?: string
  per_page?: number
  page?: number
}) {
  return useQuery({
    queryKey: userKeys.list(params || {}),
    queryFn: async () => {
      // パラメータ名を変換
      const apiParams = {
        ...params,
        pageSize: params?.per_page,
        sort_order: params?.sort_direction,
      }
      // per_pageとsort_directionを削除
      delete apiParams.per_page
      delete apiParams.sort_direction
      
      const response = await userService.getUsers(apiParams)
      console.log('useUsers - API response:', response)
      // バックエンドのレスポンス形式に合わせて調整
      if (response?.users) {
        return response // { users: [...], totalCount: number } 形式
      }
      return response || { users: [], totalCount: 0 }
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}

// ユーザー詳細取得用のカスタムフック
export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await userService.getUser(id)
      return response.data
    },
    enabled: !!id, // idが存在する場合のみ実行
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
