import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'

export const useAuth = () => {
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth)
  
  return {
    user,
    isAuthenticated,
    loading,
    // ヘッダー用のユーザー情報を取得
    headerUser: user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: user.is_admin,
      system_level: user.system_level,
      primary_department: user.primary_department,
      is_active: user.is_active,
      last_login_at: user.last_login_at
    } : undefined
  }
}
