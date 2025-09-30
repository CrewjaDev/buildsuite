'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Shield, Check, X, Save } from 'lucide-react'
import { systemLevelService } from '@/services/features/permission/permissionService'
import type { SystemLevel, Permission } from '@/services/features/permission/permissionService'
import { useSystemLevels, useSystemLevel, systemLevelKeys } from '@/hooks/features/permission/useSystemLevels'
import { usePermissions } from '@/hooks/features/permission/usePermissions'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// 型定義はAPIサービスからインポート

export default function SystemLevelManagement() {
  const [selectedSystemLevel, setSelectedSystemLevel] = useState<SystemLevel | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [selectedPermissionForAssignment, setSelectedPermissionForAssignment] = useState<Permission | null>(null)
  const [selectedPermissionsForAssignment, setSelectedPermissionsForAssignment] = useState<number[]>([])
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingSystemLevel, setEditingSystemLevel] = useState<SystemLevel | null>(null)
  const [newSystemLevel, setNewSystemLevel] = useState({
    code: '',
    name: '',
    display_name: '',
    description: '',
    priority: 1,
    is_active: true,
    is_system: false
  })
  
  const queryClient = useQueryClient()

  // TanStack Queryを使用してデータを取得
  const { data: systemLevelsResponse, isLoading: systemLevelsLoading, error: systemLevelsError } = useSystemLevels()
  const { data: permissionsResponse, isLoading: permissionsLoading, error: permissionsError } = usePermissions({ per_page: 1000 })
  
  // 選択されたシステム権限レベルの詳細情報を取得
  const { data: selectedSystemLevelDetail } = useSystemLevel(selectedSystemLevel?.id || 0)

  // データを配列として確実に取得
  const systemLevels = Array.isArray(systemLevelsResponse) 
    ? systemLevelsResponse 
    : Array.isArray(systemLevelsResponse?.data) 
      ? systemLevelsResponse.data 
      : []
  const permissions = Array.isArray(permissionsResponse) ? permissionsResponse : []


  const loading = systemLevelsLoading || permissionsLoading

  // システム権限レベルごとの既存権限データ（useMemoで最適化）
  const systemLevelPermissionsMap = useMemo(() => {
    const map: Record<number, number[]> = {}
    
    // 選択されたシステム権限レベルの既存権限を取得
    if (selectedSystemLevelDetail?.permissions) {
      map[selectedSystemLevelDetail.id] = selectedSystemLevelDetail.permissions.map((p: Permission) => p.id)
    }
    
    return map
  }, [selectedSystemLevelDetail])

  // システム権限レベル選択時の処理
  const handleSystemLevelSelect = (systemLevel: SystemLevel) => {
    setSelectedSystemLevel(systemLevel)
    // 権限選択をリセット
    setSelectedPermissionForAssignment(null)
    // 既存権限はuseEffectで設定
  }

  // 選択されたシステム権限レベルの詳細情報が取得できたら、既存権限を設定
  useEffect(() => {
    if (selectedSystemLevelDetail?.permissions) {
      const existingPermissions = selectedSystemLevelDetail.permissions.map((p: Permission) => p.id)
      setSelectedPermissions(existingPermissions)
    }
  }, [selectedSystemLevelDetail])

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

  // 変更があるかどうかを判定
  const hasChanges = useMemo(() => {
    if (!selectedSystemLevel) return false
    
    const existingPermissions = systemLevelPermissionsMap[selectedSystemLevel.id] || []
    const currentPermissions = selectedPermissions
    
    // 配列の長さが異なる場合は変更あり
    if (existingPermissions.length !== currentPermissions.length) {
      return true
    }
    
    // 配列の内容が異なる場合は変更あり
    const sortedExisting = [...existingPermissions].sort()
    const sortedCurrent = [...currentPermissions].sort()
    
    return !sortedExisting.every((id, index) => id === sortedCurrent[index])
  }, [selectedSystemLevel, selectedPermissions, systemLevelPermissionsMap])

  const handleSavePermissions = async () => {
    if (!selectedSystemLevel) return

    try {
      setSaving(true)
      
      // 既存の権限を取得
      const existingPermissions = systemLevelPermissionsMap[selectedSystemLevel.id] || []
      
      // 追加する権限
      const permissionsToAdd = selectedPermissions.filter(id => !existingPermissions.includes(id))
      // 削除する権限
      const permissionsToRemove = existingPermissions.filter(id => !selectedPermissions.includes(id))

      // 権限の追加
      if (permissionsToAdd.length > 0) {
        await systemLevelService.addPermissions(selectedSystemLevel.id, permissionsToAdd)
      }

      // 権限の削除
      if (permissionsToRemove.length > 0) {
        await systemLevelService.removePermissions(selectedSystemLevel.id, permissionsToRemove)
      }

      toast.success('権限が正常に保存されました')
      
      // クエリを無効化して再取得
      if (selectedSystemLevel) {
        queryClient.invalidateQueries({ queryKey: systemLevelKeys.detail(selectedSystemLevel.id) })
        queryClient.invalidateQueries({ queryKey: systemLevelKeys.lists() })
      }
      
    } catch (error) {
      console.error('権限の保存に失敗しました:', error)
      toast.error('権限の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateSystemLevel = async () => {
    if (!newSystemLevel.code || !newSystemLevel.name || !newSystemLevel.display_name) {
      toast.error('コード、システム権限レベル名、表示名は必須です')
      return
    }

    try {
      setSaving(true)
      await systemLevelService.createSystemLevel(newSystemLevel)
      toast.success('システム権限レベルが正常に作成されました')
      setShowCreateForm(false)
      setNewSystemLevel({
        code: '',
        name: '',
        display_name: '',
        description: '',
        priority: 1,
        is_active: true,
        is_system: false
      })
      queryClient.invalidateQueries({ queryKey: systemLevelKeys.lists() })
    } catch (error) {
      console.error('システム権限レベルの作成に失敗しました:', error)
      toast.error('システム権限レベルの作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setNewSystemLevel({
      code: '',
      name: '',
      display_name: '',
      description: '',
      priority: 1,
      is_active: true,
      is_system: false
    })
  }

  // 編集機能
  const handleEditSystemLevel = (systemLevel: SystemLevel) => {
    setEditingSystemLevel(systemLevel)
    setShowEditForm(true)
  }

  // 削除機能
  const handleDeleteSystemLevel = async (systemLevel: SystemLevel) => {
    // 削除制約チェック
    if (systemLevel.is_system) {
      toast.error('システム固定の権限レベルは削除できません')
      return
    }

    if ((systemLevel.permissions_count ?? 0) > 0) {
      const confirmed = window.confirm(
        `「${systemLevel.display_name}」には ${systemLevel.permissions_count ?? 0} 個の権限が設定されています。\n` +
        '削除すると、この権限レベルは無効化されますが、既存の権限設定は保持されます。\n' +
        '本当に削除しますか？'
      )
      if (!confirmed) return
    }

    try {
      setSaving(true)
      await systemLevelService.deleteSystemLevel(systemLevel.id)
      toast.success('システム権限レベルが正常に削除されました')
      queryClient.invalidateQueries({ queryKey: systemLevelKeys.lists() })
    } catch (error) {
      console.error('システム権限レベルの削除に失敗しました:', error)
      toast.error('システム権限レベルの削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSystemLevel = async () => {
    if (!editingSystemLevel) return
    if (!editingSystemLevel.code || !editingSystemLevel.name || !editingSystemLevel.display_name) {
      toast.error('コード、システム権限レベル名、表示名は必須です')
      return
    }

    try {
      setSaving(true)
      await systemLevelService.updateSystemLevel(editingSystemLevel.id, editingSystemLevel)
      toast.success('システム権限レベルが正常に更新されました')
      setShowEditForm(false)
      setEditingSystemLevel(null)
      queryClient.invalidateQueries({ queryKey: systemLevelKeys.lists() })
    } catch (error) {
      console.error('システム権限レベルの更新に失敗しました:', error)
      toast.error('システム権限レベルの更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }


  const handleCancelEdit = () => {
    setShowEditForm(false)
    setEditingSystemLevel(null)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">システム権限レベル管理</h2>
          <p className="text-muted-foreground">
            システム権限レベルの管理と権限付与を行います
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新規システム権限レベル作成
        </Button>
      </div>

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">新規システム権限レベル作成</CardTitle>
            <CardDescription>
              新しいシステム権限レベルを作成します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="system-level-code">コード *</Label>
                  <Input
                    id="system-level-code"
                    value={newSystemLevel.code}
                    onChange={(e) => setNewSystemLevel(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="例: SYS_MGR"
                  />
                </div>
                <div>
                  <Label htmlFor="system-level-name">システム権限レベル名 *</Label>
                  <Input
                    id="system-level-name"
                    value={newSystemLevel.name}
                    onChange={(e) => setNewSystemLevel(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: senior_manager"
                  />
                </div>
                <div>
                  <Label htmlFor="system-level-display-name">表示名 *</Label>
                  <Input
                    id="system-level-display-name"
                    value={newSystemLevel.display_name}
                    onChange={(e) => setNewSystemLevel(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="例: シニアマネージャー"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="system-level-priority">優先度</Label>
                  <Input
                    id="system-level-priority"
                    type="number"
                    min="1"
                    max="100"
                    value={newSystemLevel.priority}
                    onChange={(e) => setNewSystemLevel(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                  />
                </div>
                <div className="flex items-center space-x-4 pt-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="system-level-active"
                      checked={newSystemLevel.is_active}
                      onChange={(e) => setNewSystemLevel(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    <Label htmlFor="system-level-active">アクティブ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="system-level-system"
                      checked={newSystemLevel.is_system}
                      onChange={(e) => setNewSystemLevel(prev => ({ ...prev, is_system: e.target.checked }))}
                    />
                    <Label htmlFor="system-level-system">システム固定</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="system-level-description">説明</Label>
                <Textarea
                  id="system-level-description"
                  value={newSystemLevel.description}
                  onChange={(e) => setNewSystemLevel(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="システム権限レベルの説明を入力してください"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateSystemLevel} disabled={saving}>
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
      {showEditForm && editingSystemLevel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">システム権限レベル編集</CardTitle>
            <CardDescription>
              {editingSystemLevel.display_name} を編集します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-system-level-code">コード *</Label>
                  <Input
                    id="edit-system-level-code"
                    value={editingSystemLevel.code}
                    onChange={(e) => setEditingSystemLevel(prev => prev ? ({ ...prev, code: e.target.value }) : null)}
                    placeholder="例: SYS_MGR"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-system-level-name">システム権限レベル名 *</Label>
                  <Input
                    id="edit-system-level-name"
                    value={editingSystemLevel.name}
                    onChange={(e) => setEditingSystemLevel(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    placeholder="例: senior_manager"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-system-level-display-name">表示名 *</Label>
                  <Input
                    id="edit-system-level-display-name"
                    value={editingSystemLevel.display_name}
                    onChange={(e) => setEditingSystemLevel(prev => prev ? ({ ...prev, display_name: e.target.value }) : null)}
                    placeholder="例: シニアマネージャー"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-system-level-priority">優先度</Label>
                  <Input
                    id="edit-system-level-priority"
                    type="number"
                    min="1"
                    max="100"
                    value={editingSystemLevel.priority}
                    onChange={(e) => setEditingSystemLevel(prev => prev ? ({ ...prev, priority: parseInt(e.target.value) || 1 }) : null)}
                    placeholder="1"
                  />
                </div>
                <div className="flex items-center space-x-4 pt-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-system-level-active"
                      checked={editingSystemLevel.is_active}
                      onChange={(e) => setEditingSystemLevel(prev => prev ? ({ ...prev, is_active: e.target.checked }) : null)}
                    />
                    <Label htmlFor="edit-system-level-active">アクティブ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-system-level-system"
                      checked={editingSystemLevel.is_system}
                      onChange={(e) => setEditingSystemLevel(prev => prev ? ({ ...prev, is_system: e.target.checked }) : null)}
                      disabled={editingSystemLevel.is_system}
                    />
                    <Label htmlFor="edit-system-level-system">システム固定</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-system-level-description">説明</Label>
                <Textarea
                  id="edit-system-level-description"
                  value={editingSystemLevel.description}
                  onChange={(e) => setEditingSystemLevel(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  placeholder="システム権限レベルの説明を入力してください"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateSystemLevel} disabled={saving}>
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
        {/* システム権限レベル一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              システム権限レベル一覧
            </CardTitle>
            <CardDescription>
              システム権限レベルの一覧と管理
            </CardDescription>
          </CardHeader>
          <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">データを読み込み中...</div>
          </div>
        ) : systemLevelsError || permissionsError ? (
          <div className="text-center py-8">
            <div className="text-destructive">データの読み込みに失敗しました</div>
          </div>
        ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>システム権限レベル</TableHead>
                    <TableHead>表示名</TableHead>
                    <TableHead>権限数</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemLevels.map((level: SystemLevel) => (
                  <TableRow 
                    key={level.id}
                    className={selectedSystemLevel?.id === level.id ? "bg-muted/50" : ""}
                    onClick={() => handleSystemLevelSelect(level)}
                  >
                    <TableCell className="font-mono text-sm">{level.name}</TableCell>
                    <TableCell>{level.display_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{level.permissions_count}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={level.is_active ? "default" : "secondary"}>
                        {level.is_active ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditSystemLevel(level)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSystemLevel(level)
                          }}
                          disabled={level.is_system}
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
        {selectedSystemLevel && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">権限付与</CardTitle>
              <CardDescription>
                選択されたシステム権限レベル: {selectedSystemLevel.display_name} ({selectedSystemLevel.name})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {selectedSystemLevel.description}
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
                        const isExistingPermission = systemLevelPermissionsMap[selectedSystemLevel.id]?.includes(permissionId) || false
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
