// 見積明細の型定義

export interface EstimateItem {
  id: number
  estimate_id: number
  parent_id?: number
  item_code: string
  item_name: string
  item_description?: string
  unit: string
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
  level: number
  is_group: boolean
  created_at: string
  updated_at: string
  children?: EstimateItem[]
}

export interface CreateEstimateItemRequest {
  estimate_id: number
  parent_id?: number
  item_code: string
  item_name: string
  item_description?: string
  unit: string
  quantity: number
  unit_price: number
  sort_order?: number
  level?: number
  is_group?: boolean
}

export interface UpdateEstimateItemRequest {
  parent_id?: number
  item_code?: string
  item_name?: string
  item_description?: string
  unit?: string
  quantity?: number
  unit_price?: number
  sort_order?: number
  level?: number
  is_group?: boolean
}

export interface EstimateItemSearchParams {
  estimate_id: number
  parent_id?: number
  level?: number
  is_group?: boolean
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
  id: number
  estimate_id: number
  parent_id?: number
  item_code: string
  item_name: string
  item_description?: string
  unit: string
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
  level: number
  is_group: boolean
  children: EstimateItemTree[]
  created_at: string
  updated_at: string
}

export interface EstimateItemStats {
  total_items: number
  total_amount: number
  average_unit_price: number
  max_level: number
}
