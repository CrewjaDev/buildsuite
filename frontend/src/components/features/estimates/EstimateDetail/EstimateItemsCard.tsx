'use client'

import { Estimate } from '@/types/features/estimates/estimate'
import { EstimateItemsCard as EstimateItemsCardComponent } from '../EstimateItems/EstimateItemsCard'

interface EstimateItemsCardProps {
  estimate: Estimate
  isReadOnly?: boolean
}

export function EstimateItemsCard({ estimate, isReadOnly = false }: EstimateItemsCardProps) {
  return (
    <EstimateItemsCardComponent 
      estimateId={estimate.id} 
      isReadOnly={isReadOnly}
    />
  )
}