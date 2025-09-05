'use client'

import { useState, useEffect } from 'react'
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
import { useCreateUser } from '@/hooks/useUsers'
import { useActiveSystemLevels } from '@/hooks/useSystemLevels'
import { useActiveDepartments } from '@/hooks/useDepartments'
import { useActivePositions } from '@/hooks/usePositions'

// バリデーションスキーマ
const userCreateSchema = z.object({
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
  role: z.string().optional(),
  department_id: z.string().optional(),
  position_id: z.string().optional(),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  password_confirmation: z.string().min(1, 'パスワードの確認を入力してください'),
}).refine((data) => data.password === data.password_confirmation, {
  message: "パスワードが一致しません",
  path: ["password_confirmation"],
})

type UserCreateFormData = z.infer<typeof userCreateSchema>

interface UserCreateFormProps {
  onSuccess?: () => void
  onCancel?: () => void
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
].map(prefecture => ({ value: prefecture, label: prefecture }))

// アカウント状態オプション
const accountStatusOptions = [
  { value: 'true', label: '有効' },
  { value: 'false', label: '無効' },
]



// 割当役割オプション
const roleOptions = [
  { value: 'admin', label: '管理者' },
  { value: 'manager', label: 'マネージャー' },
  { value: 'user', label: '一般ユーザー' },
]

// 選択欄の幅設定
const SELECT_WIDTHS = {
  gender: '200px',
  prefecture: '200px',
  accountStatus: '200px',
  systemLevel: '200px',
  role: '200px',
  department: '200px',
  position: '200px',
} as const

