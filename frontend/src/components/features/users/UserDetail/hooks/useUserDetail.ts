import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/lib/userService'

// 詳細なユーザー情報の型定義
export interface UserDetail {
  id: number
  login_id?: string
  employee_id: string
  name: string
  name_kana?: string
  email?: string
  birth_date?: string
  gender?: string
  phone?: string
  mobile_phone?: string
  postal_code?: string
  prefecture?: string
  address?: string
  position?: {
    id: number
    code: string
    name: string
    display_name: string
    level: number
  }
  job_title?: string
  hire_date?: string
  service_years?: number
  service_months?: number
  system_level?: string
  is_active: boolean
  is_admin: boolean
  last_login_at?: string
  password_changed_at?: string
  password_expires_at?: string
  failed_login_attempts: number
  locked_at?: string
  is_locked: boolean
  is_password_expired: boolean
  roles: Array<{
    id: number
    name: string
    display_name: string
    priority: number
  }>
  departments: Array<{
    id: number
    name: string
    code: string
    position?: string
    is_primary: boolean
  }>
  system_level_info?: {
    code: string
    name: string
    display_name: string
    priority: number
  }
  primary_department?: {
    id: number
    name: string
    code: string
    position?: string
    is_primary: boolean
  }
  created_at: string
  updated_at: string
}

// ユーザー詳細データ取得フック
export const useUserDetail = (id: number) => {
  return useQuery({
    queryKey: ['userDetail', id],
    queryFn: async (): Promise<UserDetail> => {
      const response = await userService.getUser(id)
      // User型からUserDetail型に変換
      return {
        ...response,
        // バックエンドから返されるis_activeフィールドを使用
        is_active: response.is_active ?? (response.status === 'active'),
        // バックエンドから返されるフィールドを使用、なければデフォルト値
        is_admin: response.is_admin ?? false,
        failed_login_attempts: response.failed_login_attempts ?? 0,
        is_locked: response.is_locked ?? false,
        is_password_expired: response.is_password_expired ?? false,
        roles: response.roles ?? [],
        departments: response.departments ?? [],
        created_at: response.created_at ?? response.createdAt,
        updated_at: response.updated_at ?? response.updatedAt,
      } as UserDetail
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}

// ユーザー更新フック
export const useUpdateUserDetail = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UserDetail> }) => {
      return await userService.updateUser(id, data)
    },
    onSuccess: (_, { id }) => {
      // 関連するクエリを無効化
      queryClient.invalidateQueries({ queryKey: ['userDetail', id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => {
      console.error('User update error:', error)
    },
  })
}

// ユーザー削除フック
export const useDeleteUserDetail = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await userService.deleteUser(id)
    },
    onSuccess: () => {
      // ユーザー一覧を更新
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => {
      console.error('User delete error:', error)
    },
  })
}

// ユーザー詳細データの初期化
export const useUserDetailInitializer = (id: number) => {
  const { data: user, isLoading, error } = useUserDetail(id)
  
  return {
    user,
    isLoading,
    error,
    // データの存在確認
    hasData: !!user,
    // 基本情報の存在確認
    hasBasicInfo: !!(user?.name && user?.employee_id),
    // 所属情報の存在確認
    hasDepartmentInfo: !!(user?.departments && user.departments.length > 0),
    // 権限情報の存在確認
    hasRoleInfo: !!(user?.roles && user.roles.length > 0),
    // 履歴情報の存在確認
    hasHistoryInfo: !!(user?.created_at && user?.updated_at),
  }
}