import { useQuery } from '@tanstack/react-query'
import { projectTypeService } from '@/services/features/estimates/projectTypeService'
import { ProjectTypeOption, ProjectType } from '@/types/features/estimates/projectType'

// プロジェクトタイプオプション取得（ドロップダウン用）
export const useProjectTypeOptions = () => {
  return useQuery({
    queryKey: ['project-type-options'],
    queryFn: async (): Promise<ProjectTypeOption[]> => {
      const options = await projectTypeService.getProjectTypeOptions()
      return options
    },
  })
}

// 特定のプロジェクトタイプ詳細取得
export const useProjectType = (id: number) => {
  return useQuery({
    queryKey: ['project-type', id],
    queryFn: async (): Promise<ProjectType> => {
      const projectType = await projectTypeService.getProjectType(id)
      return projectType
    },
    enabled: !!id && id > 0,
  })
}