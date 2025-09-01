import { EstimateStatus } from '@/types/features/estimates/estimate'

/**
 * 見積ステータスのラベルを取得
 */
export function getEstimateStatusLabel(status: string): string {
  const statusMap: Record<EstimateStatus, string> = {
    draft: '下書き',
    submitted: '提出済み',
    approved: '承認済み',
    rejected: '却下',
    expired: '期限切れ'
  }
  return statusMap[status as EstimateStatus] || status
}

/**
 * 見積ステータスの色クラスを取得
 */
export function getEstimateStatusColor(status: string): string {
  const colorMap: Record<EstimateStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-yellow-100 text-yellow-800'
  }
  return colorMap[status as EstimateStatus] || 'bg-gray-100 text-gray-800'
}

/**
 * 通貨フォーマット
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount)
}

/**
 * 日付フォーマット
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

/**
 * 日時フォーマット
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * 見積番号を生成
 */
export function generateEstimateNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `EST-${year}${month}${day}-${random}`
}
