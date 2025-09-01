// 取引先基本情報の型定義

export interface Partner {
  id: number
  partner_code: string
  partner_name: string
  partner_name_print?: string
  partner_name_kana?: string
  partner_type: PartnerType
  representative?: string
  representative_kana?: string
  branch_name?: string
  postal_code?: string
  address?: string
  building_name?: string
  phone?: string
  fax?: string
  invoice_number?: string
  email?: string
  is_subcontractor: boolean
  closing_date?: number
  deposit_terms?: string
  deposit_date?: number
  deposit_method?: string
  cash_allocation?: number
  bill_allocation?: number
  payment_date?: number
  payment_method?: string
  payment_cash_allocation?: number
  payment_bill_allocation?: number
  establishment_date?: string
  capital_stock?: number
  previous_sales?: number
  employee_count?: number
  business_description?: string
  bank_name?: string
  branch_name_bank?: string
  account_type?: AccountType
  account_number?: string
  account_holder?: string
  login_id?: string
  journal_code?: string
  is_active: boolean
  status: 'active' | 'inactive'
  creator?: {
    id: number
    name: string
  }
  created_at: string
  updated_at: string
}

export type PartnerType = 'customer' | 'supplier' | 'both'

export type AccountType = 'savings' | 'current'

export interface CreatePartnerRequest {
  partner_code: string
  partner_name: string
  partner_name_print?: string
  partner_name_kana?: string
  partner_type: PartnerType
  representative?: string
  representative_kana?: string
  branch_name?: string
  postal_code?: string
  address?: string
  building_name?: string
  phone?: string
  fax?: string
  invoice_number?: string
  email?: string
  is_subcontractor?: boolean
  closing_date?: number
  deposit_terms?: string
  deposit_date?: number
  deposit_method?: string
  cash_allocation?: number
  bill_allocation?: number
  payment_date?: number
  payment_method?: string
  payment_cash_allocation?: number
  payment_bill_allocation?: number
  establishment_date?: string
  capital_stock?: number
  previous_sales?: number
  employee_count?: number
  business_description?: string
  bank_name?: string
  branch_name_bank?: string
  account_type?: AccountType
  account_number?: string
  account_holder?: string
  login_id?: string
  journal_code?: string
  is_active?: boolean
}

export interface UpdatePartnerRequest {
  partner_code?: string
  partner_name?: string
  partner_name_print?: string
  partner_name_kana?: string
  partner_type?: PartnerType
  representative?: string
  representative_kana?: string
  branch_name?: string
  postal_code?: string
  address?: string
  building_name?: string
  phone?: string
  fax?: string
  invoice_number?: string
  email?: string
  is_subcontractor?: boolean
  closing_date?: number
  deposit_terms?: string
  deposit_date?: number
  deposit_method?: string
  cash_allocation?: number
  bill_allocation?: number
  payment_date?: number
  payment_method?: string
  payment_cash_allocation?: number
  payment_bill_allocation?: number
  establishment_date?: string
  capital_stock?: number
  previous_sales?: number
  employee_count?: number
  business_description?: string
  bank_name?: string
  branch_name_bank?: string
  account_type?: AccountType
  account_number?: string
  account_holder?: string
  login_id?: string
  journal_code?: string
  is_active?: boolean
}

export interface PartnerSearchParams {
  page?: number
  pageSize?: number
  search?: string
  partner_type?: PartnerType
  is_active?: boolean
  is_subcontractor?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PartnersResponse {
  partners: Partner[]
  totalCount: number
}

export interface PartnerOptionsResponse {
  success: boolean
  data: {
    partner_types: Array<{ value: PartnerType; label: string }>
    account_types: Array<{ value: AccountType; label: string }>
  }
}

export interface PartnerStats {
  total_count: number
  active_count: number
  inactive_count: number
  customer_count: number
  supplier_count: number
  both_count: number
  subcontractor_count: number
}

// 取引先区分のラベル取得
export const getPartnerTypeLabel = (type: PartnerType): string => {
  const labels: Record<PartnerType, string> = {
    customer: '顧客',
    supplier: '仕入先',
    both: '両方',
  }
  return labels[type] || type
}

// 口座種別のラベル取得
export const getAccountTypeLabel = (type: AccountType): string => {
  const labels: Record<AccountType, string> = {
    savings: '普通預金',
    current: '当座預金',
  }
  return labels[type] || type
}

// ステータスのラベル取得
export const getStatusLabel = (status: 'active' | 'inactive'): string => {
  const labels: Record<'active' | 'inactive', string> = {
    active: '有効',
    inactive: '無効',
  }
  return labels[status] || status
}