export function UserCreateForm({ onSuccess, onCancel }: UserCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const createUserMutation = useCreateUser()
  const { addToast } = useToast()
  const { data: systemLevelsData, isLoading: isLoadingSystemLevels } = useActiveSystemLevels()
  const { data: departmentsData, isLoading: isLoadingDepartments } = useActiveDepartments()
  const { data: positionsData, isLoading: isLoadingPositions } = useActivePositions()

  // データが読み込まれているかチェック
  const isDataLoaded = !isLoadingSystemLevels && !isLoadingDepartments && !isLoadingPositions

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    formState,
  } = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      login_id: '',
      employee_id: '',
      name: '',
      name_kana: '',
      email: '',
      birth_date: '',
      gender: undefined,
      phone: '',
      mobile_phone: '',
      postal_code: '',
      prefecture: '',
      address: '',
      job_title: '',
      hire_date: '',
      is_active: true,
      is_admin: false,
      system_level: '',
      role: '',
      department_id: undefined,
      position_id: undefined,
      password: '',
      password_confirmation: '',
    },
  })

  // フォームの変更状態を監視
  useEffect(() => {
    setIsFormDirty(formState.isDirty)
  }, [formState.isDirty])

  const onSubmit = async (data: UserCreateFormData) => {
    setIsSubmitting(true)
    try {
      // パスワード確認フィールドを除外
      const userData = {
        login_id: data.login_id,
        employee_id: data.employee_id,
        name: data.name,
        name_kana: data.name_kana,
        email: data.email,
        birth_date: data.birth_date,
        gender: data.gender,
        phone: data.phone,
        mobile_phone: data.mobile_phone,
        postal_code: data.postal_code,
        prefecture: data.prefecture,
        address: data.address,
        job_title: data.job_title,
        hire_date: data.hire_date,
        is_active: data.is_active,
        is_admin: data.is_admin,
        system_level: data.system_level,
        role: data.role,
        department_id: data.department_id ? parseInt(data.department_id) : undefined,
        position_id: data.position_id ? parseInt(data.position_id) : undefined,
        password: data.password,
      }
      
      await createUserMutation.mutateAsync(userData)
      
      addToast({
        type: 'success',
        title: '作成完了',
        description: 'ユーザーが正常に作成されました',
        duration: 3000,
      })
      
      onSuccess?.()
    } catch (error) {
      console.error('User creation failed:', error)
      addToast({
        type: 'error',
        title: '作成失敗',
        description: 'ユーザーの作成に失敗しました。もう一度お試しください。',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // データが読み込まれていない場合はローディング表示
  if (!isDataLoaded) {
    return (
      <div className="w-full max-w-4xl flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本情報カード */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>基本情報</span>
              <Badge variant="default">新規作成</Badge>
            </CardTitle>
            <CardDescription>ユーザーの基本情報を入力します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">社員ID *</Label>
                <Input
                  id="employee_id"
                  {...register('employee_id')}
                  placeholder="社員IDを入力"
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-lpignore="true"
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
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-lpignore="true"
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
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-lpignore="true"
                />
              </div>
              <div className="space-y-2">
                <Label>性別</Label>
                <PopoverSearchFilter
                  value={watch('gender') || ''}
                  onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other', { shouldDirty: true, shouldValidate: true })}
                  options={genderOptions}
                  placeholder="性別を選択"
                  width={SELECT_WIDTHS.gender}
                />
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
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-lpignore="true"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="電話番号を入力"
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-lpignore="true"
                />
              </div>
              <div className="space-y-2">
                <Label>都道府県</Label>
                <PopoverSearchFilter
                  value={watch('prefecture') || ''}
                  onValueChange={(value) => setValue('prefecture', value, { shouldDirty: true, shouldValidate: true })}
                  options={prefectureOptions}
                  placeholder="都道府県を選択"
                  width={SELECT_WIDTHS.prefecture}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">住所</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="住所を入力"
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-lpignore="true"
                />
              </div>
            </div>
          </CardContent>
        </Card>



        {/* 所属情報カード */}
        <Card>
          <CardHeader>
            <CardTitle>所属情報</CardTitle>
            <CardDescription>ユーザーの所属部署・職位情報を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>所属部署</Label>
                <PopoverSearchFilter
                  value={watch('department_id') || ''}
                  onValueChange={(value) => setValue('department_id', value, { shouldDirty: true, shouldValidate: true })}
                  options={departmentsData?.map(dept => ({
                    value: dept.id.toString(),
                    label: dept.name
                  })) || []}
                  placeholder={isLoadingDepartments ? "読み込み中..." : "所属部署を選択"}
                  width={SELECT_WIDTHS.department}
                />
              </div>
              <div className="space-y-2">
                <Label>職位</Label>
                <PopoverSearchFilter
                  value={watch('position_id') || ''}
                  onValueChange={(value) => setValue('position_id', value, { shouldDirty: true, shouldValidate: true })}
                  options={positionsData?.map(pos => ({
                    value: pos.id.toString(),
                    label: pos.display_name
                  })) || []}
                  placeholder={isLoadingPositions ? "読み込み中..." : "職位を選択"}
                  width={SELECT_WIDTHS.position}
                />
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
                <Label htmlFor="hire_date">入社日</Label>
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
            <CardDescription>ユーザーのシステム権限とアカウント状態を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 左列 */}
              <div className="space-y-4">
                {/* ログインID */}
                <div className="space-y-2">
                  <Label htmlFor="login_id">ログインID *</Label>
                  <Input
                    id="login_id"
                    {...register('login_id')}
                    placeholder="ログインIDを入力"
                    autoComplete="off"
                    data-1p-ignore="true"
                    data-lpignore="true"
                  />
                  {errors.login_id && (
                    <p className="text-sm text-red-500">{errors.login_id.message}</p>
                  )}
                </div>
                
                {/* パスワードとパスワード確認を1行で左右に並べる */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">パスワード *</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register('password')}
                      placeholder="パスワードを入力（8文字以上）"
                    />
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">パスワード（確認） *</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      {...register('password_confirmation')}
                      placeholder="パスワードを再入力"
                    />
                    {errors.password_confirmation && (
                      <p className="text-sm text-red-500">{errors.password_confirmation.message}</p>
                    )}
                  </div>
                </div>
                
                {/* 割当役割 */}
                <div className="space-y-2">
                  <Label>割当役割</Label>
                  <PopoverSearchFilter
                    value={watch('role') || ''}
                    onValueChange={(value) => setValue('role', value, { shouldDirty: true, shouldValidate: true })}
                    options={roleOptions}
                    placeholder="割当役割を選択"
                    width={SELECT_WIDTHS.role}
                  />
                </div>
                
                {/* アカウント状態 */}
                <div className="space-y-2">
                  <Label>アカウント状態</Label>
                  <PopoverSearchFilter
                    value={String(watch('is_active'))}
                    onValueChange={(value) => setValue('is_active', value === 'true', { shouldDirty: true, shouldValidate: true })}
                    options={accountStatusOptions}
                    placeholder="アカウント状態を選択"
                    width={SELECT_WIDTHS.accountStatus}
                  />
                </div>
              </div>
              
              {/* 右列 */}
              <div className="space-y-4">
                {/* システム権限レベル */}
                <div className="space-y-2">
                  <Label>システム権限レベル</Label>
                  <PopoverSearchFilter
                    value={watch('system_level') || ''}
                    onValueChange={(value) => setValue('system_level', value, { shouldDirty: true, shouldValidate: true })}
                    options={systemLevelsData?.map(level => ({
                      value: level.id.toString(),
                      label: level.display_name
                    })) || []}
                    placeholder={isLoadingSystemLevels ? "読み込み中..." : "システム権限レベルを選択"}
                    width={SELECT_WIDTHS.systemLevel}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アクションボタン */}
        <div className="flex items-center justify-end space-x-4">
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
            disabled={!isFormDirty || isSubmitting}
          >
            {isSubmitting ? '作成中...' : 'ユーザー作成'}
          </Button>
        </div>
      </form>
    </div>
  )
}
