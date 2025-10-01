'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Building, Save, X } from 'lucide-react'
import { useDepartments, departmentKeys } from '@/hooks/features/permission/useDepartments'
import { departmentService } from '@/services/features/permission/permissionService'
import { useQueryClient } from '@tanstack/react-query'
import type { Department } from '@/services/features/permission/permissionService'
import { toast } from 'sonner'
import BusinessCodePermissionManager from './BusinessCodePermissionManager'

// 型定義はAPIサービスからインポート

export default function DepartmentPermissionManagement() {
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true
  })

  const queryClient = useQueryClient()

  const { data: departmentsResponse, isLoading: departmentsLoading } = useDepartments()

  const departments = Array.isArray(departmentsResponse)
    ? departmentsResponse
    : Array.isArray(departmentsResponse?.data)
      ? departmentsResponse.data
      : []

  const loading = departmentsLoading

  // 部署選択時の処理
  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department)
  }

  const handleCreateDepartment = async () => {
    if (!newDepartment.name || !newDepartment.code) {
      toast.error('部署名とコードは必須です')
      return
    }

    try {
      setSaving(true)
      await departmentService.createDepartment(newDepartment)
      toast.success('部署が正常に作成されました')
      setShowCreateForm(false)
      setNewDepartment({
        name: '',
        code: '',
        description: '',
        is_active: true
      })
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() })
    } catch (error) {
      console.error('部署の作成に失敗しました:', error)
      toast.error('部署の作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setNewDepartment({
      name: '',
      code: '',
      description: '',
      is_active: true
    })
  }

  // 編集機能
  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    setShowEditForm(true)
  }

  // 削除機能
  const handleDeleteDepartment = async (department: Department) => {
    if ((department.permissions_count ?? 0) > 0) {
      const confirmed = window.confirm(
        `「${department.name}」には ${department.permissions_count ?? 0} 個の権限が設定されています。\n` +
        '削除すると、この部署は無効化されますが、既存の権限設定は保持されます。\n' +
        '本当に削除しますか？'
      )
      if (!confirmed) return
    }

    try {
      setSaving(true)
      await departmentService.deleteDepartment(department.id)
      toast.success('部署が正常に削除されました')
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() })
    } catch (error) {
      console.error('部署の削除に失敗しました:', error)
      toast.error('部署の削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateDepartment = async () => {
    if (!editingDepartment) return
    if (!editingDepartment.name || !editingDepartment.code) {
      toast.error('部署名とコードは必須です')
      return
    }

    try {
      setSaving(true)
      await departmentService.updateDepartment(editingDepartment.id, editingDepartment)
      toast.success('部署が正常に更新されました')
      setShowEditForm(false)
      setEditingDepartment(null)
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() })
    } catch (error) {
      console.error('部署の更新に失敗しました:', error)
      toast.error('部署の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setShowEditForm(false)
    setEditingDepartment(null)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">部署管理</h2>
          <p className="text-muted-foreground">
            部署の管理と権限付与を行います
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新規部署作成
        </Button>
      </div>

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">新規部署作成</CardTitle>
            <CardDescription>
              新しい部署を作成します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department-name">部署名 *</Label>
                  <Input
                    id="department-name"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: 営業部"
                  />
                </div>
                <div>
                  <Label htmlFor="department-code">コード *</Label>
                  <Input
                    id="department-code"
                    value={newDepartment.code}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="例: SALES"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="department-description">説明</Label>
                <Textarea
                  id="department-description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="部署の説明を入力してください"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="department-active"
                  checked={newDepartment.is_active}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="department-active">アクティブ</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateDepartment} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '作成中...' : '作成'}
                </Button>
                <Button variant="outline" onClick={handleCancelCreate} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  キャンセル
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 編集フォーム */}
      {showEditForm && editingDepartment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">部署編集</CardTitle>
            <CardDescription>
              {editingDepartment.name} を編集します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-department-name">部署名 *</Label>
                  <Input
                    id="edit-department-name"
                    value={editingDepartment.name}
                    onChange={(e) => setEditingDepartment(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    placeholder="例: 営業部"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-department-code">コード *</Label>
                  <Input
                    id="edit-department-code"
                    value={editingDepartment.code}
                    onChange={(e) => setEditingDepartment(prev => prev ? ({ ...prev, code: e.target.value }) : null)}
                    placeholder="例: SALES"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-department-description">説明</Label>
                <Textarea
                  id="edit-department-description"
                  value={editingDepartment.description}
                  onChange={(e) => setEditingDepartment(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  placeholder="部署の説明を入力してください"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-department-active"
                  checked={editingDepartment.is_active}
                  onChange={(e) => setEditingDepartment(prev => prev ? ({ ...prev, is_active: e.target.checked }) : null)}
                />
                <Label htmlFor="edit-department-active">アクティブ</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateDepartment} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '更新中...' : '更新'}
                </Button>
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  キャンセル
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 部署一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              部署一覧
            </CardTitle>
            <CardDescription>
              部署の一覧と管理
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">データを読み込み中...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>部署名</TableHead>
                    <TableHead>コード</TableHead>
                    <TableHead>権限数</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department: Department) => (
                    <TableRow 
                      key={department.id}
                      className={selectedDepartment?.id === department.id ? "bg-muted/50" : ""}
                      onClick={() => handleDepartmentSelect(department)}
                    >
                      <TableCell>{department.name}</TableCell>
                      <TableCell className="font-mono text-sm">{department.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{department.permissions_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={department.is_active ? "default" : "secondary"}>
                          {department.is_active ? "有効" : "無効"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditDepartment(department)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDepartment(department)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 権限付与 */}
        {selectedDepartment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">権限付与</CardTitle>
              <CardDescription>
                選択された部署: {selectedDepartment.name} ({selectedDepartment.code})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessCodePermissionManager
                key={selectedDepartment.id}
                entityType="department"
                entityId={selectedDepartment.id}
                entityName={selectedDepartment.name}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}