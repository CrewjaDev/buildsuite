import { useQuery } from '@tanstack/react-query'
import { userService } from '@/lib/userService'

export interface UserOptions {
  roles: Array<{
    id: number
    name: string
    display_name: string
    priority: number
  }>
  departments: Array<{
    id: number
    name: string
    code: string
  }>
  system_levels: Array<{
    id: number
    code: string
    name: string
    display_name: string
    description: string
    priority: number
    is_system: boolean
    is_active: boolean
  }>
  positions: Array<{
    id: number
    code: string
    name: string
    display_name: string
    description: string
    level: number
    sort_order: number
    is_active: boolean
  }>
}

export const useUserOptions = () => {
  return useQuery({
    queryKey: ['userOptions'],
    queryFn: async (): Promise<UserOptions> => {
      const response = await userService.getOptions()
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間メモリ保持
  })
}
