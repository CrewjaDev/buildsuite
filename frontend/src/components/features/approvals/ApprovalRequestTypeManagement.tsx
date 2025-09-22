'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ApprovalRequestTypeTab from './ApprovalRequestTypeTab'
import ApprovalRequestTemplateTab from './ApprovalRequestTemplateTab'

export default function ApprovalRequestTypeManagement() {
  const [activeTab, setActiveTab] = useState('types')


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">承認依頼管理</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="types">承認依頼タイプ</TabsTrigger>
          <TabsTrigger value="templates">承認依頼テンプレート</TabsTrigger>
        </TabsList>
        
        <TabsContent value="types" className="mt-6">
          <ApprovalRequestTypeTab />
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          <ApprovalRequestTemplateTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
