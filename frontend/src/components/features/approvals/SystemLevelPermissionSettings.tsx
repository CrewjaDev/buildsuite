'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'
import { systemLevelsApi, SystemLevel, Permission, SystemLevelPermissionStatus } from '@/services/features/approvals/systemLevels'
import { SystemLevelPermissionForm } from './SystemLevelPermissionForm'

export function SystemLevelPermissionSettings() {
  const [systemLevels, setSystemLevels] = useState<SystemLevel[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionStatus, setPermissionStatus] = useState<SystemLevelPermissionStatus>({})
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState<SystemLevel | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [levelsData, permissionsData, statusData] = await Promise.all([
        systemLevelsApi.getSystemLevels(),
        systemLevelsApi.getApprovalPermissions(),
        systemLevelsApi.getPermissionStatus()
      ])
      // APIレスポンスの構造に合わせて修正（ページネーション対応）
      const levelsArray = Array.isArray(levelsData) ? levelsData : (levelsData as { data: SystemLevel[] })?.data
      setSystemLevels(Array.isArray(levelsArray) ? levelsArray : [])
      setPermissions(Array.isArray(permissionsData) ? permissionsData : [])
      setPermissionStatus(statusData || {})
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLevelSelect = (level: SystemLevel) => {
    setSelectedLevel(level)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedLevel(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setSelectedLevel(null)
    loadData()
  }

  const getPermissionCount = (levelCode: string) => {
    const levelStatus = permissionStatus[levelCode]
    if (!levelStatus) return 0
    return levelStatus.permissions.filter(p => p.is_granted).length
  }

  const getTotalPermissionCount = () => {
    return permissions.length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">システム権限レベル別権限設定</h2>
          <p className="text-gray-600">各システム権限レベルに付与する権限を管理します</p>
        </div>
        <div className="text-sm text-gray-500">
          総権限数: {getTotalPermissionCount()}個
        </div>
      </div>

      {/* システム権限レベル一覧 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.isArray(systemLevels) && systemLevels.map((level) => {
          const grantedCount = getPermissionCount(level.code)
          const totalCount = getTotalPermissionCount()
          const percentage = totalCount > 0 ? Math.round((grantedCount / totalCount) * 100) : 0

          return (
            <Card 
              key={level.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleLevelSelect(level)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{level.display_name}</CardTitle>
                      <CardDescription>優先度: {level.priority}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={level.is_active ? "default" : "secondary"}>
                    {level.is_active ? "有効" : "無効"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 権限統計 */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">付与済み権限</span>
                    <span className="font-medium">{grantedCount}/{totalCount}</span>
                  </div>
                  
                  {/* 進捗バー */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    {percentage}% の権限が付与されています
                  </div>

                  {/* 権限詳細 */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>承認関連権限</span>
                      <span>{getPermissionCount(level.code)}個</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 権限設定フォーム */}
      {showForm && selectedLevel && (
        <SystemLevelPermissionForm
          systemLevel={selectedLevel}
          permissions={permissions}
          permissionStatus={permissionStatus[selectedLevel.code]}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
