'use client'

import { useState, useEffect } from 'react'
import { EstimateItem, CreateEstimateItemRequest, UpdateEstimateItemRequest } from '@/types/features/estimates/estimateItem'
import { EstimateBreakdown } from '@/types/features/estimates/estimateBreakdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PopoverSearchFilter } from '@/components/common/data-display/DataTable'
import { usePartners } from '@/hooks/features/partners/usePartners'
import { useConstructionClassifications } from '@/hooks/features/estimates/useConstructionClassifications'
import { X } from 'lucide-react'

interface EstimateItemFormProps {
  item?: EstimateItem
  estimateId: string
  breakdowns?: EstimateBreakdown[]
  onSubmit: (data: CreateEstimateItemRequest | UpdateEstimateItemRequest) => void
  onCancel: () => void
  isLoading?: boolean
}

export function EstimateItemForm({ 
  item, 
  estimateId, 
  breakdowns,
  onSubmit, 
  onCancel, 
  isLoading = false 
}: EstimateItemFormProps) {
  // データ取得
  const { data: partners } = usePartners({ partner_type: 'supplier' })
  const { data: constructionClassifications } = useConstructionClassifications()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    quantity: 1,
    unit_price: 0,
    estimated_cost: 0,
    breakdown_id: undefined as string | undefined,
    supplier_id: undefined as number | undefined,
    order_request_content: '',
    construction_method: '',
    construction_classification_id: undefined as number | undefined,
    remarks: '',
    is_active: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        estimated_cost: item.estimated_cost,
        breakdown_id: item.breakdown_id,
        supplier_id: item.supplier_id,
        order_request_content: item.order_request_content || '',
        construction_method: item.construction_method || '',
        construction_classification_id: item.construction_classification_id,
        remarks: item.remarks || '',
        is_active: item.is_active,
      })
    }
  }, [item])

  const handleInputChange = (field: string, value: string | number | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'アイテム名は必須です'
    }

    if (!formData.breakdown_id) {
      newErrors.breakdown_id = '見積内訳は必須です'
    }

    if (!formData.unit.trim()) {
      newErrors.unit = '単位は必須です'
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = '数量は0より大きい値を入力してください'
    }

    if (formData.unit_price < 0) {
      newErrors.unit_price = '単価は0以上の値を入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const submitData = {
      ...formData,
      estimate_id: estimateId,
    }

    onSubmit(submitData)
  }

  const calculateAmount = () => {
    return formData.quantity * formData.unit_price
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {item ? '見積明細の編集' : '見積明細の追加'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 見積内訳 */}
            <div className="space-y-2">
              <Label htmlFor="breakdown_id">見積内訳 *</Label>
              <PopoverSearchFilter
                options={[
                  { value: '', label: '内訳を選択してください' },
                  ...(breakdowns || [])
                    .filter(b => b.breakdown_type === 'small')
                    .map((breakdown) => ({
                      value: breakdown.id,
                      label: breakdown.name
                    }))
                ]}
                value={formData.breakdown_id || ''}
                onValueChange={(value) => handleInputChange('breakdown_id', value || undefined)}
                placeholder="小内訳を選択"
              />
              {errors.breakdown_id && (
                <p className="text-sm text-red-500">{errors.breakdown_id}</p>
              )}
            </div>

            {/* 単位 */}
            <div className="space-y-2">
              <Label htmlFor="unit">単位 *</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                placeholder="例: 個、式、m²"
                className={errors.unit ? 'border-red-500' : ''}
              />
              {errors.unit && (
                <p className="text-sm text-red-500">{errors.unit}</p>
              )}
            </div>
          </div>

          {/* アイテム名 */}
          <div className="space-y-2">
            <Label htmlFor="name">アイテム名 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="アイテム名を入力"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="アイテムの詳細説明（任意）"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 数量 */}
            <div className="space-y-2">
              <Label htmlFor="quantity">数量 *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>

            {/* 単価 */}
            <div className="space-y-2">
              <Label htmlFor="unit_price">単価 *</Label>
              <Input
                id="unit_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => handleInputChange('unit_price', parseFloat(e.target.value) || 0)}
                className={errors.unit_price ? 'border-red-500' : ''}
              />
              {errors.unit_price && (
                <p className="text-sm text-red-500">{errors.unit_price}</p>
              )}
            </div>
          </div>

          {/* 金額（計算結果） */}
          <div className="space-y-2">
            <Label>金額（自動計算）</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              <span className="text-lg font-medium">
                ¥{calculateAmount().toLocaleString()}
              </span>
            </div>
          </div>

          {/* 工法 */}
          <div className="space-y-2">
            <Label htmlFor="construction_method">工法</Label>
            <Input
              id="construction_method"
              value={formData.construction_method}
              onChange={(e) => handleInputChange('construction_method', e.target.value)}
              placeholder="工法を入力（任意）"
            />
          </div>

          {/* 工事分類 */}
          <div className="space-y-2">
            <Label htmlFor="construction_classification_id">工事分類</Label>
            <PopoverSearchFilter
              options={[
                { value: '', label: '選択してください' },
                ...(constructionClassifications?.data || []).map((classification) => ({
                  value: classification.id.toString(),
                  label: classification.name
                }))
              ]}
              value={formData.construction_classification_id?.toString() || ''}
              onValueChange={(value) => handleInputChange('construction_classification_id', value ? parseInt(value) : undefined)}
              placeholder="工事分類を選択"
            />
          </div>

          {/* 発注先 */}
          <div className="space-y-2">
            <Label htmlFor="supplier_id">発注先</Label>
            <PopoverSearchFilter
              options={[
                { value: '', label: '選択してください' },
                ...(partners?.partners || []).map((partner) => ({
                  value: partner.id.toString(),
                  label: partner.partner_name
                }))
              ]}
              value={formData.supplier_id?.toString() || ''}
              onValueChange={(value) => handleInputChange('supplier_id', value ? parseInt(value) : undefined)}
              placeholder="発注先を選択"
            />
          </div>

          {/* 発注依頼内容 */}
          <div className="space-y-2">
            <Label htmlFor="order_request_content">発注依頼内容</Label>
            <Textarea
              id="order_request_content"
              value={formData.order_request_content}
              onChange={(e) => handleInputChange('order_request_content', e.target.value)}
              placeholder="発注依頼内容を入力（任意）"
              rows={2}
            />
          </div>

          {/* 備考 */}
          <div className="space-y-2">
            <Label htmlFor="remarks">備考</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              placeholder="備考を入力（任意）"
              rows={2}
            />
          </div>

          {/* 有効状態 */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">有効</Label>
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : (item ? '更新' : '追加')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
