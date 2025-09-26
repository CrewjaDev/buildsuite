// 社員関連の型定義

export interface Employee {
  id: number
  employee_id: string
  name: string
  name_kana?: string
  full_name: string
  email?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  phone?: string
  mobile_phone?: string
  postal_code?: string
  prefecture?: string
  address?: string
  job_title?: string
  hire_date?: string
  service_years?: number
  service_months?: number
  department: {
    id: number
    name: string
  }
  position?: {
    id: number
    name: string
  }
  is_active: boolean
  has_system_access: boolean
  user?: {
    id: number
    login_id?: string
    system_level?: string
    is_admin: boolean
    last_login_at?: string
    is_locked: boolean
    roles: Array<{ id: number; name: string; [key: string]: unknown }>
    system_level_info?: { id: number; name: string; [key: string]: unknown }
  }
  created_at: string
  updated_at: string
}

export interface EmployeeCreateData {
  employee_id: string
  name: string
  name_kana?: string
  email?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  phone?: string
  mobile_phone?: string
  postal_code?: string
  prefecture?: string
  address?: string
  job_title?: string
  hire_date?: string
  service_years?: number
  service_months?: number
  department_id: number
  position_id?: number
}

export interface EmployeeUpdateData extends Partial<EmployeeCreateData> {
  is_active?: boolean
}

export interface EmployeesResponse {
  employees: Employee[]
  totalCount: number
}

export interface EmployeeFilters {
  search?: string
  is_active?: boolean
  department_id?: number
  page?: number
  pageSize?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface EmployeeSearchParams {
  page?: number
  pageSize?: number
  search?: string
  is_active?: boolean
  has_system_access?: boolean
  department_id?: number
  position_id?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface EmployeeOptions {
  departments: Array<{
    id: number
    name: string
    code: string
    is_active: boolean
  }>
  positions: Array<{
    id: number
    name: string
    level: number
    is_active: boolean
  }>
}

export interface SystemLevel {
  id: number
  code: string
  name: string
  display_name: string
  description: string
  priority: number
  is_system: boolean
  is_active: boolean
}

export interface SystemAccessData {
  login_id: string
  password: string
  system_level: string
  is_admin?: boolean
}
