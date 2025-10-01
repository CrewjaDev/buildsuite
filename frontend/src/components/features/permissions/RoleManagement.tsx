'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Users, Save, X } from 'lucide-react'
import { useRoles, roleKeys } from '@/hooks/features/permission/useRoles'
import { roleService } from '@/services/features/permission/permissionService'
import { useQueryClient } from '@tanstack/react-query'
import type { Role } from '@/services/features/permission/permissionService'
import { toast } from 'sonner'
import BusinessCodePermissionManager from './BusinessCodePermissionManager'
import { useAppDispatch } from '@/lib/hooks'
import { updatePermissions } from '@/store/authSlice'
import { authService } from '@/lib/authService'

// 型定義はAPIサービスからインポート

export default function RoleManagement() {
  const dispatch = useAppDispatch()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [newRole, setNewRole] = useState({
    name: '',
    display_name: '',
    description: '',
    priority: 1,
    is_active: true
  })

  const queryClient = useQueryClient()

  // 権限更新のヘルパー関数
  const refreshUserPermissions = async () => {
    try {
      const { effectivePermissions } = await authService.me()
      dispatch(updatePermissions(effectivePermissions))
    } catch (error) {
      console.error('Failed to refresh permissions:', error)
    }
  }

  const { data: rolesResponse, isLoading: rolesLoading } = useRoles()

  const roles = Array.isArray(rolesResponse)
    ? rolesResponse
    : Array.isArray(rolesResponse?.data)
      ? rolesResponse.data
      : []

  const loading = rolesLoading

  // 役割選択時の処理
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
  }

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.display_name) {
      toast.error('役割名と表示名は必須です')
      return
    }

    try {
      setSaving(true)
      await roleService.createRole(newRole)
      toast.success('役割が正常に作成されました')
      setShowCreateForm(false)
      setNewRole({
        name: '',
        display_name: '',
        description: '',
        priority: 1,
        is_active: true
      })
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    } catch (error) {
      console.error('役割の作成に失敗しました:', error)
      toast.error('役割の作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setNewRole({
      name: '',
      display_name: '',
      description: '',
      priority: 1,
      is_active: true
    })
  }

  // 編集機能
  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setShowEditForm(true)
  }

  // 削除機能
  const handleDeleteRole = async (role: Role) => {
    if ((role.permissions_count ?? 0) > 0) {
      const confirmed = window.confirm(
        `「${role.display_name}」には ${role.permissions_count ?? 0} 個の権限が設定されています。\n` +
        '削除すると、この役割は無効化されますが、既存の権限設定は保持されます。\n' +
        '本当に削除しますか？'
      )
      if (!confirmed) return
    }

    try {
      setSaving(true)
      await roleService.deleteRole(role.id)
      toast.success('役割が正常に削除されました')
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    } catch (error) {
      console.error('役割の削除に失敗しました:', error)
      toast.error('役割の削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole) return
    if (!editingRole.name || !editingRole.display_name) {
      toast.error('役割名と表示名は必須です')
      return
    }

    try {
      setSaving(true)
      await roleService.updateRole(editingRole.id, editingRole)
      toast.success('役割が正常に更新されました')
      setShowEditForm(false)
      setEditingRole(null)
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    } catch (error) {
      console.error('役割の更新に失敗しました:', error)
      toast.error('役割の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setShowEditForm(false)
    setEditingRole(null)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">役割管理</h2>
          <p className="text-muted-foreground">
            機能役割の管理と権限付与を行います
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新規役割作成
        </Button>
      </div>

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">新規役割作成</CardTitle>
            <CardDescription>
              新しい役割を作成します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role-name">役割名 *</Label>
                  <Input
                    id="role-name"
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: manager"
                  />
                </div>
                <div>
                  <Label htmlFor="role-display-name">表示名 *</Label>
                  <Input
                    id="role-display-name"
                    value={newRole.display_name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="例: マネージャー"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role-priority">優先度</Label>
                <Input
                  id="role-priority"
                  type="number"
                  min="1"
                  max="100"
                  value={newRole.priority}
                  onChange={(e) => setNewRole(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="role-description">説明</Label>
                <Textarea
                  id="role-description"
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="役割の説明を入力してください"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="role-active"
                  checked={newRole.is_active}
                  onChange={(e) => setNewRole(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="role-active">アクティブ</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateRole} disabled={saving}>
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
      {showEditForm && editingRole && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">役割編集</CardTitle>
            <CardDescription>
              {editingRole.display_name} を編集します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-role-name">役割名 *</Label>
                  <Input
                    id="edit-role-name"
                    value={editingRole.name}
                    onChange={(e) => setEditingRole(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    placeholder="例: manager"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role-display-name">表示名 *</Label>
                  <Input
                    id="edit-role-display-name"
                    value={editingRole.display_name}
                    onChange={(e) => setEditingRole(prev => prev ? ({ ...prev, display_name: e.target.value }) : null)}
                    placeholder="例: マネージャー"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-role-priority">優先度</Label>
                <Input
                  id="edit-role-priority"
                  type="number"
                  min="1"
                  max="100"
                  value={editingRole.priority}
                  onChange={(e) => setEditingRole(prev => prev ? ({ ...prev, priority: parseInt(e.target.value) || 1 }) : null)}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="edit-role-description">説明</Label>
                <Textarea
                  id="edit-role-description"
                  value={editingRole.description}
                  onChange={(e) => setEditingRole(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  placeholder="役割の説明を入力してください"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-role-active"
                  checked={editingRole.is_active}
                  onChange={(e) => setEditingRole(prev => prev ? ({ ...prev, is_active: e.target.checked }) : null)}
                />
                <Label htmlFor="edit-role-active">アクティブ</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateRole} disabled={saving}>
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
        {/* 役割一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              役割一覧
            </CardTitle>
            <CardDescription>
              役割の一覧と管理
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
                    <TableHead>役割名</TableHead>
                    <TableHead>表示名</TableHead>
                    <TableHead>権限数</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role: Role) => (
                    <TableRow 
                      key={role.id}
                      className={selectedRole?.id === role.id ? "bg-muted/50" : ""}
                      onClick={() => handleRoleSelect(role)}
                    >
                      <TableCell className="font-mono text-sm">{role.name}</TableCell>
                      <TableCell>{role.display_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{role.permissions_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.is_active ? "default" : "secondary"}>
                          {role.is_active ? "有効" : "無効"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditRole(role)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRole(role)
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
        {selectedRole && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">権限付与</CardTitle>
              <CardDescription>
                選択された役割: {selectedRole.display_name} ({selectedRole.name})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessCodePermissionManager
                key={selectedRole.id}
                entityType="role"
                entityId={selectedRole.id}
                entityName={selectedRole.display_name}
                onPermissionChange={refreshUserPermissions}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}