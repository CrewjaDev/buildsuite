export interface ApprovalStatusInfo {
  iconName: string
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  color: string
  bgColor?: string
  borderColor?: string
}

export function getApprovalStatusInfo(approvalStatus: string): ApprovalStatusInfo {
  switch (approvalStatus) {
    case 'pending':
    case 'submitted':
      return {
        iconName: 'Clock',
        label: '承認待ち',
        variant: 'secondary',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      }
    case 'approved':
      return {
        iconName: 'CheckCircle',
        label: '承認済み',
        variant: 'default',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    case 'rejected':
      return {
        iconName: 'XCircle',
        label: '却下',
        variant: 'destructive',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    case 'returned':
      return {
        iconName: 'RotateCcw',
        label: '差し戻し',
        variant: 'secondary',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      }
    case 'cancelled':
      return {
        iconName: 'Ban',
        label: 'キャンセル',
        variant: 'outline',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    default:
      return {
        iconName: 'Clock',
        label: '承認中',
        variant: 'secondary',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      }
  }
}
