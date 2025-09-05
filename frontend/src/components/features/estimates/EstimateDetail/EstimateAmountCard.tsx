'use client'

import { Estimate } from '@/types/features/estimates/estimate'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/estimateUtils'
import { Calculator } from 'lucide-react'

interface EstimateAmountCardProps {
  estimate: Estimate
}

export function EstimateAmountCard({ estimate }: EstimateAmountCardProps) {
  // 金額計算
  const subtotal = estimate.subtotal || 0
  const taxRate = estimate.tax_rate || 0.10
  const taxAmount = estimate.tax_amount || 0
  const grandTotal = estimate.total_amount || 0

  return (
    <Card>
      <div className="px-6 pt-2 pb-0">
        <h3 className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          見積額 合計
        </h3>
      </div>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 税抜見積金額 */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">税抜見積金額</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(subtotal)}
              </div>
            </div>
          </div>

          {/* 消費税 */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">
                消費税（{Math.round(taxRate * 100)}%）
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(taxAmount)}
              </div>
            </div>
          </div>

          {/* 合計金額 */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-medium text-blue-600 mb-1">合計金額</div>
              <div className="text-xl font-bold text-blue-900">
                {formatCurrency(grandTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* 支払条件、納期条件、保証期間は縦並びで表示 */}
        {(estimate.payment_terms || estimate.delivery_terms || estimate.warranty_period) && (
          <div className="mt-4 pt-4 space-y-3 border-t border-gray-200">
            {/* 支払条件 */}
            {estimate.payment_terms && (
              <div>
                <span className="text-sm font-medium text-gray-700">支払条件</span>
                <p className="text-sm text-gray-900 mt-1">
                  {estimate.payment_terms}
                </p>
              </div>
            )}

            {/* 納期条件 */}
            {estimate.delivery_terms && (
              <div>
                <span className="text-sm font-medium text-gray-700">納期条件</span>
                <p className="text-sm text-gray-900 mt-1">
                  {estimate.delivery_terms}
                </p>
              </div>
            )}

            {/* 保証期間 */}
            {estimate.warranty_period && (
              <div>
                <span className="text-sm font-medium text-gray-700">保証期間</span>
                <p className="text-sm text-gray-900 mt-1">
                  {estimate.warranty_period}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
