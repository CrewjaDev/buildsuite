'use client'

import { User, Settings, LogOut, ChevronDown, UserCircle, Shield, HelpCircle } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HeaderUser } from '@/types/user'

interface UserMenuProps {
  user?: HeaderUser
  onLogout?: () => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
}

export default function UserMenu({
  user,
  onLogout,
  onProfileClick,
  onSettingsClick
}: UserMenuProps) {
  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      // デフォルトのログアウト処理
      console.log('ログアウト処理')
    }
  }

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick()
    } else {
      // デフォルトのプロフィールページ遷移
      console.log('プロフィールページへ遷移')
    }
  }

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick()
    } else {
      // デフォルトの設定ページ遷移
      console.log('設定ページへ遷移')
    }
  }

  // システムレベルに基づく役職表示
  const getRoleDisplay = (systemLevel?: string, isAdmin?: boolean) => {
    if (isAdmin) return '管理者'
    switch (systemLevel) {
      case 'admin':
        return '管理者'
      case 'manager':
        return 'マネージャー'
      case 'staff':
        return 'スタッフ'
      default:
        return 'ユーザー'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <Image 
                src={user.avatar} 
                alt={user.name} 
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-gray-600" />
            )}
          </div>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium text-gray-700">
              {user?.name || 'ユーザー'}
            </span>
            <span className="text-xs text-gray-500">
              {getRoleDisplay(user?.system_level, user?.is_admin)}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || 'ユーザー'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'user@example.com'}
            </p>
            {user?.primary_department && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.primary_department.name}
                {user.primary_department.position && ` - ${user.primary_department.position}`}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleProfileClick}>
          <UserCircle className="mr-2 h-4 w-4" />
          <span>プロフィール</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          <span>設定</span>
        </DropdownMenuItem>
        
        {user?.is_admin && (
          <DropdownMenuItem>
            <Shield className="mr-2 h-4 w-4" />
            <span>管理者パネル</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>ヘルプ</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>ログアウト</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
