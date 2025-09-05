import api from '@/lib/api'

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

export interface EmployeesResponse {
  employees: Employee[]
  totalCount: number
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
  department_id: number
  position_id?: number
}

export interface EmployeeUpdateData extends Partial<EmployeeCreateData> {
  is_active?: boolean
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

// 社員一覧を取得
export const getEmployees = async (params: EmployeeSearchParams = {}): Promise<EmployeesResponse> => {
  const response = await api.get('/employees', { params })
  return response.data.data
}

// 特定の社員を取得
export const getEmployee = async (id: number): Promise<Employee> => {
  const response = await api.get(`/employees/${id}`)
  return response.data.data
}

// 社員を作成
export const createEmployee = async (data: EmployeeCreateData): Promise<Employee> => {
  const response = await api.post('/employees', data)
  return response.data.data
}

// 社員を更新
export const updateEmployee = async (id: number, data: EmployeeUpdateData): Promise<Employee> => {
  const response = await api.put(`/employees/${id}`, data)
  return response.data.data
}

// 社員を削除
export const deleteEmployee = async (id: number): Promise<void> => {
  await api.delete(`/employees/${id}`)
}

// 社員作成・編集用のオプションデータを取得
export const getEmployeeOptions = async (): Promise<EmployeeOptions> => {
  const response = await api.get('/employees/options')
  return response.data.data
}

// システム権限レベル一覧を取得
export const getSystemLevels = async (): Promise<SystemLevel[]> => {
  const response = await api.get('/employees/system-levels')
  return response.data.data
}

// システム権限を付与/更新
export const grantSystemAccess = async (id: number, data: SystemAccessData): Promise<Employee> => {
  const response = await api.post(`/employees/${id}/system-access`, data)
  return response.data.data
}

// システム権限を削除
export const revokeSystemAccess = async (id: number): Promise<Employee> => {
  const response = await api.delete(`/employees/${id}/system-access`)
  return response.data.data
}



// デフォルトエクスポート
const employeeService = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeOptions,
  getSystemLevels,
  grantSystemAccess,
  revokeSystemAccess,
}

export default employeeService
