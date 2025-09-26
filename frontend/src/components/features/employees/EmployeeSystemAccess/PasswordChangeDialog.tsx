'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { Eye, EyeOff } from 'lucide-react'
import { usePasswordChange } from '@/hooks/features/employee/usePasswordChange'
import { type Employee } from '@/types/features/employees'

// パスワード変更用のバリデーションスキーマ
const passwordChangeSchema = z.object({
  current_password: z.string().min(1, '現在のパスワードは必須です'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  password_confirmation: z.string().min(1, 'パスワード確認は必須です'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'パスワードが一致しません',
  path: ['password_confirmation'],
})

type PasswordChangeFormData = {
  current_password: string
  password: string
  password_confirmation: string
}

interface PasswordChangeDialogProps {
  employee: Employee
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PasswordChangeDialog({ employee, isOpen, onClose, onSuccess }: PasswordChangeDialogProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const { addToast } = useToast()
  const passwordChangeMutation = usePasswordChange()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: ''
    }
  })

  const onSubmit = async (data: PasswordChangeFormData) => {
    if (!employee.user) {
      addToast({
        title: 'エラー',
        description: 'ユーザー情報が見つかりません',
        type: 'error',
      })
      return
    }

    try {
      // 新しいパスワード変更APIを使用
      await passwordChangeMutation.mutateAsync({
        userId: employee.user.id,
        data: {
          current_password: data.current_password,
          password: data.password,
          password_confirmation: data.password_confirmation,
        },
      })

      addToast({
        title: '成功',
        description: 'パスワードが正常に変更されました',
        type: 'success',
      })

      // フォームをリセット
      reset()
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Password change failed:', error)
      addToast({
        title: 'エラー',
        description: 'パスワードの変更に失敗しました',
        type: 'error',
      })
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>パスワード変更</DialogTitle>
          <DialogDescription>
            {employee.name}さんのパスワードを変更します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 現在のパスワード */}
          <div className="space-y-2">
            <Label htmlFor="current_password">現在のパスワード</Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showCurrentPassword ? 'text' : 'password'}
                {...register('current_password')}
                placeholder="現在のパスワードを入力してください"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.current_password && (
              <p className="text-sm text-red-600">{errors.current_password.message}</p>
            )}
          </div>

          {/* 新しいパスワード */}
          <div className="space-y-2">
            <Label htmlFor="password">新しいパスワード</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="8文字以上で入力してください"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* パスワード確認 */}
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">パスワード確認</Label>
            <div className="relative">
              <Input
                id="password_confirmation"
                type={showPasswordConfirmation ? 'text' : 'password'}
                {...register('password_confirmation')}
                placeholder="パスワードを再入力してください"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="text-sm text-red-600">{errors.password_confirmation.message}</p>
            )}
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={passwordChangeMutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={passwordChangeMutation.isPending}
            >
              {passwordChangeMutation.isPending ? '変更中...' : 'パスワード変更'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
