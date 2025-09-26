'use client'

import { Suspense } from 'react'
import PendingApprovalsPage from '@/components/features/approvals/PendingApprovalsPage'

export default function Page() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <PendingApprovalsPage />
    </Suspense>
  )
}
