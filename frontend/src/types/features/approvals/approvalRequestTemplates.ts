export interface ApprovalRequestTemplate {
  id: number
  name: string
  description?: string
  request_type: string | {
    id: number
    code: string
    name: string
    description?: string
    icon?: string
    color?: string
    default_approval_flow_id?: number
    is_active: boolean
    sort_order: number
    created_by?: number
    updated_by?: number
    created_at: string
    updated_at: string
    deleted_at?: string
  }
  template_data: Record<string, unknown>
  is_active: boolean
  is_system: boolean
  usage_count: number
  created_by?: number
  updated_by?: number
  created_at: string
  updated_at: string
  creator?: {
    id: number
    name: string
  }
  updater?: {
    id: number
    name: string
  }
  request_type_info?: {
    id: number
    code: string
    name: string
  }
}

export interface CreateApprovalRequestTemplateRequest {
  name: string
  description?: string
  request_type: string
  template_data: Record<string, unknown>
  is_active?: boolean
  is_system?: boolean
}

export interface UpdateApprovalRequestTemplateRequest {
  name: string
  description?: string
  request_type: string
  template_data: Record<string, unknown>
  is_active?: boolean
  is_system?: boolean
}
