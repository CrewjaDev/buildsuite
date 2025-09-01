// 取引先管理のReact Queryフック
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { partnerService } from '@/services/features/partners/partnerService'
import {
  CreatePartnerRequest,
  UpdatePartnerRequest,
  PartnerSearchParams,
  Partner,
} from '@/types/features/partners/partner'

// 取引先一覧取得フック
export const usePartners = (params: PartnerSearchParams = {}) => {
  return useQuery({
    queryKey: ['partners', params],
    queryFn: () => partnerService.getPartners(params),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    placeholderData: (previousData) => previousData, // ページネーション時に前のデータを保持
  })
}

// 取引先詳細取得フック
export const usePartner = (id: number) => {
  return useQuery({
    queryKey: ['partner', id],
    queryFn: () => partnerService.getPartner(id),
    enabled: !!id, // idが存在する時のみ実行
    staleTime: 10 * 60 * 1000, // 10分間キャッシュ
  })
}

// 取引先作成フック
export const useCreatePartner = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreatePartnerRequest) => partnerService.createPartner(data),
    onSuccess: (newPartner) => {
      // 取引先一覧のキャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      // 新しく作成された取引先のキャッシュを設定
      queryClient.setQueryData(['partner', newPartner.id], newPartner)
    },
  })
}

// 取引先更新フック
export const useUpdatePartner = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePartnerRequest }) => 
      partnerService.updatePartner(id, data),
    onSuccess: (updatedPartner) => {
      // 取引先詳細のキャッシュを更新
      queryClient.setQueryData(['partner', updatedPartner.id], updatedPartner)
      // 取引先一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['partners'] })
    },
  })
}

// 取引先削除フック
export const useDeletePartner = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => partnerService.deletePartner(id),
    onSuccess: (_, deletedId) => {
      // 取引先詳細のキャッシュを削除
      queryClient.removeQueries({ queryKey: ['partner', deletedId] })
      // 取引先一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['partners'] })
    },
  })
}

// 取引先オプションデータ取得フック
export const usePartnerOptions = () => {
  return useQuery({
    queryKey: ['partner-options'],
    queryFn: () => partnerService.getPartnerOptions(),
    staleTime: 30 * 60 * 1000, // 30分間キャッシュ（オプションデータは変更頻度が低い）
  })
}

// 取引先アクティブ状態切り替えフック
export const useTogglePartnerActive = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => partnerService.togglePartnerActive(id),
    onSuccess: (result, partnerId) => {
      // 取引先詳細のキャッシュを更新
      queryClient.setQueryData(['partner', partnerId], (oldData: Partner | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            is_active: result.is_active,
          }
        }
        return oldData
      })
      // 取引先一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['partners'] })
    },
  })
}
