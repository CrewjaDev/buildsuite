'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { setCredentials, setLoading } from '@/store/authSlice'
import { authService } from '@/lib/authService'

export default function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const dispatch = useAppDispatch()
  const loading = useAppSelector((state) => state.auth.loading)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    dispatch(setLoading(true))

    try {
      const response = await authService.login({ login_id: loginId, password })
      dispatch(setCredentials(response))
      localStorage.setItem('token', response.token)
      
      // ログイン成功後、ダッシュボードにリダイレクト
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
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </div>
  )
}



