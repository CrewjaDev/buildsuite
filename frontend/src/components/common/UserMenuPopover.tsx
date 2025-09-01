'use client'

import { useState } from 'react'
import { User, Settings, LogOut, ChevronDown, UserCircle, Shield, HelpCircle } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { HeaderUser } from '@/types/user'
import { cn } from '@/lib/utils'

interface UserMenuPopoverProps {
  user?: HeaderUser
  onLogout?: () => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
}

export default function UserMenuPopover({
  user,
  onLogout,
  onProfileClick,
  onSettingsClick
}: UserMenuPopoverProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      console.log('ログアウト処理')
    }
    setOpen(false)
  }

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick()
    } else {
      console.log('プロフィールページへ遷移')
    }
    setOpen(false)
  }

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick()
    } else {
      console.log('設定ページへ遷移')
    }
    setOpen(false)
  }

  // メニューオプション
  const menuOptions = [
    {
      id: 'profile',
      label: 'プロフィール',
      icon: UserCircle,
      onClick: handleProfileClick,
      searchTerms: ['プロフィール', 'profile', 'ユーザー', 'user']
    },
    {
      id: 'settings',
      label: '設定',
      icon: Settings,
      onClick: handleSettingsClick,
      searchTerms: ['設定', 'settings', 'config', 'オプション']
    },
    ...(user?.is_admin ? [{
      id: 'admin',
      label: '管理者パネル',
      icon: Shield,
      onClick: () => {
        console.log('管理者パネルへ遷移')
        setOpen(false)
      },
      searchTerms: ['管理者', 'admin', 'パネル', 'panel', '管理']
    }] : []),
    {
      id: 'help',
      label: 'ヘルプ',
      icon: HelpCircle,
      onClick: () => {
        console.log('ヘルプページへ遷移')
        setOpen(false)
      },
      searchTerms: ['ヘルプ', 'help', 'サポート', 'support', 'FAQ']
    },
    {
      id: 'logout',
      label: 'ログアウト',
      icon: LogOut,
      onClick: handleLogout,
      searchTerms: ['ログアウト', 'logout', 'サインアウト', 'signout'],
      className: 'text-red-600 hover:text-red-700'
    }
  ]

  // 検索フィルタリング
  const filteredOptions = searchValue
    ? menuOptions.filter(option =>
        option.searchTerms.some(term =>
          term.toLowerCase().includes(searchValue.toLowerCase())
        )
      )
    : menuOptions

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <Image 
                src={user.avatar} 
                alt={user.name} 
                width={16}
                height={16}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <User className="h-2 w-2 text-gray-600" />
            )}
          </div>
          <div className="hidden md:flex items-center">
            <span className="text-sm font-medium text-gray-700">
              {user?.name || 'ユーザー'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        {/* ユーザー情報ヘッダー */}
        <div className="p-4 border-b">
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
        </div>

        {/* 検索入力 */}
        <div className="flex items-center border-b px-3 py-2">
          <Input
            placeholder="メニューを検索..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />
        </div>

        {/* メニューオプション */}
        <div className="max-h-[300px] overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              該当するメニューがありません
            </div>
          ) : (
            filteredOptions.map((option) => {
              const Icon = option.icon
              return (
                <Button
                  key={option.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-4 py-2 h-auto text-sm",
                    option.className
                  )}
                  onClick={option.onClick}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {option.label}
                </Button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
