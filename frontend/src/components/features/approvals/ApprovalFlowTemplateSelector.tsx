'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Building, DollarSign, CheckCircle, Eye, Plus, Minus } from 'lucide-react'
import type { ApprovalFlowTemplate, CreateApprovalFlowRequest } from '@/types/features/approvals/approvalFlows'
import { approvalFlowService } from '@/services/features/approvals/approvalFlows'
import { useActiveSystemLevels } from '@/hooks/useSystemLevels'
import { useToast } from '@/components/ui/toast'

interface ApprovalFlowTemplateSelectorProps {
  templates: Record<string, ApprovalFlowTemplate>
  onFlowCreated: () => void
}

export function ApprovalFlowTemplateSelector({ templates, onFlowCreated }: ApprovalFlowTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [detailTemplate, setDetailTemplate] = useState<ApprovalFlowTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    flow_type: 'estimate'
  })
  const [steps, setSteps] = useState<Array<{
    step_order: number
    name: string
    approver_type: string
    approver_id: string
    is_required: boolean
  }>>([])
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()
  
  // システム権限レベルを取得
  const { data: systemLevels = [] } = useActiveSystemLevels()

  // 承認者コードを表示名に変換
  const getApproverDisplayName = (code: string): string => {
    const systemLevel = systemLevels.find(level => level.code === code)
    return systemLevel?.display_name || code
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates[templateId]
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: template.name,
        description: template.description
      }))
      
      // パターンからステップを初期化
      const initialSteps = template.approvers.map((approver, index) => ({
        step_order: index + 1,
        name: `第${index + 1}承認`,
        approver_type: 'system_level',
        approver_id: approver,
        is_required: true
      }))
      setSteps(initialSteps)
    }
  }

  const handleViewDetail = (templateId: string) => {
    const template = templates[templateId]
    if (template) {
      setDetailTemplate(template)
      setIsDetailDialogOpen(true)
    }
  }

  const addStep = () => {
    const defaultApprover = systemLevels.length > 0
      ? systemLevels.sort((a, b) => a.priority - b.priority)[0]
      : null

    const newStep = {
      step_order: steps.length + 1,
      name: `第${steps.length + 1}承認`,
      approver_type: 'system_level',
      approver_id: defaultApprover?.code || 'supervisor',
      is_required: true
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step_order: i + 1 }))
    setSteps(newSteps)
  }

  const updateStep = (index: number, field: string, value: string | boolean) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const handleSubmit = async () => {
    if (!selectedTemplate) return

    setLoading(true)
    try {
      const requestData: CreateApprovalFlowRequest = {
        template_id: selectedTemplate,
        name: formData.name,
        description: formData.description,
        flow_type: formData.flow_type,
        customizations: {
          steps: steps
        }
      }

      await approvalFlowService.createFromTemplate(requestData)
      
      // 成功トーストを表示
      addToast({
        type: 'success',
        title: '承認フローを作成しました',
        description: `${formData.name} が正常に作成されました`,
        duration: 4000
      })
      
      // フォームをリセット
      setFormData({
        name: '',
        description: '',
        flow_type: 'estimate'
      })
      setSteps([])
      setSelectedTemplate('')
      setIsDialogOpen(false)
      
      // 親コンポーネントに通知
      onFlowCreated()
    } catch (error) {
      console.error('承認フローの作成に失敗しました:', error)
      
      // エラートーストを表示
      addToast({
        type: 'error',
        title: '承認フローの作成に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'small_org_standard':
      case 'medium_org_standard':
        return <Building className="h-5 w-5" />
      case 'large_org_standard':
        return <Users className="h-5 w-5" />
      case 'high_value_flow':
        return <DollarSign className="h-5 w-5" />
      default:
        return <CheckCircle className="h-5 w-5" />
    }
  }

  const getStepBadgeColor = (steps: number) => {
    switch (steps) {
      case 1: return 'bg-green-100 text-green-800'
      case 2: return 'bg-blue-100 text-blue-800'
      case 3: return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">承認フローパターン</h3>
          <p className="text-sm text-gray-600">組織規模や案件に応じたパターンから承認フローを作成できます</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedTemplate}>
              フローを作成
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>承認フローを作成</DialogTitle>
              <DialogDescription>
                選択したパターンから承認フローを作成します
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">フロー名</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="承認フロー名を入力"
                />
              </div>
              
              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="承認フローの説明を入力"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="flow_type">フロータイプ</Label>
                <Select value={formData.flow_type} onValueChange={(value) => setFormData(prev => ({ ...prev, flow_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estimate">見積</SelectItem>
                    <SelectItem value="budget">予算</SelectItem>
                    <SelectItem value="order">発注</SelectItem>
                    <SelectItem value="progress">進捗</SelectItem>
                    <SelectItem value="payment">支払</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 承認ステップ編集セクション */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">承認ステップ</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStep}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    ステップ追加
                  </Button>
                </div>
                
                {steps.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    承認ステップがありません
                  </div>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">ステップ {step.step_order}</Badge>
                          {steps.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStep(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`step-name-${index}`}>ステップ名</Label>
                            <Input
                              id={`step-name-${index}`}
                              value={step.name}
                              onChange={(e) => updateStep(index, 'name', e.target.value)}
                              placeholder="ステップ名を入力"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`step-approver-${index}`}>承認者</Label>
                            <select
                              id={`step-approver-${index}`}
                              value={step.approver_id}
                              onChange={(e) => updateStep(index, 'approver_id', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {systemLevels.length > 0
                                ? systemLevels
                                    .sort((a, b) => a.priority - b.priority)
                                    .map((level) => (
                                      <option key={level.id} value={level.code}>
                                        {level.display_name}
                                      </option>
                                    ))
                                : (
                                  <option value="supervisor">上長</option>
                                )}
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`step-required-${index}`}
                            checked={step.is_required}
                            onCheckedChange={(checked) => updateStep(index, 'is_required', checked)}
                          />
                          <Label htmlFor={`step-required-${index}`}>必須</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !formData.name}>
                {loading ? '作成中...' : '作成'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* パターン一覧 */}
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(templates).map(([templateId, template]) => (
          <Card 
            key={templateId} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === templateId ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleTemplateSelect(templateId)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTemplateIcon(templateId)}
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewDetail(templateId)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Badge className={getStepBadgeColor(template.steps)}>
                    {template.steps}段階
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>対象: {template.suitable_for}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>承認者: {template.approvers.map(getApproverDisplayName).join(' → ')}</span>
                </div>
                {template.conditions && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <DollarSign className="h-4 w-4" />
                    <span>条件: {Number(template.conditions.value).toLocaleString()}円以上</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 詳細ダイアログ */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>パターン詳細</DialogTitle>
            <DialogDescription>
              {detailTemplate?.name} の詳細情報
            </DialogDescription>
          </DialogHeader>
          
          {detailTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">パターン名</label>
                  <p className="text-sm font-medium">{detailTemplate.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">段階数</label>
                  <div className="mt-1">
                    <Badge className={getStepBadgeColor(detailTemplate.steps)}>
                      {detailTemplate.steps}段階
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">対象組織</label>
                  <p className="text-sm">{detailTemplate.suitable_for}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">承認者</label>
                  <p className="text-sm">{detailTemplate.approvers.map(getApproverDisplayName).join(' → ')}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">説明</label>
                <p className="text-sm">{detailTemplate.description}</p>
              </div>
              
              {detailTemplate.conditions && (
                <div>
                  <label className="text-sm font-medium text-gray-500">適用条件</label>
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-700">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">
                        {detailTemplate.conditions.field} {detailTemplate.conditions.operator} {Number(detailTemplate.conditions.value).toLocaleString()}円
                      </span>
                    </div>
                    <p className="text-sm text-orange-600 mt-1">
                      この条件を満たす場合にこのパターンが適用されます
                    </p>
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">承認フロー</label>
                <div className="mt-2 space-y-2">
                  {detailTemplate.approvers.map((approver, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-sm font-medium">{getApproverDisplayName(approver)}</span>
                      {index < detailTemplate.approvers.length - 1 && (
                        <span className="text-sm text-gray-400">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
