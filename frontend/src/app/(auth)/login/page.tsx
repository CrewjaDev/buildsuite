'use client'

import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { setCredentials, setLoading, logout } from '@/store/authSlice'
import { authService } from '@/lib/authService'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()
  const loading = useAppSelector((state) => state.auth.loading)
  const router = useRouter()
  
  // ログインページでは自動リダイレクトを無効化
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     router.push('/dashboard')
  //   }
  // }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    dispatch(setLoading(true))

    try {
      const response = await authService.login({ login_id: loginId, password })
      
      // ログイン成功時のみ認証状態を更新
      dispatch(setCredentials(response))
      localStorage.setItem('token', response.token)
      
      // ログイン成功後、ダッシュボードにリダイレクト
      router.push('/dashboard')
    } catch (err: unknown) {
      // エラー時は認証状態を更新せず、エラーメッセージを表示
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || 'ログインに失敗しました')
      } else {
        setError('ログインに失敗しました')
      }
      
      // エラー時はトークンをクリアして認証状態をリセット
      localStorage.removeItem('token')
      dispatch(logout())
    } finally {
      setIsSubmitting(false)
      dispatch(setLoading(false))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">BS</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            BuildSuite にログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントにサインインしてください
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ログインID
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                required
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                required
                suppressHydrationWarning
              />
            </div>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading || isSubmitting ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}



