'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Settings, List } from 'lucide-react'
import { approvalFlowService, ApprovalFlow, ApprovalFlowTemplate } from '@/services/features/approvals/approvalFlows'
import { ApprovalFlowTemplateSelector } from './ApprovalFlowTemplateSelector'
import { ApprovalFlowList } from './ApprovalFlowList'

export function ApprovalFlowManagement() {
  const [activeTab, setActiveTab] = useState('templates')
  const [flows, setFlows] = useState<ApprovalFlow[]>([])
  const [templates, setTemplates] = useState<Record<string, ApprovalFlowTemplate>>({})
  const [loading, setLoading] = useState(false)

  // データ読み込み
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [flowsData, templatesData] = await Promise.all([
        approvalFlowService.getApprovalFlows(),
        approvalFlowService.getTemplates()
      ])
      setFlows(flowsData)
      setTemplates(templatesData)
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFlowCreated = () => {
    loadData() // フロー作成後に一覧を更新
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">承認フロー管理</h2>
          <p className="text-gray-600">承認フローのテンプレートと設定を管理します</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {flows.length} 件のフロー
          </Badge>
        </div>
      </div>

      {/* タブナビゲーション */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            テンプレート
          </TabsTrigger>
          <TabsTrigger value="flows" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            承認フロー一覧
          </TabsTrigger>
        </TabsList>

        {/* テンプレートタブ */}
        <TabsContent value="templates" className="space-y-6">
          <ApprovalFlowTemplateSelector 
            templates={templates}
            onFlowCreated={handleFlowCreated}
          />
        </TabsContent>

        {/* 承認フロー一覧タブ */}
        <TabsContent value="flows" className="space-y-6">
          <ApprovalFlowList 
            flows={flows}
            loading={loading}
            onRefresh={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
