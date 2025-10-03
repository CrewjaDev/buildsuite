// 見積基本情報の型定義

export interface Estimate {
  id: string
  estimate_number: string
  construction_number?: string
  project_name: string
  project_description?: string
  project_location?: string
  partner_id: number
  partner_name?: string
  partner_type?: 'customer' | 'supplier' | 'both'
  partner_address?: string
  partner_phone?: string
  partner_email?: string
  partner_website?: string
  partner_contact_person?: string
  partner_remarks?: string
  project_type_id: number
  project_type_name?: string
  construction_classification_id: number
  construction_classification_name?: string
  estimate_date: string
  issue_date?: string
  valid_until: string
  expiry_date?: string
  construction_period_from?: string
  construction_period_to?: string
  status: EstimateStatus
  approval_request_id?: string
  approval_flow_id?: string
  approval_status?: 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled'
  sub_status?: string | null
  current_step?: number
  total_steps?: number
  user_approval_status?: UserApprovalStatus
  subtotal?: number
  overhead_rate?: number
  overhead_amount?: number
  cost_expense_rate?: number
  cost_expense_amount?: number
  material_expense_rate?: number
  material_expense_amount?: number
  total_amount: number
  tax_rate: number
  tax_amount: number
  grand_total: number
  profit_margin?: number
  profit_amount?: number
  currency?: string
  payment_terms?: string
  delivery_terms?: string
  warranty_period?: string
  remarks?: string
  notes?: string
  created_by: number
  created_by_name?: string
  responsible_user_id?: number
  responsible_user_name?: string
  updated_by: number
  updated_by_name?: string
  approved_by?: number
  approved_by_name?: string
  approved_at?: string
  created_at: string
  updated_at: string
  // 計算されたプロパティ
  can_edit?: boolean
  can_delete?: boolean
  can_change_status?: boolean
  can_request_approval?: boolean
  is_under_approval?: boolean
  is_approved?: boolean
  is_rejected?: boolean
  is_returned?: boolean
  is_cancelled?: boolean
  is_expired?: boolean
  days_until_expiry?: number
  // 見積明細
  items?: EstimateItem[]
}

// 見積明細の型定義
export interface EstimateItem {
  id: string
  estimate_id: string
  parent_id?: string
  item_type: 'large' | 'medium' | 'small' | 'detail'
  display_order: number
  name: string
  description?: string
  quantity: number
  unit: string
  unit_price: number
  amount: number
  estimated_cost: number
  supplier_id?: number
  construction_method?: string
  construction_classification_id?: string
  remarks?: string
  is_expanded: boolean
  is_active: boolean
  children?: EstimateItem[]
  level: number
  created_at: string
  updated_at: string
}

export type EstimateStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired'

// ユーザー別承認状態の型定義
export interface UserApprovalStatus {
  status: 'completed' | 'pending' | 'not_started' | 'finished' | 'rejected' | 'returned'
  step: number
  total_steps: number
  step_name: string
  can_act: boolean
  message: string
  sub_status?: string | null
}

export interface CreateEstimateRequest {
  project_name: string
  partner_id: number
  project_type_id: number
  issue_date: string
  expiry_date: string
  notes?: string
  estimate_number?: string
  status?: EstimateStatus
  total_amount?: number
  project_location?: string
  project_period_start?: string
  project_period_end?: string
  responsible_user_id?: number
}

export interface UpdateEstimateRequest {
  project_name?: string
  project_description?: string
  project_location?: string
  partner_id?: number
  project_type_id?: number
  estimate_date?: string
  issue_date?: string
  valid_until?: string
  expiry_date?: string
  construction_period_from?: string
  construction_period_to?: string
  tax_rate?: number
  notes?: string
  remarks?: string
  responsible_user_id?: number
}

export interface EstimateSearchParams {
  page?: number
  per_page?: number
  search?: string
  status?: EstimateStatus
  partner_id?: number
  project_type_id?: number
  construction_classification_id?: number
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  show_only_mine?: boolean
}

export interface EstimatesResponse {
  data: Estimate[]
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

export interface EstimateStats {
  total_count: number
  draft_count: number
  submitted_count: number
  approved_count: number
  rejected_count: number
  expired_count: number
  total_amount: number
  average_amount: number
}
