import { useQuery } from '@tanstack/react-query'
import { departmentService as generalDepartmentService } from '@/services/features/departments/departmentService'
import { departmentService as permissionDepartmentService } from '@/services/features/permission/permissionService'

// 部署一覧取得用のクエリキー
export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (filters: Record<string, string | number | boolean | undefined>) => [...departmentKeys.lists(), { filters }] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...departmentKeys.details(), id] as const,
  active: () => [...departmentKeys.all, 'active'] as const,
}

// 汎用的な部署一覧取得（ドロップダウン用）
export const useDepartments = () => {
  return useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: generalDepartmentService.getDepartments,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}

// アクティブな部署のみ取得（ドロップダウン用）
export const useActiveDepartments = () => {
  return useQuery({
    queryKey: departmentKeys.active(),
    queryFn: generalDepartmentService.getActiveDepartments,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}

// 権限管理用の部署一覧取得（テーブル表示用）
export function usePermissionDepartments(params?: {
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
      const response = await permissionDepartmentService.getDepartments(params)
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

// 権限管理用の部署詳細取得
export function usePermissionDepartment(id: number) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: async () => {
      const response = await permissionDepartmentService.getDepartment(id)
      return response.data
    },
    enabled: !!id, // idが存在する場合のみ実行
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}