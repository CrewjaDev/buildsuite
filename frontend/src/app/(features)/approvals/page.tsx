'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Settings } from 'lucide-react'
// import { SystemLevelPermissionSettings } from '@/components/features/approvals/SystemLevelPermissionSettings'
import { ApprovalFlowManagement } from '@/components/features/approvals/ApprovalFlowManagement'
import ApprovalRequestTypeManagement from '@/components/features/approvals/ApprovalRequestTypeManagement'

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('flows')

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="w-full max-w-none px-4 py-6 space-y-6">
        {/* ページヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">承認管理</h1>
            <p className="text-gray-600">承認フロー、権限設定、承認依頼の管理を行います</p>
          </div>
        </div>

        {/* タブナビゲーション */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="flows" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              承認フロー
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

          {/* 権限設定タブ - 一時的に無効化 */}
          {/* <TabsContent value="permissions" className="space-y-6">
            <div>権限設定機能は準備中です</div>
          </TabsContent> */}

          {/* 承認依頼タブ */}
          <TabsContent value="requests" className="space-y-6">
            <ApprovalRequestTypeManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
