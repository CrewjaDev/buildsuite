'use client'

import { useState, useMemo, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { useToast } from '@/components/ui/toast'
import { PopoverSearchFilter } from '@/components/common/data-display/DataTable/PopoverSearchFilter'
import { useSystemLevels } from '@/hooks/features/employee/useEmployeeSelect'
import { useGrantSystemAccess, useRevokeSystemAccess } from '@/hooks/features/employee/useSystemAccess'
import { type Employee } from '@/services/features/employees/employeeService'

// バリデーションスキーマ
const systemAccessSchema = z.object({
  login_id: z.string().min(1, 'ログインIDは必須です'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  password_confirmation: z.string().min(1, 'パスワード確認は必須です'),
  system_level: z.string().min(1, 'システムレベルは必須です'),
  is_admin: z.boolean().default(false),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'パスワードが一致しません',
  path: ['password_confirmation'],
})

type SystemAccessFormData = {
  login_id: string
  password: string
  password_confirmation: string
  system_level: string
  is_admin: boolean
}

interface SystemAccessFormProps {
  employee: Employee
  onSuccess?: () => void
  onCancel?: () => void
}



export function SystemAccessForm({ employee, onSuccess, onCancel }: SystemAccessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)

  const { addToast } = useToast()
  const { data: systemLevels, isLoading: isLoadingSystemLevels } = useSystemLevels()
  const grantSystemAccessMutation = useGrantSystemAccess()
  const revokeSystemAccessMutation = useRevokeSystemAccess()

  const hasSystemAccess = employee.has_system_access && employee.user

  // 初期値を定義
  const initialValues = useMemo(() => ({
    login_id: employee.user?.login_id || '',
    password: '',
    password_confirmation: '',
    system_level: employee.user?.system_level || '',
    is_admin: Boolean(employee.user?.is_admin),
  }), [employee.user])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(systemAccessSchema),
    defaultValues: initialValues,
  })

  // フォームの現在の値を監視
  const watchedValues = watch()

  // employeeプロップが更新されたときにフォームの値を更新
  useEffect(() => {
    const newValues = {
      login_id: employee.user?.login_id || '',
      password: '',
      password_confirmation: '',
      system_level: employee.user?.system_level || '',
      is_admin: Boolean(employee.user?.is_admin),
    }
    reset(newValues)
  }, [employee.user, reset])

  // 変更検知ロジック
  const hasChanges = useMemo(() => {
    // 新規付与の場合は、必須フィールドが入力されていればボタンを有効にする
    if (!hasSystemAccess) {
      return Boolean(
        watchedValues.login_id?.trim() &&
        watchedValues.password?.trim() &&
        watchedValues.password_confirmation?.trim() &&
        watchedValues.system_level?.trim()
      )
    }

    // 更新の場合は、初期値から変更があるかチェック
    return (
      watchedValues.login_id !== initialValues.login_id ||
      watchedValues.password !== initialValues.password ||
      watchedValues.password_confirmation !== initialValues.password_confirmation ||
      watchedValues.system_level !== initialValues.system_level ||
      watchedValues.is_admin !== initialValues.is_admin
    )
  }, [watchedValues, initialValues, hasSystemAccess])

  // フォーム送信処理
  const onSubmit = async (data: SystemAccessFormData) => {
    try {
      setIsSubmitting(true)

      await grantSystemAccessMutation.mutateAsync({
        id: employee.id,
        data: {
          login_id: data.login_id,
          password: data.password,
          system_level: data.system_level,
          is_admin: data.is_admin,
        },
      })

      addToast({
        title: '成功',
        description: hasSystemAccess 
          ? 'システム利用権限が正常に更新されました'
          : 'システム利用権限が正常に付与されました',
        type: 'success',
      })

      // パスワードフィールドを明示的にクリア
      setValue('password', '')
      setValue('password_confirmation', '')

      onSuccess?.()
    } catch (error) {
      console.error('System access grant/update failed:', error)
      addToast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'システム権限の処理に失敗しました',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // システム権限無効化
  const handleRevokeAccess = async () => {
    try {
      setIsSubmitting(true)

      await revokeSystemAccessMutation.mutateAsync(employee.id)

      addToast({
        title: '成功',
        description: 'システム利用権限が正常に無効化されました',
        type: 'success',
      })

      setShowRevokeConfirm(false)
      onSuccess?.()
    } catch (error) {
      console.error('System access revoke failed:', error)
      addToast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'システム権限の無効化に失敗しました',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingSystemLevels) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">データを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 現在の状態表示 */}
      <Card className={hasSystemAccess ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                システム利用権限
                <Badge variant={hasSystemAccess ? 'default' : 'secondary'}>
                  {hasSystemAccess ? '付与済み' : '未付与'}
                </Badge>
              </CardTitle>
              <CardDescription>
                社員: {employee.name} ({employee.employee_id})
              </CardDescription>
            </div>
            {hasSystemAccess && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRevokeConfirm(true)}
                disabled={isSubmitting}
              >
                権限を無効化
              </Button>
            )}
          </div>
        </CardHeader>
        {hasSystemAccess && employee.user && (
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">ログインID</Label>
                <p className="font-medium">{employee.user.login_id}</p>
              </div>
              <div>
                <Label className="text-gray-600">システムレベル</Label>
                <p className="font-medium">{String(employee.user.system_level_info?.display_name || 'なし')}</p>
              </div>
              <div>
                <Label className="text-gray-600">管理者権限</Label>
                <p className="font-medium">{employee.user.is_admin ? 'あり' : 'なし'}</p>
              </div>
              <div>
                <Label className="text-gray-600">最終ログイン</Label>
                <p className="font-medium">
                  {employee.user.last_login_at 
                    ? new Date(employee.user.last_login_at).toLocaleString('ja-JP')
                    : '未ログイン'
                  }
                </p>
              </div>

            </div>
          </CardContent>
        )}
      </Card>

      {/* システム権限設定フォーム */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {hasSystemAccess ? 'システム利用権限を更新' : 'システム利用権限を付与'}
            </CardTitle>
            <CardDescription>
              {hasSystemAccess 
                ? 'ログイン情報とシステムレベルを更新できます'
                : 'この社員にシステム利用権限を付与します'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ログインID */}
              <div className="space-y-2">
                <Label htmlFor="login_id">
                  ログインID <Badge variant="destructive">必須</Badge>
                </Label>
                <Input
                  id="login_id"
                  {...register('login_id')}
                  placeholder="例: yamada_taro"
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-lpignore="true"
                />
                {errors.login_id && (
                  <p className="text-sm text-red-600">{errors.login_id.message}</p>
                )}
              </div>

              {/* システムレベル */}
              <div className="space-y-2">
                <Label htmlFor="system_level">
                  システムレベル <Badge variant="destructive">必須</Badge>
                </Label>
                <PopoverSearchFilter
                  options={systemLevels?.map(level => ({
                    value: level.code,
                    label: `${level.display_name} (優先度: ${level.priority})`
                  })) || []}
                  value={watch('system_level') || ''}
                  onValueChange={(value: string) => setValue('system_level', value)}
                  placeholder="システムレベルを選択"
                  width="300px"
                />
                {errors.system_level && (
                  <p className="text-sm text-red-600">{errors.system_level.message}</p>
                )}
              </div>

              {/* パスワード */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  パスワード <Badge variant="destructive">必須</Badge>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register('password')}
                    placeholder="8文字以上で入力"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* パスワード確認 */}
              <div className="space-y-2">
                <Label htmlFor="password_confirmation">
                  パスワード確認 <Badge variant="destructive">必須</Badge>
                </Label>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    type={showPasswordConfirmation ? "text" : "password"}
                    {...register('password_confirmation')}
                    placeholder="パスワードを再入力"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                  >
                    {showPasswordConfirmation ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {errors.password_confirmation && (
                  <p className="text-sm text-red-600">{errors.password_confirmation.message}</p>
                )}
              </div>
            </div>

            {/* 管理者権限 */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_admin"
                checked={watch('is_admin')}
                onChange={(e) => setValue('is_admin', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="is_admin" className="text-sm font-medium leading-none cursor-pointer">
                管理者権限を付与する
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* フォームアクション */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={!hasChanges || isSubmitting}
          >
            {isSubmitting 
              ? (hasSystemAccess ? '更新中...' : '付与中...') 
              : (hasSystemAccess ? '権限を更新' : '権限を付与')
            }
          </Button>
        </div>
      </form>

      {/* 無効化確認ダイアログ */}
      {showRevokeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">システム権限を無効化</CardTitle>
              <CardDescription>
                本当に {employee.name} のシステム利用権限を無効化しますか？
                この操作は取り消せません。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRevokeConfirm(false)}
                  disabled={isSubmitting}
                >
                  キャンセル
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRevokeAccess}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '無効化中...' : '無効化する'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
