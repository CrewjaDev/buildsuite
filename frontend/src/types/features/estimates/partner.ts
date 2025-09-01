// 取引先の型定義

export interface Partner {
  id: number
  code: string
  name: string
  name_kana?: string
  type: PartnerType
  postal_code?: string
  prefecture?: string
  address?: string
  phone?: string
  fax?: string
  email?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  is_active: boolean
  remarks?: string
  created_at: string
  updated_at: string
}

export type PartnerType = 'customer' | 'supplier' | 'both'

export interface CreatePartnerRequest {
  code: string
  name: string
  name_kana?: string
  type: PartnerType
  postal_code?: string
  prefecture?: string
  address?: string
  phone?: string
  fax?: string
  email?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  is_active?: boolean
  remarks?: string
}

export interface UpdatePartnerRequest {
  code?: string
  name?: string
  name_kana?: string
  type?: PartnerType
  postal_code?: string
  prefecture?: string
  address?: string
  phone?: string
  fax?: string
  email?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  is_active?: boolean
  remarks?: string
}

export interface PartnerSearchParams {
  page?: number
  per_page?: number
  search?: string
  type?: PartnerType
  is_active?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PartnersResponse {
  data: Partner[]
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

export interface PartnerOption {
  value: number
  label: string
  type: PartnerType
}
