'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { UserDetail } from './hooks/useUserDetail'
import { Eye, EyeOff } from 'lucide-react'
import { userService } from '@/lib/userService'

// バリデーションスキーマ
const passwordSchema = z.object({
  newPassword: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  confirmPassword: z.string().min(1, 'パスワードの確認を入力してください'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
})

type PasswordFormData = z.infer<typeof passwordSchema>

interface UserPasswordCardProps {
  user: UserDetail
  onSuccess?: () => void
}

export function UserPasswordCard({ user, onSuccess }: UserPasswordCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange', // リアルタイムでバリデーション
  })



  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true)
    try {
      // パスワード変更APIを呼び出し
      const result = await userService.changePassword(
        user.id,
        data.newPassword,
        data.confirmPassword
      )
      
      if (result.success) {
        addToast({
          type: 'success',
          title: 'パスワード設定完了',
          description: result.message || 'パスワードが正常に設定されました',
          duration: 3000,
        })
        
        reset()
        onSuccess?.()
      } else {
        throw new Error(result.message || 'パスワード設定に失敗しました')
      }
    } catch (error: unknown) {
      console.error('Password change failed:', error)
      
      // エラーメッセージを取得
      let errorMessage = 'パスワードの設定に失敗しました。もう一度お試しください。'
      
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response
        if (response?.data?.message) {
          errorMessage = response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      addToast({
        type: 'error',
        title: 'パスワード設定失敗',
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }



  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* パスワード設定カード */}
        <Card>
          <CardHeader>
            <CardTitle>パスワード設定</CardTitle>
            <CardDescription>ユーザーのパスワードを新しいパスワードに設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  {...register('newPassword')}
                  placeholder="新しいパスワードを入力（8文字以上）"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-500">{errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="新しいパスワードを再入力"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
              >
                {isSubmitting ? '設定中...' : 'パスワード設定'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
