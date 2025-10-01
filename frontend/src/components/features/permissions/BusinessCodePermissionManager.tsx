'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Settings, X, Save } from 'lucide-react'
import { businessCodeService } from '@/services/features/business/businessCodeService'
import type { 
  BusinessCodePermissionStatusResponse
} from '@/services/features/business/businessCodeService'
import { toast } from 'sonner'

interface BusinessCodePermissionManagerProps {
  entityType: 'system_level' | 'role' | 'department' | 'position' | 'user'
  entityId: number
  entityName: string
  onPermissionChange?: () => void
}

export default function BusinessCodePermissionManager({
  entityType,
  entityId,
  entityName,
  onPermissionChange
}: BusinessCodePermissionManagerProps) {
  const [selectedBusinessCode, setSelectedBusinessCode] = useState<string | null>(null)
  const [businessCodes, setBusinessCodes] = useState<Array<{code: string, name: string, description: string}>>([])
  const [availableBusinessCodes, setAvailableBusinessCodes] = useState<Array<{code: string, name: string, description: string}>>([])
  const [permissionStatus, setPermissionStatus] = useState<BusinessCodePermissionStatusResponse['data'] | null>(null)
  const [permissionOverrides, setPermissionOverrides] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [businessCodePermissionStatus, setBusinessCodePermissionStatus] = useState<Record<string, boolean>>({})

  // 権限が設定されているビジネスコードを取得
  const fetchAvailableBusinessCodes = useCallback(async (allCodes: Array<{code: string, name: string, description: string}>) => {
    const availableCodes: Array<{code: string, name: string, description: string}> = []
    
    for (const businessCode of allCodes) {
      try {
        const response = await businessCodeService.getBusinessCodePermissionStatus(
          entityType,
          entityId,
          businessCode.code
        )
        
        // 権限が1つでも設定されている場合は追加
        const hasAssignedPermissions = response.data.permission_status.some(permission => permission.is_assigned)
        if (hasAssignedPermissions) {
          availableCodes.push(businessCode)
        }
      } catch (error) {
        // エラーが発生した場合はスキップ
        console.warn(`ビジネスコード ${businessCode.code} の権限照会に失敗:`, error)
      }
    }
    
    setAvailableBusinessCodes(availableCodes)
  }, [entityType, entityId])

  // 設定モードでビジネスコードの権限設定状況をチェック
  const checkBusinessCodePermissionStatus = useCallback(async (allCodes: Array<{code: string, name: string, description: string}>) => {
    const statusMap: Record<string, boolean> = {}
    
    for (const businessCode of allCodes) {
      try {
        const response = await businessCodeService.getBusinessCodePermissionStatus(
          entityType,
          entityId,
          businessCode.code
        )
        
        // 権限が1つでも設定されている場合はtrue
        const hasAssignedPermissions = response.data.permission_status.some(permission => permission.is_assigned)
        statusMap[businessCode.code] = hasAssignedPermissions
      } catch {
        // エラーが発生した場合はfalse
        statusMap[businessCode.code] = false
      }
    }
    
    setBusinessCodePermissionStatus(statusMap)
  }, [entityType, entityId])

  // ビジネスコード一覧を取得
  useEffect(() => {
    // エンティティが変更された時に状態をクリア
    setSelectedBusinessCode(null)
    setPermissionStatus(null)
    setPermissionOverrides({})
    
    const fetchBusinessCodes = async () => {
      try {
        const response = await businessCodeService.getAllBusinessCodes()
        const codes = Object.entries(response).map(([code, info]) => ({
          code,
          name: info.name,
          description: info.description
        }))
        setBusinessCodes(codes)
        
        // 設定モード：すべてのビジネスコードを表示し、権限設定状況をチェック
        setAvailableBusinessCodes(codes)
        await checkBusinessCodePermissionStatus(codes)
      } catch (error) {
        console.error('ビジネスコードの取得に失敗しました:', error)
        toast.error('ビジネスコードの取得に失敗しました')
      }
    }

    fetchBusinessCodes()
  }, [entityType, entityId, fetchAvailableBusinessCodes, checkBusinessCodePermissionStatus])


  // ビジネスコード選択時の処理
  const handleBusinessCodeSelect = async (businessCode: string) => {
    // 以前の状態をクリア
    setSelectedBusinessCode(businessCode)
    setPermissionStatus(null)
    setPermissionOverrides({})
    setLoading(true)
    
    try {
      const response = await businessCodeService.getBusinessCodePermissionStatus(
        entityType,
        entityId,
        businessCode
      )
      
      setPermissionStatus(response.data)
      
      // 現在の権限設定をオーバーライドに反映
      const overrides: Record<number, boolean> = {}
      response.data.permission_status.forEach(permission => {
        overrides[permission.id] = permission.is_assigned
      })
      setPermissionOverrides(overrides)
    } catch (error) {
      console.error('権限照会に失敗しました:', error)
      toast.error('権限照会に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 権限の有効/無効切り替え
  const handlePermissionToggle = (permissionId: number, enabled: boolean) => {
    setPermissionOverrides(prev => ({
      ...prev,
      [permissionId]: enabled
    }))
  }

  // 権限設定の保存
  const handleSavePermissions = async () => {
    if (!selectedBusinessCode || !permissionStatus) return

    setSaving(true)
    try {
      const overrides = Object.entries(permissionOverrides).map(([permissionId, isEnabled]) => ({
        permission_id: parseInt(permissionId),
        is_enabled: isEnabled
      }))

      await businessCodeService.setBusinessCodePermissions(
        entityType,
        entityId,
        selectedBusinessCode,
        { permission_overrides: overrides }
      )

      toast.success('権限が正常に保存されました')
      
      // 状態をクリアしてから再取得
      setSelectedBusinessCode(null)
      setPermissionStatus(null)
      setPermissionOverrides({})
      
      // 権限設定状況を再チェック
      if (businessCodes.length > 0) {
        await checkBusinessCodePermissionStatus(businessCodes)
      }
      
      // 権限変更のコールバックを実行
      if (onPermissionChange) {
        onPermissionChange()
      }
    } catch (error) {
      console.error('権限の保存に失敗しました:', error)
      toast.error('権限の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 変更があるかどうかを判定
  const hasChanges = permissionStatus && Object.entries(permissionOverrides).some(([permissionId, isEnabled]) => {
    const originalPermission = permissionStatus.permission_status.find(p => p.id === parseInt(permissionId))
    return originalPermission && originalPermission.is_assigned !== isEnabled
  })

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h3 className="text-lg font-medium">{entityName} の権限管理</h3>
        <p className="text-sm text-muted-foreground">
          ビジネスコード単位での権限設定
        </p>
      </div>

      {/* ビジネスコード選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            ビジネスコードから権限を設定
          </CardTitle>
          <CardDescription>
            ビジネスコードを選択して、関連する権限を設定します
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableBusinessCodes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                ビジネスコードがありません
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableBusinessCodes.map(businessCode => {
                const isSelected = selectedBusinessCode === businessCode.code
                const hasPermissions = businessCodePermissionStatus[businessCode.code] || false
                
                // 権限が設定されている場合は緑色のスタイルを適用
                const getVariant = () => {
                  if (isSelected) return "default"
                  if (hasPermissions) return "default"
                  return "outline"
                }
                
                const getClassName = () => {
                  let baseClass = "h-auto p-3 flex flex-col items-start"
                  if (hasPermissions && !isSelected) {
                    baseClass += " bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  }
                  return baseClass
                }
                
                return (
                  <Button
                    key={businessCode.code}
                    variant={getVariant()}
                    onClick={() => handleBusinessCodeSelect(businessCode.code)}
                    className={getClassName()}
                  >
                    <div className="font-medium text-sm">{businessCode.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {businessCode.code}
                    </div>
                  </Button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 権限詳細表示 */}
      {selectedBusinessCode && permissionStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              ビジネスコード: {permissionStatus?.business_code_info.name} の権限設定
            </CardTitle>
            <CardDescription>
              {permissionStatus?.business_code_info.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">権限情報を読み込み中...</div>
              </div>
            ) : permissionStatus ? (
              <div className="space-y-4">

                {/* 権限一覧 */}
                <div className="space-y-2">
                  {(() => {
                    const filteredPermissions = permissionStatus.permission_status

                    if (filteredPermissions.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <div className="text-muted-foreground">
                            このビジネスコードに権限がありません
                          </div>
                        </div>
                      )
                    }

                    return filteredPermissions.map(permission => {
                      const isAssigned = permissionOverrides[permission.id] ?? permission.is_assigned
                      
                      return (
                        <div 
                          key={permission.id} 
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            isAssigned 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {permission.display_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {permission.name} ({permission.module})
                            </div>
                          </div>
                          
                          <Switch
                            checked={isAssigned}
                            onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked)}
                          />
                        </div>
                      )
                    })
                  })()}
                </div>

                {/* 保存ボタン */}
                <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={handleSavePermissions} 
                      disabled={!hasChanges || saving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? '保存中...' : '権限を保存'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        // オーバーライドをリセット
                        const overrides: Record<number, boolean> = {}
                        permissionStatus.permission_status.forEach(permission => {
                          overrides[permission.id] = permission.is_assigned
                        })
                        setPermissionOverrides(overrides)
                      }}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      リセット
                    </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground">権限情報がありません</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
