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
import { PopoverSearchFilter } from '@/components/common/data-display/DataTable/PopoverSearchFilter'
import { useActiveDepartments } from '@/hooks/useDepartments'
import { useActivePositions } from '@/hooks/usePositions'
import { useCreateEmployee } from '@/hooks/features/employee/useEmployeeForm'

// バリデーションスキーマ（社員基本情報のみ）
const employeeCreateSchema = z.object({
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
  department_id: z.string().min(1, '所属部署は必須です'),
  position_id: z.string().optional(),
})

type EmployeeCreateFormData = z.infer<typeof employeeCreateSchema>

interface EmployeeCreateFormProps {
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

// 選択欄の幅設定
const SELECT_WIDTHS = {
  gender: '200px',
  prefecture: '200px',
  department: '200px',
  position: '200px',
} as const

export function EmployeeCreateForm({ onSuccess, onCancel }: EmployeeCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createEmployeeMutation = useCreateEmployee()
  const { addToast } = useToast()
  const { data: departmentsData, isLoading: isLoadingDepartments } = useActiveDepartments()
  const { data: positionsData, isLoading: isLoadingPositions } = useActivePositions()

  // データが読み込まれているかチェック
  const isDataLoaded = !isLoadingDepartments && !isLoadingPositions

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EmployeeCreateFormData>({
    resolver: zodResolver(employeeCreateSchema),
    defaultValues: {
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
      department_id: '',
      position_id: '',
    },
  })



  // フォーム送信処理
  const onSubmit = async (data: EmployeeCreateFormData) => {
    try {
      setIsSubmitting(true)

      // 空文字列をundefinedに変換し、数値変換
      const processedData = {
        ...data,
        department_id: parseInt(data.department_id),
        position_id: data.position_id ? parseInt(data.position_id) : undefined,
        // 空文字列をundefinedに変換
        name_kana: data.name_kana || undefined,
        email: data.email || undefined,
        birth_date: data.birth_date || undefined,
        gender: data.gender || undefined,
        phone: data.phone || undefined,
        mobile_phone: data.mobile_phone || undefined,
        postal_code: data.postal_code || undefined,
        prefecture: data.prefecture || undefined,
        address: data.address || undefined,
        job_title: data.job_title || undefined,
        hire_date: data.hire_date || undefined,
      }

      await createEmployeeMutation.mutateAsync(processedData)

      addToast({
        title: '成功',
        description: '社員が正常に登録されました。システム利用権限は編集画面で設定してください。',
        type: 'success',
      })

      onSuccess?.()
    } catch (error) {
      console.error('Employee creation failed:', error)
      addToast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '社員の登録に失敗しました',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isDataLoaded) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 基本情報カード */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>社員の基本情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 社員ID */}
            <div className="space-y-2">
              <Label htmlFor="employee_id">
                社員ID <Badge variant="destructive">必須</Badge>
              </Label>
              <Input
                id="employee_id"
                {...register('employee_id')}
                placeholder="例: EMP001"
              />
              {errors.employee_id && (
                <p className="text-sm text-red-600">{errors.employee_id.message}</p>
              )}
            </div>

            {/* 氏名 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                氏名 <Badge variant="destructive">必須</Badge>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="例: 山田太郎"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* フリガナ */}
            <div className="space-y-2">
              <Label htmlFor="name_kana">フリガナ</Label>
              <Input
                id="name_kana"
                {...register('name_kana')}
                placeholder="例: ヤマダタロウ"
              />
            </div>

            {/* メールアドレス */}
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="例: yamada@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 個人情報カード */}
      <Card>
        <CardHeader>
          <CardTitle>個人情報</CardTitle>
          <CardDescription>個人情報を入力してください（任意）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 生年月日 */}
            <div className="space-y-2">
              <Label htmlFor="birth_date">生年月日</Label>
              <Input
                id="birth_date"
                type="date"
                {...register('birth_date')}
              />
            </div>

            {/* 性別 */}
            <div className="space-y-2">
              <Label htmlFor="gender">性別</Label>
              <PopoverSearchFilter
                options={genderOptions}
                value={watch('gender') || ''}
                onValueChange={(value: string) => setValue('gender', value as 'male' | 'female' | 'other')}
                placeholder="性別を選択"
                width={SELECT_WIDTHS.gender}
              />
            </div>

            {/* 電話番号 */}
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="例: 03-1234-5678"
              />
            </div>

            {/* 携帯電話 */}
            <div className="space-y-2">
              <Label htmlFor="mobile_phone">携帯電話</Label>
              <Input
                id="mobile_phone"
                {...register('mobile_phone')}
                placeholder="例: 090-1234-5678"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 住所情報カード */}
      <Card>
        <CardHeader>
          <CardTitle>住所情報</CardTitle>
          <CardDescription>住所情報を入力してください（任意）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 郵便番号 */}
            <div className="space-y-2">
              <Label htmlFor="postal_code">郵便番号</Label>
              <Input
                id="postal_code"
                {...register('postal_code')}
                placeholder="例: 123-4567"
              />
            </div>

            {/* 都道府県 */}
            <div className="space-y-2">
              <Label htmlFor="prefecture">都道府県</Label>
              <PopoverSearchFilter
                options={prefectureOptions}
                value={watch('prefecture') || ''}
                onValueChange={(value: string) => setValue('prefecture', value)}
                placeholder="都道府県を選択"
                width={SELECT_WIDTHS.prefecture}
              />
            </div>

            {/* 住所 */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">住所</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="例: 千代田区千代田1-1-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 職務情報カード */}
      <Card>
        <CardHeader>
          <CardTitle>職務情報</CardTitle>
          <CardDescription>職務に関する情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 所属部署 */}
            <div className="space-y-2">
              <Label htmlFor="department_id">
                所属部署 <Badge variant="destructive">必須</Badge>
              </Label>
              <PopoverSearchFilter
                options={departmentsData?.map(dept => ({
                  value: dept.id.toString(),
                  label: dept.name
                })) || []}
                value={watch('department_id') || ''}
                onValueChange={(value: string) => setValue('department_id', value)}
                placeholder="部署を選択"
                width={SELECT_WIDTHS.department}
              />
              {errors.department_id && (
                <p className="text-sm text-red-600">{errors.department_id.message}</p>
              )}
            </div>

            {/* 職位 */}
            <div className="space-y-2">
              <Label htmlFor="position_id">職位</Label>
              <PopoverSearchFilter
                options={positionsData?.map(pos => ({
                  value: pos.id.toString(),
                  label: pos.name
                })) || []}
                value={watch('position_id') || ''}
                onValueChange={(value: string) => setValue('position_id', value)}
                placeholder="職位を選択"
                width={SELECT_WIDTHS.position}
              />
            </div>

            {/* 役職名 */}
            <div className="space-y-2">
              <Label htmlFor="job_title">役職名</Label>
              <Input
                id="job_title"
                {...register('job_title')}
                placeholder="例: 主任、係長、課長など"
              />
            </div>

            {/* 入社日 */}
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

      {/* 注意事項 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
              i
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-blue-800">システム利用権限について</h4>
              <p className="text-sm text-blue-700">
                社員登録後、必要に応じて編集画面からシステム利用権限（ログインID、パスワード、権限レベル等）を設定してください。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* フォームアクション */}
      <div className="flex justify-end space-x-4 pt-4">
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
          disabled={isSubmitting}
        >
          {isSubmitting ? '登録中...' : '社員を登録'}
        </Button>
      </div>
    </form>
  )
}
