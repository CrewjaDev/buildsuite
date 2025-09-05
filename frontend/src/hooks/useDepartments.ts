import { useQuery } from '@tanstack/react-query'
import { departmentService } from '@/services/features/departments/departmentService'

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.getDepartments,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}

export const useActiveDepartments = () => {
  return useQuery({
    queryKey: ['activeDepartments'],
    queryFn: departmentService.getActiveDepartments,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}
