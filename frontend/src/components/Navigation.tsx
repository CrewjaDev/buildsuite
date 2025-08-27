'use client'

import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900">
              ダッシュボード
            </Link>
            <Link href="/users" className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900">
              ユーザー管理
            </Link>
            <Link href="/settings" className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900">
              設定
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
