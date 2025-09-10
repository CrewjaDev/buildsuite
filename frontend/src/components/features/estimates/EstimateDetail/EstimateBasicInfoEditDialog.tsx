'use client'

import { useState, useEffect, useCallback } from 'react'
import { Estimate, UpdateEstimateRequest } from '@/types/features/estimates/estimate'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PopoverSearchFilter } from '@/components/common/data-display/DataTable/PopoverSearchFilter'
import { useEmployees } from '@/hooks/features/employee/useEmployees'
import { usePartners } from '@/hooks/features/partners/usePartners'
import { useProjectTypeOptions } from '@/hooks/features/estimates/useProjectTypes'
import { useUpdateEstimate } from '@/hooks/features/estimates/useEstimates'
import { toast } from 'sonner'

interface EstimateBasicInfoEditDialogProps {
  isOpen: boolean
  onClose: () => void
  estimate: Estimate
  onSuccess?: () => void
}

export function EstimateBasicInfoEditDialog({
  isOpen,
  onClose,
  estimate,
  onSuccess
}: EstimateBasicInfoEditDialogProps) {
  // 日付をYYYY-MM-DD形式に変換する関数
  const formatDateForInput = useCallback((dateString: string | undefined) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }, [])

  const [formData, setFormData] = useState({
    project_name: '',
    project_location: '',
    estimate_date: '',
    issue_date: '',
    expiry_date: '',
    created_by: 0,
    partner_id: 0,
    construction_period_from: '',
    construction_period_to: '',
    project_type_id: 0,
    notes: ''
  })

  // estimateが変更されたときにformDataを更新
  useEffect(() => {
    setFormData({
      project_name: estimate.project_name || '',
      project_location: estimate.project_location || '',
      estimate_date: formatDateForInput(estimate.estimate_date) || formatDateForInput(estimate.issue_date) || '',
      issue_date: formatDateForInput(estimate.issue_date) || '',
      expiry_date: formatDateForInput(estimate.expiry_date) || '',
      created_by: estimate.created_by || 0,
      partner_id: estimate.partner_id || 0,
      construction_period_from: formatDateForInput(estimate.construction_period_from) || '',
      construction_period_to: formatDateForInput(estimate.construction_period_to) || '',
      project_type_id: estimate.project_type_id || 0,
      notes: estimate.notes || ''
    })
  }, [estimate, formatDateForInput])

  // デバッグ用: 初期値をコンソールに出力
  console.log('Estimate data:', {
    issue_date: estimate.issue_date,
    estimate_date: estimate.estimate_date,
    valid_until: estimate.valid_until,
    expiry_date: estimate.expiry_date,
    construction_period_from: estimate.construction_period_from,
    construction_period_to: estimate.construction_period_to,
    formatted_estimate_date: formatDateForInput(estimate.estimate_date),
    formatted_expiry_date: formatDateForInput(estimate.expiry_date)
  })
  
  console.log('Form data:', {
    estimate_date: formData.estimate_date,
    expiry_date: formData.expiry_date,
    construction_period_from: formData.construction_period_from,
    construction_period_to: formData.construction_period_to
  })

  const { data: employeesData } = useEmployees()
  const { data: partnersData } = usePartners()
  const { data: projectTypesData } = useProjectTypeOptions()
  const updateEstimateMutation = useUpdateEstimate()

  // パートナーオプションを準備
  const partnerOptions = partnersData?.partners?.map(partner => ({
    value: partner.id,
    label: partner.partner_name
  })) || []

  // プロジェクトタイプオプションを準備
  const projectTypeOptions = projectTypesData || []

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

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
      if (!formData.created_by) {
        toast.error('担当者は必須です')
        return
      }
      if (!formData.estimate_date) {
        toast.error('見積日は必須です')
        return
      }

      // 更新データを準備（空の値は除外）
      const updateData: UpdateEstimateRequest = {
        project_name: formData.project_name,
        project_location: formData.project_location,
        partner_id: formData.partner_id,
        project_type_id: formData.project_type_id,
        construction_classification_id: estimate.construction_classification_id, // 既存の値を保持
        estimate_date: formData.estimate_date,
        notes: formData.notes
      }

      // 空でない日付フィールドのみ追加
      if (formData.issue_date) updateData.issue_date = formData.issue_date
      if (formData.expiry_date) updateData.expiry_date = formData.expiry_date
      if (formData.construction_period_from) updateData.construction_period_from = formData.construction_period_from
      if (formData.construction_period_to) updateData.construction_period_to = formData.construction_period_to

      // API呼び出し
      await updateEstimateMutation.mutateAsync({
        id: estimate.id,
        data: updateData
      })

      // 成功時の処理
      toast.success('基本情報を正常に更新しました')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('基本情報の更新に失敗しました:', error)
      toast.error('基本情報の更新に失敗しました。もう一度お試しください。')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>基本情報編集</DialogTitle>
          <DialogDescription>
            見積の基本情報を編集します。必須項目は赤いアスタリスク（*）で表示されています。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* 見積番号 - 表示のみ */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              見積番号
            </label>
            <div className="flex-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
              {estimate.estimate_number || '-'}
            </div>
          </div>

          {/* 工事番号 - 表示のみ */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              工事番号
            </label>
            <div className="flex-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
              {estimate.construction_number || '-'}
            </div>
          </div>

          {/* 見積日 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              見積日 <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.estimate_date || ''}
              onChange={(e) => handleInputChange('estimate_date', e.target.value)}
              className="flex-1"
            />
          </div>

          {/* 見積状態 - 表示のみ */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              見積状態
            </label>
            <div className="flex-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                estimate.status === 'approved' ? 'bg-green-100 text-green-800' :
                estimate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                estimate.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {estimate.status === 'draft' ? '下書き' :
                 estimate.status === 'submitted' ? '提出済み' :
                 estimate.status === 'approved' ? '承認済み' :
                 estimate.status === 'rejected' ? '却下' : '不明'}
              </span>
            </div>
          </div>

          {/* 担当者 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              担当者 <span className="text-red-500">*</span>
            </label>
            <PopoverSearchFilter
              options={employeesData?.employees?.map((employee) => ({
                value: employee.id.toString(),
                label: employee.name
              })) || []}
              value={formData.created_by.toString()}
              onValueChange={(value: string) => handleInputChange('created_by', parseInt(value))}
              placeholder="担当者を選択"
              className="flex-1"
            />
          </div>

          {/* 受注先 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              受注先 <span className="text-red-500">*</span>
            </label>
            <PopoverSearchFilter
              options={partnerOptions?.map((partner) => ({
                value: partner.value.toString(),
                label: partner.label
              })) || []}
              value={formData.partner_id.toString()}
              onValueChange={(value: string) => handleInputChange('partner_id', parseInt(value))}
              placeholder="受注先を選択"
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
              placeholder="工事名称を入力"
              className="flex-1"
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
              placeholder="工事場所を入力"
              className="flex-1"
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
                value={formData.construction_period_from || ''}
                onChange={(e) => handleInputChange('construction_period_from', e.target.value)}
                className="flex-1"
              />
              <span className="text-gray-500">〜</span>
              <Input
                type="date"
                value={formData.construction_period_to || ''}
                onChange={(e) => handleInputChange('construction_period_to', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* 有効期限 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              有効期限
            </label>
            <Input
              type="date"
              value={formData.expiry_date || ''}
              onChange={(e) => handleInputChange('expiry_date', e.target.value)}
              className="flex-1"
            />
          </div>

          {/* 工事種別 */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">
              工事種別
            </label>
            <PopoverSearchFilter
              options={projectTypeOptions?.map((projectType) => ({
                value: projectType.id.toString(),
                label: projectType.name
              })) || []}
              value={formData.project_type_id ? formData.project_type_id.toString() : ''}
              onValueChange={(value: string) => handleInputChange('project_type_id', parseInt(value))}
              placeholder="工事種別を選択"
              className="flex-1"
            />
          </div>

          {/* 備考 */}
          <div className="flex items-start">
            <label className="w-32 text-sm font-medium text-gray-700 pt-2">
              備考
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="備考を入力"
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateEstimateMutation.isPending}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={updateEstimateMutation.isPending}>
            {updateEstimateMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EstimateBasicInfoEditDialog
