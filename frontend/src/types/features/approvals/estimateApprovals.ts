export interface EstimateApprovalRequest {
  estimate_id: number
  comment?: string
}

export interface EstimateApprovalAction {
  estimate_id: number
  comment?: string
}

export interface ApprovalRequest {
  id: number
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  request_type: string
  request_id: string
  request_data: Record<string, unknown>
  current_step: number
  approval_flow_id: number
  created_by: number
  requested_by: number
  created_at: string
  updated_at: string
  approved_at?: string
  rejected_at?: string
  returned_at?: string
  cancelled_at?: string
  expires_at?: string
}

export interface ApprovalRequestListItem {
  id: number
  title: string
  description: string
  status: string
  priority: string
  request_type: string
  request_id: string
  current_step: number
  created_by_name: string
  created_at: string
  amount?: number
  project_name?: string
}

export interface ApprovalRequestDetail extends ApprovalRequest {
  approval_flow: {
    id: number
    name: string
    type: string
  }
  current_step_info: {
    id: number
    step_order: number
    approver_id: number
    approver_name: string
  }
  histories: ApprovalHistory[]
  requestable?: {
    id: string
    type: string
    title: string
    amount?: number
    project_name?: string
  }
}

export interface ApprovalActionRequest {
  comment?: string
}

export interface ApprovalActionResponse {
  message: string
  approval_request: ApprovalRequestDetail
}

export interface ApprovalHistory {
  id: number
  approval_request_id: number
  approval_step_id: number
  approver_id: number
  action: 'approved' | 'rejected' | 'returned' | 'cancelled'
  comment?: string
  approved_at: string
  approver?: {
    id: number
    name: string
  }
  step?: {
    id: number
    step_name: string
    step_order: number
  }
}
