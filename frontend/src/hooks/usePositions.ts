import { useQuery } from '@tanstack/react-query'
import { positionService } from '@/services/features/positions/positionService'

export const usePositions = () => {
  return useQuery({
    queryKey: ['positions'],
    queryFn: positionService.getPositions,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}

export const useActivePositions = () => {
  return useQuery({
    queryKey: ['activePositions'],
    queryFn: positionService.getActivePositions,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}
