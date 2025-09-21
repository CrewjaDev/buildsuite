import api from '@/lib/api'

export interface SystemLevel {
  id: number
  code: string
  name: string
  display_name: string
  priority: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  permissions?: Permission[]
}

export interface Permission {
  id: number
  name: string
  display_name: string
  description?: string
  module: string
  action: string
  resource?: string
  is_system: boolean
  is_active: boolean
}

export interface SystemLevelPermissionStatus {
  [key: string]: {
    level_name: string
    priority: number
    permissions: {
      id: number
      name: string
      display_name: string
      module: string
      action: string
      resource: string
      is_granted: boolean
    }[]
  }
}

export const systemLevelsApi = {
      // システム権限レベル一覧取得
      async getSystemLevels(): Promise<SystemLevel[]> {
        const response = await api.get('/system-levels')
        // ページネーション形式のレスポンスからdataプロパティを取得
        return response.data?.data || []
      },

      // システム権限レベル詳細取得
      async getSystemLevel(id: number): Promise<SystemLevel> {
        const response = await api.get(`/system-levels/${id}`)
        return response.data
      },

      // システム権限レベル別権限一覧取得
      async getSystemLevelPermissions(): Promise<SystemLevel[]> {
        const response = await api.get('/system-level-permissions')
        return response.data
      },

      // システム権限レベル別権限詳細取得
      async getSystemLevelPermission(id: number): Promise<SystemLevel> {
        const response = await api.get(`/system-level-permissions/${id}`)
        return response.data
      },

      // システム権限レベルに権限を付与
      async attachPermission(id: number, permissionIds: number[]): Promise<void> {
        await api.post(`/system-level-permissions/${id}/attach`, {
          permission_ids: permissionIds
        })
      },

      // システム権限レベルから権限を削除
      async detachPermission(id: number, permissionIds: number[]): Promise<void> {
        await api.post(`/system-level-permissions/${id}/detach`, {
          permission_ids: permissionIds
        })
      },

      // システム権限レベルの権限を一括更新
      async syncPermissions(id: number, permissionIds: number[]): Promise<void> {
        await api.post(`/system-level-permissions/${id}/sync`, {
          permission_ids: permissionIds
        })
      },

      // 利用可能な権限一覧取得
      async getAvailablePermissions(): Promise<{ [key: string]: Permission[] }> {
        const response = await api.get('/system-level-permissions/available/permissions')
        return response.data
      },

      // 承認関連権限のみ取得
      async getApprovalPermissions(): Promise<Permission[]> {
        const response = await api.get('/system-level-permissions/approval/permissions')
        return response.data
      },

      // システム権限レベルの権限設定状況取得
      async getPermissionStatus(): Promise<SystemLevelPermissionStatus> {
        const response = await api.get('/system-level-permissions/status')
        return response.data
      }
}
