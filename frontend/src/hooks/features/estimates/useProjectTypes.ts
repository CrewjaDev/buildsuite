// プロジェクトタイプのReact Queryフック
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectTypeService } from '@/services/features/estimates/projectTypeService'
import {
  CreateProjectTypeRequest,
  UpdateProjectTypeRequest,
  ProjectTypeSearchParams,
} from '@/types/features/estimates/projectType'

// プロジェクトタイプ一覧取得フック
export const useProjectTypes = (params: ProjectTypeSearchParams = {}) => {
  return useQuery({
    queryKey: ['project-types', params],
    queryFn: () => projectTypeService.getProjectTypes(params),
    staleTime: 30 * 60 * 1000, // 30分間キャッシュ（マスターデータなので長め）
    placeholderData: (previousData) => previousData, // ページネーション時に前のデータを保持
  })
}

// プロジェクトタイプ詳細取得フック
export const useProjectType = (id: number) => {
  return useQuery({
    queryKey: ['project-type', id],
    queryFn: () => projectTypeService.getProjectType(id),
    enabled: !!id, // idが存在する時のみ実行
    staleTime: 30 * 60 * 1000, // 30分間キャッシュ
  })
}

// プロジェクトタイプ作成フック
export const useCreateProjectType = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateProjectTypeRequest) => projectTypeService.createProjectType(data),
    onSuccess: (newProjectType) => {
      // プロジェクトタイプ一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['project-types'] })
      // プロジェクトタイプオプションのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['project-type-options'] })
      // 新しく作成されたプロジェクトタイプのキャッシュを設定
      queryClient.setQueryData(['project-type', newProjectType.id], newProjectType)
    },
  })
}

// プロジェクトタイプ更新フック
export const useUpdateProjectType = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProjectTypeRequest }) => 
      projectTypeService.updateProjectType(id, data),
    onSuccess: (updatedProjectType) => {
      // プロジェクトタイプ詳細のキャッシュを更新
      queryClient.setQueryData(['project-type', updatedProjectType.id], updatedProjectType)
      // プロジェクトタイプ一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['project-types'] })
      // プロジェクトタイプオプションのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['project-type-options'] })
    },
  })
}

// プロジェクトタイプ削除フック
export const useDeleteProjectType = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => projectTypeService.deleteProjectType(id),
    onSuccess: (_, deletedId) => {
      // プロジェクトタイプ詳細のキャッシュを削除
      queryClient.removeQueries({ queryKey: ['project-type', deletedId] })
      // プロジェクトタイプ一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['project-types'] })
      // プロジェクトタイプオプションのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['project-type-options'] })
    },
  })
}

// プロジェクトタイプオプション取得フック（ドロップダウン用）
export const useProjectTypeOptions = () => {
  return useQuery({
    queryKey: ['project-type-options'],
    queryFn: () => projectTypeService.getProjectTypeOptions(),
    staleTime: 60 * 60 * 1000, // 1時間キャッシュ（マスターデータなので長め）
  })
}
