import { useQuery } from '@tanstack/react-query'
import { systemLevelService } from '@/services/features/systemLevels/systemLevelService'

export const useSystemLevels = () => {
  return useQuery({
    queryKey: ['systemLevels'],
    queryFn: systemLevelService.getSystemLevels,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}

export const useActiveSystemLevels = () => {
  return useQuery({
    queryKey: ['activeSystemLevels'],
    queryFn: systemLevelService.getActiveSystemLevels,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}
