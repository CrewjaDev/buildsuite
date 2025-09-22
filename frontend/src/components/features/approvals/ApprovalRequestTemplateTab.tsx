'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { approvalRequestTemplateService } from '@/services/features/approvals/approvalRequestTemplates'
import type { ApprovalRequestTemplate } from '@/types/features/approvals/approvalRequestTemplates'

export default function ApprovalRequestTemplateTab() {
  const [templates, setTemplates] = useState<ApprovalRequestTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addToast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const templatesData = await approvalRequestTemplateService.getApprovalRequestTemplates()
      setTemplates(templatesData)
    } catch (error) {
      console.error('データの取得に失敗しました:', error)
      addToast({
        type: 'error',
        title: 'データの取得に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  // データ取得
  useEffect(() => {
    fetchData()
  }, [fetchData])


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">承認依頼テンプレート一覧</h2>
          <p className="text-gray-600 mt-1">
            承認依頼テンプレートはコードで定義されており、編集・追加・削除はできません。
            権限設定は「権限・テンプレート設定」タブで行います。
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {Array.isArray(templates) && templates.length > 0 ? templates.map(template => (
          <Card key={template.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-gray-100">
                    <FileText className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <p className="text-gray-600">{template.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="outline">タイプ: {typeof template.request_type === 'string' ? template.request_type : template.request_type?.name || '未設定'}</Badge>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "有効" : "無効"}
                      </Badge>
                      {template.is_system && (
                        <Badge variant="outline">システム</Badge>
                      )}
                      <Badge variant="outline">使用回数: {template.usage_count}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center py-8 text-gray-500">
            承認依頼テンプレートが登録されていません
          </div>
        )}
      </div>

    </div>
  )
}
