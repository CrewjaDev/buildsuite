'use client'

import { Estimate } from '@/types/features/estimates/estimate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils/estimateUtils'

interface EstimateMetaCardProps {
  estimate: Estimate
}

export function EstimateMetaCard({ estimate }: EstimateMetaCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">メタ情報</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">作成情報</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>作成者: {estimate.created_by_name || '不明'}</p>
            <p>作成日: {formatDateTime(estimate.created_at)}</p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-2">更新情報</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>更新者: {estimate.updated_by_name || '不明'}</p>
            <p>更新日: {formatDateTime(estimate.updated_at)}</p>
          </div>
        </div>
        
        {estimate.approved_by_name && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">承認情報</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>承認者: {estimate.approved_by_name}</p>
              <p>承認日: {estimate.approved_at ? formatDateTime(estimate.approved_at) : '未承認'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}