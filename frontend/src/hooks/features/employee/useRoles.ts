import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast'
import api from '@/lib/api'
import type { Role } from '@/types/features/employees'

// 役割一覧取得
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async (): Promise<Role[]> => {
      const response = await api.get('/roles')
      return response.data.data || []
    },
  })
}

// ユーザーの役割取得
export function useUserRoles(userId: number) {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async (): Promise<Role[]> => {
      const response = await api.get(`/users/${userId}/roles`)
      return response.data.data || []
    },
    enabled: !!userId,
  })
}

// ユーザーの役割更新
export function useUpdateUserRoles() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: number; roleIds: number[] }) => {
      const response = await api.put(`/users/${userId}/roles`, {
        role_ids: roleIds
      })
      return response.data
    },
    onSuccess: (data, variables) => {
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['user-roles', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['employee', variables.userId] })
    },
    onError: (error) => {
      addToast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '役割の更新に失敗しました',
        type: 'error',
      })
    },
  })
}
