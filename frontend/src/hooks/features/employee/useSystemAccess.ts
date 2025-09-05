import { useMutation, useQueryClient } from '@tanstack/react-query'
import employeeService, { SystemAccessData } from '../../../services/features/employees/employeeService'

// システム権限付与/更新用フック
export const useGrantSystemAccess = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SystemAccessData }) => 
      employeeService.grantSystemAccess(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// システム権限削除用フック
export const useRevokeSystemAccess = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: employeeService.revokeSystemAccess,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
