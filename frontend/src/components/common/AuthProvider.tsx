'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { authService } from '@/lib/authService'
import { setCredentials, logout, updatePermissions } from '@/store/authSlice'
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
  const authStateRef = useRef({ user, isAuthenticated })
  
  // 最新の認証状態をrefに保存
  authStateRef.current = { user, isAuthenticated }

  useEffect(() => {
    // 認証ページでは何もしない（リダイレクトも発生しない）
    if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
      setIsInitialized(true)
      return
    }
    
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
        if (authStateRef.current.user && authStateRef.current.isAuthenticated) {
          setIsInitialized(true)
          return
        }

        // ユーザー情報を取得
        const { user: userData, effectivePermissions } = await authService.me()
        dispatch(setCredentials({ user: userData, token, effectivePermissions }))
        
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
  }, [dispatch, router, pathname])

  // 権限の定期更新とページフォーカス時の更新
  useEffect(() => {
    if (!isAuthenticated) return

    let lastActivity = Date.now()
    let isIdle = false

    const refreshPermissions = async () => {
      // アイドル状態の場合は権限更新をスキップ
      if (isIdle) {
        console.log('Skipping permission update due to idle state')
        return
      }

      try {
        const { effectivePermissions } = await authService.me()
        dispatch(updatePermissions(effectivePermissions))
      } catch (error: unknown) {
        console.error('Permission update failed:', error)
        
        // タイムアウトエラーの場合は特別な処理はしない（api.tsで処理される）
        if (error && typeof error === 'object' && 'code' in error) {
          const axiosError = error as { code?: string; message?: string }
          if (axiosError.code === 'ECONNABORTED' || 
              (axiosError.message && axiosError.message.includes('timeout'))) {
            // タイムアウトエラーはapi.tsで処理されるため、何もしない
            return
          }
        }
        
        // 認証エラーの場合はログアウト
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          localStorage.removeItem('token')
          dispatch(logout())
          router.push('/login')
        }
      }
    }

    // ユーザーアクティビティの監視
    const handleActivity = () => {
      lastActivity = Date.now()
      isIdle = false
    }

    // アイドル状態のチェック（30分でアイドルとみなす）
    const checkIdleState = () => {
      if (Date.now() - lastActivity > 30 * 60 * 1000) { // 30分
        isIdle = true
        console.log('User is now idle, stopping permission updates')
      }
    }

    // ページフォーカス時の更新
    const handleFocus = () => {
      isIdle = false
      lastActivity = Date.now()
      refreshPermissions()
    }

    // 定期更新（5分間隔）
    const interval = setInterval(refreshPermissions, 5 * 60 * 1000)
    
    // アイドル状態チェック（1分間隔）
    const idleCheckInterval = setInterval(checkIdleState, 60 * 1000)

    // イベントリスナーの登録
    window.addEventListener('focus', handleFocus)
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keypress', handleActivity)
    window.addEventListener('click', handleActivity)
    
    // クリーンアップ
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keypress', handleActivity)
      window.removeEventListener('click', handleActivity)
      clearInterval(interval)
      clearInterval(idleCheckInterval)
    }
  }, [isAuthenticated, dispatch, router])

  // 認証ページでは初期化チェックをスキップ
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return <>{children}</>
  }

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
