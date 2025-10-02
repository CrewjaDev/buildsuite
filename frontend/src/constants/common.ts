/**
 * プロジェクト全体で使用される共通定数
 */

// 承認者タイプの日本語ラベル
export const APPROVER_TYPE_LABELS: Record<string, string> = {
  system_level: 'システム権限レベル',
  department: '部署',
  position: '職位',
  user: '個別ユーザー'
}

// フロー種別の日本語ラベル（フォールバック用）
export const FLOW_TYPE_LABELS: Record<string, string> = {
  estimate: '見積',
  budget: '予算',
  order: '発注',
  progress: '進捗',
  payment: '支払'
}

// ステップ数のバッジカラー
export const STEP_BADGE_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-purple-100 text-purple-800',
  5: 'bg-pink-100 text-pink-800'
}

// 自動承認の表示ラベル
export const AUTO_APPROVAL_LABELS = {
  enabled: '有効',
  disabled: '無効'
} as const

// 一般的なステータスラベル
export const STATUS_LABELS = {
  active: '有効',
  inactive: '無効',
  enabled: '有効',
  disabled: '無効'
} as const
