'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { setCredentials, setLoading } from '@/store/authSlice'
import { authService } from '@/lib/authService'
import { useRefresh } from '@/hooks/useRefresh'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const dispatch = useAppDispatch()
  const loading = useAppSelector((state) => state.auth.loading)
  
  // 認証状態の確認（ログインページでは最小限の使用）
  const { data: authStatus, refresh: refreshAuthStatus } = useRefresh('/api/auth/status', {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  })

  // 既にログイン済みの場合はリダイレクト
  useEffect(() => {
    if (authStatus?.isAuthenticated) {
      router.push('/dashboard')
    }
  }, [authStatus, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    dispatch(setLoading(true))

    try {
      const response = await authService.login({ email, password })
      dispatch(setCredentials(response))
      localStorage.setItem('token', response.token)
      
      // ログイン成功後、認証状態を更新
      refreshAuthStatus()
      router.push('/dashboard')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || 'ログインに失敗しました')
      } else {
        setError('ログインに失敗しました')
      }
    } finally {
      dispatch(setLoading(false))
    }
  }

  // 既にログイン済みの場合は何も表示しない
  if (authStatus?.isAuthenticated) {
    return <div>リダイレクト中...</div>
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md" suppressHydrationWarning>
      <h2 className="text-2xl font-bold mb-6 text-center">ログイン</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </div>
  )
}



