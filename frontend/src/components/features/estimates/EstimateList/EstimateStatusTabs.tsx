'use client'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { EstimateStatus } from '@/types/features/estimates/estimate'
import { getEstimateStatusLabel } from '@/lib/utils/estimateUtils'
import { User } from 'lucide-react'

interface EstimateStatusTabsProps {
  activeTab: EstimateStatus | 'all'
  onTabChange: (tab: EstimateStatus | 'all') => void
  counts?: {
    all: number
    draft: number
    submitted: number
    approved: number
    rejected: number
    expired: number
  }
  showOnlyMine?: boolean
  onShowOnlyMineChange?: (checked: boolean) => void
}

export function EstimateStatusTabs({
  activeTab,
  onTabChange,
  counts = { all: 0, draft: 0, submitted: 0, approved: 0, rejected: 0, expired: 0 },
  showOnlyMine = false,
  onShowOnlyMineChange
}: EstimateStatusTabsProps) {
  const tabs = [
    { key: 'all' as const, label: 'すべて', count: counts.all },
    { key: 'draft' as const, label: getEstimateStatusLabel('draft'), count: counts.draft },
    { key: 'submitted' as const, label: getEstimateStatusLabel('submitted'), count: counts.submitted },
    { key: 'approved' as const, label: getEstimateStatusLabel('approved'), count: counts.approved },
    { key: 'rejected' as const, label: getEstimateStatusLabel('rejected'), count: counts.rejected },
    { key: 'expired' as const, label: getEstimateStatusLabel('expired'), count: counts.expired },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="mr-2">{tab.label}</span>
                  <Badge
                    variant={isActive ? 'default' : 'secondary'}
                    className={`
                      text-xs px-2 py-0.5
                      ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}
                    `}
                  >
                    {tab.count}
                  </Badge>
                </button>
              )
            })}
          </nav>
          
          {/* 自分の見積のみ表示チェックボックス */}
          {onShowOnlyMineChange && (
            <div className="flex items-center space-x-2 py-4">
              <Checkbox
                id="show-only-mine-tabs"
                checked={showOnlyMine}
                onCheckedChange={onShowOnlyMineChange}
              />
              <label
                htmlFor="show-only-mine-tabs"
                className="text-sm font-medium text-gray-700 cursor-pointer flex items-center space-x-1"
              >
                <User className="h-4 w-4" />
                <span>自分の見積のみ表示</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
