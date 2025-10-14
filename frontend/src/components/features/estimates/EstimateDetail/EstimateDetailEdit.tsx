'use client'

import { useState, useEffect } from 'react'
import { EstimateBreakdownTree } from '@/types/features/estimates/estimateBreakdown'
import { Estimate } from '@/types/features/estimates/estimate'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PopoverSearchFilter } from '@/components/common/data-display/DataTable'
import { useToast } from '@/components/ui/toast'
import { useUpdateEstimate } from '@/hooks/features/estimates/useEstimates'
import { useQueryClient } from '@tanstack/react-query'
import { useEmployees } from '@/hooks/features/employee/useEmployees'
import { usePartnerOptions } from '@/hooks/features/estimates/usePartners'
import { useProjectTypeOptions, useProjectType } from '@/hooks/features/estimates/useProjectTypes'
import { formatDateForInput } from '@/lib/utils/estimateUtils'
import { EstimateBreakdownStructureCard } from '../EstimateBreakdowns/EstimateBreakdownStructureCard'
import { EstimateItemsCard } from './EstimateItemsCard'

interface EstimateDetailEditProps {
  estimate: Estimate
  onCancel: () => void
  onSuccess: () => void
}

export function EstimateDetailEdit({ estimate, onCancel, onSuccess }: EstimateDetailEditProps) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const updateEstimateMutation = useUpdateEstimate()
  
  // 社員一覧取得
  const { data: employeesData } = useEmployees({ is_active: true })
  
  // 取引先オプション取得（顧客または相殺先のみ）
  const { data: partnerOptions } = usePartnerOptions('customer')
  
  // 工事種別オプション取得
  const { data: projectTypeOptions } = useProjectTypeOptions()
  
  const [formData, setFormData] = useState({
    project_name: estimate.project_name || '',
    project_location: estimate.project_location || '',
    estimate_date: formatDateForInput(estimate.estimate_date),
    issue_date: formatDateForInput(estimate.issue_date),
    expiry_date: formatDateForInput(estimate.expiry_date),
    created_by: estimate.created_by || 0,
    partner_id: estimate.partner_id || 0,
    construction_period_from: formatDateForInput(estimate.construction_period_from), // 工期開始日
    construction_period_to: formatDateForInput(estimate.construction_period_to), // 工期終了日
    project_type_id: estimate.project_type_id || 0,
    notes: estimate.notes || '',
    overhead_rate: estimate.overhead_rate || 0,
    cost_expense_rate: estimate.cost_expense_rate || 0,
    material_expense_rate: estimate.material_expense_rate || 0,
  })

  // 見積内訳のローカル状態
  const [, setLocalBreakdowns] = useState<EstimateBreakdownTree[]>([])

  // 選択された工事種別の詳細取得
  const { data: selectedProjectType } = useProjectType(formData.project_type_id)
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 見積基本情報の更新
      await updateEstimateMutation.mutateAsync({
        id: estimate.id,
        data: formData
      })
      
      // TODO: 見積内訳の一括更新APIを呼び出し
      // await updateEstimateBreakdownsMutation.mutateAsync({
      //   estimateId: estimate.id,
      //   breakdowns: localBreakdowns
      // })
      
      // 見積詳細のキャッシュを明示的に無効化して最新データを取得
      queryClient.invalidateQueries({ queryKey: ['estimate', estimate.id] })
      queryClient.invalidateQueries({ queryKey: ['estimate-breakdowns', estimate.id] })
      queryClient.invalidateQueries({ queryKey: ['estimate-breakdown-tree', estimate.id] })
      
      addToast({
        title: "見積を更新しました",
        description: "見積情報が正常に保存されました。",
        type: "success"
      })
      
      onSuccess()
    } catch (error: unknown) {
      console.error('見積更新エラー:', error)
      
      // APIから返される詳細なエラーメッセージを取得
      let errorMessage = "見積の更新中にエラーが発生しました。"
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
      
      addToast({
        title: "更新に失敗しました",
        description: errorMessage,
        type: "error"
      })
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 工事種別が変更された場合、工事種別に紐づく費率を更新
    if (field === 'project_type_id') {
      // TODO: 工事種別IDに基づいて費率を取得・更新するロジックを実装
      // 現在は表示のみなので、実際のAPI呼び出しは後で実装
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 基本情報 */}
      <Card>
        <div className="px-6 pt-2 pb-0">
          <h3 className="text-lg font-semibold leading-none tracking-tight">基本情報</h3>
        </div>
        <CardContent className="space-y-0 pt-0 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 左側カード - 基本情報 */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {/* 見積番号 - 表示のみ */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          見積番号
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {estimate.estimate_number || '-'}
                        </td>
                      </tr>

                      {/* 工事番号 - 表示のみ */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          工事番号
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {estimate.construction_number || '-'}
                        </td>
                      </tr>

                      {/* 見積日 - 編集可能 */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          見積日
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <Input
                            type="date"
                            value={formData.estimate_date}
                            onChange={(e) => handleInputChange('estimate_date', e.target.value)}
                            className="h-8 text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                      </tr>

                      {/* 見積状態 - 表示のみ */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          見積状態
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
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
                        </td>
                      </tr>

                      {/* 担当者 - 編集可能 */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          担当者
                        </td>
                                 <td className="px-3 py-2 text-sm text-gray-900">
           <PopoverSearchFilter
             options={employeesData?.employees?.map((employee) => ({
               value: employee.id.toString(),
               label: employee.name
             })) || []}
             value={formData.created_by.toString()}
             onValueChange={(value: string) => handleInputChange('created_by', parseInt(value))}
             placeholder="担当者を選択"
             className="h-8 text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
           />
         </td>
                      </tr>

                      {/* 受注先 - 編集可能 */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          受注先
                        </td>
                                 <td className="px-3 py-2 text-sm text-gray-900">
           <PopoverSearchFilter
             options={partnerOptions?.map((partner) => ({
               value: partner.value.toString(),
               label: partner.label
             })) || []}
             value={formData.partner_id.toString()}
             onValueChange={(value: string) => handleInputChange('partner_id', parseInt(value))}
             placeholder="受注先を選択"
             className="h-8 text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
           />
         </td>
                      </tr>

                      {/* 工事名称 - 編集可能 */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          工事名称
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <Input
                            value={formData.project_name}
                            onChange={(e) => handleInputChange('project_name', e.target.value)}
                            placeholder="工事名称を入力"
                            className="h-8 text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                      </tr>

                      {/* 工事場所 - 編集可能 */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          工事場所
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <Input
                            value={formData.project_location}
                            onChange={(e) => handleInputChange('project_location', e.target.value)}
                            placeholder="工事場所を入力"
                            className="h-8 text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 右側カード - その他の詳細 */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {/* 工期 - 編集可能 */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          工期
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Input
                              type="date"
                              value={formData.construction_period_from}
                              onChange={(e) => handleInputChange('construction_period_from', e.target.value)}
                              className="h-8 text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-gray-500">〜</span>
                            <Input
                              type="date"
                              value={formData.construction_period_to}
                              onChange={(e) => handleInputChange('construction_period_to', e.target.value)}
                              className="h-8 text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </td>
                      </tr>

                      {/* 有効期限 - 編集可能 */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          有効期限
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <Input
                            type="date"
                            value={formData.expiry_date}
                            onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                            className="h-8 text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                      </tr>

                      {/* 工事種別 - 編集可能 */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          工事種別
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <PopoverSearchFilter
                            options={projectTypeOptions?.map((projectType) => ({
                              value: projectType.id.toString(),
                              label: projectType.name
                            })) || []}
                            value={formData.project_type_id.toString()}
                            onValueChange={(value: string) => handleInputChange('project_type_id', parseInt(value))}
                            placeholder="工事種別を選択"
                            className="h-8 text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                      </tr>

                      {/* 一般管理費率 - 表示のみ */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          一般管理費率
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {formData.overhead_rate ? `${Number(formData.overhead_rate).toFixed(1)}%` : '-'}
                        </td>
                      </tr>

                      {/* 原価経費率 - 表示のみ */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          原価経費率
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {formData.cost_expense_rate ? `${Number(formData.cost_expense_rate).toFixed(1)}%` : '-'}
                        </td>
                      </tr>

                      {/* 材料経費率 - 表示のみ */}
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                          材料経費率
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {formData.material_expense_rate ? `${Number(formData.material_expense_rate).toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* 金額情報 */}
      <Card>
        <div className="px-6 pt-2 pb-0">
          <h3 className="text-lg font-semibold leading-none tracking-tight">見積額 合計</h3>
        </div>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-700 mb-1">税抜見積金額</div>
              <div className="text-lg font-semibold text-blue-900">
                ¥{estimate.subtotal?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm font-medium text-green-700 mb-1">消費税（税率）</div>
              <div className="text-lg font-semibold text-green-900">
                ¥{estimate.tax_amount?.toLocaleString() || '0'} ({Math.round((estimate.tax_rate || 0) * 100)}%)
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="text-sm font-medium text-purple-700 mb-1">合計金額</div>
              <div className="text-lg font-semibold text-purple-900">
                ¥{estimate.grand_total?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 見積内訳構造 */}
      <EstimateBreakdownStructureCard 
        estimate={estimate} 
        isReadOnly={false}
        onBreakdownsChange={setLocalBreakdowns}
      />

      {/* 見積明細 */}
      <EstimateItemsCard estimate={estimate} isReadOnly={false} />

      {/* アクションボタン */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" disabled={updateEstimateMutation.isPending}>
          {updateEstimateMutation.isPending ? '保存中...' : '保存'}
        </Button>
      </div>
    </form>
  )
}