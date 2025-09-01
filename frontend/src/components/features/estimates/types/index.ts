// 見積管理機能専用の型定義

// 取引先（得意先・仕入先）の型
export interface Partner {
  id: string
  partner_code: string
  partner_name: string
  partner_type: 'customer' | 'supplier' | 'both'
  company_name?: string
  representative_name?: string
  postal_code?: string
  address?: string
  phone?: string
  fax?: string
  email?: string
  website?: string
  tax_number?: string
  payment_terms?: string
  remarks?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// プロジェクトタイプの型
export interface ProjectType {
  id: string
  code: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 工事分類の型
export interface ConstructionClassification {
  id: string
  code: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 見積の型
export interface Estimate {
  id: string
  estimate_number: string
  project_name: string
  partner_id: string
  partner?: Partner
  project_type_id: string
  project_type?: ProjectType
  construction_classification_id: string
  construction_classification?: ConstructionClassification
  issue_date?: string
  expiry_date?: string
  delivery_date?: string
  delivery_location?: string
  payment_terms?: string
  warranty_period?: string
  remarks?: string
  subtotal_amount: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired'
  created_by: number
  creator?: unknown // User型（後で修正）
  approved_by?: number
  approver?: unknown // User型（後で修正）
  approved_at?: string
  created_at: string
  updated_at: string
  items?: EstimateItem[]
}

// 見積明細の型
export interface EstimateItem {
  id: string
  estimate_id: string
  parent_id?: string
  parent?: EstimateItem
  children?: EstimateItem[]
  item_type: 'category' | 'item'
  display_order: number
  name: string
  description?: string
  quantity?: number
  unit?: string
  unit_price?: number
  amount: number
  supplier?: string
  construction_method?: string
  construction_classification_id?: string
  construction_classification?: ConstructionClassification
  remarks?: string
  is_expanded: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// 原価計画の型
export interface CostPlan {
  id: string
  estimate_id: string
  estimate?: Estimate
  cost_plan_number: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'completed'
  total_estimated_cost: number
  total_actual_cost: number
  profit_margin: number
  profit_amount: number
  created_by: number
  creator?: unknown // User型（後で修正）
  created_at: string
  updated_at: string
  items?: CostPlanItem[]
}

// 原価計画明細の型
export interface CostPlanItem {
  id: string
  cost_plan_id: string
  cost_plan?: CostPlan
  estimate_item_id: string
  estimate_item?: EstimateItem
  supplier_id: string
  supplier?: Partner
  estimated_cost: number
  actual_cost: number
  cost_difference: number
  remarks?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 見積枝番の型
export interface EstimateBranch {
  id: string
  estimate_id: string
  estimate?: Estimate
  branch_number: string
  name: string
  description?: string
  version: string
  is_enabled: boolean
  created_by: number
  creator?: unknown // User型（後で修正）
  created_at: string
  updated_at: string
}

// 見積検索・フィルター用の型
export interface EstimateSearchParams {
  page?: number
  pageSize?: number
  search?: string
  estimate_number?: string
  project_name?: string
  partner_name?: string
  partner_type?: 'customer' | 'supplier' | 'both'
  project_type_id?: string
  construction_classification_id?: string
  status?: string
  issue_date_from?: string
  issue_date_to?: string
  total_amount_from?: number
  total_amount_to?: number
  created_by?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// 見積明細検索・フィルター用の型
export interface EstimateItemSearchParams {
  page?: number
  pageSize?: number
  search?: string
  estimate_id?: string
  parent_id?: string
  item_type?: 'category' | 'item'
  name?: string
  supplier?: string
  construction_classification_id?: string
  is_active?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// 取引先検索・フィルター用の型
export interface PartnerSearchParams {
  page?: number
  pageSize?: number
  search?: string
  partner_code?: string
  partner_name?: string
  partner_type?: 'customer' | 'supplier' | 'both'
  company_name?: string
  is_active?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// APIレスポンスの型
export interface EstimatesResponse {
  data: Estimate[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface EstimateResponse {
  success: boolean
  data: Estimate
  message?: string
}

export interface PartnersResponse {
  data: Partner[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}
