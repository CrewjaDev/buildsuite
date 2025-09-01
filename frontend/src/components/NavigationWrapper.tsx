'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import Header from './Header'
import { Notification } from '@/types/notification'
import { useAuth } from '@/hooks/useAuth'
import { logout } from '@/store/authSlice'

export default function NavigationWrapper() {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch()
  const { headerUser } = useAuth()
  
  // 認証ページではヘッダーを非表示
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register')
  
  // サンプル通知データ（実際の実装ではAPIから取得）
  const sampleNotifications: Notification[] = [
    {
      id: '1',
      title: '新しいプロジェクトが作成されました',
      message: 'プロジェクト「Webサイトリニューアル」が作成されました。詳細を確認してください。',
      type: 'info',
      read: false,
      timestamp: new Date('2024-01-15T10:30:00'),
      link: '/projects/1'
    },
    {
      id: '2',
      title: 'タスクの期限が近づいています',
      message: 'タスク「デザイン確認」の期限が明日です。早めの対応をお願いします。',
      type: 'warning',
      read: false,
      timestamp: new Date('2024-01-15T09:15:00'),
      link: '/tasks/123'
    },
    {
      id: '3',
      title: 'システムメンテナンス完了',
      message: 'システムメンテナンスが正常に完了しました。すべての機能が利用可能です。',
      type: 'success',
      read: true,
      timestamp: new Date('2024-01-14T16:00:00')
    },
    {
      id: '4',
      title: '新しいユーザーが登録されました',
      message: '山田花子さんがシステムに登録されました。承認をお願いします。',
      type: 'info',
      read: false,
      timestamp: new Date('2024-01-14T14:20:00'),
      link: '/users/pending'
    },
    {
      id: '5',
      title: 'セキュリティアラート',
      message: '不審なログイン試行が検出されました。パスワードの変更をお勧めします。',
      type: 'error',
      read: false,
      timestamp: new Date('2024-01-14T11:45:00'),
      link: '/security'
    }
  ]
  
  // 通知関連のハンドラー
  const handleMarkAsRead = (id: string) => {
    console.log('通知を既読にする:', id)
    // 実際の実装ではAPIを呼び出して通知を既読にする
  }
  
  const handleMarkAllAsRead = () => {
    console.log('すべての通知を既読にする')
    // 実際の実装ではAPIを呼び出してすべての通知を既読にする
  }
  
  const handleDeleteNotification = (id: string) => {
    console.log('通知を削除:', id)
    // 実際の実装ではAPIを呼び出して通知を削除する
  }
  
  // ユーザー関連のハンドラー
  const handleLogout = () => {
    console.log('ログアウト処理')
    // ローカルストレージのトークンを削除
    localStorage.removeItem('token')
    // Reduxの状態をクリア
    dispatch(logout())
    // ログインページにリダイレクト
    router.push('/login')
  }
  
  const handleProfileClick = () => {
    console.log('プロフィールページへ遷移')
    // 実際の実装ではプロフィールページに遷移
    if (headerUser) {
      router.push(`/users/${headerUser.id}`)
    }
  }
  
  const handleSettingsClick = () => {
    console.log('設定ページへ遷移')
    // 実際の実装では設定ページに遷移
    router.push('/settings')
  }
  
  return isAuthPage ? null : (
    <Header 
      user={headerUser}
      notifications={sampleNotifications}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onDeleteNotification={handleDeleteNotification}
      onLogout={handleLogout}
      onProfileClick={handleProfileClick}
      onSettingsClick={handleSettingsClick}
    />
  )
}
