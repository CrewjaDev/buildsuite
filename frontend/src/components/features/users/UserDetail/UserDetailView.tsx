'use client'

import { UserDetail } from './hooks/useUserDetail'
import { UserInfoCard } from './UserInfoCard'
import { UserContactCard } from './UserContactCard'
import { UserDepartmentCard } from './UserDepartmentCard'
import { UserRoleCard } from './UserRoleCard'
import { UserMetaCard } from './UserMetaCard'

interface UserDetailViewProps {
  user: UserDetail
}

export function UserDetailView({ user }: UserDetailViewProps) {
  return (
    <div className="w-full max-w-4xl">
      <div className="space-y-6">
        {/* 基本情報カード */}
        <UserInfoCard user={user} />

        {/* 連絡先情報カード */}
        <UserContactCard user={user} />

        {/* 所属情報カード */}
        <UserDepartmentCard user={user} />

        {/* 権限・役割カード */}
        <UserRoleCard user={user} />

        {/* メタ情報カード */}
        <UserMetaCard user={user} />
      </div>
    </div>
  )
}
