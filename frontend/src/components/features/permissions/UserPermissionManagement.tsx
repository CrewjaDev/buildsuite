'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, User as UserIcon, Check, X, Search } from 'lucide-react'
import { useUsers, useUser, userKeys } from '@/hooks/features/permission/useUsers'
import { usePermissions } from '@/hooks/features/permission/usePermissions'
import { userService } from '@/services/features/permission/permissionService'
import { useQueryClient } from '@tanstack/react-query'
import type { User, Permission } from '@/services/features/permission/permissionService'

// Type definition for department
interface Department {
  id: number
  name: string
}
import { toast } from 'sonner'

// 型定義はAPIサービスからインポート

export default function UserPermissionManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [selectedPermissionForAssignment, setSelectedPermissionForAssignment] = useState<Permission | null>(null)
  const [selectedPermissionsForAssignment, setSelectedPermissionsForAssignment] = useState<number[]>([])
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const queryClient = useQueryClient()

  const { data: usersResponse, isLoading: usersLoading } = useUsers({ search: searchTerm, per_page: 50 })
  const { data: permissionsResponse, isLoading: permissionsLoading } = usePermissions({ per_page: 1000 })
  const { data: selectedUserDetail } = useUser(selectedUser?.id || 0)

  const users = usersResponse?.users || []
  const permissions = Array.isArray(permissionsResponse) ? permissionsResponse : []

  const loading = usersLoading || permissionsLoading

  // デバッグ用ログ
  console.log('UserPermissionManagement - usersResponse:', usersResponse)
  console.log('UserPermissionManagement - users:', users)
  console.log('UserPermissionManagement - usersLoading:', usersLoading)

  const userPermissionsMap = useMemo(() => {
    const map: Record<number, number[]> = {}
    if (selectedUserDetail?.permissions) {
      map[selectedUserDetail.id] = selectedUserDetail.permissions.map((p: Permission) => p.id)
    }
    return map
  }, [selectedUserDetail])

  // ユーザー選択時の処理
  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
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
    if (selectedUserDetail?.permissions) {
      const existingPermissions = selectedUserDetail.permissions.map((p: Permission) => p.id)
      setSelectedPermissions(existingPermissions)
    }
  }, [selectedUserDetail])

  const handleSavePermissions = async () => {
    if (!selectedUser) return

    try {
      setSaving(true)
      const existingPermissions = userPermissionsMap[selectedUser.id] || []
      const permissionsToAdd = selectedPermissions.filter(id => !existingPermissions.includes(id))
      const permissionsToRemove = existingPermissions.filter(id => !selectedPermissions.includes(id))

      if (permissionsToAdd.length > 0) {
        await userService.addPermissions(selectedUser.id, permissionsToAdd)
      }
      if (permissionsToRemove.length > 0) {
        await userService.removePermissions(selectedUser.id, permissionsToRemove)
      }

      toast.success('権限が正常に保存されました')
      if (selectedUser) {
        queryClient.invalidateQueries({ queryKey: userKeys.detail(selectedUser.id) })
        queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      }
    } catch (error) {
      console.error('権限の保存に失敗しました:', error)
      toast.error('権限の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 変更があるかどうかを判定
  const hasChanges = useMemo(() => {
    if (!selectedUser) return false
    
    const existingPermissions = userPermissionsMap[selectedUser.id] || []
    const currentPermissions = selectedPermissions
    
    // 配列の長さが異なる場合は変更あり
    if (existingPermissions.length !== currentPermissions.length) {
      return true
    }
    
    // 配列の内容が異なる場合は変更あり
    const sortedExisting = [...existingPermissions].sort()
    const sortedCurrent = [...currentPermissions].sort()
    
    return !sortedExisting.every((id, index) => id === sortedCurrent[index])
  }, [selectedUser, selectedPermissions, userPermissionsMap])

  const filteredUsers = users.filter((user: User) =>
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    ((user.departments?.map((d: Department) => d.name).join('、') || '').toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ユーザー権限管理</h2>
          <p className="text-muted-foreground">
            社員管理で登録済みのユーザーに個別権限を付与します
          </p>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ユーザー一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              ユーザー一覧
            </CardTitle>
            <CardDescription>
              社員管理で登録済みのユーザー一覧
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="ユーザー名、メール、部署で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">データを読み込み中...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ユーザー名</TableHead>
                    <TableHead>部署</TableHead>
                    <TableHead>職位</TableHead>
                    <TableHead>個別権限数</TableHead>
                    <TableHead>ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => (
                    <TableRow 
                      key={user.id}
                      className={selectedUser?.id === user.id ? "bg-muted/50" : ""}
                      onClick={() => handleUserSelect(user)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                    <TableCell>{user.departments?.map((d: Department) => d.name).join('、') || '-'}</TableCell>
                    <TableCell>{user.position?.display_name || user.position?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{(userPermissionsMap[user.id]?.length) ?? 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 権限付与 */}
        {selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">個別権限付与</CardTitle>
              <CardDescription>
                選択されたユーザー: {selectedUser.name} ({selectedUser.email})
                <br />
                <span className="text-sm text-muted-foreground">
                  このユーザーにのみ付与される特別な権限を設定します
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {(selectedUser.departments?.map((d: Department) => d.name).join('、') || '-')} / {(selectedUser.position?.display_name || selectedUser.position?.name || '-')}
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
                  <h4 className="font-medium">付与予定の個別権限</h4>
                  <div className="text-xs text-muted-foreground mb-2">
                    部署・職位・役割で付与される権限とは別に、このユーザーにのみ付与される権限です
                  </div>
                  {selectedPermissions.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded">
                      権限が選択されていません
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedPermissions.map((permissionId) => {
                        const permission = permissions.find(p => p.id === permissionId)
                        if (!permission) return null
                        const isExistingPermission = userPermissionsMap[selectedUser.id]?.includes(permissionId) || false
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