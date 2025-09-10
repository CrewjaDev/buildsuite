'use client'

import { Estimate } from '@/types/features/estimates/estimate'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/estimateUtils'

interface EstimateInfoCardProps {
  estimate: Estimate
}

export function EstimateInfoCard({ estimate }: EstimateInfoCardProps) {
  return (
    <div className="space-y-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左側 - 基本情報 */}
        <div className="p-0">
              <div className="overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {/* 見積番号 */}
                                               <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                             <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                               見積番号
                             </td>
                             <td className="px-3 py-2 text-sm text-gray-900">
                               {estimate.estimate_number || '-'}
                             </td>
                           </tr>

                    {/* 工事番号 */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        工事番号
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {estimate.construction_number || '-'}
                      </td>
                    </tr>

                    {/* 見積日 */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        見積日
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {estimate.issue_date ? formatDate(estimate.issue_date) : '-'}
                      </td>
                    </tr>

                    {/* 見積状態（ステータス） */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        見積状態
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <Badge 
                          variant={estimate.status === 'approved' ? 'default' : 
                                  estimate.status === 'rejected' ? 'destructive' : 
                                  estimate.status === 'submitted' ? 'secondary' : 'outline'}
                        >
                          {estimate.status === 'draft' ? '下書き' :
                           estimate.status === 'submitted' ? '提出済み' :
                           estimate.status === 'approved' ? '承認済み' :
                           estimate.status === 'rejected' ? '却下' : '不明'}
                        </Badge>
                      </td>
                    </tr>

                    {/* 担当者 */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        担当者
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {estimate.created_by_name || '-'}
                      </td>
                    </tr>

                    {/* 受注先（取引先） */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        受注先
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {estimate.partner_name || '-'}
                      </td>
                    </tr>

                    {/* 工事名称 */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        工事名称
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {estimate.project_name || '-'}
                      </td>
                    </tr>

                    {/* 工事場所 */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        工事場所
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {estimate.project_location || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
        </div>

        {/* 右側 - その他の詳細 */}
        <div className="p-0">
              <div className="overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {/* 工期 */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        工期
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {estimate.construction_period_from && estimate.construction_period_to ? (
                          <div className="flex items-center gap-2">
                            <span>{formatDate(estimate.construction_period_from)}</span>
                            <span className="text-gray-500">〜</span>
                            <span>{formatDate(estimate.construction_period_to)}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>

                    {/* 有効期限 */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        有効期限
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {estimate.expiry_date ? formatDate(estimate.expiry_date) : '-'}
                      </td>
                    </tr>

                    {/* 工事種別 */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        工事種別
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {estimate.project_type_name || '-'}
                      </td>
                    </tr>

                    {/* 一般管理費率 */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        一般管理費率
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {estimate.overhead_rate ? `${Number(estimate.overhead_rate).toFixed(1)}%` : '-'}
                      </td>
                    </tr>

                    {/* 原価経費率 */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        原価経費率
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {estimate.cost_expense_rate ? `${Number(estimate.cost_expense_rate).toFixed(1)}%` : '-'}
                      </td>
                    </tr>

                    {/* 材料経費率 */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50/30 w-40">
                        材料経費率
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {estimate.material_expense_rate ? `${Number(estimate.material_expense_rate).toFixed(1)}%` : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
        </div>

        {/* 備考 */}
        {estimate.notes && (
          <div className="p-4 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-700">備考</label>
            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
              {estimate.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
