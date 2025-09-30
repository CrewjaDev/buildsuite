import { Metadata } from 'next'
import PermissionManagement from '@/components/features/permissions/PermissionManagement'

export const metadata: Metadata = {
  title: '権限管理',
  description: 'システム管理者向けの権限管理ページ'
}

export default function PermissionsPage() {
  return <PermissionManagement />
}
