'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
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
import { ErrorDialog } from '@/components/common/ErrorDialog'

interface EstimateCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (estimateId: string) => void
}

export function EstimateCreateDialog({ isOpen, onClose, onSuccess }: EstimateCreateDialogProps) {
  const { user } = useAuth() // ログインユーザー情報を取得
  const createEstimateMutation = useCreateEstimate()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [dialogSize, setDialogSize] = useState({ width: 650, height: 600 })
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: ''
  })
  
  // ダイアログの幅に基づいてレスポンシブクラスを決定
  const isNarrowDialog = dialogSize.width < 600
  
  // デバッグ用：現在の幅を表示（必要に応じてコメントアウト）
  // console.log('Dialog width:', dialogSize.width, 'isNarrowDialog:', isNarrowDialog, 'Breakpoint: 600px')

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
    responsible_user_id: user?.id, // ログインユーザーIDを初期設定
  })

  // マスターデータ取得
  const { data: partnerOptions } = usePartnerOptions('customer')
  const { data: projectTypeOptions } = useProjectTypeOptions()
  const { data: employeesData } = useEmployees({ is_active: true })

  // 選択された工事種別の詳細取得
  const { data: selectedProjectType } = useProjectType(formData.project_type_id)

  // ログインユーザー情報が取得されたら担当者を設定
  useEffect(() => {
    if (user?.id && (!formData.responsible_user_id || formData.responsible_user_id === 0)) {
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
      // ダイアログサイズをリセット
      setDialogSize({ width: 650, height: 600 })
      
      // 見積作成成功時は詳細ページに遷移（削除処理とは独立）
      onSuccess?.(estimate.id)
      onClose()
    } catch (error: unknown) {
      console.error('見積の作成に失敗しました:', error)
      
      // APIから返される詳細なエラーメッセージを取得
      let errorMessage = '見積の作成に失敗しました。もう一度お試しください。'
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
      
      // エラーダイアログを表示
      setErrorDialog({
        isOpen: true,
        message: errorMessage
      })
    }
  }

  const handleCancel = useCallback(() => {
    // ダイアログサイズをリセット
    setDialogSize({ width: 650, height: 600 })
    onClose()
  }, [onClose])

  const handleErrorDialogClose = useCallback(() => {
    setErrorDialog({ isOpen: false, message: '' })
  }, [])


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
      
      // デバッグ用（必要に応じてコメントアウト）
      // console.log('Resizing to:', newWidth, 'isNarrowDialog will be:', newWidth < 600)
      
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

  // ダイアログのリサイズを監視（ResizeObserverは削除して、カスタムハンドラーのみ使用）
  // useEffect(() => {
  //   if (!isOpen || !dialogRef.current) return

  //   const dialog = dialogRef.current
  //   const resizeObserver = new ResizeObserver((entries) => {
  //     for (const entry of entries) {
  //       const { width, height } = entry.contentRect
  //       setDialogSize({ width, height })
  //     }
  //   })

  //   resizeObserver.observe(dialog)
  //   return () => resizeObserver.disconnect()
  // }, [isOpen])

  // ダイアログが開かれた時にフォームをリセット
  useEffect(() => {
    if (isOpen) {
      setFormData({
        project_name: '',
        partner_id: 0,
        project_type_id: 0,
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        project_location: '',
        project_period_start: '',
        project_period_end: '',
        responsible_user_id: user?.id || undefined,
      })
      setDialogSize({ width: 650, height: 600 })
    }
  }, [isOpen, user?.id])

  return (
    <>
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
          <DialogTitle>新規見積作成</DialogTitle>
          <DialogDescription>
            新しい見積書を作成します。必須項目は赤いアスタリスク（*）で表示されています。
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          {/* 見積日 */}
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
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
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-start'}`}>
            <label className={`text-sm font-medium text-gray-700 pt-2 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
              担当者 <span className="text-red-500">*</span>
            </label>
            <div className="flex-1 space-y-2">
              <PopoverSearchFilter
                value={formData.responsible_user_id?.toString() || ''}
                onValueChange={(value) => handleInputChange('responsible_user_id', parseInt(value))}
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
                placeholder="担当者を選択してください"
                className="w-full"
                style={{ zIndex: 100 }}
              />
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600 flex items-center">
                {formData.responsible_user_id && formData.responsible_user_id > 0 ? (
                  <span>
                    部署: {
                      // ログインユーザーの場合、user.primary_departmentから取得
                      formData.responsible_user_id === user?.id && user?.primary_department 
                        ? user.primary_department.name
                        : // その他のユーザーの場合、employeesDataから取得
                          employeesData?.employees?.find(emp => emp.id === formData.responsible_user_id)?.department?.name || '部署情報なし'
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
              value={formData.partner_id.toString()}
              onValueChange={(value) => handleInputChange('partner_id', parseInt(value))}
              options={Array.isArray(partnerOptions) ? partnerOptions.map(partner => ({
                value: partner.value.toString(),
                label: partner.label
              })) : []}
              placeholder="受注先を選択してください"
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
              placeholder="工事名称を入力してください"
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
              placeholder="工事場所を入力してください"
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
                value={formData.project_period_start}
                onChange={(e) => handleInputChange('project_period_start', e.target.value)}
                placeholder="開始日"
                className="flex-1 w-full min-w-0"
              />
              <span className={`text-gray-500 text-sm flex-shrink-0 ${isNarrowDialog ? '' : 'text-base'}`}>〜</span>
              <Input
                type="date"
                value={formData.project_period_end}
                onChange={(e) => handleInputChange('project_period_end', e.target.value)}
                placeholder="終了日"
                className="flex-1 w-full min-w-0"
              />
            </div>
          </div>

          {/* 有効期限 */}
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
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
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-center'}`}>
            <label className={`text-sm font-medium text-gray-700 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
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
              style={{ zIndex: 100 }}
            />
          </div>

          {/* 工事種別費率情報 */}
          {selectedProjectType && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-2">
              <label className="w-full sm:w-32 text-sm font-medium text-gray-700 pt-2">
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
          <div className={`flex gap-2 ${isNarrowDialog ? 'flex-col' : 'flex-row items-start'}`}>
            <label className={`text-sm font-medium text-gray-700 pt-2 ${isNarrowDialog ? 'w-full' : 'w-32 flex-shrink-0'}`}>
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

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={handleCancel} disabled={createEstimateMutation.isPending}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={createEstimateMutation.isPending}>
            {createEstimateMutation.isPending ? '作成中...' : '作成'}
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

    {/* エラーダイアログ */}
    <ErrorDialog
      isOpen={errorDialog.isOpen}
      onClose={handleErrorDialogClose}
      title="見積作成エラー"
      message={errorDialog.message}
    />
    </>
  )
}

export default EstimateCreateDialog
