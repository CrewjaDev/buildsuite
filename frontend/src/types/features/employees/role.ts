// 役割関連の型定義

export interface Role {
  id: number
  name: string
  display_name: string
  description: string
  priority: number
  is_system: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: number
  user_id: number
  role_id: number
  assigned_at: string
  assigned_by: number
  is_active: boolean
  created_at: string
  updated_at: string
  role?: Role
}

export interface RoleCreateData {
  name: string
  display_name: string
  description?: string
  priority?: number
  is_system?: boolean
  is_active?: boolean
}

export type RoleUpdateData = Partial<RoleCreateData>

export interface RoleFilters {
  search?: string
  is_active?: boolean
  is_system?: boolean
  page?: number
  pageSize?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
