import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

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

// 社員一覧を取得
export const useEmployees = (filters: EmployeeFilters = {}) => {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await api.get(`/employees?${params.toString()}`)
      return response.data.data as EmployeesResponse
    },
  })
}

// 特定の社員を取得
export const useEmployee = (id: number) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const response = await api.get(`/employees/${id}`)
      return response.data.data as Employee
    },
    enabled: !!id,
  })
}

// 社員作成・編集用のオプションデータを取得
export const useEmployeeOptions = () => {
  return useQuery({
    queryKey: ['employee-options'],
    queryFn: async () => {
      const response = await api.get('/employees/options')
      return response.data.data as {
        departments: Array<{ id: number; name: string; is_active: boolean }>
        positions: Array<{ id: number; name: string; level: number; is_active: boolean }>
      }
    },
  })
}

// 社員を作成
export const useCreateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EmployeeCreateData) => {
      const response = await api.post('/employees', data)
      return response.data
    },
    onSuccess: () => {
      // 社員一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// 社員を更新
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EmployeeUpdateData }) => {
      const response = await api.put(`/employees/${id}`, data)
      return response.data
    },
    onSuccess: (_, { id }) => {
      // 特定の社員とリストのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['employee', id] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// 社員を削除
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/employees/${id}`)
      return response.data
    },
    onSuccess: () => {
      // 社員一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// システムレベル一覧を取得
export const useSystemLevels = () => {
  return useQuery({
    queryKey: ['system-levels'],
    queryFn: async () => {
      const response = await api.get('/employees/system-levels')
      return response.data.data as Array<{
        code: string
        name: string
        display_name: string
        priority: number
      }>
    },
  })
}

// システム権限を付与
export const useGrantSystemAccess = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: number
      data: {
        login_id: string
        password: string
        system_level: string
        is_admin?: boolean
      }
    }) => {
      const response = await api.post(`/employees/${id}/system-access`, data)
      return response.data
    },
    onSuccess: (_, { id }) => {
      // 特定の社員とリストのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['employee', id] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// システム権限を無効化
export const useRevokeSystemAccess = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/employees/${id}/system-access`)
      return response.data
    },
    onSuccess: (_, id) => {
      // 特定の社員とリストのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['employee', id] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
