'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PopoverSearchFilter } from '@/components/common/data-display/DataTable'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Minus, Users, Building, DollarSign, Settings, ChevronDown, ChevronRight } from 'lucide-react'
import type { 
  ApprovalFlow, 
  CreateApprovalFlowRequest, 
  UpdateApprovalFlowRequest,
  ApprovalStep,
  ApprovalRequester,
  ApprovalConditions,
  FlowConfig
} from '@/types/features/approvals/approvalFlows'
import type { UserDetail } from '@/types/user'
import { approvalFlowService } from '@/services/features/approvals/approvalFlows'
import { useActiveSystemLevels } from '@/hooks/useSystemLevels'
import { useActiveDepartments } from '@/hooks/useDepartments'
import { useActivePositions } from '@/hooks/usePositions'
import { useUsers } from '@/hooks/useUsers'
import { businessCodeService } from '@/services/features/business/businessCodeService'
import { useToast } from '@/components/ui/toast'

interface ApprovalFlowFormProps {
  flow?: ApprovalFlow // 編集時は既存のフローを渡す
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// ステップ別詳細設定コンポーネント
const StepDetailSettings: React.FC<{
  step: ApprovalStep;
  stepIndex: number;
  onUpdate: (stepIndex: number, field: keyof ApprovalStep, value: unknown) => void;
}> = ({ step, stepIndex, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const defaultEditingConditions = {
    allow_during_pending: true,
    allow_during_reviewing: false,
    allow_during_step_approved: true,
    allow_during_expired: false,
  };
  
  const defaultCancellationConditions = {
    allow_during_pending: true,
    allow_during_reviewing: false,
    allow_during_step_approved: false,
    allow_during_expired: false,
  };
  
  const editingConditions = step.editing_conditions || defaultEditingConditions;
  const cancellationConditions = step.cancellation_conditions || defaultCancellationConditions;
  
  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">詳細設定</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {isExpanded ? '折りたたむ' : '展開'}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="space-y-4 mt-4">
          {/* 編集条件 */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-600">編集条件</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id={`editing-pending-${stepIndex}`}
                  checked={editingConditions.allow_during_pending}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'editing_conditions', {
                      ...editingConditions,
                      allow_during_pending: checked
                    })
                  }
                />
                <Label htmlFor={`editing-pending-${stepIndex}`} className="text-sm">
                  承認待ち中に編集を許可
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id={`editing-reviewing-${stepIndex}`}
                  checked={editingConditions.allow_during_reviewing}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'editing_conditions', {
                      ...editingConditions,
                      allow_during_reviewing: checked
                    })
                  }
                />
                <Label htmlFor={`editing-reviewing-${stepIndex}`} className="text-sm">
                  審査中に編集を許可
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id={`editing-step-approved-${stepIndex}`}
                  checked={editingConditions.allow_during_step_approved}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'editing_conditions', {
                      ...editingConditions,
                      allow_during_step_approved: checked
                    })
                  }
                />
                <Label htmlFor={`editing-step-approved-${stepIndex}`} className="text-sm">
                  ステップ承認後に編集を許可
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id={`editing-expired-${stepIndex}`}
                  checked={editingConditions.allow_during_expired}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'editing_conditions', {
                      ...editingConditions,
                      allow_during_expired: checked
                    })
                  }
                />
                <Label htmlFor={`editing-expired-${stepIndex}`} className="text-sm">
                  期限切れ後に編集を許可
                </Label>
              </div>
            </div>
          </div>
          
          {/* キャンセル条件 */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-600">キャンセル条件</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id={`cancellation-pending-${stepIndex}`}
                  checked={cancellationConditions.allow_during_pending}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'cancellation_conditions', {
                      ...cancellationConditions,
                      allow_during_pending: checked
                    })
                  }
                />
                <Label htmlFor={`cancellation-pending-${stepIndex}`} className="text-sm">
                  承認待ち中にキャンセルを許可
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id={`cancellation-reviewing-${stepIndex}`}
                  checked={cancellationConditions.allow_during_reviewing}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'cancellation_conditions', {
                      ...cancellationConditions,
                      allow_during_reviewing: checked
                    })
                  }
                />
                <Label htmlFor={`cancellation-reviewing-${stepIndex}`} className="text-sm">
                  審査中にキャンセルを許可
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id={`cancellation-step-approved-${stepIndex}`}
                  checked={cancellationConditions.allow_during_step_approved}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'cancellation_conditions', {
                      ...cancellationConditions,
                      allow_during_step_approved: checked
                    })
                  }
                />
                <Label htmlFor={`cancellation-step-approved-${stepIndex}`} className="text-sm">
                  ステップ承認後にキャンセルを許可
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id={`cancellation-expired-${stepIndex}`}
                  checked={cancellationConditions.allow_during_expired}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'cancellation_conditions', {
                      ...cancellationConditions,
                      allow_during_expired: checked
                    })
                  }
                />
                <Label htmlFor={`cancellation-expired-${stepIndex}`} className="text-sm">
                  期限切れ後にキャンセルを許可
                </Label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export function ApprovalFlowForm({ flow, isOpen, onClose, onSuccess }: ApprovalFlowFormProps) {
  // ビジネスロジックコードのみを取得（システム管理コードは除外）
  const [businessTypes, setBusinessTypes] = useState<Array<{id: string, name: string, code: string}>>([])
  
  // 選択されたビジネスコードの承認権限情報
  const [businessCodePermissions, setBusinessCodePermissions] = useState<Array<{id: number, name: string, display_name: string}>>([])
  
  const [formData, setFormData] = useState<{
    name: string
    description: string
    flow_type: string
    priority: number
    is_active: boolean
    flow_config: FlowConfig
  }>({
    name: '',
    description: '',
    flow_type: '', // 初期値は空、businessTypesが読み込まれた後に設定
    priority: 1,
    is_active: true,
    flow_config: {
      allow_editing_after_request: true,
      allow_cancellation_after_request: true,
      step_settings: {}
    }
  })
  
  // ビジネスコードをAPIから取得
  useEffect(() => {
    const loadBusinessCodes = async () => {
      try {
        const allBusinessCodes = await businessCodeService.getAllBusinessCodes()
        const businessTypesData = Object.entries(allBusinessCodes)
          .filter(([, info]) => !info.is_system)
          .map(([code, info]) => ({
            id: code,
            name: info.name,
            code: code
          }))
        setBusinessTypes(businessTypesData)
        
        // フロータイプが設定されていない場合は最初のビジネスコードを設定
        if (!formData.flow_type && businessTypesData.length > 0) {
          setFormData(prev => ({ ...prev, flow_type: businessTypesData[0].code }))
        }
        
      } catch (error) {
        console.error('ビジネスコードの取得に失敗:', error)
        // フォールバック: 基本的なビジネスコードを設定
        const fallbackBusinessTypes = [
          { id: 'estimate', name: '見積', code: 'estimate' },
          { id: 'budget', name: '予算', code: 'budget' },
          { id: 'purchase', name: '発注', code: 'purchase' },
          { id: 'construction', name: '工事', code: 'construction' },
          { id: 'general', name: '一般', code: 'general' }
        ]
        setBusinessTypes(fallbackBusinessTypes)
        
        // フロータイプが設定されていない場合は最初のビジネスコードを設定
        if (!formData.flow_type) {
          setFormData(prev => ({ ...prev, flow_type: fallbackBusinessTypes[0].code }))
        }
      }
    }
    
    loadBusinessCodes()
  }, [formData.flow_type])

  // フロータイプ変更時に権限を取得
  useEffect(() => {
    const loadBusinessCodePermissions = async () => {
      if (!formData.flow_type) {
        setBusinessCodePermissions([])
        return
      }

      
      try {
        const permissionStatus = await businessCodeService.getBusinessCodePermissionStatus(
          'system_level',
          1,
          formData.flow_type
        )
        
        if (permissionStatus.data.permission_status && permissionStatus.data.permission_status.length > 0) {
          // カテゴリベースで承認ステップ用権限をフィルタリング
          const approvalPermissions = permissionStatus.data.permission_status.filter(p => 
            p.category === 'approval_step'
          )
          
          
          setBusinessCodePermissions(approvalPermissions.map(p => ({
            id: p.id,
            name: p.name,
            display_name: p.display_name
          })))
        } else {
          setBusinessCodePermissions([])
        }
      } catch (error) {
        console.warn('ビジネスコード権限取得に失敗:', error)
        setBusinessCodePermissions([])
      }
    }

    loadBusinessCodePermissions()
  }, [formData.flow_type])
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
  const { data: usersData } = useUsers({ page: 1, pageSize: 1000, is_active: true })
  const users = usersData?.users || []
  
  // ユーザーの表示ラベルを生成する関数
  const getUserDisplayLabel = (user: UserDetail) => {
    const parts = [user.name]
    
    // システム権限レベル
    if (user.systemLevel?.display_name) {
      parts.push(`[${user.systemLevel.display_name}]`)
    }
    
    // 職位
    if (user.position?.display_name) {
      parts.push(`(${user.position.display_name})`)
    }
    
    // 役割（最初の役割のみ表示）
    if (user.roles && user.roles.length > 0) {
      parts.push(`- ${user.roles[0].display_name}`)
    }
    
    // 部署（プライマリ部署または最初の部署）
    const primaryDept = user.primary_department || (user.departments && user.departments[0])
    if (primaryDept?.name) {
      parts.push(`@${primaryDept.name}`)
    }
    
    return parts.join(' ')
  }

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      flow_type: businessTypes[0]?.code || '',
      priority: 1,
      is_active: true,
      flow_config: {
        allow_editing_after_request: true,
        allow_cancellation_after_request: true,
        step_settings: {}
      }
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
  }, [businessTypes])

  // 編集時の初期化
  useEffect(() => {
    if (flow && isOpen) {
      setFormData({
        name: flow.name,
        description: flow.description || '',
        flow_type: flow.flow_type,
        priority: flow.priority,
        is_active: flow.is_active,
        flow_config: flow.flow_config || {
          allow_editing_after_request: true,
          allow_cancellation_after_request: true,
          step_settings: {}
        }
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
        // 各ステップのconditionプロパティとrequired_permissionsを適切に初期化
        const initializedSteps = flow.approval_steps.map(step => {
          const stepKey = `step_${step.step}`;
          const stepSettings = flow.flow_config?.step_settings?.[stepKey];
          
          return {
            ...step,
            required_permissions: step.required_permissions || [], // 初期化
            condition: step.condition || {
              type: 'required',
              display_name: '必須承認'
            },
            auto_approve_if_requester: step.auto_approve_if_requester || false, // 自動承認設定の初期化
            // 新規追加：詳細設定
            editing_conditions: step.editing_conditions || stepSettings?.editing_conditions || {
              allow_during_pending: true,
              allow_during_reviewing: false,
              allow_during_step_approved: true,
              allow_during_expired: false,
            },
            cancellation_conditions: step.cancellation_conditions || stepSettings?.cancellation_conditions || {
              allow_during_pending: true,
              allow_during_reviewing: false,
              allow_during_step_approved: false,
              allow_during_expired: false,
            }
          };
        });
        setApprovalSteps(initializedSteps)
      }
    } else if (isOpen) {
      // 新規作成時の初期化
      resetForm()
    }
  }, [flow, isOpen, resetForm])

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

  const updateRequester = (index: number, field: keyof ApprovalRequester, value: string | number | string[]) => {
    const newRequesters = [...requesters]
    
    // タイプが変更された場合は値もリセット
    if (field === 'type') {
      newRequesters[index] = {
        ...newRequesters[index],
        [field]: value as 'system_level' | 'department' | 'position' | 'user',
        value: '', // 値をリセット
        display_name: '' // 表示名もリセット
      }
    } else {
      newRequesters[index] = { ...newRequesters[index], [field]: value }
    }
    
    // display_nameを更新
    if (field === 'type' || field === 'value') {
      const requester = newRequesters[index]
      if (requester.type === 'system_level') {
        const systemLevel = systemLevels.find(level => level.code === requester.value)
        newRequesters[index].display_name = systemLevel?.display_name || 'システム権限レベル'
      } else if (requester.type === 'department') {
        const department = departments.find(dept => dept.id.toString() === String(requester.value))
        newRequesters[index].display_name = department?.name || '部署'
      } else if (requester.type === 'position') {
        const position = positions.find(pos => pos.id.toString() === String(requester.value))
        newRequesters[index].display_name = position?.name || '職位'
      } else if (requester.type === 'user') {
        // 個別ユーザーの場合はユーザー一覧から名前を取得
        const user = users.find((u) => u.id.toString() === String(requester.value))
        newRequesters[index].display_name = user?.name || 'ユーザー'
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
      required_permissions: [], // 初期化
      condition: {
        type: 'required',
        display_name: '必須承認'
      },
      auto_approve_if_requester: false, // 自動承認設定の初期化
      // 新規追加：詳細設定のデフォルト値
      editing_conditions: {
        allow_during_pending: true,
        allow_during_reviewing: false,
        allow_during_step_approved: true,
        allow_during_expired: false,
      },
      cancellation_conditions: {
        allow_during_pending: true,
        allow_during_reviewing: false,
        allow_during_step_approved: false,
        allow_during_expired: false,
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
    
    // 完全に新しい配列を作成して強制再レンダリング
    const newSteps = approvalSteps.map((step, sIndex) => {
      if (sIndex === stepIndex) {
        return {
          ...step,
          approvers: step.approvers.map((approver, aIndex) => {
            if (aIndex === approverIndex) {
              // タイプが変更された場合は値もリセット
              if (field === 'type') {
                return {
                  ...approver,
                  [field]: value as 'system_level' | 'department' | 'position' | 'user',
                  value: '', // 値をリセット
                  display_name: '' // 表示名もリセット
                }
              } else {
                return {
                  ...approver,
                  [field]: value
                }
              }
            }
            return approver
          })
        }
      }
      return step
    })
    
    // display_nameを更新
    if (field === 'type' || field === 'value') {
      const approver = newSteps[stepIndex].approvers[approverIndex]
      if (approver.type === 'system_level') {
        const systemLevel = systemLevels.find(level => level.code === approver.value)
        newSteps[stepIndex].approvers[approverIndex].display_name = systemLevel?.display_name || 'システム権限レベル'
      } else if (approver.type === 'department') {
        const department = departments.find(dept => dept.id.toString() === String(approver.value))
        newSteps[stepIndex].approvers[approverIndex].display_name = department?.name || '部署'
      } else if (approver.type === 'position') {
        const position = positions.find(pos => pos.id.toString() === String(approver.value))
        newSteps[stepIndex].approvers[approverIndex].display_name = position?.name || '職位'
      } else if (approver.type === 'user') {
        // 個別ユーザーの場合はユーザー一覧から名前を取得
        const user = users.find((u) => u.id.toString() === String(approver.value))
        newSteps[stepIndex].approvers[approverIndex].display_name = user?.name || 'ユーザー'
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
        is_active: formData.is_active,
        flow_config: formData.flow_config
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
      
      // バリデーションエラーの詳細を表示
      const axiosError = error as { response?: { data?: { errors?: Record<string, string[]> } } }
      if (axiosError?.response?.data?.errors) {
        const errors = axiosError.response.data.errors
        console.log('バリデーションエラー詳細:', errors)
        
        // 最初のエラーメッセージを表示
        const firstError = Object.values(errors)[0]
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError
        
        addToast({
          type: 'error',
          title: 'バリデーションエラー',
          description: errorMessage,
          duration: 5000
        })
      } else {
        addToast({
          type: 'error',
          title: '保存に失敗しました',
          description: 'エラーが発生しました。もう一度お試しください。',
          duration: 5000
        })
      }
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
              
              {/* フロー設定 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">フロー設定</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow_editing_after_request"
                      checked={formData.flow_config.allow_editing_after_request}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        flow_config: { 
                          ...prev.flow_config, 
                          allow_editing_after_request: checked 
                        } 
                      }))}
                    />
                    <Label htmlFor="allow_editing_after_request" className="text-sm">
                      承認依頼後の編集を許可
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow_cancellation_after_request"
                      checked={formData.flow_config.allow_cancellation_after_request}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        flow_config: { 
                          ...prev.flow_config, 
                          allow_cancellation_after_request: checked 
                        } 
                      }))}
                    />
                    <Label htmlFor="allow_cancellation_after_request" className="text-sm">
                      承認依頼後のキャンセルを許可
                    </Label>
                  </div>
                </div>
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
                    <div key={`requester-${index}-${requester.type}-${requester.value}`} className="border rounded-lg p-4 space-y-3">
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
                          <Select 
                            key={`requester-type-${index}-${requester.type}`}
                            value={requester.type} 
                            onValueChange={(value) => {
                              console.log('Requester type changed:', { index, oldType: requester.type, newType: value })
                              updateRequester(index, 'type', value)
                            }}
                          >
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
                            <Select 
                              key={`requester-system-level-${index}-${requester.value}`}
                              value={String(requester.value)} 
                              onValueChange={(value) => updateRequester(index, 'value', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="システム権限レベルを選択" />
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
                            <Select 
                              key={`requester-department-${index}-${requester.value}`}
                              value={String(requester.value)} 
                              onValueChange={(value) => updateRequester(index, 'value', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="部署を選択" />
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
                            <Select 
                              key={`requester-position-${index}-${requester.value}`}
                              value={String(requester.value)} 
                              onValueChange={(value) => updateRequester(index, 'value', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="職位を選択" />
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
                            <PopoverSearchFilter
                              key={`requester-user-${index}-${requester.value}`}
                              options={users.map((user) => ({
                                value: user.id.toString(),
                                label: getUserDisplayLabel(user)
                              }))}
                              value={String(requester.value)}
                              onValueChange={(value: string) => updateRequester(index, 'value', value)}
                              placeholder="ユーザーを選択"
                              emptyMessage="該当するユーザーがありません"
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
                  {approvalSteps.filter(step => step.step !== 0).map((step) => {
                    const stepIndex = approvalSteps.findIndex(s => s.step === step.step)
                    const safeCondition = step.condition || {
                      type: 'required',
                      display_name: '必須承認'
                    }
                    
                    // ステップ0の場合は特別な表示
                    const isStepZero = step.step === 0
                    
                    return (
                    <div key={stepIndex} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant={isStepZero ? "secondary" : "outline"}>
                          {isStepZero ? "承認依頼作成" : `ステップ ${step.step}`}
                        </Badge>
                        {approvalSteps.length > 1 && !isStepZero && (
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
                          {isStepZero ? (
                            <div className="text-sm text-gray-500 p-2 border rounded">
                              承認依頼作成ステップでは条件設定は不要です
                            </div>
                          ) : (
                            <Select value={safeCondition.type} onValueChange={(value) => updateApprovalStep(stepIndex, 'condition', { type: value, display_name: value === 'required' ? '必須承認' : '任意承認' })}>
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
                          )}
                        </div>
                      </div>
                      
                      {/* 自動承認設定 */}
                      {!isStepZero && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`auto-approve-${stepIndex}`}
                            checked={step.auto_approve_if_requester || false}
                            onCheckedChange={(checked) => updateApprovalStep(stepIndex, 'auto_approve_if_requester', checked)}
                          />
                          <Label htmlFor={`auto-approve-${stepIndex}`} className="text-sm">
                            承認依頼作成者の場合自動承認
                          </Label>
                        </div>
                      )}
                      
                      {/* 詳細設定セクション */}
                      <StepDetailSettings 
                        step={step} 
                        stepIndex={stepIndex} 
                        onUpdate={updateApprovalStep} 
                      />
                      
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
                          <div key={`approver-${stepIndex}-${approverIndex}-${approver.type}-${approver.value}`} className="border rounded p-3 space-y-2">
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
                                <Select 
                                  key={`approver-type-${stepIndex}-${approverIndex}-${approver.type}`}
                                  value={approver.type} 
                                  onValueChange={(value) => {
                                    console.log('Approver type changed:', { stepIndex, approverIndex, oldType: approver.type, newType: value })
                                    updateApprover(stepIndex, approverIndex, 'type', value)
                                  }}
                                >
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
                                  <Select 
                                    key={`approver-system-level-${stepIndex}-${approverIndex}-${approver.value}`}
                                    value={String(approver.value)} 
                                    onValueChange={(value) => updateApprover(stepIndex, approverIndex, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="システム権限レベルを選択" />
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
                                  <Select 
                                    key={`approver-department-${stepIndex}-${approverIndex}-${approver.value}`}
                                    value={String(approver.value)} 
                                    onValueChange={(value) => updateApprover(stepIndex, approverIndex, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="部署を選択" />
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
                                  <Select 
                                    key={`approver-position-${stepIndex}-${approverIndex}-${approver.value}`}
                                    value={String(approver.value)} 
                                    onValueChange={(value) => updateApprover(stepIndex, approverIndex, 'value', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="職位を選択" />
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
                                  <PopoverSearchFilter
                                    key={`approver-user-${stepIndex}-${approverIndex}-${approver.value}`}
                                    options={users.map((user) => ({
                                      value: user.id.toString(),
                                      label: getUserDisplayLabel(user)
                                    }))}
                                    value={String(approver.value)}
                                    onValueChange={(value: string) => updateApprover(stepIndex, approverIndex, 'value', value)}
                                    placeholder="ユーザーを選択"
                                    emptyMessage="該当するユーザーがありません"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* ステップで利用可能な権限の設定 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">ステップで利用可能な権限</Label>
                        <div className="text-xs text-muted-foreground">
                          利用可能な権限数: {businessCodePermissions.length} (承認・却下・差し戻しのみ)
                        </div>
                        <div className="space-y-2">
                          {businessCodePermissions.length > 0 ? businessCodePermissions.map((permission) => {
                            const isSelected = step.available_permissions?.includes(permission.name) || false
                            return (
                              <div 
                                key={`${stepIndex}-${permission.id}-${step.available_permissions?.length || 0}`} 
                                className="flex items-center space-x-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                }}
                              >
                                <input
                                  type="checkbox"
                                  key={`checkbox-${stepIndex}-${permission.id}-${step.available_permissions?.length || 0}`}
                                  id={`step-${stepIndex}-permission-${permission.id}`}
                                  checked={isSelected}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    console.log('チェックボックス直接クリック:', {
                                      stepIndex,
                                      permission: permission.name,
                                      checked: e.currentTarget.checked
                                    })
                                  }}
                                  onChange={(e) => {
                                    console.log('チェックボックスクリックイベント発火:', {
                                      stepIndex,
                                      permission: permission.name,
                                      checked: e.target.checked,
                                      currentStep: step
                                    })
                                    
                                    const currentPermissions = step.available_permissions || []
                                    const newPermissions = e.target.checked
                                      ? [...currentPermissions, permission.name]
                                      : currentPermissions.filter(p => p !== permission.name)
                                    
                                    
                                    // ステップの権限を更新
                                    const newSteps = approvalSteps.map((s, sIndex) => {
                                      if (sIndex === stepIndex) {
                                        return { ...s, available_permissions: newPermissions }
                                      }
                                      return s
                                    })
                                    
                                    console.log('新しいステップ配列:', newSteps)
                                    setApprovalSteps(newSteps)
                                  }}
                                  className="rounded border-input cursor-pointer"
                                  style={{ pointerEvents: 'auto' }}
                                />
                                <Label 
                                  htmlFor={`step-${stepIndex}-permission-${permission.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {permission.display_name}
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                  ({permission.name})
                                </span>
                              </div>
                            )
                          }) : (
                            <div className="text-sm text-muted-foreground">
                              権限情報を読み込み中...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    )
                  })}
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
