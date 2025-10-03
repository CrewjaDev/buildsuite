// 共通の型定義
export interface ApprovalConditions {
  amount_min?: number
  amount_max?: number
  departments?: number[]
  project_types?: string[]
  vendor_types?: string[]
}

export interface ApprovalRequester {
  type: 'system_level' | 'department' | 'position' | 'user'
  value: string | number
  display_name: string
  required_permissions?: string[] // 必要な権限
}

export interface ApprovalApprover {
  type: 'system_level' | 'department' | 'position' | 'user'
  value: string | number
  display_name: string
  required_permissions?: string[] // 必要な権限
}

export interface ApprovalStepCondition {
  type: 'required' | 'optional' | 'majority' | 'unanimous'
  display_name: string
}

export interface StepConditions {
  allow_during_pending: boolean
  allow_during_reviewing: boolean
  allow_during_step_approved: boolean
  allow_during_expired: boolean
}

export interface ApprovalStep {
  step: number
  name: string
  approvers: ApprovalApprover[]
  available_permissions: string[]
  condition: ApprovalStepCondition
  required_permissions?: string[] // ステップで必要な権限
  auto_approve_if_requester?: boolean // 承認依頼作成者の場合自動承認
  // 新規追加：詳細設定
  editing_conditions?: StepConditions
  cancellation_conditions?: StepConditions
}

export interface FlowConfig {
  allow_editing_after_request: boolean
  allow_cancellation_after_request: boolean
  step_settings?: {
    [key: string]: {
      editing_conditions: StepConditions
      cancellation_conditions: StepConditions
    }
  }
}

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
  // 新しいJSONカラム設計
  conditions?: ApprovalConditions
  requesters?: ApprovalRequester[]
  approval_steps?: ApprovalStep[]
  // 新規追加：フロー設定
  flow_config?: FlowConfig
  // 旧設計との互換性のため残す
  steps?: LegacyApprovalStep[]
  conditions_old?: ApprovalCondition[]
}

export interface LegacyApprovalStep {
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
  name: string
  description?: string
  flow_type: string
  conditions?: ApprovalConditions
  requesters?: ApprovalRequester[]
  approval_steps?: ApprovalStep[]
  priority?: number
  is_active?: boolean
  // 新規追加：フロー設定
  flow_config?: FlowConfig
  // テンプレートからの作成用
  template_id?: string
  customizations?: Record<string, unknown>
}

export interface UpdateApprovalFlowRequest {
  name: string
  description?: string
  flow_type?: string
  conditions?: ApprovalConditions
  requesters?: ApprovalRequester[]
  approval_steps?: ApprovalStep[]
  is_active?: boolean
  priority?: number
  // 新規追加：フロー設定
  flow_config?: FlowConfig
}
