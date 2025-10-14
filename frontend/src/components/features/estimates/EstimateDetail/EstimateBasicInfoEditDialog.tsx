'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Estimate, UpdateEstimateRequest } from '@/types/features/estimates/estimate'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PopoverSearchFilter } from '@/components/common/data-display/DataTable/PopoverSearchFilter'
import { useEmployees } from '@/hooks/features/employee/useEmployees'
import { usePartners } from '@/hooks/features/partners/usePartners'
import { useProjectTypeOptions } from '@/hooks/features/estimates/useProjectTypes'
import { useUpdateEstimate } from '@/hooks/features/estimates/useEstimates'
import { useAuth } from '@/hooks/useAuth'
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
  const { user } = useAuth()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [dialogSize, setDialogSize] = useState({ width: 650, height: 600 })
  
  // ダイアログの幅に基づいてレスポンシブクラスを決定
  const isNarrowDialog = dialogSize.width < 600

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

  // ウィンドウリサイズ時の調整
  const handleWindowResize = useCallback(() => {
    if (!dialogRef.current) return
    
    const rect = dialogRef.current.getBoundingClientRect()
    const maxWidth = Math.min(1200, window.innerWidth - 100)
    const maxHeight = Math.min(window.innerHeight - 100, window.innerHeight * 0.9)
    
    if (rect.width > maxWidth || rect.height > maxHeight) {
      setDialogSize(prev => ({
        width: Math.min(prev.width, maxWidth),
        height: Math.min(prev.height, maxHeight)
      }))
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = dialogSize.width
    const startHeight = dialogSize.height
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      
      const newWidth = Math.max(320, Math.min(1200, startWidth + deltaX))
      const newHeight = Math.max(400, Math.min(window.innerHeight - 100, startHeight + deltaY))
      
      setDialogSize({ width: newWidth, height: newHeight })
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [dialogSize.width, dialogSize.height])

  // ウィンドウリサイズイベントリスナー
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', handleWindowResize)
      return () => window.removeEventListener('resize', handleWindowResize)
    }
  }, [isOpen, handleWindowResize])

  // ダイアログが開かれた時にサイズをリセット
  useEffect(() => {
    if (isOpen) {
      setDialogSize({ width: 650, height: 600 })
    }
  }, [isOpen])

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
    } catch (error: unknown) {
      console.error('基本情報の更新に失敗しました:', error)
      
      // APIから返される詳細なエラーメッセージを取得
      let errorMessage = '基本情報の更新に失敗しました。もう一度お試しください。'
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } }
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-50" />}
      <DialogContent 
        ref={dialogRef}
        className="flex flex-col p-2 sm:p-4 md:p-6 overflow-auto fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `${dialogSize.width}px`,
          height: `${dialogSize.height}px`,
          minWidth: '320px',
          maxWidth: '1200px',
          minHeight: '400px',
          maxHeight: '90vh',
          position: 'fixed',
          zIndex: 50,
          overflow: 'auto',
          boxSizing: 'border-box'
        }}
      >
        <DialogHeader>
          <DialogTitle>基本情報編集</DialogTitle>
          <DialogDescription>
            見積の基本情報を編集します。必須項目は赤いアスタリスク（*）で表示されています。
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          {/* 見積番号 - 表示のみ */}
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
              見積番号
            </label>
            <div className="flex-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
              {estimate.estimate_number || '-'}
            </div>
          </div>

          {/* 工事番号 - 表示のみ */}
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
              工事番号
            </label>
            <div className="flex-1 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
              {estimate.construction_number || '-'}
            </div>
          </div>

          {/* 見積日 */}
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
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
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
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

          {/* 担当者・部署 */}
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-start'}`}>
            <label className={`text-sm font-medium text-gray-700 pt-2 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
              担当者 <span className="text-red-500">*</span>
            </label>
            <div className="flex-1 space-y-2">
              <PopoverSearchFilter
                options={(() => {
                  const employeeOptions = Array.isArray(employeesData?.employees) 
                    ? employeesData.employees.map(employee => ({
                        value: employee.id.toString(),
                        label: employee.name
                      }))
                    : []
                  
                  // ログインユーザーがoptionsに含まれていない場合は追加
                  if (user?.id && !employeeOptions.find(opt => opt.value === user.id.toString())) {
                    employeeOptions.unshift({
                      value: user.id.toString(),
                      label: user.name || 'ログインユーザー'
                    })
                  }
                  
                  return employeeOptions
                })()}
                value={formData.created_by.toString()}
                onValueChange={(value: string) => handleInputChange('created_by', parseInt(value))}
                placeholder="担当者を選択してください"
                className="w-full"
                style={{ zIndex: 100 }}
              />
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600 flex items-center">
                {formData.created_by && formData.created_by > 0 ? (
                  <span>
                    部署: {
                      // ログインユーザーの場合、user.primary_departmentから取得
                      formData.created_by === user?.id && user?.primary_department 
                        ? user.primary_department.name
                        : // その他のユーザーの場合、employeesDataから取得
                          employeesData?.employees?.find(emp => emp.id === formData.created_by)?.department?.name || '部署情報なし'
                    }
                  </span>
                ) : (
                  '部署情報'
                )}
              </div>
            </div>
          </div>

          {/* 受注先 */}
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
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
              style={{ zIndex: 100 }}
            />
          </div>

          {/* 工事名称 */}
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
              工事名称 <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.project_name}
              onChange={(e) => handleInputChange('project_name', e.target.value)}
              placeholder="工事名称を入力"
              className="flex-1"
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
            />
          </div>

          {/* 工事場所 */}
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
              工事場所
            </label>
            <Input
              value={formData.project_location}
              onChange={(e) => handleInputChange('project_location', e.target.value)}
              placeholder="工事場所を入力"
              className="flex-1"
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
            />
          </div>

          {/* 工期 */}
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
              工期
            </label>
            <div className={`flex-1 flex items-center gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row'}`}>
              <Input
                type="date"
                value={formData.construction_period_from || ''}
                onChange={(e) => handleInputChange('construction_period_from', e.target.value)}
                className="flex-1 w-full min-w-0"
              />
              <span className={`text-gray-500 text-sm flex-shrink-0 ${isNarrowDialog ? '' : 'text-base'}`}>〜</span>
              <Input
                type="date"
                value={formData.construction_period_to || ''}
                onChange={(e) => handleInputChange('construction_period_to', e.target.value)}
                className="flex-1 w-full min-w-0"
              />
            </div>
          </div>

          {/* 有効期限 */}
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
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
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
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
              style={{ zIndex: 100 }}
            />
          </div>

          {/* 備考 */}
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-start'}`}>
            <label className={`text-sm font-medium text-gray-700 pt-2 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
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

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={updateEstimateMutation.isPending}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={updateEstimateMutation.isPending}>
            {updateEstimateMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
        
        {/* リサイズハンドル */}
        <div
          className="absolute bottom-0 right-0 w-10 h-10 cursor-se-resize bg-blue-200 hover:bg-blue-300 opacity-90 hover:opacity-100 transition-all duration-200 border-2 border-blue-400 hover:border-blue-600 rounded-tl-lg"
          onMouseDown={handleMouseDown}
          style={{
            background: 'linear-gradient(-45deg, transparent 30%, #2563eb 30%, #2563eb 70%, transparent 70%)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
          title="ドラッグしてリサイズ（600px未満で縦並び）"
        >
          <div className="absolute bottom-2 right-2 w-3 h-3 bg-blue-600 rounded-full"></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-white rounded-full"></div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EstimateBasicInfoEditDialog
