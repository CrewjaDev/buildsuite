'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { PopoverSearchFilter } from '@/components/common/data-display/DataTable/PopoverSearchFilter'
import { Employee } from '@/types/features/employees'
import { useUpdateEmployee } from '@/hooks/features/employee/useEmployeeForm'
import { useEmployeeOptions } from '@/hooks/features/employee/useEmployeeSelect'
import { format } from 'date-fns'

// バリデーションスキーマ
const employeeEditSchema = z.object({
  employee_id: z.string().min(1, '社員IDは必須です'),
  name: z.string().min(1, '氏名は必須です'),
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
  department_id: z.number().min(1, '所属部署は必須です'),
  position_id: z.number().optional(),
})

type EmployeeEditFormData = z.infer<typeof employeeEditSchema>

interface EmployeeDetailEditProps {
  employee: Employee
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
].map(prefecture => ({ value: prefecture, label: prefecture }))

// アカウント状態オプション
const accountStatusOptions = [
  { value: 'true', label: '有効' },
  { value: 'false', label: '無効' },
]

// 選択欄の幅設定
const SELECT_WIDTHS = {
  gender: '200px',           // 性別（短い）
  prefecture: '200px',       // 都道府県（短い）
  department: '300px',       // 所属部署（中程度）
  position: '300px',         // 職位（中程度）
  accountStatus: '200px',    // アカウント状態（短い）
} as const

