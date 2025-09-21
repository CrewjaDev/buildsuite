'use client'

import { useState } from 'react'
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
import { ApprovalFlow } from '@/services/features/approvals/approvalFlows'
import { approvalFlowService } from '@/services/features/approvals/approvalFlows'
import { useActiveSystemLevels } from '@/hooks/useSystemLevels'
import { useToast } from '@/components/ui/toast'

interface ApprovalFlowListProps {
  flows: ApprovalFlow[]
  loading: boolean
  onRefresh: () => void
}

export function ApprovalFlowList({ flows, loading, onRefresh }: ApprovalFlowListProps) {
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
  const [editSteps, setEditSteps] = useState<Array<{
    id?: number
    step_order: number
    name: string
    approver_type: string
    approver_id: string
    is_required: boolean
  }>>([])
  const { addToast } = useToast()
  
  // システム権限レベルを取得（React Query使用）
  const { data: systemLevels = [], isLoading: systemLevelsLoading } = useActiveSystemLevels()

  const handleViewDetail = (flow: ApprovalFlow) => {
    setSelectedFlow(flow)
    setIsDetailDialogOpen(true)
  }

  const handleEdit = (flow: ApprovalFlow) => {
    setSelectedFlow(flow)
    setEditFormData({
      name: flow.name,
      description: flow.description || '',
      is_active: flow.is_active,
      priority: flow.priority
    })
    
    // ステップ情報を設定
    if (flow.steps && flow.steps.length > 0) {
      setEditSteps(flow.steps.map(step => ({
        id: step.id,
        step_order: step.step_order,
        name: step.name,
        approver_type: step.approver_type,
        approver_id: step.approver_system_level?.code || step.approver_id.toString(),
        is_required: step.is_required
      })))
    } else {
      setEditSteps([])
    }
    
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedFlow) return

    try {
      await approvalFlowService.updateApprovalFlow(selectedFlow.id, editFormData)
      
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

    const newStep = {
      step_order: editSteps.length + 1,
      name: `第${editSteps.length + 1}承認`,
      approver_type: 'system_level',
      approver_id: defaultApprover?.code || 'supervisor',
      is_required: true
    }
    setEditSteps([...editSteps, newStep])
  }

  const removeStep = (index: number) => {
    const newSteps = editSteps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step_order: i + 1 }))
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
    const labels: Record<string, string> = {
      estimate: '見積',
      budget: '予算',
      order: '発注',
      progress: '進捗',
      payment: '支払'
    }
    return labels[flowType] || flowType
  }

  const getStepBadgeColor = (stepCount: number) => {
    switch (stepCount) {
      case 1: return 'bg-green-100 text-green-800'
      case 2: return 'bg-blue-100 text-blue-800'
      case 3: return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
                      <Badge className={getStepBadgeColor(flow.steps?.length || 0)}>
                        {flow.steps?.length || 0}段階
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>承認フロー詳細</DialogTitle>
            <DialogDescription>
              {selectedFlow?.name} の詳細情報
            </DialogDescription>
          </DialogHeader>
          
          {selectedFlow && (
            <div className="space-y-4">
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
              
              {selectedFlow.steps && selectedFlow.steps.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">承認ステップ</label>
                  <div className="mt-2 space-y-2">
                    {selectedFlow.steps.map((step) => (
                      <div key={step.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Badge variant="outline">{step.step_order}</Badge>
                        <span className="text-sm font-medium">{step.name}</span>
                        <span className="text-sm text-gray-500">
                          → {step.approver_system_level?.display_name || step.approver_id}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedFlow.conditions && selectedFlow.conditions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">適用条件</label>
                  <div className="mt-2 space-y-1">
                    {selectedFlow.conditions.map((condition) => (
                      <div key={condition.id} className="text-sm text-gray-600">
                        {condition.field_name} {condition.operator} {String(condition.value)}
                      </div>
                    ))}
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
                      <Badge variant="outline">ステップ {step.step_order}</Badge>
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
                          value={step.approver_id}
                          onChange={(e) => updateStep(index, 'approver_id', e.target.value)}
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
