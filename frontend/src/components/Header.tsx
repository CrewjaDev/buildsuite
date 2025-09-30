'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import NotificationDropdown from '@/components/common/NotificationDropdown'
import UserMenuPopover from '@/components/common/UserMenuPopover'
import { HeaderUser } from '@/types/user'
import { Notification } from '@/types/notification'

interface HeaderProps {
  user?: HeaderUser
  notifications?: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDeleteNotification?: (id: string) => void
  onLogout?: () => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
}

export default function Header({ 
  user, 
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onLogout,
  onProfileClick,
  onSettingsClick
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { href: '/dashboard', label: 'ダッシュボード' },
    { href: '/employees', label: '社員管理', businessCode: 'employee' },
    { href: '/partners', label: '取引先管理', businessCode: 'partner' },
    { href: '/estimates', label: '見積管理', businessCode: 'estimate' },
    { href: '/approvals', label: '承認管理', businessCode: 'approval' },
    { href: '/permissions', label: '権限管理', businessCode: 'permission' },
    // { href: '/reports', label: 'レポート' },
  ].filter(item => {
    // ビジネスコードが指定されている場合は権限チェック
    if (item.businessCode) {
      // TODO: effectivePermissionsをuseAuthから取得して使用
      return true; // 一時的にすべて表示
    }
    // ビジネスコードが指定されていない場合は表示
    return true;
  })

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50 w-full">
      <div className="w-full">
        <div className="flex items-center justify-between h-10 pl-4">
          {/* 左側: サービス名とナビゲーション */}
          <div className="flex items-center space-x-8">
            {/* サービス名 */}
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">BuildSuite</span>
            </Link>
            
            {/* デスクトップナビゲーション */}
            <div className="hidden md:flex items-center space-x-6">
              <Separator orientation="vertical" className="h-6" />
              <nav className="flex items-center space-x-6">
                {navigationItems.map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* 右側: 通知とユーザーメニュー */}
          <div className="flex items-center space-x-4">
            {/* 通知 */}
            <NotificationDropdown
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onDelete={onDeleteNotification}
            />

            {/* ユーザーメニュー */}
            <UserMenuPopover
              user={user}
              onLogout={onLogout}
              onProfileClick={onProfileClick}
              onSettingsClick={onSettingsClick}
            />

            {/* モバイルメニューボタン */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
