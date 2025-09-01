// 工事分類の型定義

export interface ConstructionClassification {
  id: number
  code: string
  name: string
  display_name: string
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateConstructionClassificationRequest {
  code: string
  name: string
  display_name: string
  description?: string
  is_active?: boolean
  sort_order?: number
}

export interface UpdateConstructionClassificationRequest {
  code?: string
  name?: string
  display_name?: string
  description?: string
  is_active?: boolean
  sort_order?: number
}

export interface ConstructionClassificationSearchParams {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface ConstructionClassificationsResponse {
  data: ConstructionClassification[]
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

export interface ConstructionClassificationOption {
  value: number
  label: string
  code: string
}
