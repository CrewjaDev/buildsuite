import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { 
  Employee, 
  EmployeeCreateData, 
  EmployeeUpdateData, 
  EmployeesResponse, 
  EmployeeFilters 
} from '@/types/features/employees'

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
