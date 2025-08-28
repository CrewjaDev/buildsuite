'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { UserDetail, useUpdateUserDetail } from './hooks/useUserDetail'
import { useUserOptions } from './hooks/useUserOptions'
import { format } from 'date-fns'

// バリデーションスキーマ
const userEditSchema = z.object({
  login_id: z.string().min(1, 'ログインIDは必須です'),
  employee_id: z.string().min(1, '社員IDは必須です'),
  name: z.string().min(1, '社員名は必須です'),
  name_kana: z.string().optional(),
  email: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  phone: z.string().optional(),
  mobile_phone: z.string().optional(),
  postal_code: z.string().optional(),
  prefecture: z.string().optional(),
  address: z.string().optional(),
  job_title: z.string().optional(),
  hire_date: z.string().optional(),
  is_active: z.boolean(),
  is_admin: z.boolean(),
  system_level: z.string().optional(),
  role_ids: z.array(z.number()).optional(),
  department_ids: z.array(z.number()).optional(),
  position_id: z.number().optional(),
  primary_department_id: z.number().optional(),
})

type UserEditFormData = z.infer<typeof userEditSchema>

interface UserDetailEditProps {
  user: UserDetail
  onCancel: () => void
  onSuccess?: () => void
}

// 性別オプション
const genderOptions = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
]

// 都道府県オプション
const prefectureOptions = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

