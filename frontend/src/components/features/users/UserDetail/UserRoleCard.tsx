'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserDetail } from './hooks/useUserDetail'
import { Eye, EyeOff } from 'lucide-react'
import React from 'react'


interface UserRoleCardProps {
  user: UserDetail
}

// 役割の型定義
interface Role {
  id: number
  name: string
  display_name?: string
  description?: string
}

export function UserRoleCard({ user }: UserRoleCardProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [actualPassword, setActualPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // パスワード確認処理
  const handlePasswordCheck = async () => {
    try {
      setIsLoading(true)
      // 実際のAPI呼び出しは後で実装
      // 現在は仮のパスワードを表示
      setActualPassword('password123')
      setShowPasswordModal(true)
    } catch (error) {
      console.error('パスワード確認エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // パスワード表示値の計算
  const getPasswordDisplayValue = () => {
    if (!actualPassword) return ''
    return showPassword ? actualPassword : '•'.repeat(actualPassword.length)
  }

  return (
    <React.Fragment>
      <Card>
        <CardHeader>
          <CardTitle>システム利用権限</CardTitle>
          <CardDescription>システム権限と割り当て役割を表示します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">ログインID</label>
              <div className="flex items-center gap-2">
                <p className="text-sm">{user.login_id || '未設定'}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePasswordCheck}
                  disabled={isLoading}
                  className="w-fit"
                >
                  {isLoading ? '確認中...' : 'パスワードを確認'}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">システム権限レベル</label>
              <p className="text-sm">{user.system_level_info?.display_name || '未設定'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">アカウント状態</label>
              <div className="flex gap-2">
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                  {user.is_active ? '有効' : '無効'}
                </Badge>
                {user.is_locked && (
                  <Badge variant="destructive">ロック中</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">割り当て役割</label>
            <div className="flex flex-wrap gap-2">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role: Role, index: number) => (
                  <Badge key={index} variant="outline">
                    {role.name || role.display_name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">役割が割り当てられていません</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* パスワード確認モーダル */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">パスワード確認</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPasswordModal(false)
                  setShowPassword(false)
                  setActualPassword('')
                }}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                ユーザー: {user.name} ({user.login_id})
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">パスワード</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={getPasswordDisplayValue()}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setShowPassword(false)
                    setActualPassword('')
                  }}
                >
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  )
}
