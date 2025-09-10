'use client'

import { useState, useMemo, useEffect } from 'react'
import { Estimate } from '@/types/features/estimates/estimate'
import { EstimateBreakdownTree } from '@/types/features/estimates/estimateBreakdown'
import { useEstimateBreakdownTree } from '@/hooks/features/estimates/useEstimateBreakdowns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils/estimateUtils'
import { TreePine } from 'lucide-react'
import { EstimateBreakdownTreeView } from './EstimateBreakdownTreeView'
interface EstimateBreakdownStructureCardProps {
  estimate: Estimate
  isReadOnly?: boolean
  breakdowns?: EstimateBreakdownTree[]
  onBreakdownsChange?: (breakdowns: EstimateBreakdownTree[]) => void
}

export function EstimateBreakdownStructureCard({ 
  estimate, 
  onBreakdownsChange 
}: EstimateBreakdownStructureCardProps) {
  const { data: serverBreakdownTree, isLoading } = useEstimateBreakdownTree(estimate.id)
  const [activeTab, setActiveTab] = useState<'large' | 'medium' | 'small'>('large')
  
  // ローカル状態の内訳データ（編集用）
  const [localBreakdowns, setLocalBreakdowns] = useState<EstimateBreakdownTree[]>([])
  
  // サーバーデータが変更されたらローカル状態を更新
  useEffect(() => {
    if (serverBreakdownTree) {
      setLocalBreakdowns(serverBreakdownTree)
    }
  }, [serverBreakdownTree])
  
  // 親コンポーネントに変更を通知
  useEffect(() => {
    if (onBreakdownsChange) {
      onBreakdownsChange(localBreakdowns)
    }
  }, [localBreakdowns, onBreakdownsChange])




  const getTotalAmount = (breakdowns: EstimateBreakdownTree[] | undefined): number => {
    const safeBreakdowns = Array.isArray(breakdowns) ? breakdowns : []
    return safeBreakdowns.reduce((total, breakdown) => {
      return total + (breakdown.calculated_amount || 0)
    }, 0)
  }

  // タブ別に階層データをフィルタリング
  const filteredBreakdowns = useMemo(() => {
    if (!Array.isArray(localBreakdowns)) return []
    
    switch (activeTab) {
      case 'large':
        // 大内訳のみ表示（子要素なし）
        return localBreakdowns
          .filter(breakdown => breakdown.breakdown_type === 'large')
          .map(breakdown => ({
            ...breakdown,
            children: [] // 子要素を空にする
          }))
      case 'medium':
        // 大内訳と中内訳の階層表示（小内訳は非表示）
        return localBreakdowns
          .filter(breakdown => breakdown.breakdown_type === 'large')
          .map(breakdown => ({
            ...breakdown,
            children: breakdown.children?.map(mediumChild => ({
              ...mediumChild,
              children: [] // 小内訳を空にする
            })).filter(child => child.breakdown_type === 'medium') || []
          }))
      case 'small':
        // 大内訳、中内訳、小内訳の完全階層表示
        return localBreakdowns
          .filter(breakdown => breakdown.breakdown_type === 'large')
          .map(breakdown => ({
            ...breakdown,
            children: breakdown.children?.map(mediumChild => ({
              ...mediumChild,
              children: mediumChild.children?.filter(smallChild => smallChild.breakdown_type === 'small') || []
            })).filter(child => child.breakdown_type === 'medium') || []
          }))
      default:
        return localBreakdowns
    }
  }, [localBreakdowns, activeTab])

  // 各タイプの件数を計算
  const breakdownCounts = useMemo(() => {
    if (!Array.isArray(localBreakdowns)) return { large: 0, medium: 0, small: 0 }
    
    return {
      large: localBreakdowns.filter(b => b.breakdown_type === 'large').length,
      medium: localBreakdowns.filter(b => b.breakdown_type === 'medium').length,
      small: localBreakdowns.filter(b => b.breakdown_type === 'small').length,
    }
  }, [localBreakdowns])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            見積内訳
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            見積内訳
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              合計: {formatCurrency(getTotalAmount(localBreakdowns))}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'large' | 'medium' | 'small')}>
          <div className="flex justify-start">
            <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-auto">
              <TabsTrigger value="large" className="flex items-center gap-1 px-3 py-1 text-sm">
                大内訳
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {breakdownCounts.large}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="medium" className="flex items-center gap-1 px-3 py-1 text-sm">
                中内訳
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {breakdownCounts.medium}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="small" className="flex items-center gap-1 px-3 py-1 text-sm">
                小内訳
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {breakdownCounts.small}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="large" className="mt-4">
            <EstimateBreakdownTreeView
              breakdowns={filteredBreakdowns}
              currentTab="large"
            />
          </TabsContent>
          
          <TabsContent value="medium" className="mt-4">
            <EstimateBreakdownTreeView
              breakdowns={filteredBreakdowns}
              currentTab="medium"
            />
          </TabsContent>
          
          <TabsContent value="small" className="mt-4">
            <EstimateBreakdownTreeView
              breakdowns={filteredBreakdowns}
              currentTab="small"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
