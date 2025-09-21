'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, FileText, Settings } from 'lucide-react'
import { SystemLevelPermissionSettings } from '@/components/features/approvals/SystemLevelPermissionSettings'
import { ApprovalFlowManagement } from '@/components/features/approvals/ApprovalFlowManagement'

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('flows')

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="w-full max-w-none px-4 py-6 space-y-6">
        {/* ページヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">承認管理</h1>
            <p className="text-gray-600">承認フローと承認依頼の管理を行います</p>
          </div>
        </div>

        {/* タブナビゲーション */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flows" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              承認フロー
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              権限設定
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              承認依頼
            </TabsTrigger>
          </TabsList>

          {/* 承認フロータブ */}
          <TabsContent value="flows" className="space-y-6">
            <ApprovalFlowManagement />
          </TabsContent>

          {/* 権限設定タブ */}
          <TabsContent value="permissions" className="space-y-6">
            <SystemLevelPermissionSettings />
          </TabsContent>

          {/* 承認依頼タブ */}
          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>承認依頼一覧</CardTitle>
                <CardDescription>承認待ちの案件を管理します</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">承認依頼一覧</h3>
                  <p className="text-gray-500">承認依頼一覧画面の実装予定</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
