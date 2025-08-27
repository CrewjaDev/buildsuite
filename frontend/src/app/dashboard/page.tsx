'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { authService } from '@/lib/authService'
import { setCredentials, logout } from '@/store/authSlice'

export default function DashboardPage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        
        if (!token) {
          router.push('/login')
          return
        }

        if (user && isAuthenticated) {
          setIsLoading(false)
          return
        }

        const userData = await authService.me()
        dispatch(setCredentials({ user: userData, token }))
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        localStorage.removeItem('token')
        dispatch(logout())
        router.push('/login')
      }
    }

    checkAuth()
  }, [user, isAuthenticated, dispatch, router])

  const handleLogout = async () => {
    try {
      await authService.logout()
      dispatch(logout())
      localStorage.removeItem('token')
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      dispatch(logout())
      localStorage.removeItem('token')
      router.push('/login')
    }
  }

  if (isLoading) {
    return <div>認証中...</div>
  }

  if (!user || !isAuthenticated) {
    return <div>認証中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            ダッシュボード
          </h1>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">
            ようこそ！{user?.name}さん
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">ユーザー情報</h3>
              <p className="text-blue-700">{user?.email}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">認証状態</h3>
              <p className="text-green-700">ログイン済み</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">アクション</h3>
              <button 
                onClick={handleLogout}
                className="text-purple-700 hover:text-purple-900"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}