'use client'

import { useState } from 'react'
import { Estimate } from '@/types/features/estimates/estimate'
import { EstimateInfoCard } from './EstimateInfoCard'
import { EstimateAmountCard } from './EstimateAmountCard'
import { EstimateBreakdownStructureCard } from '../EstimateBreakdowns/EstimateBreakdownStructureCard'
import { EstimateItemsCard } from './EstimateItemsCard'
import EstimateBasicInfoEditDialog from './EstimateBasicInfoEditDialog'
import EstimateBreakdownEditDialog from './EstimateBreakdownEditDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'

interface EstimateDetailViewProps {
  estimate: Estimate
  onDataUpdate?: () => void
}

export function EstimateDetailView({ estimate, onDataUpdate }: EstimateDetailViewProps) {
  const [showBasicInfoEditDialog, setShowBasicInfoEditDialog] = useState(false)
  const [showBreakdownEditDialog, setShowBreakdownEditDialog] = useState(false)

  return (
    <div className="space-y-4">
      {/* 基本情報 */}
      <Card>
        <div className="px-6 pt-2 pb-0 flex justify-between items-center">
          <h3 className="text-lg font-semibold leading-none tracking-tight">基本情報</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBasicInfoEditDialog(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            編集
          </Button>
        </div>
        <CardContent className="pt-0">
          <EstimateInfoCard estimate={estimate} />
        </CardContent>
      </Card>

      {/* 金額情報 */}
      <EstimateAmountCard estimate={estimate} />

      {/* 見積内訳構造 */}
      <Card>
        <div className="px-6 pt-2 pb-0 flex justify-between items-center">
          <h3 className="text-lg font-semibold leading-none tracking-tight">見積内訳構造</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBreakdownEditDialog(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            編集
          </Button>
        </div>
        <CardContent className="pt-0">
          <EstimateBreakdownStructureCard estimate={estimate} />
        </CardContent>
      </Card>

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

      {/* 基本情報編集ダイアログ */}
      <EstimateBasicInfoEditDialog
        estimate={estimate}
        isOpen={showBasicInfoEditDialog}
        onClose={() => setShowBasicInfoEditDialog(false)}
        onSuccess={() => {
          // 親コンポーネントにデータ更新を通知
          onDataUpdate?.()
        }}
      />

      {/* 見積内訳編集ダイアログ */}
      <EstimateBreakdownEditDialog
        estimate={estimate}
        isOpen={showBreakdownEditDialog}
        onClose={() => setShowBreakdownEditDialog(false)}
        onSuccess={() => {
          // 親コンポーネントにデータ更新を通知
          onDataUpdate?.()
        }}
      />
    </div>
  )
}