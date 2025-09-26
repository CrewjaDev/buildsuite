'use client'

import { useAppSelector } from '@/lib/hooks'
import UserDashboard from '@/components/features/dashboard/UserDashboard'
import ManagerDashboard from '@/components/features/dashboard/ManagerDashboard'
import AdminDashboard from '@/components/features/dashboard/AdminDashboard'
import ApprovalDashboard from '@/components/features/dashboard/ApprovalDashboard'
import type { HeaderUser } from '@/types/user'

export default function DashboardPage() {
  const { user, isAuthenticated } = useAppSelector((state: unknown) => (state as { auth: { user: HeaderUser; isAuthenticated: boolean } }).auth)

  // 認証状態の確認（AuthProviderで既にチェック済み）
  if (!user || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    )
  }

  // ユーザーの権限に基づいてダッシュボードを切り替え
  const renderDashboard = () => {
    if (user.is_admin) {
      return <AdminDashboard user={user} />
    }
    
    // 承認者機能利用権限を持つユーザーには承認者ダッシュボードを表示
    if (user.permissions?.includes('approval.usage')) {
      return <ApprovalDashboard user={user} />
    }
    
    // システム権限レベルに基づく判定
    switch (user.system_level) {
      case 'admin':
        return <AdminDashboard user={user} />
      case 'manager':
        return <ManagerDashboard user={user} />
      default:
        return <UserDashboard user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderDashboard()}
    </div>
  )
}
