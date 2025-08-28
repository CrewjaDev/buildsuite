'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock, 
  MoreHorizontal,
  User,
  Shield
} from 'lucide-react'
import { UserDetail, useDeleteUserDetail } from './hooks/useUserDetail'
import { useToast } from '@/components/ui/toast'

interface UserDetailHeaderProps {
  user: UserDetail
  onEditClick: () => void
  onDeleteSuccess?: () => void
  canEdit?: boolean
  canDelete?: boolean
  canManagePermissions?: boolean
}

export function UserDetailHeader({ 
  user, 
  onEditClick, 
  onDeleteSuccess,
  canEdit = true,
  canDelete = true,
  canManagePermissions = true
}: UserDetailHeaderProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteUserMutation = useDeleteUserDetail()
  const { addToast } = useToast()

  // ステータスの表示
  const getStatusDisplay = (isActive: boolean) => {
    return isActive ? '有効' : '無効'
  }

  // 削除確認と実行
  const handleDelete = async () => {
    if (!confirm(`ユーザー「${user.name}」を削除しますか？\nこの操作は取り消せません。`)) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteUserMutation.mutateAsync(user.id)
      
      addToast({
        type: 'success',
        title: '削除完了',
        description: `ユーザー「${user.name}」が正常に削除されました`,
        duration: 3000,
      })
      
      onDeleteSuccess?.()
      router.push('/users')
    } catch (error) {
      console.error('User delete failed:', error)
      addToast({
        type: 'error',
        title: '削除失敗',
        description: 'ユーザーの削除に失敗しました。',
        duration: 5000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // アカウントロック切り替え
  const handleToggleLock = async () => {
    const action = user.is_locked ? 'ロック解除' : 'ロック'
    if (!confirm(`ユーザー「${user.name}」のアカウントを${action}しますか？`)) {
      return
    }

    try {
      // TODO: アカウントロック切り替えAPIを実装
      console.log('Toggle lock for user:', user.id)
      addToast({
        type: 'success',
        title: 'ロック状態変更',
        description: `アカウントの${action}が完了しました`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Toggle lock failed:', error)
      addToast({
        type: 'error',
        title: 'ロック状態変更失敗',
        description: `${action}に失敗しました`,
        duration: 5000,
      })
    }
  }



  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
      {/* 左側: ナビゲーションとユーザー情報 */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/users')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>一覧に戻る</span>
        </Button>

        <div className="h-6 w-px bg-gray-300" />

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {user.name} ({user.employee_id})
              </h1>
              <p className="text-sm text-gray-600">ユーザー詳細</p>
            </div>
          </div>
          
          <Badge variant={user.is_active ? 'default' : 'secondary'}>
            {getStatusDisplay(user.is_active)}
          </Badge>
          
          {user.is_locked && (
            <Badge variant="destructive">
              ロック中
            </Badge>
          )}
        </div>
      </div>

      {/* 右側: アクションボタン */}
      <div className="flex items-center space-x-2">
        {/* 編集ボタン */}
        {canEdit && (
          <Button 
            onClick={onEditClick}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>編集</span>
          </Button>
        )}

        {/* その他のアクション（ドロップダウンメニュー） */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* アカウントロック切り替え */}
            <DropdownMenuItem onClick={handleToggleLock}>
              {user.is_locked ? (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  ロック解除
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  ロック
                </>
              )}
            </DropdownMenuItem>



            {/* 権限管理 */}
            {canManagePermissions && (
              <DropdownMenuItem onClick={() => console.log('Manage permissions')}>
                <Shield className="h-4 w-4 mr-2" />
                権限管理
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* 削除 */}
            {canDelete && (
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? '削除中...' : '削除'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
