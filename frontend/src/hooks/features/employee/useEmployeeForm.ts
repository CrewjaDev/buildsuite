import { useMutation, useQueryClient } from '@tanstack/react-query'
import employeeService, { EmployeeUpdateData } from '../../../services/features/employees/employeeService'

// 社員作成用フック
export const useCreateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: () => {
      // 社員一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// 社員更新用フック
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmployeeUpdateData }) => 
      employeeService.updateEmployee(id, data),
    onSuccess: (_, { id }) => {
      // 特定の社員とリストのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['employee', id] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// 社員削除用フック
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: employeeService.deleteEmployee,
    onSuccess: () => {
      // 社員一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
