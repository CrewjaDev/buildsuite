'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Settings, List } from 'lucide-react'
import { approvalFlowService } from '@/services/features/approvals/approvalFlows'
import type { ApprovalFlow, ApprovalFlowTemplate } from '@/types/features/approvals/approvalFlows'
import { ApprovalFlowTemplateSelector } from './ApprovalFlowTemplateSelector'
import { ApprovalFlowList } from './ApprovalFlowList'
import { ApprovalFlowForm } from './ApprovalFlowForm'

export function ApprovalFlowManagement() {
  const [activeTab, setActiveTab] = useState('templates')
  const [flows, setFlows] = useState<ApprovalFlow[]>([])
  const [templates, setTemplates] = useState<Record<string, ApprovalFlowTemplate>>({})
  const [loading, setLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingFlow, setEditingFlow] = useState<ApprovalFlow | undefined>(undefined)

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

  const handleCreateFlow = () => {
    setEditingFlow(undefined)
    setIsFormOpen(true)
  }

  const handleEditFlow = (flow: ApprovalFlow) => {
    setEditingFlow(flow)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingFlow(undefined)
  }

  const handleFormSuccess = () => {
    loadData() // フォーム成功後に一覧を更新
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">承認フロー管理</h2>
          <p className="text-gray-600">承認フローのパターンと設定を管理します</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {flows.length} 件のフロー
          </Badge>
          <Button onClick={handleCreateFlow} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            新規作成
          </Button>
        </div>
      </div>

      {/* タブナビゲーション */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            パターン
          </TabsTrigger>
          <TabsTrigger value="flows" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            承認フロー一覧
          </TabsTrigger>
        </TabsList>

        {/* パターンタブ */}
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
            onEdit={handleEditFlow}
          />
        </TabsContent>
      </Tabs>

      {/* 承認フロー作成・編集フォーム */}
      <ApprovalFlowForm
        flow={editingFlow}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
