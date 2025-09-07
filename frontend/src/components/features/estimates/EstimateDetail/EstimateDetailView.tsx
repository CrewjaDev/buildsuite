'use client'

import { Estimate } from '@/types/features/estimates/estimate'
import { EstimateInfoCard } from './EstimateInfoCard'
import { EstimateAmountCard } from './EstimateAmountCard'
import { EstimateBreakdownStructureCard } from '../EstimateBreakdowns/EstimateBreakdownStructureCard'
import { EstimateItemsCard } from './EstimateItemsCard'
import { Card, CardContent } from '@/components/ui/card'

interface EstimateDetailViewProps {
  estimate: Estimate
}

export function EstimateDetailView({ estimate }: EstimateDetailViewProps) {
  return (
    <div className="space-y-4">
      {/* 基本情報 */}
      <EstimateInfoCard estimate={estimate} />

      {/* 金額情報 */}
      <EstimateAmountCard estimate={estimate} />

      {/* 見積内訳構造 */}
      <EstimateBreakdownStructureCard estimate={estimate} />

      {/* 見積明細 */}
      <EstimateItemsCard estimate={estimate} isReadOnly={true} />

      {/* メタ情報 */}
      <Card>
        <div className="px-6 pt-2 pb-0">
          <h3 className="text-lg font-semibold leading-none tracking-tight">メタ情報</h3>
        </div>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">作成</span>
              <span className="text-sm text-gray-900 ml-2">
                {estimate.created_at ? new Date(estimate.created_at).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : '-'}
              </span>
              <span className="text-sm text-gray-900 ml-2">
                {estimate.created_by_name || '-'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">更新</span>
              <span className="text-sm text-gray-900 ml-2">
                {estimate.updated_at ? new Date(estimate.updated_at).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : '-'}
              </span>
              <span className="text-sm text-gray-900 ml-2">
                {estimate.updated_by_name || '-'}
              </span>
            </div>
            {estimate.approved_by_name && (
              <div>
                <span className="text-sm font-medium text-gray-700">承認</span>
                <span className="text-sm text-gray-900 ml-2">
                  {estimate.approved_at ? new Date(estimate.approved_at).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }) : '-'}
                </span>
                <span className="text-sm text-gray-900 ml-2">
                  {estimate.approved_by_name}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}