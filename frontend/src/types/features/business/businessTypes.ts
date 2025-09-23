export interface BusinessType {
  id: number
  code: string
  name: string
  description?: string
  category: string
  sort_order: number
  is_active: boolean
  requires_approval: boolean
  default_permissions: string[]
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface BusinessTypeCategory {
  category: string
  name: string
  description?: string
  business_types: BusinessType[]
}

export interface CreateBusinessTypeRequest {
  code: string
  name: string
  description?: string
  category: string
  sort_order?: number
  is_active?: boolean
  requires_approval?: boolean
  default_permissions?: string[]
  settings?: Record<string, unknown>
}

export interface UpdateBusinessTypeRequest {
  name?: string
  description?: string
  category?: string
  sort_order?: number
  is_active?: boolean
  requires_approval?: boolean
  default_permissions?: string[]
  settings?: Record<string, unknown>
}
