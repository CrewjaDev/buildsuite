'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Building, Briefcase, User, Layers, Settings, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

// 各タブのコンポーネント（後で実装）
import SystemLevelManagement from './SystemLevelManagement'
import RoleManagement from './RoleManagement'
import DepartmentPermissionManagement from './DepartmentPermissionManagement'
import PositionPermissionManagement from './PositionPermissionManagement'
import UserPermissionManagement from './UserPermissionManagement'
import PermissionHierarchyView from './PermissionHierarchyView'
import BusinessCodeManagement from '../business/BusinessCodeManagement'
import ABACPolicyManagement from './ABACPolicyManagement'

export default function PermissionManagement() {
  const [activeTab, setActiveTab] = useState('business-codes')
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  // システム管理者のみアクセス可能
  const isSystemAdmin = user?.is_admin

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isSystemAdmin)) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isSystemAdmin, loading, router])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (!isAuthenticated || !isSystemAdmin) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">アクセス拒否</h1>
          <p className="text-muted-foreground mt-2">
            このページにアクセスする権限がありません。
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    {
      id: 'business-codes',
      label: 'ビジネスコード',
      icon: Settings,
      component: BusinessCodeManagement
    },
    {
      id: 'system-levels',
      label: 'システム権限レベル',
      icon: Layers,
      component: SystemLevelManagement
    },
    {
      id: 'roles',
      label: '役割',
      icon: Users,
      component: RoleManagement
    },
    {
      id: 'departments',
      label: '部署権限',
      icon: Building,
      component: DepartmentPermissionManagement
    },
    {
      id: 'positions',
      label: '職位権限',
      icon: Briefcase,
      component: PositionPermissionManagement
    },
    {
      id: 'users',
      label: 'ユーザー権限',
      icon: User,
      component: UserPermissionManagement
    },
    {
      id: 'hierarchy',
      label: '権限階層表示',
      icon: Layers,
      component: PermissionHierarchyView
    },
    {
      id: 'abac-policies',
      label: 'ABACポリシー',
      icon: Shield,
      component: ABACPolicyManagement
    }
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">権限管理</h1>
        <p className="text-muted-foreground">
          システム管理者向けの権限管理ページ。ビジネスコードベースの権限システムを統合的に管理します。
        </p>
      </div>

      <Card>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {tabs.map((tab) => {
              const Component = tab.component
              return (
                <TabsContent key={tab.id} value={tab.id} className="mt-6">
                  <Component />
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
