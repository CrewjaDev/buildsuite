'use client'

import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { authService } from '@/lib/authService'
import { setCredentials, logout } from '@/store/authSlice'
import { useRouter, usePathname } from 'next/navigation'

interface AuthProviderProps {
  children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        
        if (!token) {
          // トークンがない場合は認証ページにリダイレクト（認証ページ以外の場合）
          if (!pathname?.startsWith('/login') && !pathname?.startsWith('/register')) {
            router.push('/login')
          }
          setIsInitialized(true)
          return
        }

        // 既にユーザー情報がある場合は初期化完了
        if (user && isAuthenticated) {
          setIsInitialized(true)
          return
        }

        // ユーザー情報を取得
        const userData = await authService.me()
        dispatch(setCredentials({ user: userData, token }))
        
        // 認証ページにいる場合はダッシュボードにリダイレクト
        if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
          router.push('/dashboard')
        }
        
      } catch (error) {
        console.error('Auth initialization failed:', error)
        
        // 認証エラーの場合はトークンを削除してログインページにリダイレクト
        localStorage.removeItem('token')
        dispatch(logout())
        
        if (!pathname?.startsWith('/login') && !pathname?.startsWith('/register')) {
          router.push('/login')
        }
      } finally {
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [dispatch, router, pathname, user, isAuthenticated])

  // 初期化中はローディング表示
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
