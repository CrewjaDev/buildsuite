// 工事種別（プロジェクトタイプ）の型定義

export interface ProjectType {
  id: number
  code: string
  name: string
  display_name: string
  description?: string
  is_active: boolean
  sort_order: number
  overhead_rate?: number
  cost_expense_rate?: number
  material_expense_rate?: number
  created_at: string
  updated_at: string
}

export interface CreateProjectTypeRequest {
  code: string
  name: string
  display_name: string
  description?: string
  is_active?: boolean
  sort_order?: number
}

export interface UpdateProjectTypeRequest {
  code?: string
  name?: string
  display_name?: string
  description?: string
  is_active?: boolean
  sort_order?: number
}

export interface ProjectTypeSearchParams {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface ProjectTypesResponse {
  data: ProjectType[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
  links: {
    first: string
    last: string
    prev?: string
    next?: string
  }
}

export interface ProjectTypeOption {
  id: number
  name: string
}
