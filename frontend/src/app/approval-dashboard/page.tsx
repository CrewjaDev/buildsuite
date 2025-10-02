'use client'

import { Suspense } from 'react'
import ApprovalListPage from '@/components/features/approval-dashboard/ApprovalListPage'

export default function Page() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ApprovalListPage />
    </Suspense>
  )
}