export function EmployeeDetailEdit({ employee, onCancel, onSuccess }: EmployeeDetailEditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const updateEmployeeMutation = useUpdateEmployee()
  const { data: employeeOptions } = useEmployeeOptions()
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EmployeeEditFormData>({
    resolver: zodResolver(employeeEditSchema),
    defaultValues: {
      employee_id: employee.employee_id || '',
      name: employee.name || '',
      name_kana: employee.name_kana || '',
      email: employee.email || '',
      birth_date: employee.birth_date ? format(new Date(employee.birth_date), 'yyyy-MM-dd') : '',
      gender: employee.gender || undefined,
      phone: employee.phone || '',
      mobile_phone: employee.mobile_phone || '',
      postal_code: employee.postal_code || '',
      prefecture: employee.prefecture || '',
      address: employee.address || '',
      job_title: employee.job_title || '',
      hire_date: employee.hire_date ? format(new Date(employee.hire_date), 'yyyy-MM-dd') : '',

      is_active: employee.is_active,
      department_id: employee.department.id,
      position_id: employee.position?.id || undefined,
    },
  })

  const watchedValues = watch()
  
  // 手動で変更検知を行う
  const hasChanges = useMemo(() => {
    const currentValues = watchedValues
    const originalValues = {
      employee_id: employee.employee_id || '',
      name: employee.name || '',
      name_kana: employee.name_kana || '',
      email: employee.email || '',
      birth_date: employee.birth_date ? format(new Date(employee.birth_date), 'yyyy-MM-dd') : '',
      gender: employee.gender || undefined,
      phone: employee.phone || '',
      mobile_phone: employee.mobile_phone || '',
      postal_code: employee.postal_code || '',
      prefecture: employee.prefecture || '',
      address: employee.address || '',
      job_title: employee.job_title || '',
      hire_date: employee.hire_date ? format(new Date(employee.hire_date), 'yyyy-MM-dd') : '',
      is_active: employee.is_active,
      department_id: employee.department.id,
      position_id: employee.position?.id || undefined,
    }
    
    return Object.keys(originalValues).some(key => {
      const currentVal = currentValues[key as keyof typeof currentValues]
      const originalVal = originalValues[key as keyof typeof originalValues]
      return currentVal !== originalVal
    })
  }, [watchedValues, employee])

  const onSubmit = async (data: EmployeeEditFormData) => {
    setIsSubmitting(true)
    try {
      await updateEmployeeMutation.mutateAsync({
        id: employee.id,
        data: {
          ...data,

          // 空文字列をundefinedに変換
          email: data.email || undefined,
          name_kana: data.name_kana || undefined,
          birth_date: data.birth_date || undefined,
          phone: data.phone || undefined,
          mobile_phone: data.mobile_phone || undefined,
          postal_code: data.postal_code || undefined,
          prefecture: data.prefecture || undefined,
          address: data.address || undefined,
          job_title: data.job_title || undefined,
          hire_date: data.hire_date || undefined,
        },
      })

      addToast({
        type: 'success',
        title: '更新完了',
        description: '社員情報を更新しました',
      })

      onSuccess?.()
    } catch (error) {
      console.error('Employee update error:', error)
      addToast({
        type: 'error',
        title: '更新失敗',
        description: '社員情報の更新に失敗しました',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // オプション変換
  const departmentOptions = employeeOptions?.departments?.map(dept => ({
    value: dept.id.toString(),
    label: dept.name,
  })) || []

  const positionOptions = employeeOptions?.positions?.map(pos => ({
    value: pos.id.toString(),
    label: pos.name,
  })) || []

  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本情報カード */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>社員の基本的な個人情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="employee_id">社員ID *</Label>
                <Input
                  id="employee_id"
                  {...register('employee_id')}
                  className={errors.employee_id ? 'border-red-500' : ''}
                />
                {errors.employee_id && (
                  <p className="text-sm text-red-500">{errors.employee_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">氏名 *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_kana">氏名（カナ）</Label>
                <Input
                  id="name_kana"
                  {...register('name_kana')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">性別</Label>
                <PopoverSearchFilter
                  options={genderOptions}
                  value={watchedValues.gender || ''}
                  onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}
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
                <Label htmlFor="is_active">ステータス</Label>
                <PopoverSearchFilter
                  options={accountStatusOptions}
                  value={watchedValues.is_active.toString()}
                  onValueChange={(value) => setValue('is_active', value === 'true')}
                  placeholder="ステータスを選択"

                  width={SELECT_WIDTHS.accountStatus}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 連絡先情報カード */}
        <Card>
          <CardHeader>
            <CardTitle>連絡先情報</CardTitle>
            <CardDescription>社員の連絡先と住所情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_phone">携帯電話</Label>
                <Input
                  id="mobile_phone"
                  {...register('mobile_phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">郵便番号</Label>
                <Input
                  id="postal_code"
                  {...register('postal_code')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefecture">都道府県</Label>
                <PopoverSearchFilter
                  options={prefectureOptions}
                  value={watchedValues.prefecture || ''}
                  onValueChange={(value) => setValue('prefecture', value)}
                  placeholder="都道府県を選択"

                  width={SELECT_WIDTHS.prefecture}
                />
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <Label htmlFor="address">住所</Label>
                <Input
                  id="address"
                  {...register('address')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 勤務情報カード */}
        <Card>
          <CardHeader>
            <CardTitle>勤務情報</CardTitle>
            <CardDescription>所属部署、職位、勤務に関する情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="department_id">所属部署 *</Label>
                <PopoverSearchFilter
                  options={departmentOptions}
                  value={watchedValues.department_id?.toString() || ''}
                  onValueChange={(value) => setValue('department_id', Number(value))}
                  placeholder="部署を選択"

                  width={SELECT_WIDTHS.department}
                />
                {errors.department_id && (
                  <p className="text-sm text-red-500">{errors.department_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position_id">職位</Label>
                <PopoverSearchFilter
                  options={positionOptions}
                  value={watchedValues.position_id?.toString() || ''}
                  onValueChange={(value) => setValue('position_id', value ? Number(value) : undefined)}
                  placeholder="職位を選択"

                  width={SELECT_WIDTHS.position}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title">役職</Label>
                <Input
                  id="job_title"
                  {...register('job_title')}
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

        {/* アクションボタン */}
        <div className="flex items-center justify-end space-x-4 pt-6">
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
            className="min-w-24"
          >
            {isSubmitting ? '更新中...' : '更新'}
          </Button>
        </div>
      </form>
    </div>
  )
}
