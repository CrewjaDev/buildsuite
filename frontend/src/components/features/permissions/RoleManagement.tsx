'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Users, Check, X, Save } from 'lucide-react'
import { useRoles, useRole, roleKeys } from '@/hooks/features/permission/useRoles'
import { usePermissions } from '@/hooks/features/permission/usePermissions'
import { roleService } from '@/services/features/permission/permissionService'
import { useQueryClient } from '@tanstack/react-query'
import type { Role, Permission } from '@/services/features/permission/permissionService'
import { toast } from 'sonner'

// 型定義はAPIサービスからインポート

export default function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [selectedPermissionForAssignment, setSelectedPermissionForAssignment] = useState<Permission | null>(null)
  const [selectedPermissionsForAssignment, setSelectedPermissionsForAssignment] = useState<number[]>([])
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false)
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

  const { data: rolesResponse, isLoading: rolesLoading } = useRoles()
  const { data: permissionsResponse, isLoading: permissionsLoading } = usePermissions({ per_page: 1000 })
  const { data: selectedRoleDetail } = useRole(selectedRole?.id || 0)

  const roles = Array.isArray(rolesResponse)
    ? rolesResponse
    : Array.isArray(rolesResponse?.data)
      ? rolesResponse.data
      : []
  const permissions = Array.isArray(permissionsResponse) ? permissionsResponse : []

  const loading = rolesLoading || permissionsLoading

  const rolePermissionsMap = useMemo(() => {
    const map: Record<number, number[]> = {}
    if (selectedRoleDetail?.permissions) {
      map[selectedRoleDetail.id] = selectedRoleDetail.permissions.map((p: Permission) => p.id)
    }
    return map
  }, [selectedRoleDetail])

  // 役割選択時の処理
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    setSelectedPermissionForAssignment(null)
  }

  const handleAddPermissionToAssignment = () => {
    if (selectedPermissionForAssignment && !selectedPermissions.includes(selectedPermissionForAssignment.id)) {
      setSelectedPermissions(prev => [...prev, selectedPermissionForAssignment.id])
    }
  }

  const handleAddMultiplePermissionsToAssignment = () => {
    const newPermissions = selectedPermissionsForAssignment.filter(id => !selectedPermissions.includes(id))
    if (newPermissions.length > 0) {
      setSelectedPermissions(prev => [...prev, ...newPermissions])
      setSelectedPermissionsForAssignment([])
      setIsMultiSelectOpen(false)
    }
  }

  const handleRemovePermissionFromAssignment = (permissionId: number) => {
    setSelectedPermissions(prev => prev.filter(id => id !== permissionId))
  }

  useEffect(() => {
    if (selectedRoleDetail?.permissions) {
      const existingPermissions = selectedRoleDetail.permissions.map((p: Permission) => p.id)
      setSelectedPermissions(existingPermissions)
    }
  }, [selectedRoleDetail])

  const handleSavePermissions = async () => {
    if (!selectedRole) return

    try {
      setSaving(true)
      const existing = rolePermissionsMap[selectedRole.id] || []
      const toAdd = selectedPermissions.filter(id => !existing.includes(id))
      const toRemove = existing.filter(id => !selectedPermissions.includes(id))

      if (toAdd.length > 0) await roleService.addPermissions(selectedRole.id, toAdd)
      if (toRemove.length > 0) await roleService.removePermissions(selectedRole.id, toRemove)

      toast.success('権限が正常に保存されました')
      if (selectedRole) {
        queryClient.invalidateQueries({ queryKey: roleKeys.detail(selectedRole.id) })
        queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      }
    } catch (e) {
      console.error('権限の保存に失敗しました:', e)
      toast.error('権限の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 変更があるかどうかを判定
  const hasChanges = useMemo(() => {
    if (!selectedRole) return false
    
    const existingPermissions = rolePermissionsMap[selectedRole.id] || []
    const currentPermissions = selectedPermissions
    
    // 配列の長さが異なる場合は変更あり
    if (existingPermissions.length !== currentPermissions.length) {
      return true
    }
    
    // 配列の内容が異なる場合は変更あり
    const sortedExisting = [...existingPermissions].sort()
    const sortedCurrent = [...currentPermissions].sort()
    
    return !sortedExisting.every((id, index) => id === sortedCurrent[index])
  }, [selectedRole, selectedPermissions, rolePermissionsMap])

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
      setNewRole({ name: '', display_name: '', description: '', priority: 1, is_active: true })
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
    setNewRole({ name: '', display_name: '', description: '', priority: 1, is_active: true })
  }

  // 編集機能
  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setShowEditForm(true)
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
                    placeholder="例: 管理者"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="role-active"
                    checked={newRole.is_active}
                    onChange={(e) => setNewRole(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <Label htmlFor="role-active">アクティブ</Label>
                </div>
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
                    placeholder="例: 管理者"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="edit-role-active"
                    checked={editingRole.is_active}
                    onChange={(e) => setEditingRole(prev => prev ? ({ ...prev, is_active: e.target.checked }) : null)}
                  />
                  <Label htmlFor="edit-role-active">アクティブ</Label>
                </div>
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
              機能役割の一覧と管理
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
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {selectedRole.description}
                </div>
                
                {/* 権限マスタから選択 */}
                <div className="space-y-3">
                  <h4 className="font-medium">権限マスタから選択</h4>
                  
                  {/* 単一選択（従来の方式） */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">単一選択</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedPermissionForAssignment?.id || ''}
                        onChange={(e) => {
                          const permissionId = parseInt(e.target.value)
                          const permission = permissions.find(p => p.id === permissionId)
                          setSelectedPermissionForAssignment(permission || null)
                        }}
                        className="flex-1 px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="">権限を選択してください</option>
                        {permissions.map((permission) => {
                          const isAlreadySelected = selectedPermissions.includes(permission.id)
                          return (
                            <option 
                              key={permission.id} 
                              value={permission.id}
                              disabled={isAlreadySelected}
                              className={isAlreadySelected ? "text-muted-foreground bg-muted" : ""}
                            >
                              {isAlreadySelected ? "✓ " : ""}{permission.display_name} ({permission.name})
                            </option>
                          )
                        })}
                      </select>
                      <Button 
                        onClick={handleAddPermissionToAssignment}
                        disabled={!selectedPermissionForAssignment || selectedPermissions.includes(selectedPermissionForAssignment.id)}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        追加
                      </Button>
                    </div>
                  </div>

                  {/* 複数選択（ドロップダウン形式） */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">複数選択</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsMultiSelectOpen(!isMultiSelectOpen)}
                          className="w-full justify-between"
                        >
                          <span>
                            {selectedPermissionsForAssignment.length === 0 
                              ? "権限を選択してください" 
                              : `${selectedPermissionsForAssignment.length}件の権限を選択中`
                            }
                          </span>
                          <svg
                            className={`h-4 w-4 transition-transform ${isMultiSelectOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </Button>
                        
                        {isMultiSelectOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
                            <div className="p-2">
                              {permissions.map((permission) => {
                                const isAlreadySelected = selectedPermissions.includes(permission.id)
                                const isSelectedForAssignment = selectedPermissionsForAssignment.includes(permission.id)
                                return (
                                  <label key={permission.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isSelectedForAssignment}
                                      disabled={isAlreadySelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedPermissionsForAssignment(prev => [...prev, permission.id])
                                        } else {
                                          setSelectedPermissionsForAssignment(prev => prev.filter(id => id !== permission.id))
                                        }
                                      }}
                                      className="rounded border-input"
                                    />
                                    <span className={`text-sm flex-1 ${isAlreadySelected ? 'text-muted-foreground line-through' : ''}`}>
                                      {isAlreadySelected ? "✓ " : ""}{permission.display_name} ({permission.name})
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={handleAddMultiplePermissionsToAssignment}
                        disabled={selectedPermissionsForAssignment.length === 0}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        追加
                      </Button>
                      <Button 
                        onClick={() => {
                          setSelectedPermissionsForAssignment([])
                          setIsMultiSelectOpen(false)
                        }}
                        disabled={selectedPermissionsForAssignment.length === 0}
                        variant="outline"
                        size="sm"
                      >
                        クリア
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 付与予定の権限一覧 */}
                <div className="space-y-3">
                  <h4 className="font-medium">付与予定の権限</h4>
                  {selectedPermissions.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded">
                      権限が選択されていません
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedPermissions.map((permissionId) => {
                        const permission = permissions.find(p => p.id === permissionId)
                        if (!permission) return null
                        const isExistingPermission = (rolePermissionsMap[selectedRole.id]?.includes(permissionId)) || false
                        return (
                          <div key={permission.id} className={`flex items-center justify-between p-2 border rounded ${isExistingPermission ? 'bg-blue-50 border-blue-200' : 'bg-muted/30'}`}>
                            <div className="flex-1">
                              <div className="text-sm font-medium flex items-center gap-2">
                                {permission.display_name}
                                {isExistingPermission && (
                                  <Badge variant="outline" className="text-xs">
                                    既存
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {permission.name} ({permission.module})
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {permission.module}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemovePermissionFromAssignment(permission.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                        <div className="flex gap-2 pt-4 border-t">
                          <Button 
                            onClick={handleSavePermissions} 
                            disabled={!hasChanges || saving}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {saving ? '保存中...' : '権限を保存'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedPermissions([])}
                            disabled={saving}
                          >
                            <X className="h-4 w-4 mr-2" />
                            クリア
                          </Button>
                        </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}