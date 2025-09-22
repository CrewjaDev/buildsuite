export interface ApprovalRequestType {
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
  default_approval_flow?: {
    id: number
    name: string
    flow_type: string
  }
  creator?: {
    id: number
    name: string
  }
  updater?: {
    id: number
    name: string
  }
}

export interface CreateApprovalRequestTypeRequest {
  code: string
  name: string
  description?: string
  icon?: string
  color?: string
  default_approval_flow_id?: number
  is_active?: boolean
  sort_order?: number
}

export interface UpdateApprovalRequestTypeRequest {
  code: string
  name: string
  description?: string
  icon?: string
  color?: string
  default_approval_flow_id?: number
  is_active?: boolean
  sort_order?: number
}

export interface ApprovalFlow {
  id: number
  name: string
  flow_type: string
}
