'use client'

import { useState } from 'react'
import { Estimate } from '@/types/features/estimates/estimate'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle, Clock, XCircle, RotateCcw, Ban } from 'lucide-react'
import { EstimateApprovalRequestDialog } from './EstimateApprovalRequestDialog'
import { getApprovalStatusInfo } from '@/lib/utils/approvalStatus'
import { useAuth } from '@/hooks/useAuth'

const iconMap = {
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Ban
}

interface EstimateApprovalRequestButtonProps {
  estimate: Estimate
  onApprovalRequestCreated?: () => void
}

export function EstimateApprovalRequestButton({ 
  estimate, 
  onApprovalRequestCreated 
}: EstimateApprovalRequestButtonProps) {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const { hasPermission } = useAuth()

  // 承認依頼可能かどうかの判定
  const canRequestApproval = () => {
    // バックエンドのアクセサ + フロントエンドの権限チェック
    const backendCheck = estimate.can_request_approval
    const frontendCheck = hasPermission('estimate.approval.request')
    
    return backendCheck && frontendCheck
  }

  // 承認依頼の状態に応じた表示
  const getApprovalStatus = () => {
    if (estimate.approval_request_id) {
      // 承認状態を優先的に使用
      const approvalStatus = estimate.approval_status || estimate.status
      return getApprovalStatusInfo(approvalStatus)
    }
    return null
  }

  const approvalStatus = getApprovalStatus()

  // 承認依頼ボタンの表示
  if (approvalStatus) {
    const IconComponent = iconMap[approvalStatus.iconName as keyof typeof iconMap]
    return (
      <Badge variant={approvalStatus.variant} className="flex items-center gap-1">
        <IconComponent className="h-4 w-4" />
        {approvalStatus.label}
      </Badge>
    )
  }

  // 承認依頼可能な場合のボタン
  if (canRequestApproval()) {
    return (
      <>
        <Button
          onClick={() => setShowApprovalDialog(true)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          承認依頼
        </Button>
        
        <EstimateApprovalRequestDialog
          estimate={estimate}
          open={showApprovalDialog}
          onOpenChange={setShowApprovalDialog}
          onSuccess={onApprovalRequestCreated}
        />
      </>
    )
  }

  // 承認依頼不可の場合
  return null
}
