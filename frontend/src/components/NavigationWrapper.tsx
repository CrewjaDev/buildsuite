'use client'

import { usePathname } from 'next/navigation'
import Navigation from './Navigation'

export default function NavigationWrapper() {
  const pathname = usePathname()
  
  // 認証ページではナビゲーションを非表示
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register')
  
  return isAuthPage ? null : <Navigation />
}
