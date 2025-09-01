import { EstimateItem } from '../types'

// 見積管理機能専用のユーティリティ関数

// 見積ステータスの表示名を取得
export const getEstimateStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    draft: '下書き',
    submitted: '提出済み',
    approved: '承認済み',
    rejected: '却下',
    expired: '期限切れ',
  }
  return statusLabels[status] || status
}

// 見積ステータスの色を取得
export const getEstimateStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-yellow-100 text-yellow-800',
  }
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

// 取引先タイプの表示名を取得
export const getPartnerTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    customer: '得意先',
    supplier: '仕入先',
    both: '両方',
  }
  return typeLabels[type] || type
}

// 金額をフォーマット
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}

// 日付をフォーマット
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('ja-JP')
}

// 見積番号を生成（例: EST-2025-001）
export const generateEstimateNumber = (): string => {
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-3)
  return `EST-${year}-${timestamp}`
}

// 見積明細の階層レベルを取得
export const getEstimateItemLevel = (item: EstimateItem): number => {
  let level = 0
  let current = item
  while (current.parent) {
    level++
    current = current.parent
  }
  return level
}

// 見積明細の合計金額を計算
export const calculateEstimateTotal = (items: EstimateItem[]): number => {
  return items.reduce((total, item) => {
    if (item.item_type === 'item') {
      return total + (item.amount || 0)
    }
    return total
  }, 0)
}

// 見積明細の階層構造を構築
export const buildEstimateItemHierarchy = (items: EstimateItem[]): EstimateItem[] => {
  const itemMap = new Map<string, EstimateItem>()
  const rootItems: EstimateItem[] = []

  // まず全てのアイテムをマップに格納
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] })
  })

  // 親子関係を構築
  items.forEach(item => {
    const mappedItem = itemMap.get(item.id)!
    if (item.parent_id) {
      const parent = itemMap.get(item.parent_id)
      if (parent && parent.children) {
        parent.children.push(mappedItem)
      }
    } else {
      rootItems.push(mappedItem)
    }
  })

  return rootItems
}

// 見積明細の表示順序を取得
export const getEstimateItemDisplayOrder = (items: EstimateItem[]): (EstimateItem & { level: number })[] => {
  const result: (EstimateItem & { level: number })[] = []
  
  const addItem = (item: EstimateItem, level: number = 0) => {
    result.push({ ...item, level })
    if (item.children && item.children.length > 0) {
      item.children.forEach((child: EstimateItem) => addItem(child, level + 1))
    }
  }

  const hierarchy = buildEstimateItemHierarchy(items)
  hierarchy.forEach(item => addItem(item))
  
  return result
}
