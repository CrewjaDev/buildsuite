import api from '@/lib/api'

export interface DashboardStats {
  estimates: {
    draft_count: number
    pending_approval_count: number
    approved_count: number
    total_amount: number
    has_permission: boolean
  }
  approvals: {
    my_pending_requests: number
    my_approved_requests: number
    has_permission: boolean
  }
  recent_activities: Activity[]
}

export interface ManagerDashboardStats {
  department_estimates: {
    department_estimate_count: number
    department_pending_count: number
    department_approved_count: number
    department_total_amount: number
    has_permission: boolean
  }
  team_approvals: {
    team_pending_requests: number
    team_approved_requests: number
    has_permission: boolean
  }
  team_activities: Activity[]
}

export interface AdminDashboardStats {
  system_overview: {
    total_users: number
    total_estimates: number
    total_approval_requests: number
    total_amount: number
  }
  user_management: {
    active_users: number
    inactive_users: number
    admin_users: number
    recent_logins: number
  }
  approval_system: {
    pending_approvals: number
    approved_this_month: number
    rejected_this_month: number
  }
  recent_system_activities: Activity[]
}

export interface Activity {
  type: string
  title: string
  description: string
  timestamp: string
  status: string
  estimate_id?: string
  request_id?: number
}

class DashboardService {
  /**
   * ユーザーダッシュボード用の統計データを取得
   */
  async getUserStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/user-stats')
    return response.data.data
  }

  /**
   * マネージャーダッシュボード用の統計データを取得
   */
  async getManagerStats(): Promise<ManagerDashboardStats> {
    const response = await api.get('/dashboard/manager-stats')
    return response.data.data
  }

  /**
   * 管理者ダッシュボード用の統計データを取得
   */
  async getAdminStats(): Promise<AdminDashboardStats> {
    const response = await api.get('/dashboard/admin-stats')
    return response.data.data
  }
}

export const dashboardService = new DashboardService()
