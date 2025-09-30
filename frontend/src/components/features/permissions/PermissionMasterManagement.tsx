'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Edit, Trash2, Info } from 'lucide-react'
import type { Permission } from '@/services/features/permission/permissionService'
import { usePermissions } from '@/hooks/features/permission/usePermissions'

// 型定義はAPIサービスからインポート

// 権限マスタ管理コンポーネント
export default function PermissionMasterManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModule, setSelectedModule] = useState('all')
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)

  // TanStack Queryを使用してデータを取得
  const { data: permissions = [], isLoading, error } = usePermissions({
    per_page: 1000 // 全データを取得
  })

  const modules = ['all', 'estimate', 'user', 'approval', 'system', 'department', 'position', 'budget', 'order', 'progress', 'payment', 'role']

  // クライアントサイドでのフィルタリング（全データ表示時）
  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission => {
      const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           permission.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesModule = selectedModule === 'all' || permission.module === selectedModule
      return matchesSearch && matchesModule
    })
  }, [permissions, searchTerm, selectedModule])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">権限マスタ管理</h2>
          <p className="text-muted-foreground">
            システム内の権限を定義・管理します
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新規権限作成
        </Button>
      </div>

      {/* 検索・フィルタ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">権限一覧</CardTitle>
          <CardDescription>
            システム内で使用可能な権限の一覧です
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="権限名または表示名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="all">全モジュール</option>
              {modules.filter(m => m !== 'all').map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>

          {/* 権限テーブル */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">データを読み込み中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">データの読み込みに失敗しました</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>権限名</TableHead>
                  <TableHead>表示名</TableHead>
                  <TableHead>モジュール</TableHead>
                  <TableHead>アクション</TableHead>
                  <TableHead>使用数</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((permission) => (
                <TableRow 
                  key={permission.id}
                  className={selectedPermission?.id === permission.id ? "bg-muted/50" : ""}
                  onClick={() => setSelectedPermission(permission)}
                >
                  <TableCell className="font-mono text-sm">{permission.name}</TableCell>
                  <TableCell>{permission.display_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{permission.module}</Badge>
                  </TableCell>
                  <TableCell>{permission.action}</TableCell>
                  <TableCell>
                    <Badge variant="outline">-</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={permission.is_active ? "default" : "secondary"}>
                      {permission.is_active ? "有効" : "無効"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {/* 件数表示 */}
          <div className="mt-4 text-sm text-muted-foreground">
            {filteredPermissions.length}件の権限を表示
            {searchTerm && (
              <span className="ml-2">
                （検索: {`"${searchTerm}"`}）
              </span>
            )}
            {selectedModule !== 'all' && (
              <span className="ml-2">
                （モジュール: {selectedModule}）
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 権限詳細情報 */}
      {selectedPermission && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              権限詳細情報
            </CardTitle>
            <CardDescription>
              選択された権限の詳細情報と使用状況
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">権限名</h4>
                  <p className="font-mono text-sm">{selectedPermission.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">表示名</h4>
                  <p>{selectedPermission.display_name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">モジュール</h4>
                  <Badge variant="secondary">{selectedPermission.module}</Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">アクション</h4>
                  <p>{selectedPermission.action}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">ステータス</h4>
                  <Badge variant={selectedPermission.is_active ? "default" : "secondary"}>
                    {selectedPermission.is_active ? "有効" : "無効"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">説明</h4>
                  <p className="text-sm">{selectedPermission.description}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">使用数</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">-</Badge>
                    <span className="text-sm text-muted-foreground">階層で使用中</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">使用状況</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>システム権限レベル</span>
                      <span className="text-muted-foreground">3箇所</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>役割</span>
                      <span className="text-muted-foreground">2箇所</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>部署</span>
                      <span className="text-muted-foreground">1箇所</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>職位</span>
                      <span className="text-muted-foreground">0箇所</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>個別権限</span>
                      <span className="text-muted-foreground">0箇所</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  権限を編集
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  権限を削除
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
