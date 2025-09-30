'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Calculator, Eye, Layers, Shield, Users, Building, Briefcase, User as UserIcon } from 'lucide-react'
import { useUsers, useUser } from '@/hooks/features/permission/useUsers'
import type { User, Permission } from '@/services/features/permission/permissionService'

// Type definitions for better type safety
interface Department {
  id: number
  name: string
  permissions?: Permission[]
}

interface Role {
  id: number
  name: string
  display_name: string
  permissions?: Permission[]
}


// 権限階層表示コンポーネント
export default function PermissionHierarchyView() {
  const [selectedUser, setSelectedUser] = useState('')
  const [viewMode, setViewMode] = useState('hierarchy')

  const { data: usersResponse, isLoading: usersLoading } = useUsers({ per_page: 100 })
  const { data: selectedUserDetail } = useUser(selectedUser ? parseInt(selectedUser) : 0)

  const users = useMemo(() => {
    return Array.isArray(usersResponse)
      ? usersResponse
      : Array.isArray(usersResponse?.data)
        ? usersResponse.data
        : []
  }, [usersResponse])

  const selectedUserData = useMemo(() => {
    if (selectedUserDetail) {
      return selectedUserDetail
    }
    return users.find((user: User) => user.login_id === selectedUser)
  }, [selectedUserDetail, users, selectedUser])

  const loading = usersLoading

  // ユーザーの権限データ（選択されたユーザーから取得）
  const userPermissions = selectedUserData ? {
    systemLevel: selectedUserData.permissions || [],
    roles: selectedUserData.roles || [],
    departments: selectedUserData.departments?.flatMap((d: Department) => d.permissions || []) || [],
    positions: selectedUserData.position?.permissions || [],
    individual: selectedUserData.permissions || []
  } : {
    systemLevel: [],
    roles: [],
    departments: [],
    positions: [],
    individual: []
  }

  const finalPermissions = [
    ...userPermissions.systemLevel,
    ...userPermissions.roles.flatMap((role: Role) => role.permissions || []),
    ...userPermissions.departments,
    ...userPermissions.positions,
    ...userPermissions.individual,
  ].filter(Boolean)

  const permissionCategories = {
    estimate: finalPermissions.filter((p: Permission) => p.name.startsWith('estimate')),
    partner: finalPermissions.filter((p: Permission) => p.name.startsWith('partner')),
    approval: finalPermissions.filter((p: Permission) => p.name.startsWith('approval')),
    other: finalPermissions.filter((p: Permission) => !p.name.startsWith('estimate') && !p.name.startsWith('partner') && !p.name.startsWith('approval')),
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">権限階層表示</h2>
          <p className="text-muted-foreground">
            5階層の権限システムを可視化し、ユーザーの最終権限を確認できます
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calculator className="h-4 w-4 mr-2" />
            権限計算
          </Button>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            詳細表示
          </Button>
        </div>
      </div>

      {/* ユーザー選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ユーザー選択</CardTitle>
          <CardDescription>
            権限を確認したいユーザーを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">ユーザーデータを読み込み中...</p>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="ユーザー名またはログインIDで検索..."
                    className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="">ユーザーを選択</option>
              {users.map((user: User) => (
                <option key={user.id} value={user.login_id}>
                  {user.name} ({user.login_id})
                </option>
              ))}
            </select>
            <Button>検索</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUserData && (
        <>
          {/* ユーザー基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ユーザー基本情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">名前</label>
                  <p className="text-lg font-semibold">{selectedUserData.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ログインID</label>
                  <p className="text-lg font-semibold">{selectedUserData.login_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">システム権限レベル</label>
                  <Badge variant="secondary">{selectedUserData.system_level}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">部署</label>
                  <p className="text-lg font-semibold">{selectedUserData.departments?.map((d: Department) => d.name).join('、') || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">職位</label>
                  <p className="text-lg font-semibold">{selectedUserData.position?.display_name || selectedUserData.position?.name || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 権限階層詳細 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">権限階層詳細</CardTitle>
              <CardDescription>
                5階層の権限システムによる権限の構成を表示します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="hierarchy" className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    階層別表示
                  </TabsTrigger>
                  <TabsTrigger value="final" className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    最終権限
                  </TabsTrigger>
                  <TabsTrigger value="source" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    権限の由来
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="hierarchy" className="mt-6">
                  <div className="space-y-6">
                    {/* 1. システム権限レベル */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">1. システム権限レベル ({selectedUserData.system_level})</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {userPermissions.systemLevel.map((permission: Permission, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span className="text-sm">{permission.name}</span>
                            <span className="text-xs text-muted-foreground">({permission.display_name})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. 役割権限 */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold">2. 役割権限</h3>
                      </div>
                      {userPermissions.roles.map((role: Role, roleIndex: number) => (
                        <div key={roleIndex} className="mb-3">
                          <h4 className="font-medium text-green-700 mb-2">{role.display_name}役割:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                            {(role.permissions || []).map((permission: Permission, index: number) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                <span className="text-sm">{permission.name}</span>
                                <span className="text-xs text-muted-foreground">({permission.display_name})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 3. 部署権限 */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Building className="h-5 w-5 text-purple-600" />
                        <h3 className="text-lg font-semibold">3. 部署権限 ({selectedUserData.departments?.map((d: Department) => d.name).join('、') || '-'})</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {userPermissions.departments.map((permission: Permission, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                            <span className="text-sm">{permission.name}</span>
                            <span className="text-xs text-muted-foreground">({permission.display_name})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 4. 職位権限 */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="h-5 w-5 text-orange-600" />
                        <h3 className="text-lg font-semibold">4. 職位権限 ({selectedUserData.position?.display_name || selectedUserData.position?.name || '-'})</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {userPermissions.positions.map((permission: Permission, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                            <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                            <span className="text-sm">{permission.name}</span>
                            <span className="text-xs text-muted-foreground">({permission.display_name})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 5. 個別権限 */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <UserIcon className="h-5 w-5 text-red-600" />
                        <h3 className="text-lg font-semibold">5. 個別権限</h3>
                      </div>
                      {userPermissions.individual.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {userPermissions.individual.map((permission: Permission, index: number) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                              <span className="text-sm">{permission.name}</span>
                              <span className="text-xs text-muted-foreground">({permission.display_name})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">個別権限は設定されていません</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="final" className="mt-6">
                  <div className="space-y-6">
                    {/* 最終権限サマリー */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">最終権限サマリー</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{finalPermissions.length}</div>
                          <div className="text-sm text-muted-foreground">合計権限数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{permissionCategories.estimate.length}</div>
                          <div className="text-sm text-muted-foreground">見積関連</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{permissionCategories.partner.length}</div>
                          <div className="text-sm text-muted-foreground">取引先関連</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{permissionCategories.approval.length}</div>
                          <div className="text-sm text-muted-foreground">承認関連</div>
                        </div>
                      </div>
                    </div>

                    {/* カテゴリ別権限 */}
                    {Object.entries(permissionCategories).map(([category, permissions]: [string, Permission[]]) => (
                      permissions.length > 0 && (
                        <div key={category} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3 capitalize">{category}関連 ({permissions.length}個)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {permissions.map((permission: Permission, index: number) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <span className="text-sm font-mono">{permission.name}</span>
                                <span className="text-xs text-muted-foreground">({permission.display_name})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="source" className="mt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    権限の由来表示機能は実装中です
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
