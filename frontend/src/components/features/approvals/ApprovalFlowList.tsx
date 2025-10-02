'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit, Trash2, Eye, RefreshCw, Plus, Minus } from 'lucide-react'
import { approvalFlowService } from '@/services/features/approvals/approvalFlows'
import type { ApprovalFlow, ApprovalStep } from '@/types/features/approvals/approvalFlows'
import { useActiveSystemLevels } from '@/hooks/useSystemLevels'
import { useToast } from '@/components/ui/toast'
import { permissionService, type Permission } from '@/services/features/permission/permissionService'
import { useBusinessCodes } from '@/hooks/features/business/useBusinessCode'
import { APPROVER_TYPE_LABELS, STEP_BADGE_COLORS, AUTO_APPROVAL_LABELS } from '@/constants/common'

interface ApprovalFlowListProps {
  flows: ApprovalFlow[]
  loading: boolean
  onRefresh: () => void
  onEdit?: (flow: ApprovalFlow) => void
}

export function ApprovalFlowList({ flows, loading, onRefresh, onEdit }: ApprovalFlowListProps) {
  const [selectedFlow, setSelectedFlow] = useState<ApprovalFlow | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    priority: 0
  })
  const [editSteps, setEditSteps] = useState<ApprovalStep[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const { addToast } = useToast()
  
  // システム権限レベルを取得（React Query使用）
  const { data: systemLevels = [], isLoading: systemLevelsLoading } = useActiveSystemLevels()
  
  // ビジネスコードを取得
  const { data: businessCodesData } = useBusinessCodes()

  // 権限一覧を取得
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await permissionService.getPermissions({ per_page: 1000 })
        
        // レスポンス構造を確認して適切に設定
        if (response && Array.isArray(response)) {
          setPermissions(response)
        } else if (response && response.data && Array.isArray(response.data)) {
          setPermissions(response.data)
        } else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
          setPermissions(response.data.data)
        } else {
          setPermissions([])
        }
      } catch (error) {
        console.error('権限一覧の取得に失敗しました:', error)
        setPermissions([])
      }
    }
    fetchPermissions()
  }, [])

  // 権限コードから日本語名を取得する関数
  const getPermissionDisplayName = (permissionCode: string): string => {
    if (!Array.isArray(permissions)) {
      return permissionCode
    }
    
    const permission = permissions.find(p => p.name === permissionCode)
    
    if (permission) {
      return permission.display_name || permissionCode
    }
    
    // データベースに権限が見つからない場合は、権限コードをそのまま返す
    return permissionCode
  }

  const handleViewDetail = (flow: ApprovalFlow) => {
    setSelectedFlow(flow)
    setIsDetailDialogOpen(true)
  }

  const handleEdit = (flow: ApprovalFlow) => {
    if (onEdit) {
      onEdit(flow)
    } else {
      // フォールバック: 既存の編集ダイアログを開く
      setSelectedFlow(flow)
      setEditFormData({
        name: flow.name,
        description: flow.description || '',
        is_active: flow.is_active,
        priority: flow.priority
      })
      
      // ステップ情報を設定（新しいJSONカラム設計）
      if (flow.approval_steps && flow.approval_steps.length > 0) {
        setEditSteps(flow.approval_steps.map(step => ({
          step: step.step,
          name: step.name,
          approvers: step.approvers || [],
          available_permissions: step.available_permissions || [],
          condition: step.condition || { type: 'required', display_name: '必須承認' }
        })))
      } else {
        setEditSteps([])
      }
      
      setIsEditDialogOpen(true)
    }
  }

  const handleUpdate = async () => {
    if (!selectedFlow) return

    try {
      // ステップの変更も含めて更新データを準備
      const updateData = {
        ...editFormData,
        approval_steps: editSteps
      }
      
      await approvalFlowService.updateApprovalFlow(selectedFlow.id, updateData)
      
      addToast({
        type: 'success',
        title: '承認フローを更新しました',
        description: `${editFormData.name} が正常に更新されました`,
        duration: 4000
      })
      
      setIsEditDialogOpen(false)
      onRefresh()
    } catch (error) {
      console.error('承認フローの更新に失敗しました:', error)
      
      addToast({
        type: 'error',
        title: '承認フローの更新に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000
      })
    }
  }

  const addStep = () => {
    // デフォルト承認者を取得（優先度が低い最初のレベル）
    const defaultApprover = systemLevels.length > 0
      ? systemLevels.sort((a, b) => a.priority - b.priority)[0]
      : null

    const newStep: ApprovalStep = {
      step: editSteps.length + 1,
      name: `第${editSteps.length + 1}承認`,
      approvers: [{
        type: 'system_level' as const,
        value: defaultApprover?.code || 'supervisor',
        display_name: defaultApprover?.display_name || '上長'
      }],
      available_permissions: ['approval.view', 'approval.approve'],
      condition: {
        type: 'required' as const,
        display_name: '必須承認'
      }
    }
    setEditSteps([...editSteps, newStep])
  }

  const removeStep = (index: number) => {
    const newSteps = editSteps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step: i + 1 }))
    setEditSteps(newSteps)
  }

  const updateStep = (index: number, field: string, value: string | boolean) => {
    const newSteps = [...editSteps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setEditSteps(newSteps)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この承認フローを削除しますか？')) return

    setDeletingId(id)
    try {
      await approvalFlowService.deleteApprovalFlow(id)
      
      // 成功トーストを表示
      addToast({
        type: 'success',
        title: '承認フローを削除しました',
        description: '承認フローが正常に削除されました',
        duration: 4000
      })
      
      onRefresh()
    } catch (error) {
      console.error('承認フローの削除に失敗しました:', error)
      
      // エラートーストを表示
      addToast({
        type: 'error',
        title: '承認フローの削除に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000
      })
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (flow: ApprovalFlow) => {
    if (flow.is_system) {
      return <Badge variant="secondary">システム</Badge>
    }
    return flow.is_active ? (
      <Badge variant="default" className="bg-green-100 text-green-800">有効</Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">無効</Badge>
    )
  }

  const getFlowTypeLabel = (flowType: string) => {
    // ビジネスコードから日本語名を取得
    if (businessCodesData?.data?.business_codes) {
      const businessCode = businessCodesData.data.business_codes.find(
        (bc: { code: string; name: string }) => bc.code === flowType
      )
      if (businessCode) {
        return businessCode.name
      }
    }
    
    // ビジネスコードが見つからない場合は、フロー種別コードをそのまま返す
    return flowType
  }

  const getStepBadgeColor = (stepCount: number) => {
    return STEP_BADGE_COLORS[stepCount] || 'bg-gray-100 text-gray-800'
  }

  const getApproverTypeLabel = (type: string) => {
    return APPROVER_TYPE_LABELS[type] || type
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400 mb-4" />
          <p className="text-gray-500">読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">承認フロー一覧</h3>
          <p className="text-sm text-gray-600">作成済みの承認フローを管理します</p>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          更新
        </Button>
      </div>

      {/* フロー一覧テーブル */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>フロー名</TableHead>
                <TableHead>タイプ</TableHead>
                <TableHead>ステップ数</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>優先度</TableHead>
                <TableHead>作成日</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    承認フローがありません
                  </TableCell>
                </TableRow>
              ) : (
                flows.map((flow) => (
                  <TableRow key={flow.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{flow.name}</div>
                        {flow.description && (
                          <div className="text-sm text-gray-500">{flow.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getFlowTypeLabel(flow.flow_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStepBadgeColor(flow.approval_steps?.length || 0)}>
                        {flow.approval_steps?.length || 0}段階
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(flow)}</TableCell>
                    <TableCell>{flow.priority}</TableCell>
                    <TableCell>
                      {new Date(flow.created_at).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(flow)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!flow.is_system && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(flow)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(flow.id)}
                              disabled={deletingId === flow.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 詳細ダイアログ */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>承認フロー詳細</DialogTitle>
            <DialogDescription>
              {selectedFlow?.name} の詳細情報
            </DialogDescription>
          </DialogHeader>
          
          {selectedFlow && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">フロー名</label>
                  <p className="text-sm">{selectedFlow.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">タイプ</label>
                  <p className="text-sm">{getFlowTypeLabel(selectedFlow.flow_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ステータス</label>
                  <div className="mt-1">{getStatusBadge(selectedFlow)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">優先度</label>
                  <p className="text-sm">{selectedFlow.priority}</p>
                </div>
              </div>
              
              {selectedFlow.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">説明</label>
                  <p className="text-sm">{selectedFlow.description}</p>
                </div>
              )}
              
              {selectedFlow.requesters && selectedFlow.requesters.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">承認依頼者設定</label>
                  <div className="mt-2 space-y-2">
                    {selectedFlow.requesters.map((requester, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{requester.display_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {getApproverTypeLabel(requester.type)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedFlow.approval_steps && selectedFlow.approval_steps.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">承認ステップ</label>
                  <div className="mt-2 space-y-2">
                    {selectedFlow.approval_steps.filter(step => step.step !== 0).map((step, index) => {
                      // デバッグ用ログ
                      console.log('Step data:', step);
                      return (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={step.step === 0 ? "secondary" : "outline"}>
                            {step.step === 0 ? "承認依頼作成" : `ステップ ${step.step}`}
                          </Badge>
                          <span className="text-sm font-medium">{step.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="font-medium">
                            {step.step === 0 ? '承認依頼者:' : '承認者:'}
                          </div>
                          <div className="ml-2 space-y-1">
                            {step.approvers?.map((approver, approverIndex) => (
                              <div key={approverIndex} className="flex items-center gap-2">
                                <span>{approver.display_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {getApproverTypeLabel(approver.type)}
                                </Badge>
                              </div>
                            )) || (step.step === 0 ? '承認依頼者なし' : '承認者なし')}
                          </div>
                        </div>
                        {step.available_permissions && step.available_permissions.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <div className="font-medium">利用可能権限:</div>
                            <div className="ml-2 flex flex-wrap gap-1">
                              {step.available_permissions.map((permission, permIndex) => (
                                <Badge key={permIndex} variant="secondary" className="text-xs">
                                  {getPermissionDisplayName(permission)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {step.condition && (
                          <div className="text-sm text-gray-600">
                            <div className="font-medium">承認条件:</div>
                            <div className="ml-2">
                              <Badge variant="outline" className="text-xs">
                                {step.condition.display_name}
                              </Badge>
                            </div>
                          </div>
                        )}
                        <div className="text-sm text-gray-600">
                          <div className="font-medium">自動承認設定:</div>
                          <div className="ml-2">
                            <Badge variant={step.auto_approve_if_requester ? "default" : "secondary"} className="text-xs">
                              {step.auto_approve_if_requester ? AUTO_APPROVAL_LABELS.enabled : AUTO_APPROVAL_LABELS.disabled}
                            </Badge>
                            {step.auto_approve_if_requester && (
                              <span className="ml-2 text-xs text-gray-500">
                                (承認依頼作成者の場合自動承認)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {selectedFlow.conditions && Object.keys(selectedFlow.conditions).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">適用条件</label>
                  <div className="mt-2 space-y-1">
                    {selectedFlow.conditions.amount_min !== undefined && selectedFlow.conditions.amount_min !== null && (
                      <div className="text-sm text-gray-600">
                        最小金額: {selectedFlow.conditions.amount_min.toLocaleString()}円
                      </div>
                    )}
                    {selectedFlow.conditions.amount_max !== undefined && selectedFlow.conditions.amount_max !== null && (
                      <div className="text-sm text-gray-600">
                        最大金額: {selectedFlow.conditions.amount_max.toLocaleString()}円
                      </div>
                    )}
                    {selectedFlow.conditions.departments && selectedFlow.conditions.departments.length > 0 && (
                      <div className="text-sm text-gray-600">
                        対象部署: {selectedFlow.conditions.departments.length} 部署
                      </div>
                    )}
                    {selectedFlow.conditions.project_types && selectedFlow.conditions.project_types.length > 0 && (
                      <div className="text-sm text-gray-600">
                        プロジェクトタイプ: {selectedFlow.conditions.project_types.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>承認フローを編集</DialogTitle>
            <DialogDescription>
              {selectedFlow?.name} の設定を変更します
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">フロー名</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="承認フロー名を入力"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">説明</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="承認フローの説明を入力"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-priority">優先度</Label>
              <Input
                id="edit-priority"
                type="number"
                value={editFormData.priority}
                onChange={(e) => setEditFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                placeholder="優先度を入力"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={editFormData.is_active}
                onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="edit-active">有効</Label>
            </div>
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
            
            {editSteps.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                承認ステップがありません
              </div>
            ) : (
              <div className="space-y-3">
                {editSteps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">ステップ {step.step}</Badge>
                      {editSteps.length > 1 && (
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
                          value={step.approvers[0]?.value || ''}
                          onChange={(e) => {
                            const newSteps = [...editSteps]
                            newSteps[index] = {
                              ...newSteps[index],
                              approvers: [{
                                type: 'system_level' as const,
                                value: e.target.value,
                                display_name: systemLevels.find(l => l.code === e.target.value)?.display_name || '上長'
                              }]
                            }
                            setEditSteps(newSteps)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={systemLevelsLoading}
                        >
                          {systemLevelsLoading ? (
                            <option value="">読み込み中...</option>
                          ) : systemLevels.length > 0 ? (
                            systemLevels
                              .sort((a, b) => a.priority - b.priority)
                              .map((level) => (
                                <option key={level.id} value={level.code}>
                                  {level.display_name}
                                </option>
                              ))
                          ) : (
                            <option value="supervisor">上長</option>
                          )}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`step-required-${index}`}
                        checked={step.condition.type === 'required'}
                        onCheckedChange={(checked) => {
                          const newSteps = [...editSteps]
                          newSteps[index] = {
                            ...newSteps[index],
                            condition: {
                              type: checked ? 'required' : 'optional',
                              display_name: checked ? '必須承認' : '任意承認'
                            }
                          }
                          setEditSteps(newSteps)
                        }}
                      />
                      <Label htmlFor={`step-required-${index}`}>必須</Label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdate} disabled={!editFormData.name}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
