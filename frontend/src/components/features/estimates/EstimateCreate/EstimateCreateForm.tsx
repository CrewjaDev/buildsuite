'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateEstimate } from '@/hooks/features/estimates/useEstimates'
import { CreateEstimateRequest } from '@/types/features/estimates/estimate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePartners } from '@/hooks/features/estimates/usePartners'
import { useProjectTypes } from '@/hooks/features/estimates/useProjectTypes'
import { useConstructionClassifications } from '@/hooks/features/estimates/useConstructionClassifications'
import { useToast } from '@/components/ui/toast'
import { Save } from 'lucide-react'

interface EstimateCreateFormProps {
  onSuccess?: (estimateId: number) => void
  onCancel?: () => void
}

export function EstimateCreateForm({ onSuccess, onCancel }: EstimateCreateFormProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const createEstimateMutation = useCreateEstimate()
  
  // フォーム状態
  const [formData, setFormData] = useState<CreateEstimateRequest>({
    project_name: '',
    project_description: '',
    partner_id: 0,
    project_type_id: 0,
    construction_classification_id: 0,
    estimate_date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90日後
    tax_rate: 0.10,
    remarks: '',
  })

  // マスターデータ取得
  const { data: partners } = usePartners()
  const { data: projectTypes } = useProjectTypes()
  const { data: constructionClassifications } = useConstructionClassifications()

  // フォーム更新ハンドラー
  const handleInputChange = useCallback((field: keyof CreateEstimateRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  // 保存ハンドラー
  const handleSave = useCallback(async () => {
    try {
      const newEstimate = await createEstimateMutation.mutateAsync(formData)
      
      addToast({
        title: "見積を作成しました",
        description: "新しい見積が正常に作成されました。",
        type: "success"
      })
      
      if (onSuccess) {
        onSuccess(newEstimate.id)
      } else {
        router.push(`/estimates/${newEstimate.id}`)
      }
    } catch {
      addToast({
        title: "作成に失敗しました",
        description: "見積の作成中にエラーが発生しました。",
        type: "error"
      })
    }
  }, [formData, createEstimateMutation, addToast, router, onSuccess])

  // キャンセルハンドラー
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    } else {
      router.push('/estimates')
    }
  }, [router, onCancel])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 工事名称 */}
        <div className="md:col-span-2">
          <Label htmlFor="project_name">工事名称 *</Label>
          <Input
            id="project_name"
            value={formData.project_name}
            onChange={(e) => handleInputChange('project_name', e.target.value)}
            placeholder="工事名称を入力してください"
            className="mt-1"
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
          />
        </div>

        {/* 工事場所 */}
        <div className="md:col-span-2">
          <Label htmlFor="project_description">工事場所</Label>
          <Input
            id="project_description"
            value={formData.project_description}
            onChange={(e) => handleInputChange('project_description', e.target.value)}
            placeholder="工事場所を入力してください"
            className="mt-1"
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
          />
        </div>

        {/* 取引先 */}
        <div>
          <Label htmlFor="partner_id">取引先 *</Label>
          <Select
            value={formData.partner_id.toString()}
            onValueChange={(value) => handleInputChange('partner_id', parseInt(value))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="取引先を選択してください" />
            </SelectTrigger>
            <SelectContent>
              {partners?.data?.map((partner) => (
                <SelectItem key={partner.id} value={partner.id.toString()}>
                  {partner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 工事種別 */}
        <div>
          <Label htmlFor="project_type_id">工事種別 *</Label>
          <Select
            value={formData.project_type_id.toString()}
            onValueChange={(value) => handleInputChange('project_type_id', parseInt(value))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="工事種別を選択してください" />
            </SelectTrigger>
            <SelectContent>
              {projectTypes?.data?.map((projectType) => (
                <SelectItem key={projectType.id} value={projectType.id.toString()}>
                  {projectType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 工事分類 */}
        <div>
          <Label htmlFor="construction_classification_id">工事分類 *</Label>
          <Select
            value={formData.construction_classification_id.toString()}
            onValueChange={(value) => handleInputChange('construction_classification_id', parseInt(value))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="工事分類を選択してください" />
            </SelectTrigger>
            <SelectContent>
              {constructionClassifications?.data?.map((classification) => (
                <SelectItem key={classification.id} value={classification.id.toString()}>
                  {classification.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 見積日 */}
        <div>
          <Label htmlFor="estimate_date">見積日 *</Label>
          <Input
            id="estimate_date"
            type="date"
            value={formData.estimate_date}
            onChange={(e) => handleInputChange('estimate_date', e.target.value)}
            className="mt-1"
          />
        </div>

        {/* 有効期限 */}
        <div>
          <Label htmlFor="valid_until">有効期限 *</Label>
          <Input
            id="valid_until"
            type="date"
            value={formData.valid_until}
            onChange={(e) => handleInputChange('valid_until', e.target.value)}
            className="mt-1"
          />
        </div>

        {/* 消費税率 */}
        <div>
          <Label htmlFor="tax_rate">消費税率</Label>
          <Input
            id="tax_rate"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={formData.tax_rate}
            onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
            placeholder="0.10"
            className="mt-1"
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
          />
        </div>

        {/* 備考 */}
        <div className="md:col-span-2">
          <Label htmlFor="remarks">備考</Label>
          <Input
            id="remarks"
            value={formData.remarks}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('remarks', e.target.value)}
            placeholder="備考を入力してください"
            className="mt-1"
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
          />
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={handleCancel}>
          キャンセル
        </Button>
        <Button 
          onClick={handleSave}
          disabled={createEstimateMutation.isPending || !formData.project_name || !formData.partner_id || !formData.project_type_id || !formData.construction_classification_id}
        >
          <Save className="h-4 w-4 mr-2" />
          {createEstimateMutation.isPending ? '作成中...' : '作成'}
        </Button>
      </div>
    </div>
  )
}
