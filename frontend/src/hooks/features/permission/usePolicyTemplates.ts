import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { policyTemplateService, type CreateTemplateData, type UpdateTemplateData, type GenerateConditionRequest, type GenerateCombinedConditionRequest } from '@/services/features/permission/policyTemplateService'
import { toast } from 'sonner'

// Query Keys
export const policyTemplateKeys = {
  all: ['policy-templates'] as const,
  lists: () => [...policyTemplateKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...policyTemplateKeys.lists(), params] as const,
  details: () => [...policyTemplateKeys.all, 'detail'] as const,
  detail: (id: number) => [...policyTemplateKeys.details(), id] as const,
  categories: () => [...policyTemplateKeys.all, 'categories'] as const,
  byAction: (action: string) => [...policyTemplateKeys.all, 'by-action', action] as const,
}

// ポリシーテンプレート一覧取得
export function usePolicyTemplates(params?: {
  search?: string
  category?: string
  action?: string
  is_system?: boolean
  is_active?: boolean
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  per_page?: number
  page?: number
}) {
  return useQuery({
    queryKey: policyTemplateKeys.list(params),
    queryFn: () => policyTemplateService.getTemplates(params),
    staleTime: 5 * 60 * 1000, // 5分
  })
}

// 特定のポリシーテンプレート取得
export function usePolicyTemplate(id: number) {
  return useQuery({
    queryKey: policyTemplateKeys.detail(id),
    queryFn: () => policyTemplateService.getTemplate(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5分
  })
}

// テンプレートカテゴリ一覧取得
export function usePolicyTemplateCategories() {
  return useQuery({
    queryKey: policyTemplateKeys.categories(),
    queryFn: () => policyTemplateService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10分
  })
}

// アクション別テンプレート一覧取得
export function usePolicyTemplatesByAction(action: string) {
  return useQuery({
    queryKey: policyTemplateKeys.byAction(action),
    queryFn: () => policyTemplateService.getTemplatesByAction(action),
    enabled: !!action,
    staleTime: 5 * 60 * 1000, // 5分
  })
}

// ポリシーテンプレート作成
export function useCreatePolicyTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTemplateData) => policyTemplateService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyTemplateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: policyTemplateKeys.categories() })
      toast.success('テンプレートが正常に作成されました')
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'テンプレートの作成に失敗しました')
    },
  })
}

// ポリシーテンプレート更新
export function useUpdatePolicyTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTemplateData }) =>
      policyTemplateService.updateTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: policyTemplateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: policyTemplateKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: policyTemplateKeys.categories() })
      toast.success('テンプレートが正常に更新されました')
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'テンプレートの更新に失敗しました')
    },
  })
}

// ポリシーテンプレート削除
export function useDeletePolicyTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => policyTemplateService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyTemplateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: policyTemplateKeys.categories() })
      toast.success('テンプレートが正常に削除されました')
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'テンプレートの削除に失敗しました')
    },
  })
}

// 条件式生成
export function useGenerateCondition() {
  return useMutation({
    mutationFn: (data: GenerateConditionRequest) => policyTemplateService.generateCondition(data),
    onSuccess: (data) => {
      const condition = data.data.condition
      toast.success(`条件式が生成されました: ${JSON.stringify(condition, null, 2)}`)
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || '条件式の生成に失敗しました')
    },
  })
}

// 組み合わせ条件式生成
export function useGenerateCombinedCondition() {
  return useMutation({
    mutationFn: (data: GenerateCombinedConditionRequest) => policyTemplateService.generateCombinedCondition(data),
    onSuccess: (data) => {
      const condition = data.data.condition
      toast.success(`組み合わせ条件式が生成されました: ${JSON.stringify(condition, null, 2)}`)
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || '組み合わせ条件式の生成に失敗しました')
    },
  })
}
