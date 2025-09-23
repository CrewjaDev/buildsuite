'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Minus, Users, Building, DollarSign, Settings } from 'lucide-react'
import type { 
  ApprovalFlow, 
  CreateApprovalFlowRequest, 
  UpdateApprovalFlowRequest,
  ApprovalStep,
  ApprovalRequester,
  ApprovalConditions
} from '@/types/features/approvals/approvalFlows'
import { approvalFlowService } from '@/services/features/approvals/approvalFlows'
import { useActiveSystemLevels } from '@/hooks/useSystemLevels'
import { useActiveDepartments } from '@/hooks/useDepartments'
import { useActivePositions } from '@/hooks/usePositions'
import { useActiveBusinessTypes } from '@/hooks/useBusinessTypes'
import { useToast } from '@/components/ui/toast'

interface ApprovalFlowFormProps {
  flow?: ApprovalFlow // 編集時は既存のフローを渡す
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}


export function ApprovalFlowForm({ flow, isOpen, onClose, onSuccess }: ApprovalFlowFormProps) {
  const [formData, setFormData] = useState<{
    name: string
    description: string
    flow_type: string
    priority: number
    is_active: boolean
  }>({
    name: '',
    description: '',
    flow_type: 'estimate',
    priority: 1,
    is_active: true
  })
  const [conditions, setConditions] = useState<ApprovalConditions>({
    amount_min: undefined,
    amount_max: undefined,
    departments: [],
    project_types: [],
    vendor_types: []
  })
  const [requesters, setRequesters] = useState<ApprovalRequester[]>([])
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([])
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()
  
  // データ取得
  const { data: systemLevels = [] } = useActiveSystemLevels()
  const { data: departments = [] } = useActiveDepartments()
  const { data: positions = [] } = useActivePositions()
  const { data: businessTypes = [] } = useActiveBusinessTypes()

  // 編集時の初期化
  useEffect(() => {
    if (flow && isOpen) {
      setFormData({
        name: flow.name,
        description: flow.description || '',
        flow_type: flow.flow_type,
        priority: flow.priority,
        is_active: flow.is_active
      })
      
      // 条件の設定
      if (flow.conditions) {
        setConditions({
          amount_min: flow.conditions.amount_min,
          amount_max: flow.conditions.amount_max,
          departments: flow.conditions.departments || [],
          project_types: flow.conditions.project_types || [],
          vendor_types: flow.conditions.vendor_types || []
        })
      }
      
      // 承認依頼者の設定
      if (flow.requesters) {
        setRequesters(flow.requesters)
      }
      
      // 承認ステップの設定
      if (flow.approval_steps) {
        setApprovalSteps(flow.approval_steps)
      }
    } else if (isOpen) {
      // 新規作成時の初期化
      resetForm()
    }
  }, [flow, isOpen])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      flow_type: 'estimate',
      priority: 1,
      is_active: true
    })
    setConditions({
      amount_min: undefined,
      amount_max: undefined,
      departments: [],
      project_types: [],
      vendor_types: []
    })
    setRequesters([])
    setApprovalSteps([])
  }

  const addRequester = () => {
    const newRequester: ApprovalRequester = {
      type: 'system_level',
      value: 'staff',
      display_name: '担当者'
    }
    setRequesters([...requesters, newRequester])
  }

  const removeRequester = (index: number) => {
    setRequesters(requesters.filter((_, i) => i !== index))
  }

  const updateRequester = (index: number, field: keyof ApprovalRequester, value: string | number) => {
    const newRequesters = [...requesters]
    newRequesters[index] = { ...newRequesters[index], [field]: value }
    
    // display_nameを更新
    if (field === 'type' || field === 'value') {
      const requester = newRequesters[index]
      if (requester.type === 'system_level') {
        const systemLevel = systemLevels.find(level => level.code === requester.value)
        newRequesters[index].display_name = systemLevel?.display_name || '担当者'
      } else if (requester.type === 'department') {
        const department = departments.find(dept => dept.id === requester.value)
        newRequesters[index].display_name = department?.name || '部署'
      } else if (requester.type === 'position') {
        const position = positions.find(pos => pos.id === requester.value)
        newRequesters[index].display_name = position?.name || '職位'
      }
    }
    
    setRequesters(newRequesters)
  }

  const addApprovalStep = () => {
    const newStep: ApprovalStep = {
      step: approvalSteps.length + 1,
      name: `第${approvalSteps.length + 1}承認`,
      approvers: [{
        type: 'system_level',
        value: 'supervisor',
        display_name: '上長'
      }],
      available_permissions: ['estimate.approval.view', 'estimate.approval.approve'],
      condition: {
        type: 'required',
        display_name: '必須承認'
      }
    }
    setApprovalSteps([...approvalSteps, newStep])
  }

  const removeApprovalStep = (index: number) => {
    const newSteps = approvalSteps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step: i + 1 }))
    setApprovalSteps(newSteps)
  }

  const updateApprovalStep = (index: number, field: keyof ApprovalStep, value: unknown) => {
    const newSteps = [...approvalSteps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setApprovalSteps(newSteps)
  }

  const addApprover = (stepIndex: number) => {
    const newSteps = [...approvalSteps]
    const newApprover = {
      type: 'system_level' as const,
      value: 'supervisor',
      display_name: '上長'
    }
    newSteps[stepIndex].approvers.push(newApprover)
    setApprovalSteps(newSteps)
  }

  const removeApprover = (stepIndex: number, approverIndex: number) => {
    const newSteps = [...approvalSteps]
    newSteps[stepIndex].approvers = newSteps[stepIndex].approvers.filter((_, i) => i !== approverIndex)
    setApprovalSteps(newSteps)
  }

  const updateApprover = (stepIndex: number, approverIndex: number, field: string, value: string | number) => {
    const newSteps = [...approvalSteps]
    newSteps[stepIndex].approvers[approverIndex] = {
      ...newSteps[stepIndex].approvers[approverIndex],
      [field]: value
    }
    
    // display_nameを更新
    if (field === 'type' || field === 'value') {
      const approver = newSteps[stepIndex].approvers[approverIndex]
      if (approver.type === 'system_level') {
        const systemLevel = systemLevels.find(level => level.code === approver.value)
        newSteps[stepIndex].approvers[approverIndex].display_name = systemLevel?.display_name || '上長'
      } else if (approver.type === 'department') {
        const department = departments.find(dept => dept.id === approver.value)
        newSteps[stepIndex].approvers[approverIndex].display_name = department?.name || '部署'
      } else if (approver.type === 'position') {
        const position = positions.find(pos => pos.id === approver.value)
        newSteps[stepIndex].approvers[approverIndex].display_name = position?.name || '職位'
      }
    }
    
    setApprovalSteps(newSteps)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      addToast({
        type: 'error',
        title: 'バリデーションエラー',
        description: 'フロー名を入力してください',
        duration: 4000
      })
      return
    }

    if (approvalSteps.length === 0) {
      addToast({
        type: 'error',
        title: 'バリデーションエラー',
        description: '承認ステップを1つ以上設定してください',
        duration: 4000
      })
      return
    }

    setLoading(true)
    try {
      const requestData: CreateApprovalFlowRequest | UpdateApprovalFlowRequest = {
        name: formData.name,
        description: formData.description,
        flow_type: formData.flow_type,
        conditions: conditions,
        requesters: requesters,
        approval_steps: approvalSteps,
        priority: formData.priority,
        is_active: formData.is_active
      }

      if (flow) {
        // 更新
        await approvalFlowService.updateApprovalFlow(flow.id, requestData as UpdateApprovalFlowRequest)
        addToast({
          type: 'success',
          title: '承認フローを更新しました',
          description: `${formData.name} が正常に更新されました`,
          duration: 4000
        })
      } else {
        // 新規作成
        await approvalFlowService.createApprovalFlow(requestData as CreateApprovalFlowRequest)
        addToast({
          type: 'success',
          title: '承認フローを作成しました',
          description: `${formData.name} が正常に作成されました`,
          duration: 4000
        })
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('承認フローの保存に失敗しました:', error)
      addToast({
        type: 'error',
        title: '保存に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {flow ? '承認フローを編集' : '承認フローを作成'}
          </DialogTitle>
          <DialogDescription>
            {flow ? `${flow.name} の設定を変更します` : '新しい承認フローを作成します'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">フロー名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="承認フロー名を入力"
                  />
                </div>
                <div>
                  <Label htmlFor="flow_type">フロータイプ</Label>
                  <Select value={formData.flow_type} onValueChange={(value) => setFormData(prev => ({ ...prev, flow_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((businessType) => (
                        <SelectItem key={businessType.id} value={businessType.code}>
                          {businessType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">優先度</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                    placeholder="優先度を入力"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">有効</Label>
                </div>
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
            </CardContent>
          </Card>

          {/* 適用条件 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                適用条件
              </CardTitle>
              <CardDescription>この承認フローが適用される条件を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount_min">最小金額</Label>
                  <Input
                    id="amount_min"
                    type="number"
                    value={conditions.amount_min || ''}
                    onChange={(e) => setConditions(prev => ({ ...prev, amount_min: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="最小金額を入力"
                  />
                </div>
                <div>
                  <Label htmlFor="amount_max">最大金額</Label>
                  <Input
                    id="amount_max"
                    type="number"
                    value={conditions.amount_max || ''}
                    onChange={(e) => setConditions(prev => ({ ...prev, amount_max: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="最大金額を入力"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 承認依頼者設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                承認依頼者設定
              </CardTitle>
              <CardDescription>この承認フローを使用できるユーザーを設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">承認依頼者</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRequester}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  依頼者追加
                </Button>
              </div>
              
              {requesters.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  承認依頼者が設定されていません
                </div>
              ) : (
                <div className="space-y-3">
                  {requesters.map((requester, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">依頼者 {index + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequester(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`requester-type-${index}`}>タイプ</Label>
                          <Select value={requester.type} onValueChange={(value) => updateRequester(index, 'type', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="system_level">システム権限レベル</SelectItem>
                              <SelectItem value="department">部署</SelectItem>
                              <SelectItem value="position">職位</SelectItem>
                              <SelectItem value="user">個別ユーザー</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor={`requester-value-${index}`}>値</Label>
                          {requester.type === 'system_level' ? (
                            <Select value={requester.value as string} onValueChange={(value) => updateRequester(index, 'value', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {systemLevels.map((level) => (
                                  <SelectItem key={level.id} value={level.code}>
                                    {level.display_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : requester.type === 'department' ? (
                            <Select value={requester.value as string} onValueChange={(value) => updateRequester(index, 'value', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : requester.type === 'position' ? (
                            <Select value={requester.value as string} onValueChange={(value) => updateRequester(index, 'value', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {positions.map((pos) => (
                                  <SelectItem key={pos.id} value={pos.id.toString()}>
                                    {pos.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={requester.value as string}
                              onChange={(e) => updateRequester(index, 'value', e.target.value)}
                              placeholder="ユーザーIDを入力"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 承認ステップ設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                承認ステップ設定
              </CardTitle>
              <CardDescription>承認の流れを設定します（最大5ステップ）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">承認ステップ</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addApprovalStep}
                  disabled={approvalSteps.length >= 5}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  ステップ追加
                </Button>
              </div>
              
              {approvalSteps.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  承認ステップが設定されていません
                </div>
              ) : (
                <div className="space-y-4">
                  {approvalSteps.map((step, stepIndex) => (
                    <div key={stepIndex} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">ステップ {step.step}</Badge>
                        {approvalSteps.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeApprovalStep(stepIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`step-name-${stepIndex}`}>ステップ名</Label>
                          <Input
                            id={`step-name-${stepIndex}`}
                            value={step.name}
                            onChange={(e) => updateApprovalStep(stepIndex, 'name', e.target.value)}
                            placeholder="ステップ名を入力"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`step-condition-${stepIndex}`}>条件</Label>
                          <Select value={step.condition.type} onValueChange={(value) => updateApprovalStep(stepIndex, 'condition', { type: value, display_name: value === 'required' ? '必須承認' : '任意承認' })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="required">必須承認</SelectItem>
                              <SelectItem value="optional">任意承認</SelectItem>
                              <SelectItem value="majority">過半数承認</SelectItem>
                              <SelectItem value="unanimous">全会一致承認</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* 承認者設定 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">承認者</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addApprover(stepIndex)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            承認者追加
                          </Button>
                        </div>
                        
                        {step.approvers.map((approver, approverIndex) => (
                          <div key={approverIndex} className="border rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">承認者 {approverIndex + 1}</Badge>
                              {step.approvers.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeApprover(stepIndex, approverIndex)}
                                  className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor={`approver-type-${stepIndex}-${approverIndex}`}>タイプ</Label>
                                <Select value={approver.type} onValueChange={(value) => updateApprover(stepIndex, approverIndex, 'type', value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="system_level">システム権限レベル</SelectItem>
                                    <SelectItem value="department">部署</SelectItem>
                                    <SelectItem value="position">職位</SelectItem>
                                    <SelectItem value="user">個別ユーザー</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor={`approver-value-${stepIndex}-${approverIndex}`}>値</Label>
                                {approver.type === 'system_level' ? (
                                  <Select value={approver.value as string} onValueChange={(value) => updateApprover(stepIndex, approverIndex, 'value', value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {systemLevels.map((level) => (
                                        <SelectItem key={level.id} value={level.code}>
                                          {level.display_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : approver.type === 'department' ? (
                                  <Select value={approver.value as string} onValueChange={(value) => updateApprover(stepIndex, approverIndex, 'value', value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id.toString()}>
                                          {dept.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : approver.type === 'position' ? (
                                  <Select value={approver.value as string} onValueChange={(value) => updateApprover(stepIndex, approverIndex, 'value', value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {positions.map((pos) => (
                                        <SelectItem key={pos.id} value={pos.id.toString()}>
                                          {pos.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    value={approver.value as string}
                                    onChange={(e) => updateApprover(stepIndex, approverIndex, 'value', e.target.value)}
                                    placeholder="ユーザーIDを入力"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.name.trim()}>
            {loading ? '保存中...' : (flow ? '更新' : '作成')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