export function UserDetailEdit({ user, onCancel, onSuccess }: UserDetailEditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const updateUserMutation = useUpdateUserDetail()
  const { data: userOptions } = useUserOptions()
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      login_id: user.login_id || '',
      employee_id: user.employee_id || '',
      name: user.name || '',
      name_kana: user.name_kana || '',
      email: user.email || '',
      birth_date: user.birth_date ? format(new Date(user.birth_date), 'yyyy-MM-dd') : '',
      gender: (user.gender as 'male' | 'female' | 'other') || undefined,
      phone: user.phone || '',
      mobile_phone: user.mobile_phone || '',
      postal_code: user.postal_code || '',
      prefecture: user.prefecture || '',
      address: user.address || '',
      job_title: user.job_title || '',
      hire_date: user.hire_date ? format(new Date(user.hire_date), 'yyyy-MM-dd') : '',
      is_active: user.is_active,
      is_admin: user.is_admin,
      system_level: user.system_level || '',
      role_ids: user.roles?.map(role => role.id) || [],
      department_ids: user.departments?.map(dept => dept.id) || [],
      position_id: user.position?.id,
      primary_department_id: user.primary_department?.id,
    },
  })



  const onSubmit = async (data: UserEditFormData) => {
    setIsSubmitting(true)
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          ...data,
          // 日付フィールドの変換
          birth_date: data.birth_date || undefined,
          hire_date: data.hire_date || undefined,
        },
      })
      
      addToast({
        type: 'success',
        title: '更新完了',
        description: 'ユーザー情報が正常に更新されました',
        duration: 3000,
      })
      
      onSuccess?.()
    } catch (error) {
      console.error('User update failed:', error)
      addToast({
        type: 'error',
        title: '更新失敗',
        description: 'ユーザー情報の更新に失敗しました。もう一度お試しください。',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本情報カード */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>基本情報</span>
            <Badge variant={user.is_active ? 'default' : 'secondary'}>
              {user.is_active ? '有効' : '無効'}
            </Badge>
          </CardTitle>
          <CardDescription>ユーザーの基本情報を編集します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">社員ID *</Label>
              <Input
                id="employee_id"
                {...register('employee_id')}
                placeholder="社員IDを入力"
              />
              {errors.employee_id && (
                <p className="text-sm text-red-500">{errors.employee_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">社員名（漢字） *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="社員名を入力"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_kana">社員名（カナ）</Label>
              <Input
                id="name_kana"
                {...register('name_kana')}
                placeholder="社員名（カナ）を入力"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">性別</Label>
              <select
                id="gender"
                value={watch('gender') || ''}
                onChange={(e) => setValue('gender', e.target.value as 'male' | 'female' | 'other', { shouldDirty: true })}
                className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">性別を選択</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">生年月日</Label>
              <Input
                id="birth_date"
                type="date"
                {...register('birth_date')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="メールアドレスを入力"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 連絡先情報カード */}
      <Card>
        <CardHeader>
          <CardTitle>連絡先情報</CardTitle>
          <CardDescription>電話番号と住所情報を編集します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="電話番号を入力"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_phone">携帯電話</Label>
              <Input
                id="mobile_phone"
                {...register('mobile_phone')}
                placeholder="携帯電話番号を入力"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">郵便番号</Label>
              <Input
                id="postal_code"
                {...register('postal_code')}
                placeholder="郵便番号を入力"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prefecture">都道府県</Label>
              <select
                id="prefecture"
                value={watch('prefecture') || ''}
                onChange={(e) => setValue('prefecture', e.target.value, { shouldDirty: true })}
                className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">都道府県を選択</option>
                {prefectureOptions.map((prefecture) => (
                  <option key={prefecture} value={prefecture}>
                    {prefecture}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">住所</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="住所を入力"
            />
          </div>
        </CardContent>
      </Card>

      {/* 所属情報カード */}
      <Card>
        <CardHeader>
          <CardTitle>所属情報</CardTitle>
          <CardDescription>所属部署と職位情報を編集します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_department_id">所属部署</Label>
              <select
                id="primary_department_id"
                value={watch('primary_department_id')?.toString() || ''}
                onChange={(e) => setValue('primary_department_id', e.target.value ? Number(e.target.value) : undefined, { shouldDirty: true })}
                className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">所属部署を選択</option>
                {userOptions?.departments?.map((department) => (
                  <option key={department.id} value={department.id.toString()}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">役職</Label>
              <Input
                id="job_title"
                {...register('job_title')}
                placeholder="役職を入力"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position_id">職位</Label>
              <select
                id="position_id"
                value={watch('position_id')?.toString() || ''}
                onChange={(e) => setValue('position_id', e.target.value ? Number(e.target.value) : undefined, { shouldDirty: true })}
                className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">職位を選択</option>
                {userOptions?.positions?.map((position) => (
                  <option key={position.id} value={position.id.toString()}>
                    {position.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hire_date">入社年月日</Label>
              <Input
                id="hire_date"
                type="date"
                {...register('hire_date')}
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* システム利用権限カード */}
      <Card>
        <CardHeader>
          <CardTitle>システム利用権限</CardTitle>
          <CardDescription>システム権限とアカウント状態を編集します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="login_id">ログインID *</Label>
              <Input
                id="login_id"
                {...register('login_id')}
                placeholder="ログインIDを入力"
              />
              {errors.login_id && (
                <p className="text-sm text-red-500">{errors.login_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="system_level">システム権限レベル</Label>
              <select
                id="system_level"
                value={watch('system_level') || ''}
                onChange={(e) => setValue('system_level', e.target.value, { shouldDirty: true })}
                className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">システム権限レベルを選択</option>
                {userOptions?.system_levels?.map((level) => (
                  <option key={level.code} value={level.code}>
                    {level.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_active">アカウント状態</Label>
              <select
                id="is_active"
                value={watch('is_active') ? 'true' : 'false'}
                onChange={(e) => setValue('is_active', e.target.value === 'true', { shouldDirty: true })}
                className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="true">有効</option>
                <option value="false">無効</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>割り当て役割</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="role_employee"
                  checked={watch('role_ids')?.includes(1) || false}
                  onChange={(e) => {
                    const currentRoles = watch('role_ids') || []
                    if (e.target.checked) {
                      setValue('role_ids', [...currentRoles, 1], { shouldDirty: true })
                    } else {
                      setValue('role_ids', currentRoles.filter(id => id !== 1), { shouldDirty: true })
                    }
                  }}
                />
                <Label htmlFor="role_employee">社員</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="role_staff"
                  checked={watch('role_ids')?.includes(2) || false}
                  onChange={(e) => {
                    const currentRoles = watch('role_ids') || []
                    if (e.target.checked) {
                      setValue('role_ids', [...currentRoles, 2], { shouldDirty: true })
                    } else {
                      setValue('role_ids', currentRoles.filter(id => id !== 2), { shouldDirty: true })
                    }
                  }}
                />
                <Label htmlFor="role_staff">スタッフ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="role_section_chief"
                  checked={watch('role_ids')?.includes(3) || false}
                  onChange={(e) => {
                    const currentRoles = watch('role_ids') || []
                    if (e.target.checked) {
                      setValue('role_ids', [...currentRoles, 3], { shouldDirty: true })
                    } else {
                      setValue('role_ids', currentRoles.filter(id => id !== 3), { shouldDirty: true })
                    }
                  }}
                />
                <Label htmlFor="role_section_chief">課長</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="role_department_manager"
                  checked={watch('role_ids')?.includes(4) || false}
                  onChange={(e) => {
                    const currentRoles = watch('role_ids') || []
                    if (e.target.checked) {
                      setValue('role_ids', [...currentRoles, 4], { shouldDirty: true })
                    } else {
                      setValue('role_ids', currentRoles.filter(id => id !== 4), { shouldDirty: true })
                    }
                  }}
                />
                <Label htmlFor="role_department_manager">部長</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="role_director"
                  checked={watch('role_ids')?.includes(5) || false}
                  onChange={(e) => {
                    const currentRoles = watch('role_ids') || []
                    if (e.target.checked) {
                      setValue('role_ids', [...currentRoles, 5], { shouldDirty: true })
                    } else {
                      setValue('role_ids', currentRoles.filter(id => id !== 5), { shouldDirty: true })
                    }
                  }}
                />
                <Label htmlFor="role_director">取締役</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex justify-end gap-4">
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
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? '更新中...' : '更新'}
        </Button>
      </div>
    </form>
    </div>
  )
}
