'use client'

import { useState } from 'react'
import { Estimate } from '@/types/features/estimates/estimate'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { EstimateApprovalRequestDialog } from './EstimateApprovalRequestDialog'
import { useAuth } from '@/hooks/useAuth'

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
    // 下書き状態かつ承認依頼が未作成の場合のみ表示
    const isDraft = estimate.status === 'draft'
    const noApprovalRequest = !estimate.approval_request_id
    const backendCheck = estimate.can_request_approval
    const frontendCheck = hasPermission('estimate.approval.request')
    
    return isDraft && noApprovalRequest && backendCheck && frontendCheck
  }


  // 承認依頼ボタンの表示（バッジ表示を削除）

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
