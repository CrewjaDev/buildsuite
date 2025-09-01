// 見積基本情報の型定義

export interface Estimate {
  id: number
  estimate_number: string
  project_name: string
  project_description?: string
  partner_id: number
  partner_name?: string
  project_type_id: number
  project_type_name?: string
  construction_classification_id: number
  construction_classification_name?: string
  estimate_date: string
  valid_until: string
  status: EstimateStatus
  total_amount: number
  tax_rate: number
  tax_amount: number
  grand_total: number
  remarks?: string
  created_by: number
  created_by_name?: string
  updated_by: number
  updated_by_name?: string
  created_at: string
  updated_at: string
}

export type EstimateStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired'

export interface CreateEstimateRequest {
  project_name: string
  project_description?: string
  partner_id: number
  project_type_id: number
  construction_classification_id: number
  estimate_date: string
  valid_until: string
  tax_rate: number
  remarks?: string
}

export interface UpdateEstimateRequest {
  project_name?: string
  project_description?: string
  partner_id?: number
  project_type_id?: number
  construction_classification_id?: number
  estimate_date?: string
  valid_until?: string
  tax_rate?: number
  remarks?: string
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
