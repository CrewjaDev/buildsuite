import api from '@/lib/api'
import type { 
  Employee, 
  EmployeesResponse, 
  EmployeeSearchParams, 
  EmployeeCreateData, 
  EmployeeUpdateData, 
  EmployeeOptions, 
  SystemLevel, 
  SystemAccessData 
} from '@/types/features/employees'

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
