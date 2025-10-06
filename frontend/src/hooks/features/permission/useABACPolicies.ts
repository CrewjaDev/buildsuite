import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { abacPolicyService, type CreatePolicyData, type UpdatePolicyData, type TestConditionsRequest } from '@/services/features/permission/abacPolicyService'
import { toast } from 'sonner'

// Query Keys
export const abacPolicyKeys = {
  all: ['abac-policies'] as const,
  lists: () => [...abacPolicyKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...abacPolicyKeys.lists(), params] as const,
  details: () => [...abacPolicyKeys.all, 'detail'] as const,
  detail: (id: number) => [...abacPolicyKeys.details(), id] as const,
  options: () => [...abacPolicyKeys.all, 'options'] as const,
}

// ABACポリシー一覧取得
export function useABACPolicies(params?: {
  search?: string
  business_code?: string
  action?: string
  effect?: string
  is_active?: boolean
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  per_page?: number
  page?: number
}) {
  return useQuery({
    queryKey: abacPolicyKeys.list(params),
    queryFn: () => abacPolicyService.getPolicies(params),
    staleTime: 5 * 60 * 1000, // 5分
  })
}

// 特定のABACポリシー取得
export function useABACPolicy(id: number) {
  return useQuery({
    queryKey: abacPolicyKeys.detail(id),
    queryFn: () => abacPolicyService.getPolicy(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5分
  })
}

// ポリシーオプション取得
export function useABACPolicyOptions() {
  return useQuery({
    queryKey: abacPolicyKeys.options(),
    queryFn: () => abacPolicyService.getOptions(),
    staleTime: 10 * 60 * 1000, // 10分
  })
}

// ABACポリシー作成
export function useCreateABACPolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePolicyData) => abacPolicyService.createPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: abacPolicyKeys.lists() })
      toast.success('ポリシーが正常に作成されました')
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'ポリシーの作成に失敗しました')
    },
  })
}

// ABACポリシー更新
export function useUpdateABACPolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePolicyData }) =>
      abacPolicyService.updatePolicy(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: abacPolicyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: abacPolicyKeys.detail(id) })
      toast.success('ポリシーが正常に更新されました')
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'ポリシーの更新に失敗しました')
    },
  })
}

// ABACポリシー削除
export function useDeleteABACPolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => abacPolicyService.deletePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: abacPolicyKeys.lists() })
      toast.success('ポリシーが正常に削除されました')
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'ポリシーの削除に失敗しました')
    },
  })
}

// 条件式テスト
export function useTestABACPolicyConditions() {
  return useMutation({
    mutationFn: (data: TestConditionsRequest) => abacPolicyService.testConditions(data),
    onSuccess: (data) => {
      const result = data.data.result
      toast.success(`条件式テスト結果: ${result ? 'true' : 'false'}`)
    },
    onError: (error: unknown) => {
      if ((error as { response?: { data?: { message?: string } } }).response?.data?.message) {
        toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || '条件式のテストに失敗しました')
      } else {
        toast.error('条件式のテストに失敗しました')
      }
    },
  })
}
