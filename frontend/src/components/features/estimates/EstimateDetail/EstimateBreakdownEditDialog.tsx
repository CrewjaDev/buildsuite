'use client'

import { useState, useEffect } from 'react'
import { Estimate } from '@/types/features/estimates/estimate'
import { EstimateBreakdown, EstimateBreakdownTree } from '@/types/features/estimates/estimateBreakdown'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEstimateBreakdownTree, useCreateEstimateBreakdown, useUpdateEstimateBreakdown } from '@/hooks/features/estimates/useEstimateBreakdowns'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { PopoverSearchFilter } from '@/components/common/data-display/DataTable/PopoverSearchFilter'

interface EstimateBreakdownEditDialogProps {
  isOpen: boolean
  onClose: () => void
  estimate: Estimate
  onSuccess?: () => void
}

interface BreakdownEditState {
  largeBreakdowns: EstimateBreakdown[]
  mediumBreakdowns: EstimateBreakdown[]
  smallBreakdowns: EstimateBreakdown[]
  activeTab: 'large' | 'medium' | 'small'
  hasChanges: boolean
}

export function EstimateBreakdownEditDialog({
  isOpen,
  onClose,
  estimate,
  onSuccess
}: EstimateBreakdownEditDialogProps) {
  // データ取得（見積詳細ページと同じ方法を使用）
  const { data: breakdownsData, isLoading, refetch } = useEstimateBreakdownTree(estimate.id)
  const createBreakdownMutation = useCreateEstimateBreakdown(false) // トーストを表示しない
  const updateBreakdownMutation = useUpdateEstimateBreakdown(false) // トーストを表示しない
  const queryClient = useQueryClient()

  // ローカル状態管理
  const [editState, setEditState] = useState<BreakdownEditState>({
    largeBreakdowns: [],
    mediumBreakdowns: [],
    smallBreakdowns: [],
    activeTab: 'small',
    hasChanges: false
  })

  // ダイアログが開かれたときに最新データを取得
  useEffect(() => {
    if (isOpen) {
      refetch()
    }
  }, [isOpen, refetch])

  // データを階層別に分類
  useEffect(() => {
    if (breakdownsData) {
      // 階層構造から平坦な配列に変換
      const flattenBreakdowns = (breakdowns: EstimateBreakdownTree[]): EstimateBreakdown[] => {
        const result: EstimateBreakdown[] = []
        breakdowns.forEach(breakdown => {
          result.push(breakdown)
          if (breakdown.children && breakdown.children.length > 0) {
            result.push(...flattenBreakdowns(breakdown.children))
          }
        })
        return result
      }
      
      const allBreakdowns = flattenBreakdowns(breakdownsData)
      const largeBreakdowns = allBreakdowns.filter(b => b.breakdown_type === 'large')
      const mediumBreakdowns = allBreakdowns.filter(b => b.breakdown_type === 'medium')
      const smallBreakdowns = allBreakdowns.filter(b => b.breakdown_type === 'small')
      
      setEditState(prev => ({
        ...prev,
        largeBreakdowns,
        mediumBreakdowns,
        smallBreakdowns,
        hasChanges: false
      }))
    }
  }, [breakdownsData])

  // 初期状態の設定（小内訳が1つもない場合は1つ作成）
  useEffect(() => {
    if (breakdownsData && editState.smallBreakdowns.length === 0) {
      // データベースから取得された小内訳が存在するかチェック
      const flattenBreakdowns = (breakdowns: EstimateBreakdownTree[]): EstimateBreakdown[] => {
        const result: EstimateBreakdown[] = []
        breakdowns.forEach(breakdown => {
          result.push(breakdown)
          if (breakdown.children && breakdown.children.length > 0) {
            result.push(...flattenBreakdowns(breakdown.children))
          }
        })
        return result
      }
      
      const allBreakdowns = flattenBreakdowns(breakdownsData)
      const dbSmallBreakdowns = allBreakdowns.filter(b => b.breakdown_type === 'small' && !b.id.startsWith('temp-'))
      
      // データベースに小内訳が存在しない場合のみ、一時的な小内訳を作成
      // ただし、削除されたデータに対しては一時的な小内訳を作成しない
      if (dbSmallBreakdowns.length === 0 && estimate && estimate.id) {
        const newSmallBreakdown: EstimateBreakdown = {
          id: `temp-${Date.now()}`,
          estimate_id: estimate.id,
          parent_id: null,
          breakdown_type: 'small',
          name: '',
          display_order: 1,
          description: '',
          quantity: 1,
          unit: '式',
          unit_price: 0,
          direct_amount: 0,
          calculated_amount: 0,
          estimated_cost: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        setEditState(prev => ({
          ...prev,
          smallBreakdowns: [newSmallBreakdown],
          hasChanges: true
        }))
      }
    }
  }, [breakdownsData, editState.smallBreakdowns.length, estimate.id])


  // 段階的追加機能：中内訳を追加したときに中内訳タブを表示
  const handleAddMediumBreakdown = () => {
    handleAddBreakdown('medium')
    // 中内訳タブをアクティブにする（小内訳タブはそのまま）
    setEditState(prev => ({ ...prev, activeTab: 'medium' }))
  }

  // 段階的追加機能：大内訳を追加したときに大内訳タブを表示
  const handleAddLargeBreakdown = () => {
    handleAddBreakdown('large')
    // 大内訳タブをアクティブにする（小内訳タブはそのまま）
    setEditState(prev => ({ ...prev, activeTab: 'large' }))
  }

  // 特定の親に中内訳を追加
  const handleAddMediumBreakdownToParent = (parentId: string) => {
    const newMediumBreakdown: EstimateBreakdown = {
      id: `temp-medium-${Date.now()}`,
      estimate_id: estimate.id,
      breakdown_type: 'medium',
      name: '',
      parent_id: parentId || null,
      display_order: 1,
      construction_method: '',
      construction_classification_id: undefined,
      description: '',
      quantity: 1,
      unit: '式',
      unit_price: 0,
      direct_amount: 0,
      calculated_amount: 0,
      estimated_cost: 0,
      supplier_id: undefined,
      order_request_content: '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // 関連データ
      construction_classification: undefined,
      supplier: undefined
    }

    setEditState(prev => ({
      ...prev,
      mediumBreakdowns: [...prev.mediumBreakdowns, newMediumBreakdown],
      hasChanges: true
    }))
  }

  // 特定の親に小内訳を追加
  const handleAddSmallBreakdownToParent = (parentId: string) => {
    const newSmallBreakdown: EstimateBreakdown = {
      id: `temp-small-${Date.now()}`,
      estimate_id: estimate.id,
      breakdown_type: 'small',
      name: '',
      parent_id: parentId || null,
      display_order: 1,
      construction_method: '',
      construction_classification_id: undefined,
      description: '',
      quantity: 1,
      unit: '式',
      unit_price: 0,
      direct_amount: 0,
      calculated_amount: 0,
      estimated_cost: 0,
      supplier_id: undefined,
      order_request_content: '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // 関連データ
      construction_classification: undefined,
      supplier: undefined
    }

    setEditState(prev => ({
      ...prev,
      smallBreakdowns: [...prev.smallBreakdowns, newSmallBreakdown],
      hasChanges: true
    }))
  }

  // 内訳の追加
  const handleAddBreakdown = (type: 'large' | 'medium' | 'small') => {
    // 親選択のロジック
    let parentId: string | null = null
    
    if (type === 'medium') {
      // 中内訳の場合は、大内訳を親として選択可能
      const largeBreakdowns = editState.largeBreakdowns
      if (largeBreakdowns.length > 0) {
        parentId = largeBreakdowns[0].id // 最初の大内訳を親として設定
      }
    } else if (type === 'small') {
      // 小内訳の場合は、中内訳または大内訳を親として選択可能
      const mediumBreakdowns = editState.mediumBreakdowns
      if (mediumBreakdowns.length > 0) {
        parentId = mediumBreakdowns[0].id // 最初の中内訳を親として設定
      } else {
        const largeBreakdowns = editState.largeBreakdowns
        if (largeBreakdowns.length > 0) {
          parentId = largeBreakdowns[0].id // 大内訳を親として設定
        }
      }
    }

    const newBreakdown: EstimateBreakdown = {
      id: `temp-${Date.now()}`,
      estimate_id: estimate.id,
      parent_id: parentId,
      breakdown_type: type,
      name: '',
      display_order: 1,
      description: '',
      quantity: 1,
      unit: '式',
      unit_price: 0,
      direct_amount: 0,
      calculated_amount: 0,
      estimated_cost: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setEditState(prev => ({
      ...prev,
      [`${type}Breakdowns`]: [...prev[`${type}Breakdowns`], newBreakdown],
      hasChanges: true
    }))
  }

  // 内訳の更新
  const handleUpdateBreakdown = (type: 'large' | 'medium' | 'small', id: string, field: string, value: unknown) => {
    setEditState(prev => ({
      ...prev,
      [`${type}Breakdowns`]: prev[`${type}Breakdowns`].map(breakdown =>
        breakdown.id === id ? { ...breakdown, [field]: value } : breakdown
      ),
      hasChanges: true
    }))
  }

  // 内訳の削除
  const handleDeleteBreakdown = (type: 'large' | 'medium' | 'small', id: string) => {
    // 小内訳の場合は最低1つは残す
    if (type === 'small' && editState.smallBreakdowns.length <= 1) {
      toast.error('小内訳は最低1つ必要です')
      return
    }

    // 親が削除された場合、子要素を「未設定」親に移動
    if (type === 'large') {
      // 大内訳が削除された場合、中内訳と小内訳の親をnullに設定
      setEditState(prev => ({
        ...prev,
        mediumBreakdowns: prev.mediumBreakdowns.map(medium => 
          medium.parent_id === id ? { ...medium, parent_id: null } : medium
        ),
        smallBreakdowns: prev.smallBreakdowns.map(small => 
          small.parent_id === id ? { ...small, parent_id: null } : small
        ),
        [`${type}Breakdowns`]: prev[`${type}Breakdowns`].filter(breakdown => breakdown.id !== id),
        hasChanges: true
      }))
    } else if (type === 'medium') {
      // 中内訳が削除された場合、小内訳の親をnullに設定
      setEditState(prev => ({
        ...prev,
        smallBreakdowns: prev.smallBreakdowns.map(small => 
          small.parent_id === id ? { ...small, parent_id: null } : small
        ),
        [`${type}Breakdowns`]: prev[`${type}Breakdowns`].filter(breakdown => breakdown.id !== id),
        hasChanges: true
      }))
    } else {
      setEditState(prev => ({
        ...prev,
        [`${type}Breakdowns`]: prev[`${type}Breakdowns`].filter(breakdown => breakdown.id !== id),
        hasChanges: true
      }))
    }
  }

  // 親選択オプションを取得
  const getParentOptions = (type: 'large' | 'medium' | 'small') => {
    const options = [{ value: '', label: '未設定' }]
    
    if (type === 'medium') {
      // 中内訳の場合は大内訳を親として選択可能
      editState.largeBreakdowns.forEach(breakdown => {
        options.push({ value: breakdown.id, label: breakdown.name || '大内訳(未設定)' })
      })
    } else if (type === 'small') {
      // 小内訳の場合は中内訳または大内訳を親として選択可能
      editState.mediumBreakdowns.forEach(breakdown => {
        options.push({ value: breakdown.id, label: breakdown.name || '中内訳(未設定)' })
      })
      editState.largeBreakdowns.forEach(breakdown => {
        options.push({ value: breakdown.id, label: breakdown.name || '大内訳(未設定)' })
      })
    }
    return options
  }

  // 内訳の順序変更
  const handleMoveBreakdown = (type: 'large' | 'medium' | 'small', id: string, direction: 'up' | 'down') => {
    setEditState(prev => {
      const breakdowns = [...prev[`${type}Breakdowns`]]
      const index = breakdowns.findIndex(b => b.id === id)
      
      if (direction === 'up' && index > 0) {
        [breakdowns[index], breakdowns[index - 1]] = [breakdowns[index - 1], breakdowns[index]]
      } else if (direction === 'down' && index < breakdowns.length - 1) {
        [breakdowns[index], breakdowns[index + 1]] = [breakdowns[index + 1], breakdowns[index]]
      }
      
      return {
        ...prev,
        [`${type}Breakdowns`]: breakdowns,
        hasChanges: true
      }
    })
  }

  // 保存処理
  const handleSave = async () => {
    try {
      // バリデーション
      const allBreakdowns = [...editState.largeBreakdowns, ...editState.mediumBreakdowns, ...editState.smallBreakdowns]
      const emptyNames = allBreakdowns.filter(b => !b.name.trim())
      
      if (emptyNames.length > 0) {
        toast.error('内訳名称は必須です')
        return
      }

      // 新規作成と更新を分けて処理
      for (const breakdown of allBreakdowns) {
        if (breakdown.id.startsWith('temp-')) {
          // 新規作成
          await createBreakdownMutation.mutateAsync({
            estimate_id: breakdown.estimate_id,
            parent_id: breakdown.parent_id || undefined,
            breakdown_type: breakdown.breakdown_type,
            name: breakdown.name,
            description: breakdown.description,
            quantity: breakdown.quantity,
            unit: breakdown.unit,
            unit_price: breakdown.unit_price,
            direct_amount: breakdown.direct_amount,
            estimated_cost: breakdown.estimated_cost
          })
        } else {
          // 更新
          await updateBreakdownMutation.mutateAsync({
            breakdownId: breakdown.id,
            data: {
              parent_id: breakdown.parent_id || undefined,
              name: breakdown.name,
              description: breakdown.description,
              quantity: breakdown.quantity,
              unit: breakdown.unit,
              unit_price: breakdown.unit_price,
              direct_amount: breakdown.direct_amount,
              estimated_cost: breakdown.estimated_cost
            }
          })
        }
      }

      // React Queryのキャッシュを無効化
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdown-tree', estimate.id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdowns', estimate.id] 
      })
      // より包括的なキャッシュ無効化
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdown-tree'] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['estimate-breakdowns'] 
      })
      
      toast.success('見積内訳を保存しました')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('見積内訳の保存に失敗しました:', error)
      toast.error('見積内訳の保存に失敗しました。もう一度お試しください。')
    }
  }

  // ヘッダー行のレンダリング
  const renderHeaderRow = (type: 'large' | 'medium' | 'small') => {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 border rounded-lg font-medium text-sm">
        {/* 移動ボタン列 */}
        <div className="w-16 text-center">操作</div>
        
        {/* 親選択（大内訳以外） */}
        {(type === 'medium' || type === 'small') && (
          <div className="w-32">親内訳</div>
        )}
        
        {/* 内訳名称 */}
        <div className="flex-1">内訳名称</div>
        
        {/* 工法 */}
        <div className="w-24">工法</div>
        
        {/* 工事分類 */}
        <div className="w-24">工事分類</div>
        
        {/* 摘要 */}
        <div className="w-32">摘要</div>
        
        {/* 数量 */}
        <div className="w-20">数量</div>
        
        {/* 単価 */}
        <div className="w-24">単価</div>
        
        {/* 金額備考（小内訳のみ） */}
        {type === 'small' && (
          <div className="w-24">金額備考</div>
        )}
        
        {/* 発注先 */}
        <div className="w-24">発注先</div>
        
        {/* 発注依頼内容 */}
        <div className="w-32">発注依頼内容</div>
        
        {/* 予想原価（小内訳のみ） */}
        {type === 'small' && (
          <div className="w-24">予想原価</div>
        )}
        
        {/* 削除ボタン列 */}
        <div className="w-16 text-center">削除</div>
      </div>
    )
  }

  // 中内訳の階層表示レンダリング
  const renderHierarchicalMediumBreakdowns = () => {
    const result: React.ReactElement[] = []
    
    // 大内訳ごとにグループ化
    const largeBreakdowns = editState.largeBreakdowns
    const mediumBreakdowns = editState.mediumBreakdowns
    
    // 大内訳が存在しない場合は、すべての中内訳を親なしとして表示
    if (largeBreakdowns.length === 0) {
      mediumBreakdowns.forEach(mediumBreakdown => {
        result.push(renderBreakdownRow(mediumBreakdown, 'medium'))
      })
      return result
    }
    
    largeBreakdowns.forEach(largeBreakdown => {
      // 大内訳行を表示
      result.push(
        <div key={`large-${largeBreakdown.id}`} className="flex items-center gap-2 p-2 border rounded-lg bg-blue-50">
          {/* 移動ボタン列 */}
          <div className="w-16 text-center">
            {/* 大内訳は移動ボタンなし */}
          </div>
          
          {/* 親選択列（大内訳は表示しない） */}
          <div className="w-32"></div>
          
          {/* 大内訳名称 */}
          <div className="flex-1">
            <div className="font-medium text-blue-800">
              {largeBreakdown.name || '大内訳(未設定)'}
            </div>
          </div>
          
          {/* その他の列は空 */}
          <div className="w-24"></div>
          <div className="w-24"></div>
          <div className="w-32"></div>
          <div className="w-20"></div>
          <div className="w-24"></div>
          <div className="w-24"></div>
          <div className="w-32"></div>
          
          {/* 操作列（大内訳は中内訳追加ボタン） */}
          <div className="w-16 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddMediumBreakdownToParent(largeBreakdown.id)}
              className="h-6 w-6 p-0"
              title="中内訳を追加"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
      
      // この大内訳に紐づく中内訳を表示
      const childMediumBreakdowns = mediumBreakdowns.filter(medium => medium.parent_id === largeBreakdown.id)
      childMediumBreakdowns.forEach(mediumBreakdown => {
        result.push(
          <div key={mediumBreakdown.id} className="flex items-center gap-2 p-2 border rounded-lg ml-4">
            {/* 移動ボタン列 */}
            <div className="flex flex-col gap-1 w-16">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveBreakdown('medium', mediumBreakdown.id, 'up')}
                disabled={childMediumBreakdowns.indexOf(mediumBreakdown) === 0}
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveBreakdown('medium', mediumBreakdown.id, 'down')}
                disabled={childMediumBreakdowns.indexOf(mediumBreakdown) === childMediumBreakdowns.length - 1}
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            {/* 親選択（中内訳） */}
            <div className="w-32">
              <PopoverSearchFilter
                value={mediumBreakdown.parent_id || ''}
                onValueChange={(value) => handleUpdateBreakdown('medium', mediumBreakdown.id, 'parent_id', value)}
                options={getParentOptions('medium')}
                placeholder="親内訳を選択"
                className="w-full"
              />
            </div>

            {/* 中内訳名称 */}
            <div className="flex-1">
              <Input
                value={mediumBreakdown.name}
                onChange={(e) => handleUpdateBreakdown('medium', mediumBreakdown.id, 'name', e.target.value)}
                placeholder="中内訳名称を入力"
                className="w-full"
              />
            </div>

            {/* 工法 */}
            <div className="w-24">
              <Input
                value={mediumBreakdown.construction_method || ''}
                onChange={(e) => handleUpdateBreakdown('medium', mediumBreakdown.id, 'construction_method', e.target.value)}
                placeholder="工法"
                className="w-full"
              />
            </div>

            {/* 工事分類 */}
            <div className="w-24">
              <Input
                value={mediumBreakdown.construction_classification?.name || ''}
                onChange={(e) => handleUpdateBreakdown('medium', mediumBreakdown.id, 'construction_classification_id', e.target.value)}
                placeholder="工事分類"
                className="w-full"
              />
            </div>

            {/* 摘要 */}
            <div className="w-32">
              <Input
                value={mediumBreakdown.description || ''}
                onChange={(e) => handleUpdateBreakdown('medium', mediumBreakdown.id, 'description', e.target.value)}
                placeholder="摘要"
                className="w-full"
              />
            </div>

            {/* 数量 */}
            <div className="w-20">
              <Input
                type="number"
                value={mediumBreakdown.quantity}
                onChange={(e) => handleUpdateBreakdown('medium', mediumBreakdown.id, 'quantity', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>

            {/* 単価 */}
            <div className="w-24">
              <Input
                type="number"
                value={mediumBreakdown.unit_price}
                onChange={(e) => handleUpdateBreakdown('medium', mediumBreakdown.id, 'unit_price', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>

            {/* 発注先 */}
            <div className="w-24">
              <Input
                value={mediumBreakdown.supplier?.name || ''}
                onChange={(e) => handleUpdateBreakdown('medium', mediumBreakdown.id, 'supplier_id', e.target.value)}
                placeholder="発注先"
                className="w-full"
              />
            </div>

            {/* 発注依頼内容 */}
            <div className="w-32">
              <Input
                value={mediumBreakdown.order_request_content || ''}
                onChange={(e) => handleUpdateBreakdown('medium', mediumBreakdown.id, 'order_request_content', e.target.value)}
                placeholder="発注依頼内容"
                className="w-full"
              />
            </div>

            {/* 削除ボタン */}
            <div className="w-16 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteBreakdown('medium', mediumBreakdown.id)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )
      })
    })
    
    // 親なしの中内訳を「上位内訳（未設定）」として表示
    const orphanMediumBreakdowns = mediumBreakdowns.filter(medium => !medium.parent_id)
    if (orphanMediumBreakdowns.length > 0) {
      // 「上位内訳（未設定）」の親行を表示
      result.push(
        <div key="orphan-parent" className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
          {/* 移動ボタン列 */}
          <div className="w-16 text-center">
            {/* 未設定は移動ボタンなし */}
          </div>
          
          {/* 親選択列（未設定は表示しない） */}
          <div className="w-32"></div>
          
          {/* 未設定名称 */}
          <div className="flex-1">
            <div className="font-medium text-gray-600">
              上位内訳（未設定）
            </div>
          </div>
          
          {/* その他の列は空 */}
          <div className="w-24"></div>
          <div className="w-24"></div>
          <div className="w-32"></div>
          <div className="w-20"></div>
          <div className="w-24"></div>
          <div className="w-24"></div>
          <div className="w-32"></div>
          
          {/* 操作列（未設定は中内訳追加ボタン） */}
          <div className="w-16 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddMediumBreakdownToParent('')}
              className="h-6 w-6 p-0"
              title="中内訳を追加"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
      
      // 親なしの中内訳を表示
      orphanMediumBreakdowns.forEach(mediumBreakdown => {
        result.push(renderBreakdownRow(mediumBreakdown, 'medium'))
      })
    }
    
    return result
  }

  // 小内訳の階層表示レンダリング
  const renderHierarchicalSmallBreakdowns = () => {
    const result: React.ReactElement[] = []
    
    // 中内訳ごとにグループ化
    const mediumBreakdowns = editState.mediumBreakdowns
    const smallBreakdowns = editState.smallBreakdowns
    
    
    // 中内訳が存在しない場合は、すべての小内訳を親なしとして表示
    if (mediumBreakdowns.length === 0) {
      smallBreakdowns.forEach(smallBreakdown => {
        result.push(renderBreakdownRow(smallBreakdown, 'small'))
      })
      return result
    }
    
    mediumBreakdowns.forEach(mediumBreakdown => {
      // 中内訳行を表示
      result.push(
        <div key={`medium-${mediumBreakdown.id}`} className="flex items-center gap-2 p-2 border rounded-lg bg-blue-50">
          {/* 移動ボタン列 */}
          <div className="w-16 text-center">
            {/* 中内訳は移動ボタンなし */}
          </div>
          
          {/* 親選択列（中内訳は表示しない） */}
          <div className="w-32"></div>
          
          {/* 中内訳名称 */}
          <div className="flex-1">
            <div className="font-medium text-blue-800">
              {mediumBreakdown.name || '中内訳(未設定)'}
            </div>
          </div>
          
          {/* その他の列は空 */}
          <div className="w-24"></div>
          <div className="w-24"></div>
          <div className="w-32"></div>
          <div className="w-20"></div>
          <div className="w-24"></div>
          <div className="w-24"></div>
          <div className="w-24"></div>
          <div className="w-32"></div>
          <div className="w-24"></div>
          
          {/* 操作列（中内訳は小内訳追加ボタン） */}
          <div className="w-16 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddSmallBreakdownToParent(mediumBreakdown.id)}
              className="h-6 w-6 p-0"
              title="小内訳を追加"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
      
      // この中内訳に紐づく小内訳を表示
      const childSmallBreakdowns = smallBreakdowns.filter(small => small.parent_id === mediumBreakdown.id)
      childSmallBreakdowns.forEach(smallBreakdown => {
        result.push(
          <div key={smallBreakdown.id} className="flex items-center gap-2 p-2 border rounded-lg ml-4">
            {/* 移動ボタン列 */}
            <div className="flex flex-col gap-1 w-16">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveBreakdown('small', smallBreakdown.id, 'up')}
                disabled={childSmallBreakdowns.indexOf(smallBreakdown) === 0}
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveBreakdown('small', smallBreakdown.id, 'down')}
                disabled={childSmallBreakdowns.indexOf(smallBreakdown) === childSmallBreakdowns.length - 1}
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            {/* 親選択（小内訳） */}
            <div className="w-32">
              <PopoverSearchFilter
                value={smallBreakdown.parent_id || ''}
                onValueChange={(value) => handleUpdateBreakdown('small', smallBreakdown.id, 'parent_id', value)}
                options={getParentOptions('small')}
                placeholder="親内訳を選択"
                className="w-full"
              />
            </div>

            {/* 小内訳名称 */}
            <div className="flex-1">
              <Input
                value={smallBreakdown.name}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'name', e.target.value)}
                placeholder="小内訳名称を入力"
                className="w-full"
              />
            </div>

            {/* 工法 */}
            <div className="w-24">
              <Input
                value={smallBreakdown.construction_method || ''}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'construction_method', e.target.value)}
                placeholder="工法"
                className="w-full"
              />
            </div>

            {/* 工事分類 */}
            <div className="w-24">
              <Input
                value={smallBreakdown.construction_classification?.name || ''}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'construction_classification_id', e.target.value)}
                placeholder="工事分類"
                className="w-full"
              />
            </div>

            {/* 摘要 */}
            <div className="w-32">
              <Input
                value={smallBreakdown.description || ''}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'description', e.target.value)}
                placeholder="摘要"
                className="w-full"
              />
            </div>

            {/* 数量 */}
            <div className="w-20">
              <Input
                type="number"
                value={smallBreakdown.quantity}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'quantity', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>

            {/* 単価 */}
            <div className="w-24">
              <Input
                type="number"
                value={smallBreakdown.unit_price}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'unit_price', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>

            {/* 金額備考 */}
            <div className="w-24">
              <Input
                type="number"
                value={smallBreakdown.direct_amount}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'direct_amount', parseFloat(e.target.value) || 0)}
                placeholder="金額"
                className="w-full"
              />
            </div>

            {/* 発注先 */}
            <div className="w-24">
              <Input
                value={smallBreakdown.supplier?.name || ''}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'supplier_id', e.target.value)}
                placeholder="発注先"
                className="w-full"
              />
            </div>

            {/* 発注依頼内容 */}
            <div className="w-32">
              <Input
                value={smallBreakdown.order_request_content || ''}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'order_request_content', e.target.value)}
                placeholder="発注依頼内容"
                className="w-full"
              />
            </div>

            {/* 予想原価 */}
            <div className="w-24">
              <Input
                type="number"
                value={smallBreakdown.estimated_cost}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'estimated_cost', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>

            {/* 削除ボタン */}
            <div className="w-16 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteBreakdown('small', smallBreakdown.id)}
                disabled={editState.smallBreakdowns.length <= 1}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )
      })
    })
    
    // 親なしの小内訳を「上位内訳（未設定）」として表示
    const orphanSmallBreakdowns = smallBreakdowns.filter(small => !small.parent_id)
    if (orphanSmallBreakdowns.length > 0) {
      // 「上位内訳（未設定）」の親行を表示
      result.push(
        <div key="orphan-parent" className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
          {/* 移動ボタン列 */}
          <div className="w-16 text-center">
            {/* 未設定は移動ボタンなし */}
          </div>
          
          {/* 親選択列（未設定は表示しない） */}
          <div className="w-32"></div>
          
          {/* 未設定名称 */}
          <div className="flex-1">
            <div className="font-medium text-gray-600">
              上位内訳（未設定）
            </div>
          </div>
          
          {/* その他の列は空 */}
          <div className="w-24"></div>
          <div className="w-24"></div>
          <div className="w-32"></div>
          <div className="w-20"></div>
          <div className="w-24"></div>
          <div className="w-24"></div>
          <div className="w-24"></div>
          <div className="w-32"></div>
          <div className="w-24"></div>
          
          {/* 操作列（未設定は小内訳追加ボタン） */}
          <div className="w-16 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddSmallBreakdownToParent('')}
              className="h-6 w-6 p-0"
              title="小内訳を追加"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
      
      // 親なしの小内訳を表示
      orphanSmallBreakdowns.forEach(smallBreakdown => {
        result.push(
          <div key={smallBreakdown.id} className="flex items-center gap-2 p-2 border rounded-lg ml-4">
            {/* 移動ボタン列 */}
            <div className="flex flex-col gap-1 w-16">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveBreakdown('small', smallBreakdown.id, 'up')}
                disabled={orphanSmallBreakdowns.indexOf(smallBreakdown) === 0}
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveBreakdown('small', smallBreakdown.id, 'down')}
                disabled={orphanSmallBreakdowns.indexOf(smallBreakdown) === orphanSmallBreakdowns.length - 1}
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            {/* 親選択（小内訳） */}
            <div className="w-32">
              <PopoverSearchFilter
                value={smallBreakdown.parent_id || ''}
                onValueChange={(value) => handleUpdateBreakdown('small', smallBreakdown.id, 'parent_id', value)}
                options={getParentOptions('small')}
                placeholder="親内訳を選択"
                className="w-full"
              />
            </div>

            {/* 小内訳名称 */}
            <div className="flex-1">
              <Input
                value={smallBreakdown.name}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'name', e.target.value)}
                placeholder="小内訳名称を入力"
                className="w-full"
              />
            </div>

            {/* 工法 */}
            <div className="w-24">
              <Input
                value={smallBreakdown.construction_method || ''}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'construction_method', e.target.value)}
                placeholder="工法"
                className="w-full"
              />
            </div>

            {/* 工事分類 */}
            <div className="w-24">
              <Input
                value={smallBreakdown.construction_classification?.name || ''}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'construction_classification_id', e.target.value)}
                placeholder="工事分類"
                className="w-full"
              />
            </div>

            {/* 摘要 */}
            <div className="w-32">
              <Input
                value={smallBreakdown.description || ''}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'description', e.target.value)}
                placeholder="摘要"
                className="w-full"
              />
            </div>

            {/* 数量 */}
            <div className="w-20">
              <Input
                type="number"
                value={smallBreakdown.quantity}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'quantity', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>

            {/* 単価 */}
            <div className="w-24">
              <Input
                type="number"
                value={smallBreakdown.unit_price}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'unit_price', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>

            {/* 金額備考 */}
            <div className="w-24">
              <Input
                type="number"
                value={smallBreakdown.direct_amount}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'direct_amount', parseFloat(e.target.value) || 0)}
                placeholder="金額"
                className="w-full"
              />
            </div>

            {/* 発注先 */}
            <div className="w-24">
              <Input
                value={smallBreakdown.supplier?.name || ''}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'supplier_id', e.target.value)}
                placeholder="発注先"
                className="w-full"
              />
            </div>

            {/* 発注依頼内容 */}
            <div className="w-32">
              <Input
                value={smallBreakdown.order_request_content || ''}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'order_request_content', e.target.value)}
                placeholder="発注依頼内容"
                className="w-full"
              />
            </div>

            {/* 予想原価 */}
            <div className="w-24">
              <Input
                type="number"
                value={smallBreakdown.estimated_cost}
                onChange={(e) => handleUpdateBreakdown('small', smallBreakdown.id, 'estimated_cost', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>

            {/* 削除ボタン */}
            <div className="w-16 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteBreakdown('small', smallBreakdown.id)}
                disabled={editState.smallBreakdowns.length <= 1}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )
      })
    }
    
    return result
  }

  // 内訳行のレンダリング
  const renderBreakdownRow = (breakdown: EstimateBreakdown, type: 'large' | 'medium' | 'small') => {
    return (
      <div key={breakdown.id} className="flex items-center gap-2 p-2 border rounded-lg">
        {/* 移動ボタン */}
        <div className="flex flex-col gap-1 w-16">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleMoveBreakdown(type, breakdown.id, 'up')}
            disabled={editState[`${type}Breakdowns`].indexOf(breakdown) === 0}
            className="h-6 w-6 p-0"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleMoveBreakdown(type, breakdown.id, 'down')}
            disabled={editState[`${type}Breakdowns`].indexOf(breakdown) === editState[`${type}Breakdowns`].length - 1}
            className="h-6 w-6 p-0"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        {/* 親選択（大内訳以外） */}
        {(type === 'medium' || type === 'small') && (
          <div className="w-32">
            <PopoverSearchFilter
              options={getParentOptions(type)}
              value={breakdown.parent_id || ''}
              onValueChange={(value: string) => handleUpdateBreakdown(type, breakdown.id, 'parent_id', value || null)}
              placeholder="親を選択"
              className="w-full"
            />
          </div>
        )}

        {/* 内訳名称 */}
        <div className="flex-1">
          <Input
            value={breakdown.name}
            onChange={(e) => handleUpdateBreakdown(type, breakdown.id, 'name', e.target.value)}
            placeholder={`${type === 'large' ? '大' : type === 'medium' ? '中' : '小'}内訳名称を入力`}
            className="w-full"
          />
        </div>

        {/* 工法 */}
        <div className="w-24">
          <Input
            value={breakdown.construction_method || ''}
            onChange={(e) => handleUpdateBreakdown(type, breakdown.id, 'construction_method', e.target.value)}
            placeholder="工法"
            className="w-full"
          />
        </div>

        {/* 工事分類 */}
        <div className="w-24">
          <Input
            value={breakdown.construction_classification?.name || ''}
            onChange={(e) => handleUpdateBreakdown(type, breakdown.id, 'construction_classification_id', e.target.value)}
            placeholder="工事分類"
            className="w-full"
          />
        </div>

        {/* 摘要 */}
        <div className="w-32">
          <Input
            value={breakdown.description || ''}
            onChange={(e) => handleUpdateBreakdown(type, breakdown.id, 'description', e.target.value)}
            placeholder="摘要"
            className="w-full"
          />
        </div>

        {/* 数量 */}
        <div className="w-20">
          <Input
            type="number"
            value={breakdown.quantity}
            onChange={(e) => handleUpdateBreakdown(type, breakdown.id, 'quantity', parseFloat(e.target.value) || 0)}
            className="w-full"
          />
        </div>

        {/* 単価 */}
        <div className="w-24">
          <Input
            type="number"
            value={breakdown.unit_price}
            onChange={(e) => handleUpdateBreakdown(type, breakdown.id, 'unit_price', parseFloat(e.target.value) || 0)}
            className="w-full"
          />
        </div>

        {/* 金額備考（小内訳のみ） */}
        {type === 'small' && (
          <div className="w-24">
            <Input
              type="number"
              value={breakdown.direct_amount}
              onChange={(e) => handleUpdateBreakdown(type, breakdown.id, 'direct_amount', parseFloat(e.target.value) || 0)}
              placeholder="金額"
              className="w-full"
            />
          </div>
        )}

        {/* 発注先 */}
        <div className="w-24">
          <Input
            value={breakdown.supplier?.name || ''}
            onChange={(e) => handleUpdateBreakdown(type, breakdown.id, 'supplier_id', e.target.value)}
            placeholder="発注先"
            className="w-full"
          />
        </div>

        {/* 発注依頼内容 */}
        <div className="w-32">
          <Input
            value={breakdown.order_request_content || ''}
            onChange={(e) => handleUpdateBreakdown(type, breakdown.id, 'order_request_content', e.target.value)}
            placeholder="発注依頼内容"
            className="w-full"
          />
        </div>

        {/* 予想原価（小内訳のみ） */}
        {type === 'small' && (
          <div className="w-24">
            <Input
              type="number"
              value={breakdown.estimated_cost}
              onChange={(e) => handleUpdateBreakdown(type, breakdown.id, 'estimated_cost', parseFloat(e.target.value) || 0)}
              className="w-full"
            />
          </div>
        )}

        {/* 削除ボタン */}
        <div className="w-16 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteBreakdown(type, breakdown.id)}
            disabled={type === 'small' && editState.smallBreakdowns.length <= 1}
            className="h-6 w-6 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[95vw] max-h-[80vh]">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>見積内訳編集</DialogTitle>
          <DialogDescription>
            見積内訳の階層構造を管理します。小内訳から順番に追加していくことができます。
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={editState.activeTab} onValueChange={(value) => setEditState(prev => ({ ...prev, activeTab: value as 'large' | 'medium' | 'small' }))}>
          <TabsList className="flex w-full justify-start">
            {/* 大内訳 */}
            {editState.largeBreakdowns.length > 0 ? (
              <TabsTrigger value="large" className="px-4 py-2 text-sm font-medium data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
                大内訳
              </TabsTrigger>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddLargeBreakdown()}
                className="px-4 py-2 h-8 text-sm font-medium hover:bg-gray-100"
              >
                <Plus className="h-3 w-3 mr-1" />
                大内訳を追加
              </Button>
            )}
            
            {/* 中内訳 */}
            {editState.mediumBreakdowns.length > 0 ? (
              <TabsTrigger value="medium" className="px-4 py-2 text-sm font-medium data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
                中内訳
              </TabsTrigger>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddMediumBreakdown()}
                className="px-4 py-2 h-8 text-sm font-medium hover:bg-gray-100"
                disabled={editState.smallBreakdowns.length === 0}
              >
                <Plus className="h-3 w-3 mr-1" />
                中内訳を追加
              </Button>
            )}
            
            {/* 小内訳 */}
            <TabsTrigger value="small" className="px-4 py-2 text-sm font-medium data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
              小内訳
            </TabsTrigger>
          </TabsList>

          {/* 大内訳タブ */}
          <TabsContent value="large" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">大内訳</h3>
              <Button onClick={() => handleAddBreakdown('large')}>
                <Plus className="h-4 w-4 mr-2" />
                大内訳を追加
              </Button>
            </div>
            
            <div className="space-y-2">
              {renderHeaderRow('large')}
              {editState.largeBreakdowns.map(breakdown => renderBreakdownRow(breakdown, 'large'))}
            </div>
          </TabsContent>

          {/* 中内訳タブ */}
          <TabsContent value="medium" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">中内訳</h3>
              <Button onClick={() => handleAddMediumBreakdownToParent('')}>
                <Plus className="h-4 w-4 mr-2" />
                中内訳を追加
              </Button>
            </div>
            
            
            <div className="space-y-2">
              {renderHeaderRow('medium')}
              {renderHierarchicalMediumBreakdowns()}
            </div>
          </TabsContent>

          {/* 小内訳タブ */}
          <TabsContent value="small" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">小内訳</h3>
              <Button onClick={() => handleAddSmallBreakdownToParent('')}>
                <Plus className="h-4 w-4 mr-2" />
                小内訳を追加
              </Button>
            </div>
            
            
            <div className="space-y-2">
              {renderHeaderRow('small')}
              {renderHierarchicalSmallBreakdowns()}
            </div>
          </TabsContent>

        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createBreakdownMutation.isPending || updateBreakdownMutation.isPending}>
            キャンセル
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={createBreakdownMutation.isPending || updateBreakdownMutation.isPending || !editState.hasChanges}
          >
            {createBreakdownMutation.isPending || updateBreakdownMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EstimateBreakdownEditDialog
