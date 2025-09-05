'use client'

import { Estimate } from '@/types/features/estimates/estimate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EstimateItemsCardProps {
  estimate: Estimate
}

export function EstimateItemsCard({}: EstimateItemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">見積明細</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <p>見積明細の表示機能は準備中です</p>
          <p className="text-sm mt-2">階層構造での明細管理機能を実装予定</p>
        </div>
      </CardContent>
    </Card>
  )
}