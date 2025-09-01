// ユーザー管理専用の型定義

// ユーザー管理一覧用のユーザー型
export interface UserManagementUser {
  id: number
  login_id: string
  employee_id: string
  name: string
  name_kana?: string
  gender?: string
  email?: string
  department?: {
    id: number
    name: string
    code: string
    position?: string
    is_primary: boolean
  }
  primary_department?: {
    id: number
    name: string
    code: string
    position?: string
    is_primary: boolean
  }
  position?: {
    id: number
    code: string
    name: string
    display_name: string
    level: number
  }
  job_title?: string
  hire_date?: string
  system_level?: string
  is_active: boolean
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// ユーザー管理一覧のレスポンス型
export interface UserManagementResponse {
  users: UserManagementUser[]
  totalCount: number
}

// ユーザー管理用の検索パラメータ型
export interface UserManagementSearchParams {
  page?: number
  pageSize?: number
  search?: string
  is_active?: boolean
  system_level?: string
  department_id?: number
  role_id?: number
  is_locked?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// ユーザー管理用のフィルター型
export interface UserManagementFilters {
  is_active?: boolean
  is_admin?: boolean
  system_level?: string
  department_id?: number
  role_id?: number
}

// ユーザー管理用のソート型
export interface UserManagementSort {
  field: keyof UserManagementUser
  direction: 'asc' | 'desc'
}
