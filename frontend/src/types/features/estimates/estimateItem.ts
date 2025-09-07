// 見積明細の型定義

export interface EstimateItem {
  id: string
  estimate_id: string
  breakdown_id?: string
  display_order: number
  name: string
  description?: string
  quantity: number
  unit: string
  unit_price: number
  amount: number
  estimated_cost: number
  supplier_id?: number
  order_request_content?: string
  construction_method?: string
  construction_classification_id?: number
  construction_classification_name?: string
  remarks?: string
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
  
  // Relations
  estimate?: {
    id: string
    estimate_number: string
    project_name: string
  }
  breakdown?: {
    id: string
    name: string
    breakdown_type: string
  }
  supplier?: {
    id: number
    name: string
  }
  construction_classification?: {
    id: number
    name: string
  }
}

export interface CreateEstimateItemRequest {
  estimate_id: string
  breakdown_id?: string
  display_order?: number
  name: string
  description?: string
  quantity: number
  unit: string
  unit_price: number
  estimated_cost?: number
  supplier_id?: number
  order_request_content?: string
  construction_method?: string
  construction_classification_id?: number
  construction_classification_name?: string
  remarks?: string
  is_active?: boolean
}

export interface UpdateEstimateItemRequest {
  breakdown_id?: string
  display_order?: number
  name?: string
  description?: string
  quantity?: number
  unit?: string
  unit_price?: number
  estimated_cost?: number
  supplier_id?: number
  order_request_content?: string
  construction_method?: string
  construction_classification_id?: number
  construction_classification_name?: string
  remarks?: string
  is_active?: boolean
}

export interface EstimateItemSearchParams {
  estimate_id: string
  breakdown_id?: string
  is_active?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface EstimateItemsResponse {
  data: EstimateItem[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

export interface EstimateItemTree {
  id: string
  estimate_id: string
  breakdown_id?: string
  display_order: number
  name: string
  description?: string
  quantity: number
  unit: string
  unit_price: number
  amount: number
  estimated_cost: number
  supplier_id?: number
  order_request_content?: string
  construction_method?: string
  construction_classification_id?: number
  construction_classification_name?: string
  remarks?: string
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
  item_type?: string
  children?: EstimateItemTree[]
  
  // Relations
  breakdown?: {
    id: string
    name: string
    breakdown_type: string
  }
  supplier?: {
    id: number
    name: string
  }
  construction_classification?: {
    id: number
    name: string
  }
}

export interface EstimateItemStats {
  total_items: number
  total_amount: number
  total_estimated_cost: number
  average_unit_price: number
}
