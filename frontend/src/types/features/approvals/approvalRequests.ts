export interface ApprovalRequest {
  id: number
  approval_flow_id: number
  request_type: string
  request_id: string
  title: string
  description?: string
  request_data?: Record<string, unknown>
  current_step: number
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled'
  sub_status?: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  requested_by: number
  approved_by?: number
  approved_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
  // 追加フィールド
  requester_name?: string
  progress_status?: {
    current_status: string
    progress_text: string
    current_approvers: string[]
    current_step: number
    total_steps: number
  }
  // リレーション
  approval_flow?: {
    id: number
    name: string
    flow_type: string
  }
  requester?: {
    id: number
    name: string
    email: string
  }
  approver?: {
    id: number
    name: string
    email: string
  }
  histories?: ApprovalHistory[]
}

export interface ApprovalHistory {
  id: number
  approval_request_id: number
  step: number
  action: 'approve' | 'reject' | 'return' | 'cancel'
  acted_by: number
  acted_at: string
  comment?: string
  created_at: string
  updated_at: string
  // リレーション
  actor?: {
    id: number
    name: string
    email: string
  }
}

export interface CreateApprovalRequestRequest {
  approval_flow_id: number
  request_type: string
  request_id: string
  title: string
  description?: string
  request_data?: Record<string, unknown>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  expires_at?: string
}

export interface UpdateApprovalRequestRequest {
  title?: string
  description?: string
  request_data?: Record<string, unknown>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  expires_at?: string
}

export interface ApprovalActionRequest {
  action: 'approve' | 'reject' | 'return' | 'cancel'
  comment?: string
}

export interface ApprovalRequestFilter {
  user_view_status?: string
  status?: string[]
  sub_status?: string
  request_type?: string[]
  priority?: string[]
  requested_by?: number[]
  approval_flow_id?: number[]
  created_from?: string
  created_to?: string
  expires_from?: string
  expires_to?: string
}

export interface ApprovalRequestListResponse {
  data: ApprovalRequest[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
