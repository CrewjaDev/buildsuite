'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Save, X, Shield } from 'lucide-react'
import { systemLevelService } from '@/services/features/permission/permissionService'
import type { SystemLevel } from '@/services/features/permission/permissionService'
import { useSystemLevels, systemLevelKeys } from '@/hooks/features/permission/useSystemLevels'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import BusinessCodePermissionManager from './BusinessCodePermissionManager'
import { useAppDispatch } from '@/lib/hooks'
import { updatePermissions } from '@/store/authSlice'
import { authService } from '@/lib/authService'

// 型定義はAPIサービスからインポート

export default function SystemLevelManagement() {
  const dispatch = useAppDispatch()
  const [selectedSystemLevel, setSelectedSystemLevel] = useState<SystemLevel | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingSystemLevel, setEditingSystemLevel] = useState<SystemLevel | null>(null)
  const [saving, setSaving] = useState(false)
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

  // 権限更新のヘルパー関数
  const refreshUserPermissions = async () => {
    try {
      const { effectivePermissions } = await authService.me()
      dispatch(updatePermissions(effectivePermissions))
    } catch (error) {
      console.error('Failed to refresh permissions:', error)
    }
  }

  // TanStack Queryを使用してデータを取得
  const { data: systemLevelsResponse, isLoading: systemLevelsLoading, error: systemLevelsError } = useSystemLevels()
  // データを配列として確実に取得
  const systemLevels = Array.isArray(systemLevelsResponse) 
    ? systemLevelsResponse 
    : Array.isArray(systemLevelsResponse?.data) 
      ? systemLevelsResponse.data 
      : []

  const loading = systemLevelsLoading


  // システム権限レベル選択時の処理
  const handleSystemLevelSelect = (systemLevel: SystemLevel) => {
    setSelectedSystemLevel(systemLevel)
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
        ) : systemLevelsError ? (
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
              <BusinessCodePermissionManager
                key={selectedSystemLevel.id}
                entityType="system_level"
                entityId={selectedSystemLevel.id}
                entityName={selectedSystemLevel.display_name}
                onPermissionChange={refreshUserPermissions}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
