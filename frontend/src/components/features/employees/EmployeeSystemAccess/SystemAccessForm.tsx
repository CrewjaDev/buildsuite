'use client'

import { useState, useMemo, useEffect } from 'react'
import { Key } from 'lucide-react'
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
import { useRoles, useUserRoles, useUpdateUserRoles } from '@/hooks/features/employee/useRoles'
import { type Employee } from '@/types/features/employees'
import { PasswordChangeDialog } from './PasswordChangeDialog'

// 権限管理用のバリデーションスキーマ（パスワードは含まない）
const permissionManagementSchema = z.object({
  login_id: z.string().min(1, 'ログインIDは必須です'),
  system_level: z.string().min(1, 'システムレベルは必須です'),
  is_admin: z.boolean().default(false),
  roles: z.array(z.string()).default([]), // 役割の配列
})

type PermissionManagementFormData = {
  login_id: string
  system_level: string
  is_admin: boolean
  roles: string[]
}

interface SystemAccessFormProps {
  employee: Employee
  onSuccess?: () => void
  onCancel?: () => void
}



export function SystemAccessForm({ employee, onSuccess, onCancel }: SystemAccessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false)

  const { addToast } = useToast()
  const { data: systemLevels, isLoading: isLoadingSystemLevels } = useSystemLevels()
  const { data: roles, isLoading: isLoadingRoles } = useRoles()
  const { data: userRoles, isLoading: isLoadingUserRoles } = useUserRoles(employee.user?.id || 0)
  const grantSystemAccessMutation = useGrantSystemAccess()
  const revokeSystemAccessMutation = useRevokeSystemAccess()
  const updateUserRolesMutation = useUpdateUserRoles()

  const hasSystemAccess = Boolean(employee.has_system_access && employee.user)

  // 初期値を定義
  const initialValues = useMemo(() => ({
    login_id: employee.user?.login_id || '',
    system_level: employee.user?.system_level || '',
    is_admin: Boolean(employee.user?.is_admin),
    roles: userRoles?.map(role => role.id.toString()) || [],
  }), [employee.user, userRoles])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(permissionManagementSchema),
    defaultValues: initialValues,
  })

  // フォームの現在の値を監視
  const watchedValues = watch()

  // employeeプロップが更新されたときにフォームの値を更新
  useEffect(() => {
    const newValues = {
      login_id: employee.user?.login_id || '',
      system_level: employee.user?.system_level || '',
      is_admin: Boolean(employee.user?.is_admin),
      roles: userRoles?.map(role => role.id.toString()) || [],
    }
    reset(newValues)
  }, [employee.user, userRoles, reset])

  // 変更検知ロジック
  const hasChanges = useMemo(() => {
    // 新規付与の場合は、必須フィールドが入力されていればボタンを有効にする
    if (!hasSystemAccess) {
      return Boolean(
        watchedValues.login_id?.trim() &&
        watchedValues.system_level?.trim()
      )
    }

    // 更新の場合は、初期値から変更があるかチェック
    const loginIdChanged = watchedValues.login_id !== initialValues.login_id
    const systemLevelChanged = watchedValues.system_level !== initialValues.system_level
    const isAdminChanged = watchedValues.is_admin !== initialValues.is_admin
    
    // 配列の比較を改善
    const currentRoles = watchedValues.roles || []
    const initialRoles = initialValues.roles || []
    const rolesChanged = currentRoles.length !== initialRoles.length || 
      !currentRoles.every(role => initialRoles.includes(role))
    
    const hasChanges = loginIdChanged || systemLevelChanged || isAdminChanged || rolesChanged
    
    return hasChanges
  }, [watchedValues, initialValues, hasSystemAccess])

  // フォーム送信処理
  const onSubmit = async (data: PermissionManagementFormData) => {
    console.log('Form submission started:', data)
    console.log('onSubmit function called')
    
    // 追加のバリデーション
    if (!data.system_level || data.system_level.trim() === '') {
      console.error('System level is empty or invalid:', data.system_level)
      addToast({
        title: 'エラー',
        description: 'システムレベルを選択してください',
        type: 'error',
      })
      return
    }
    
    if (!data.login_id || data.login_id.trim() === '') {
      console.error('Login ID is empty or invalid:', data.login_id)
      addToast({
        title: 'エラー',
        description: 'ログインIDを入力してください',
        type: 'error',
      })
      return
    }
    
    try {
      setIsSubmitting(true)

      // システム権限の更新/付与
      const requestData = {
        login_id: data.login_id.trim(),
        system_level: data.system_level.trim(),
        is_admin: data.is_admin,
      }
      
      console.log('Sending request data:', requestData)
      console.log('Employee ID:', employee.id)
      
      await grantSystemAccessMutation.mutateAsync({
        id: employee.id,
        data: requestData,
      })

      // 役割の更新（システム権限がある場合のみ）
      if (hasSystemAccess && employee.user?.id) {
        try {
          const roleIds = data.roles ? data.roles.map(id => parseInt(id)) : []
          console.log('Updating roles:', { userId: employee.user.id, roleIds })
          await updateUserRolesMutation.mutateAsync({
            userId: employee.user.id,
            roleIds: roleIds,
          })
          console.log('Roles updated successfully')
        } catch (roleError) {
          console.error('Role update failed:', roleError)
          // 役割更新が失敗しても、基本的な権限更新は続行
        }
      }

      addToast({
        title: '成功',
        description: hasSystemAccess 
          ? '権限が正常に更新されました'
          : 'システム利用権限が正常に付与されました',
        type: 'success',
      })

      onSuccess?.()
    } catch (error) {
      console.error('System access grant/update failed:', error)
      
      // バリデーションエラーの詳細をログ出力
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { errors?: unknown } } }
        console.error('Validation errors:', axiosError.response?.data?.errors)
        console.error('Full error response:', axiosError.response?.data)
      }
      
      addToast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '権限の処理に失敗しました',
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

  if (isLoadingSystemLevels || isLoadingRoles || isLoadingUserRoles) {
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
            
            {/* 現在の役割表示 */}
            <div className="mt-4 pt-4 border-t">
              <Label className="text-gray-600">現在の役割</Label>
              <div className="mt-2">
                {userRoles && userRoles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userRoles.map((role) => (
                      <Badge key={role.id} variant="secondary">
                        {role.display_name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    役割は設定されていません（システム権限レベルの基本権限のみ適用）
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* システム権限設定フォーム */}
      <form onSubmit={(e) => {
        console.log('Form onSubmit event triggered')
        console.log('Form errors:', errors)
        console.log('Form values:', watch())
        handleSubmit(onSubmit, (errors) => {
          console.log('Validation errors:', errors)
        })(e)
      }} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {hasSystemAccess ? '権限を更新' : 'システム利用権限を付与'}
            </CardTitle>
            <CardDescription>
              {hasSystemAccess 
                ? 'ログイン情報、システムレベル、機能役割を更新できます'
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
                  onValueChange={(value: string) => {
                    console.log('System level changed to:', value)
                    setValue('system_level', value)
                  }}
                  placeholder="システムレベルを選択"
                  width="300px"
                />
                {errors.system_level && (
                  <p className="text-sm text-red-600">{errors.system_level.message}</p>
                )}
              </div>

              {/* パスワード変更ボタン（既存ユーザーのみ） */}
              {hasSystemAccess && (
                <div className="space-y-2">
                  <Label>パスワード</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordChangeDialog(true)}
                    className="w-full"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    パスワードを変更
                  </Button>
                </div>
              )}
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

            {/* 役割選択（システム権限がある場合のみ表示） */}
            {hasSystemAccess && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  機能役割 <span className="text-gray-500 font-normal">（任意）</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roles?.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={watch('roles')?.includes(role.id.toString()) || false}
                        onChange={(e) => {
                          const currentRoles = watch('roles') || []
                          if (e.target.checked) {
                            setValue('roles', [...currentRoles, role.id.toString()])
                          } else {
                            setValue('roles', currentRoles.filter(id => id !== role.id.toString()))
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor={`role-${role.id}`} className="text-sm cursor-pointer">
                        {role.display_name}
                        {role.description && (
                          <span className="text-gray-500 ml-1">({role.description})</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    複数の役割を選択できます。選択した役割の権限が統合されます。
                  </p>
                  <p className="text-xs text-blue-600">
                    ※ 役割を設定しない場合、システム権限レベルの基本権限のみが適用されます。
                  </p>
                </div>
              </div>
            )}
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
            onClick={() => console.log('Submit button clicked:', { hasChanges, isSubmitting })}
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

      {/* パスワード変更ダイアログ */}
      <PasswordChangeDialog
        employee={employee}
        isOpen={showPasswordChangeDialog}
        onClose={() => setShowPasswordChangeDialog(false)}
        onSuccess={() => {
          // パスワード変更成功時の処理
          setShowPasswordChangeDialog(false)
        }}
      />
    </div>
  )
}
