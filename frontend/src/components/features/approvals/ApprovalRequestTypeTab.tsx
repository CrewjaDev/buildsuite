'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, FileText, DollarSign, ShoppingCart, Receipt, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { approvalRequestTypeService } from '@/services/features/approvals/approvalRequestTypes'
import type { ApprovalRequestType, CreateApprovalRequestTypeRequest } from '@/types/features/approvals/approvalRequestTypes'

const iconMap = {
  FileText,
  DollarSign,
  ShoppingCart,
  Receipt,
  Calendar,
}

const colorMap = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
  purple: 'bg-purple-100 text-purple-600',
  pink: 'bg-pink-100 text-pink-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  gray: 'bg-gray-100 text-gray-600',
}

export default function ApprovalRequestTypeTab() {
  const [requestTypes, setRequestTypes] = useState<ApprovalRequestType[]>([])
  const [approvalFlows, setApprovalFlows] = useState<Array<{ id: number; name: string; flow_type: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<ApprovalRequestType | null>(null)
  const [formData, setFormData] = useState<CreateApprovalRequestTypeRequest>({
    code: '',
    name: '',
    description: '',
    icon: 'FileText',
    color: 'blue',
    default_approval_flow_id: undefined,
    is_active: true,
    sort_order: 0,
  })
  const { addToast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [requestTypesData, approvalFlowsData] = await Promise.all([
        approvalRequestTypeService.getApprovalRequestTypes(),
        approvalRequestTypeService.getApprovalFlows(),
      ])
      setRequestTypes(requestTypesData)
      setApprovalFlows(approvalFlowsData)
    } catch (error) {
      console.error('データの取得に失敗しました:', error)
      addToast({
        type: 'error',
        title: 'データの取得に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  // データ取得
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // フォームリセット
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      icon: 'FileText',
      color: 'blue',
      default_approval_flow_id: undefined,
      is_active: true,
      sort_order: 0,
    })
  }

  // 作成処理
  const handleCreate = async () => {
    try {
      await approvalRequestTypeService.createApprovalRequestType(formData)
      addToast({
        type: 'success',
        title: '承認依頼タイプを作成しました',
        description: `${formData.name} が正常に作成されました`,
        duration: 4000,
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('承認依頼タイプの作成に失敗しました:', error)
      addToast({
        type: 'error',
        title: '承認依頼タイプの作成に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000,
      })
    }
  }

  // 編集開始
  const handleEdit = (type: ApprovalRequestType) => {
    setSelectedType(type)
    setFormData({
      code: type.code,
      name: type.name,
      description: type.description || '',
      icon: type.icon || 'FileText',
      color: type.color || 'blue',
      default_approval_flow_id: type.default_approval_flow_id,
      is_active: type.is_active,
      sort_order: type.sort_order,
    })
    setIsEditDialogOpen(true)
  }

  // 更新処理
  const handleUpdate = async () => {
    if (!selectedType) return

    try {
      await approvalRequestTypeService.updateApprovalRequestType(selectedType.id, formData)
      addToast({
        type: 'success',
        title: '承認依頼タイプを更新しました',
        description: `${formData.name} が正常に更新されました`,
        duration: 4000,
      })
      setIsEditDialogOpen(false)
      setSelectedType(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('承認依頼タイプの更新に失敗しました:', error)
      addToast({
        type: 'error',
        title: '承認依頼タイプの更新に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000,
      })
    }
  }

  // 削除処理
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`承認依頼タイプ「${name}」を削除しますか？`)) return

    try {
      await approvalRequestTypeService.deleteApprovalRequestType(id)
      addToast({
        type: 'success',
        title: '承認依頼タイプを削除しました',
        description: `${name} が正常に削除されました`,
        duration: 4000,
      })
      fetchData()
    } catch (error) {
      console.error('承認依頼タイプの削除に失敗しました:', error)
      addToast({
        type: 'error',
        title: '承認依頼タイプの削除に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000,
      })
    }
  }

  // アイコンコンポーネント取得
  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || FileText
    return IconComponent
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">承認依頼タイプ管理</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              新規タイプ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>承認依頼タイプの作成</DialogTitle>
              <DialogDescription>
                新しい承認依頼タイプを作成します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">タイプコード *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="estimate"
                  />
                </div>
                <div>
                  <Label htmlFor="name">タイプ名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="見積承認"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="見積書の承認依頼"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">アイコン</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FileText">FileText</SelectItem>
                      <SelectItem value="DollarSign">DollarSign</SelectItem>
                      <SelectItem value="ShoppingCart">ShoppingCart</SelectItem>
                      <SelectItem value="Receipt">Receipt</SelectItem>
                      <SelectItem value="Calendar">Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="color">色</Label>
                  <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="pink">Pink</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="gray">Gray</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="default_approval_flow">デフォルト承認フロー</Label>
                <Select 
                  value={formData.default_approval_flow_id?.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, default_approval_flow_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="承認フローを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvalFlows.map(flow => (
                      <SelectItem key={flow.id} value={flow.id.toString()}>
                        {flow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sort_order">並び順</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">有効</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreate}>
                  作成
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {Array.isArray(requestTypes) && requestTypes.length > 0 ? requestTypes.map(type => {
          const IconComponent = getIconComponent(type.icon || 'FileText')
          const colorClass = colorMap[type.color as keyof typeof colorMap] || colorMap.blue

          return (
            <Card key={type.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${colorClass}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{type.name}</h3>
                      <p className="text-gray-600">{type.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline">コード: {type.code}</Badge>
                        <Badge variant={type.is_active ? "default" : "secondary"}>
                          {type.is_active ? "有効" : "無効"}
                        </Badge>
                        {type.default_approval_flow && (
                          <Badge variant="outline">
                            デフォルト: {typeof type.default_approval_flow === 'string' ? type.default_approval_flow : type.default_approval_flow?.name || '未設定'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(type)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(type.id, type.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        }) : (
          <div className="text-center py-8 text-gray-500">
            承認依頼タイプが登録されていません
          </div>
        )}
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>承認依頼タイプの編集</DialogTitle>
            <DialogDescription>
              承認依頼タイプの情報を編集します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_code">タイプコード *</Label>
                <Input
                  id="edit_code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_name">タイプ名 *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_description">説明</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_icon">アイコン</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FileText">FileText</SelectItem>
                    <SelectItem value="DollarSign">DollarSign</SelectItem>
                    <SelectItem value="ShoppingCart">ShoppingCart</SelectItem>
                    <SelectItem value="Receipt">Receipt</SelectItem>
                    <SelectItem value="Calendar">Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_color">色</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="pink">Pink</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="gray">Gray</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit_default_approval_flow">デフォルト承認フロー</Label>
              <Select 
                value={formData.default_approval_flow_id?.toString()} 
                onValueChange={(value) => setFormData({ ...formData, default_approval_flow_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="承認フローを選択" />
                </SelectTrigger>
                <SelectContent>
                  {approvalFlows.map(flow => (
                    <SelectItem key={flow.id} value={flow.id.toString()}>
                      {flow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_sort_order">並び順</Label>
                <Input
                  id="edit_sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit_is_active">有効</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleUpdate}>
                更新
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
