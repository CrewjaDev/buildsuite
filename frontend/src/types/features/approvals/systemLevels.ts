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
