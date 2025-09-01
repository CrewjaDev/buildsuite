// プロジェクトタイプのAPIサービス
import api from '@/lib/api'
import {
  ProjectType,
  CreateProjectTypeRequest,
  UpdateProjectTypeRequest,
  ProjectTypeSearchParams,
  ProjectTypesResponse,
  ProjectTypeOption
} from '@/types/features/estimates/projectType'

export const projectTypeService = {
  // プロジェクトタイプ一覧取得
  async getProjectTypes(params: ProjectTypeSearchParams = {}): Promise<ProjectTypesResponse> {
    const response = await api.get('/api/project-types', { params })
    return response.data
  },

  // プロジェクトタイプ詳細取得
  async getProjectType(id: number): Promise<ProjectType> {
    const response = await api.get(`/api/project-types/${id}`)
    return response.data
  },

  // プロジェクトタイプ作成
  async createProjectType(data: CreateProjectTypeRequest): Promise<ProjectType> {
    const response = await api.post('/api/project-types', data)
    return response.data
  },

  // プロジェクトタイプ更新
  async updateProjectType(id: number, data: UpdateProjectTypeRequest): Promise<ProjectType> {
    const response = await api.put(`/api/project-types/${id}`, data)
    return response.data
  },

  // プロジェクトタイプ削除
  async deleteProjectType(id: number): Promise<void> {
    await api.delete(`/api/project-types/${id}`)
  },

  // プロジェクトタイプオプション取得（ドロップダウン用）
  async getProjectTypeOptions(): Promise<ProjectTypeOption[]> {
    const response = await api.get('/api/project-types/options')
    return response.data
  }
}
