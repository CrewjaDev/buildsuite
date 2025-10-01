'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { User as UserIcon, Search } from 'lucide-react'
import { useUsers, userKeys } from '@/hooks/features/permission/useUsers'
import { userService } from '@/services/features/permission/permissionService'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '@/services/features/permission/permissionService'
import { toast } from 'sonner'
import BusinessCodePermissionManager from './BusinessCodePermissionManager'


// 型定義はAPIサービスからインポート

export default function UserPermissionManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const queryClient = useQueryClient()

  const { data: usersResponse, isLoading: usersLoading } = useUsers({ search: searchTerm, per_page: 50 })

  const users = usersResponse?.users || []

  const loading = usersLoading

  // ユーザー選択時の処理
  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
  }

  // ユーザー削除機能
  const handleDeleteUser = async (user: User) => {
    const confirmed = window.confirm(
      `「${user.name}」を削除しますか？\n` +
      '削除すると、このユーザーは無効化されますが、既存の権限設定は保持されます。\n' +
      '本当に削除しますか？'
    )
    if (!confirmed) return

    try {
      await userService.deleteUser(user.id)
      toast.success('ユーザーが正常に削除されました')
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    } catch (error) {
      console.error('ユーザーの削除に失敗しました:', error)
      toast.error('ユーザーの削除に失敗しました')
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ユーザー権限管理</h2>
          <p className="text-muted-foreground">
            ユーザーの権限管理を行います
          </p>
        </div>
      </div>

      {/* 検索 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ユーザー検索</CardTitle>
          <CardDescription>
            ユーザーを検索して権限を管理します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ユーザー名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ユーザー一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              ユーザー一覧
            </CardTitle>
            <CardDescription>
              ユーザーの一覧と管理
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
                    <TableHead>ユーザー名</TableHead>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead>部署</TableHead>
                    <TableHead>権限数</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: User) => (
                    <TableRow 
                      key={user.id}
                      className={selectedUser?.id === user.id ? "bg-muted/50" : ""}
                      onClick={() => handleUserSelect(user)}
                    >
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.departments && user.departments.length > 0 ? (
                          <Badge variant="outline">{user.departments[0].name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">-</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "有効" : "無効"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteUser(user)
                            }}
                          >
                            削除
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
        {selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">権限付与</CardTitle>
              <CardDescription>
                選択されたユーザー: {selectedUser.name} ({selectedUser.email})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessCodePermissionManager
                key={selectedUser.id}
                entityType="user"
                entityId={selectedUser.id}
                entityName={selectedUser.name}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}