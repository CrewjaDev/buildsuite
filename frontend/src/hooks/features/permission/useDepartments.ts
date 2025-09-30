import { useQuery } from '@tanstack/react-query'
import { departmentService } from '@/services/features/permission/permissionService'

// 部署一覧取得用のクエリキー
export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (filters: Record<string, string | number | boolean | undefined>) => [...departmentKeys.lists(), { filters }] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...departmentKeys.details(), id] as const,
}

// 部署一覧取得用のカスタムフック
export function useDepartments(params?: {
  search?: string
  is_active?: boolean
  level?: number
  parent_id?: number
  root_only?: boolean
  sort_by?: string
  sort_direction?: string
  per_page?: number
  page?: number
}) {
  return useQuery({
    queryKey: departmentKeys.list(params || {}),
    queryFn: async () => {
      const response = await departmentService.getDepartments(params)
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

// 部署詳細取得用のカスタムフック
export function useDepartment(id: number) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: async () => {
      const response = await departmentService.getDepartment(id)
      return response.data
    },
    enabled: !!id, // idが存在する場合のみ実行
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
