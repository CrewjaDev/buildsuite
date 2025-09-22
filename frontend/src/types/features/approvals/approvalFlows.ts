export interface ApprovalFlow {
  id: number
  name: string
  description?: string
  flow_type: string
  is_active: boolean
  is_system: boolean
  priority: number
  created_by?: number
  updated_by?: number
  created_at: string
  updated_at: string
  steps?: ApprovalStep[]
  conditions?: ApprovalCondition[]
}

export interface ApprovalStep {
  id: number
  approval_flow_id: number
  step_order: number
  name: string
  description?: string
  approver_type: string
  approver_id: number
  approver_condition?: Record<string, unknown>
  is_required: boolean
  can_delegate: boolean
  timeout_hours?: number
  is_active: boolean
  created_at: string
  updated_at: string
  approver_system_level?: {
    id: number
    code: string
    name: string
    display_name: string
  }
  approver?: {
    id: number
    name: string
    email: string
  }
}

export interface ApprovalCondition {
  id: number
  approval_flow_id: number
  condition_type: string
  field_name: string
  operator: string
  value: unknown
  value_type: string
  is_active: boolean
  priority: number
  description?: string
  created_at: string
  updated_at: string
}

export interface ApprovalFlowTemplate {
  id: string
  name: string
  description: string
  steps: number
  approvers: string[]
  suitable_for: string
  conditions?: {
    type: string
    field: string
    operator: string
    value: unknown
  }
}

export interface CreateApprovalFlowRequest {
  template_id: string
  name: string
  description?: string
  flow_type: string
  customizations?: Record<string, unknown>
}

export interface UpdateApprovalFlowRequest {
  name: string
  description?: string
  is_active?: boolean
  priority?: number
  steps?: Array<{
    step_order: number
    name: string
    approver_type: string
    approver_id: string
    is_required: boolean
  }>
}
