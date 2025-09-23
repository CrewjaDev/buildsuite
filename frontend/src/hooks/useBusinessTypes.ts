import { useQuery } from '@tanstack/react-query'
import { businessTypeService } from '@/services/features/business/businessTypeService'

export const useBusinessTypes = () => {
  return useQuery({
    queryKey: ['businessTypes'],
    queryFn: businessTypeService.getBusinessTypes,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}

export const useActiveBusinessTypes = () => {
  return useQuery({
    queryKey: ['activeBusinessTypes'],
    queryFn: businessTypeService.getActiveBusinessTypes,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}

export const useBusinessTypesByCategory = (category: string) => {
  return useQuery({
    queryKey: ['businessTypesByCategory', category],
    queryFn: () => businessTypeService.getBusinessTypesByCategory(category),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}