'use client'

import { Employee } from '@/types/features/employees'
import { EmployeeInfoCard } from './EmployeeInfoCard'
import { EmployeeContactCard } from './EmployeeContactCard'
import { EmployeeWorkCard } from './EmployeeWorkCard'
import { EmployeeSystemCard } from './EmployeeSystemCard'
import { EmployeeMetaCard } from './EmployeeMetaCard'

interface EmployeeDetailViewProps {
  employee: Employee
}

export function EmployeeDetailView({ employee }: EmployeeDetailViewProps) {
  return (
    <div className="w-full max-w-4xl">
      <div className="space-y-6">
        {/* 基本情報カード */}
        <EmployeeInfoCard employee={employee} />

        {/* 連絡先情報カード */}
        <EmployeeContactCard employee={employee} />

        {/* 勤務情報カード */}
        <EmployeeWorkCard employee={employee} />

        {/* システム権限カード */}
        <EmployeeSystemCard employee={employee} />

        {/* メタ情報カード */}
        <EmployeeMetaCard employee={employee} />
      </div>
    </div>
  )
}
