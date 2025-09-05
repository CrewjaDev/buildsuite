import { useQuery } from '@tanstack/react-query'
import employeeService from '../../../services/features/employees/employeeService'

// 社員選択用の軽量フック
export const useEmployeeOptions = () => {
  return useQuery({
    queryKey: ['employee-options'],
    queryFn: employeeService.getEmployeeOptions,
  })
}

// システム権限レベル選択用フック
export const useSystemLevels = () => {
  return useQuery({
    queryKey: ['system-levels'],
    queryFn: employeeService.getSystemLevels,
  })
}

// 部署選択用フック（軽量版）
export const useDepartmentSelect = () => {
  return useQuery({
    queryKey: ['department-select'],
    queryFn: async () => {
      const options = await employeeService.getEmployeeOptions()
      return options.departments
    },
  })
}

// 職位選択用フック（軽量版）
export const usePositionSelect = () => {
  return useQuery({
    queryKey: ['position-select'],
    queryFn: async () => {
      const options = await employeeService.getEmployeeOptions()
      return options.positions
    },
  })
}
