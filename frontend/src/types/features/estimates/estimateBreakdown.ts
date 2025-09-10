export interface EstimateBreakdown {
  id: string
  estimate_id: string
  parent_id: string | null
  breakdown_type: 'large' | 'medium' | 'small'
  name: string
  display_order: number
  description?: string
  quantity: number
  unit: string
  unit_price: number
  direct_amount: number
  calculated_amount: number
  estimated_cost: number
  supplier_id?: number
  construction_method?: string
  construction_classification_id?: number
  remarks?: string
  order_request_content?: string
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
  parent?: EstimateBreakdown
  children?: EstimateBreakdown[]
  items?: EstimateItem[]
  supplier?: {
    id: number
    name: string
  }
  construction_classification?: {
    id: number
    name: string
  }
}

export interface EstimateItem {
  id: string
  estimate_id: string
  breakdown_id?: string
  name: string
  display_order: number
  description?: string
  quantity: number
  unit: string
  unit_price: number
  amount: number
  estimated_cost: number
  supplier_id?: number
  construction_method?: string
  construction_classification_id?: number
  remarks?: string
  order_request_content?: string
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
  breakdown?: EstimateBreakdown
  supplier?: {
    id: number
    name: string
  }
  construction_classification?: {
    id: number
    name: string
  }
}

export interface EstimateBreakdownTree extends EstimateBreakdown {
  children: EstimateBreakdownTree[]
  items: EstimateItem[]
}

export interface CreateEstimateBreakdownRequest {
  estimate_id: string
  parent_id?: string
  breakdown_type: 'large' | 'medium' | 'small'
  name: string
  display_order?: number
  description?: string
  quantity?: number
  unit?: string
  unit_price?: number
  direct_amount?: number
  estimated_cost?: number
  supplier_id?: number
  construction_method?: string
  construction_classification_id?: number
  remarks?: string
  order_request_content?: string
}

export interface UpdateEstimateBreakdownRequest {
  parent_id?: string
  name?: string
  description?: string
  quantity?: number
  unit?: string
  unit_price?: number
  direct_amount?: number
  estimated_cost?: number
  supplier_id?: number
  construction_method?: string
  construction_classification_id?: number
  remarks?: string
  order_request_content?: string
}

export interface EstimateBreakdownOrderRequest {
  breakdown_id: string
  new_order: number
}
