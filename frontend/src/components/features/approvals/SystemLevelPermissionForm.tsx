'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Search, Shield, CheckCircle, XCircle } from 'lucide-react'
import { systemLevelsApi, SystemLevel, Permission } from '@/services/features/approvals/systemLevels'

interface SystemLevelPermissionFormProps {
  systemLevel: SystemLevel
  permissions: Permission[]
  permissionStatus?: {
    level_name: string
    priority: number
    permissions: {
      id: number
      name: string
      display_name: string
      module: string
      action: string
      resource: string
      is_granted: boolean
    }[]
  }
  onClose: () => void
  onSuccess: () => void
}

export function SystemLevelPermissionForm({ 
  systemLevel, 
  permissions, 
  permissionStatus, 
  onClose, 
  onSuccess 
}: SystemLevelPermissionFormProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // 既存の権限設定を読み込み
    if (permissionStatus) {
      const grantedPermissionIds = permissionStatus.permissions
        .filter(p => p.is_granted)
        .map(p => p.id)
      setSelectedPermissions(grantedPermissionIds)
    }
  }, [permissionStatus])

  const filteredPermissions = permissions.filter(permission =>
    permission.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.action.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId)
      } else {
        return [...prev, permissionId]
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedPermissions(filteredPermissions.map(p => p.id))
  }

  const handleDeselectAll = () => {
    setSelectedPermissions([])
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError('')
      
      await systemLevelsApi.syncPermissions(systemLevel.id, selectedPermissions)
      onSuccess()
    } catch (error: unknown) {
      console.error('権限設定の保存に失敗しました:', error)
      setError((error as { response?: { data?: { error?: string } } })?.response?.data?.error || '保存に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const getPermissionModule = (permission: Permission) => {
    const moduleMap: { [key: string]: string } = {
      'approval': '承認',
      'estimate': '見積',
      'user': 'ユーザー',
      'role': '役割',
      'department': '部署',
      'position': '職位',
      'system_level': 'システム権限レベル'
    }
    return moduleMap[permission.module] || permission.module
  }

  const getPermissionAction = (permission: Permission) => {
    const actionMap: { [key: string]: string } = {
      'view': '閲覧',
      'create': '作成',
      'edit': '編集',
      'delete': '削除',
      'approve': '承認',
      'reject': '却下',
      'return': '差し戻し',
      'request': '依頼',
      'cancel': 'キャンセル'
    }
    return actionMap[permission.action] || permission.action
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {systemLevel.display_name} の権限設定
                </CardTitle>
                <CardDescription>
                  システム権限レベル「{systemLevel.display_name}」に付与する権限を設定します
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 検索・フィルター */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="search">権限検索</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="権限名、モジュール、アクションで検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  すべて選択
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  すべて解除
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>選択済み: {selectedPermissions.length}個</span>
              <span>総数: {filteredPermissions.length}個</span>
            </div>
          </div>

          {/* 権限一覧 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">権限一覧</h3>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {filteredPermissions.map((permission) => {
                const isSelected = selectedPermissions.includes(permission.id)
                const isSystemPermission = permission.is_system

                return (
                  <div
                    key={permission.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{permission.display_name}</span>
                          {isSystemPermission && (
                            <Badge variant="secondary" className="text-xs">
                              システム
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {getPermissionModule(permission)} - {getPermissionAction(permission)}
                          {permission.resource && ` - ${permission.resource}`}
                        </div>
                        {permission.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {permission.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        {isSelected ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ボタン */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
