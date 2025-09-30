'use client'

import { useState, useCallback, useEffect } from 'react'
import { useCreateEstimate } from '@/hooks/features/estimates/useEstimates'
import { CreateEstimateRequest } from '@/types/features/estimates/estimate'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PopoverSearchFilter } from '@/components/common/data-display/DataTable/PopoverSearchFilter'
import { usePartnerOptions } from '@/hooks/features/estimates/usePartners'
import { useProjectTypeOptions, useProjectType } from '@/hooks/features/estimates/useProjectTypes'
import { useEmployees } from '@/hooks/features/employee/useEmployees'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface EstimateCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (estimateId: string) => void
}

export function EstimateCreateDialog({ isOpen, onClose, onSuccess }: EstimateCreateDialogProps) {
  const { user } = useAuth() // ログインユーザー情報を取得
  const createEstimateMutation = useCreateEstimate()

  // フォーム状態
  const [formData, setFormData] = useState<CreateEstimateRequest>({
    project_name: '',
    partner_id: 0,
    project_type_id: 0,
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90日後
    notes: '',
    project_location: '',
    project_period_start: '',
    project_period_end: '',
    responsible_user_id: user?.id || 0, // ログインユーザーIDを初期設定
  })

  // マスターデータ取得
  const { data: partnerOptions } = usePartnerOptions('customer')
  const { data: projectTypeOptions } = useProjectTypeOptions()
  const { data: employeesData } = useEmployees({ is_active: true })

  // 選択された工事種別の詳細取得
  const { data: selectedProjectType } = useProjectType(formData.project_type_id)

  // ログインユーザー情報が取得されたら担当者を設定
  useEffect(() => {
    if (user?.id && formData.responsible_user_id === 0) {
      setFormData(prev => ({
        ...prev,
        responsible_user_id: user.id
      }))
    }
  }, [user, formData.responsible_user_id])

  // 工事種別が変更された際に費率を自動設定
  useEffect(() => {
    if (selectedProjectType) {
      setFormData(prev => ({
        ...prev,
        overhead_rate: selectedProjectType.overhead_rate || 0,
        cost_expense_rate: selectedProjectType.cost_expense_rate || 0,
        material_expense_rate: selectedProjectType.material_expense_rate || 0,
      }))
    }
  }, [selectedProjectType])

  const handleInputChange = useCallback((field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleSubmit = async () => {
    try {
      // バリデーション
      if (!formData.project_name.trim()) {
        toast.error('工事名称は必須です')
        return
      }
      if (!formData.partner_id) {
        toast.error('受注先は必須です')
        return
      }
      if (!formData.project_type_id) {
        toast.error('工事種別は必須です')
        return
      }
      if (!formData.issue_date) {
        toast.error('見積日は必須です')
        return
      }
      if (!formData.expiry_date) {
        toast.error('有効期限は必須です')
        return
      }
      if (!formData.responsible_user_id) {
        toast.error('担当者は必須です')
        return
      }

      // 見積作成
      const estimate = await createEstimateMutation.mutateAsync(formData)
      
      toast.success('見積を作成しました')
      onSuccess?.(estimate.id)
      onClose()
    } catch (error) {
      console.error('見積の作成に失敗しました:', error)
      toast.error('見積の作成に失敗しました。もう一度お試しください。')
    }
  }

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新規見積作成</DialogTitle>
          <DialogDescription>
            新しい見積書を作成します。必須項目は赤いアスタリスク（*）で表示されています。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* 見積日 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              見積日 <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.issue_date}
              onChange={(e) => handleInputChange('issue_date', e.target.value)}
              className="flex-1"
            />
          </div>

          {/* 担当者・部署 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              担当者 <span className="text-red-500">*</span>
            </label>
            <div className="flex-1 flex gap-2">
              <PopoverSearchFilter
                value={formData.responsible_user_id?.toString() || ''}
                onValueChange={(value) => handleInputChange('responsible_user_id', parseInt(value))}
                options={Array.isArray(employeesData?.employees) ? employeesData.employees.map(employee => ({
                  value: employee.id.toString(),
                  label: employee.name
                })) : []}
                placeholder={user?.id ? "担当者を選択してください（現在のユーザーが設定済み）" : "担当者を選択してください"}
                className="flex-1"
              />
              <div className="w-32 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600 flex items-center">
                {formData.responsible_user_id && formData.responsible_user_id > 0 && employeesData?.employees ? (
                  employeesData.employees.find(emp => emp.id === formData.responsible_user_id)?.department?.name || '部署情報なし'
                ) : (
                  '部署'
                )}
              </div>
            </div>
          </div>

          {/* 受注先 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              受注先 <span className="text-red-500">*</span>
            </label>
            <PopoverSearchFilter
              value={formData.partner_id.toString()}
              onValueChange={(value) => handleInputChange('partner_id', parseInt(value))}
              options={Array.isArray(partnerOptions) ? partnerOptions.map(partner => ({
                value: partner.value.toString(),
                label: partner.label
              })) : []}
              placeholder="受注先を選択してください"
              className="flex-1"
            />
          </div>

          {/* 工事名称 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              工事名称 <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.project_name}
              onChange={(e) => handleInputChange('project_name', e.target.value)}
              placeholder="工事名称を入力してください"
              className="flex-1"
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
            />
          </div>

          {/* 工事場所 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              工事場所
            </label>
            <Input
              value={formData.project_location}
              onChange={(e) => handleInputChange('project_location', e.target.value)}
              placeholder="工事場所を入力してください"
              className="flex-1"
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
            />
          </div>

          {/* 工期 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              工期
            </label>
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="date"
                value={formData.project_period_start}
                onChange={(e) => handleInputChange('project_period_start', e.target.value)}
                placeholder="開始日"
                className="flex-1"
              />
              <span className="text-gray-500">〜</span>
              <Input
                type="date"
                value={formData.project_period_end}
                onChange={(e) => handleInputChange('project_period_end', e.target.value)}
                placeholder="終了日"
                className="flex-1"
              />
            </div>
          </div>

          {/* 有効期限 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              有効期限 <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => handleInputChange('expiry_date', e.target.value)}
              className="flex-1"
            />
          </div>

          {/* 工事種別 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              工事種別 <span className="text-red-500">*</span>
            </label>
            <PopoverSearchFilter
              value={formData.project_type_id.toString()}
              onValueChange={(value) => handleInputChange('project_type_id', parseInt(value))}
              options={Array.isArray(projectTypeOptions) ? projectTypeOptions.map(projectType => ({
                value: projectType.id.toString(),
                label: projectType.name
              })) : []}
              placeholder="工事種別を選択してください"
              className="flex-1"
            />
          </div>

          {/* 工事種別費率情報 */}
          {selectedProjectType && (
            <div className="flex items-start">
              <label className="w-32 text-sm font-medium text-gray-700 pt-2">
                費率情報
              </label>
              <div className="flex-1 space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">一般管理費率:</span>{' '}
                  <span className="text-gray-600">
                    {selectedProjectType.overhead_rate ? `${Number(selectedProjectType.overhead_rate).toFixed(1)}%` : '未設定'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">原価経費率:</span>{' '}
                  <span className="text-gray-600">
                    {selectedProjectType.cost_expense_rate ? `${Number(selectedProjectType.cost_expense_rate).toFixed(1)}%` : '未設定'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">材料経費率:</span>{' '}
                  <span className="text-gray-600">
                    {selectedProjectType.material_expense_rate ? `${Number(selectedProjectType.material_expense_rate).toFixed(1)}%` : '未設定'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 備考 */}
          <div className="flex items-start">
            <label className="w-32 text-sm font-medium text-gray-700 pt-2">
              備考
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="備考を入力してください"
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={createEstimateMutation.isPending}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={createEstimateMutation.isPending}>
            {createEstimateMutation.isPending ? '作成中...' : '作成'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EstimateCreateDialog
