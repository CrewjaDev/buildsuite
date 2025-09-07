'use client'

import { useState, useEffect } from 'react'
import { Estimate } from '@/types/features/estimates/estimate'
import { EstimateBreakdownTree, CreateEstimateBreakdownRequest } from '@/types/features/estimates/estimateBreakdown'
import { useCreateEstimateBreakdown, useUpdateEstimateBreakdown } from '@/hooks/features/estimates/useEstimateBreakdowns'
import { useEstimateBreakdowns } from '@/hooks/features/estimates/useEstimateBreakdowns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save } from 'lucide-react'

interface EstimateBreakdownFormProps {
  estimate: Estimate
  breakdown?: EstimateBreakdownTree | null
  onClose: () => void
}

export function EstimateBreakdownForm({ estimate, breakdown, onClose }: EstimateBreakdownFormProps) {
  const { data: existingBreakdowns } = useEstimateBreakdowns(estimate.id)
  const createBreakdown = useCreateEstimateBreakdown()
  const updateBreakdown = useUpdateEstimateBreakdown()

  const [formData, setFormData] = useState<CreateEstimateBreakdownRequest>({
    estimate_id: estimate.id,
    breakdown_type: 'small',
    name: '',
    description: '',
    quantity: 1,
    unit: '個',
    unit_price: 0,
    direct_amount: 0,
    estimated_cost: 0,
    construction_method: '',
    remarks: '',
    order_request_content: ''
  })

  const [parentId, setParentId] = useState<string>('')

  useEffect(() => {
    if (breakdown) {
      setFormData({
        estimate_id: breakdown.estimate_id,
        breakdown_type: breakdown.breakdown_type,
        name: breakdown.name,
        description: breakdown.description || '',
        quantity: breakdown.quantity,
        unit: breakdown.unit,
        unit_price: breakdown.unit_price,
        direct_amount: breakdown.direct_amount,
        estimated_cost: breakdown.estimated_cost,
        construction_method: breakdown.construction_method || '',
        remarks: breakdown.remarks || '',
        order_request_content: breakdown.order_request_content || ''
      })
      setParentId(breakdown.parent_id || '')
    }
  }, [breakdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (breakdown) {
        // 更新
        await updateBreakdown.mutateAsync({
          breakdownId: breakdown.id,
          data: {
            name: formData.name,
            description: formData.description,
            quantity: formData.quantity,
            unit: formData.unit,
            unit_price: formData.unit_price,
            direct_amount: formData.direct_amount,
            estimated_cost: formData.estimated_cost,
            construction_method: formData.construction_method,
            remarks: formData.remarks,
            order_request_content: formData.order_request_content
          }
        })
      } else {
        // 作成
        await createBreakdown.mutateAsync({
          ...formData,
          parent_id: parentId || undefined
        })
      }
      onClose()
    } catch (error) {
      console.error('保存エラー:', error)
    }
  }

  const getAvailableParents = () => {
    if (!existingBreakdowns) return []
    
    const currentType = formData.breakdown_type
    let availableTypes: string[] = []
    
    switch (currentType) {
      case 'large':
        availableTypes = []
        break
      case 'medium':
        availableTypes = ['large']
        break
      case 'small':
        availableTypes = ['medium']
        break
    }
    
    return existingBreakdowns.filter(b => 
      availableTypes.includes(b.breakdown_type) && 
      b.id !== breakdown?.id
    )
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {breakdown ? '見積内訳編集' : '見積内訳作成'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breakdown_type">内訳種別</Label>
              <Select
                value={formData.breakdown_type}
                onValueChange={(value: 'large' | 'medium' | 'small') => 
                  setFormData(prev => ({ ...prev, breakdown_type: value }))
                }
                disabled={!!breakdown}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="large">大内訳</SelectItem>
                  <SelectItem value="medium">中内訳</SelectItem>
                  <SelectItem value="small">小内訳</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.breakdown_type !== 'large' && (
              <div className="space-y-2">
                <Label htmlFor="parent_id">親内訳</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="親内訳を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">なし</SelectItem>
                    {getAvailableParents().map(parent => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">内訳名 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="内訳名を入力"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">詳細説明</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="詳細説明を入力"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">単位</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="個"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">単価</Label>
              <Input
                id="unit_price"
                type="number"
                value={formData.unit_price}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="direct_amount">一式金額</Label>
              <Input
                id="direct_amount"
                type="number"
                value={formData.direct_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, direct_amount: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
                placeholder="一式で入力する場合の金額"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_cost">予想原価</Label>
              <Input
                id="estimated_cost"
                type="number"
                value={formData.estimated_cost}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="construction_method">工法</Label>
            <Input
              id="construction_method"
              value={formData.construction_method}
              onChange={(e) => setFormData(prev => ({ ...prev, construction_method: e.target.value }))}
              placeholder="工法を入力"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">備考</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="備考を入力"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_request_content">発注依頼内容</Label>
            <Textarea
              id="order_request_content"
              value={formData.order_request_content}
              onChange={(e) => setFormData(prev => ({ ...prev, order_request_content: e.target.value }))}
              placeholder="発注依頼内容を入力"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button 
              type="submit" 
              disabled={createBreakdown.isPending || updateBreakdown.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {breakdown ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
