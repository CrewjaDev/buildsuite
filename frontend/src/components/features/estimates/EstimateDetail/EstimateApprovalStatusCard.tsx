'use client'

import { Estimate } from '@/types/features/estimates/estimate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, XCircle, RotateCcw, Ban } from 'lucide-react'
import { getApprovalStatusInfo } from '@/lib/utils/approvalStatus'

const iconMap = {
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Ban
}

interface EstimateApprovalStatusCardProps {
  estimate: Estimate
}

export function EstimateApprovalStatusCard({ estimate }: EstimateApprovalStatusCardProps) {
  if (!estimate.approval_request_id) {
    return null
  }

  const approvalStatus = estimate.approval_status || estimate.status
  const statusInfo = getApprovalStatusInfo(approvalStatus)

  const IconComponent = iconMap[statusInfo.iconName as keyof typeof iconMap]

  return (
    <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <IconComponent className="h-5 w-5" />
          承認状況
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">承認依頼ID:</span>
            <span className="text-sm font-mono">{estimate.approval_request_id}</span>
          </div>
          
          {estimate.approval_flow_id && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">承認フローID:</span>
              <span className="text-sm font-mono">{estimate.approval_flow_id}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">承認状態:</span>
            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
              <IconComponent className="h-4 w-4" />
              {statusInfo.label}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">見積状態:</span>
            <Badge variant="outline">
              {estimate.status === 'draft' && '下書き'}
              {estimate.status === 'submitted' && '提出済み'}
              {estimate.status === 'approved' && '承認済み'}
              {estimate.status === 'rejected' && '却下'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
