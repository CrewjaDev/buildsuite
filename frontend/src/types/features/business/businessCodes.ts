/**
 * 業務コードの型定義
 * 完全ハードコーディング方式
 */

// 全業務コード定数
export const BUSINESS_CODES = {
  // システム管理
  USER: 'user',
  ROLE: 'role',
  DEPARTMENT: 'department',
  SYSTEM: 'system',
  APPROVAL: 'approval',
  // ビジネスロジック
  ESTIMATE: 'estimate',
  BUDGET: 'budget',
  PURCHASE: 'purchase',
  CONSTRUCTION: 'construction',
  GENERAL: 'general'
} as const;

// 業務コードの型
export type BusinessCode = typeof BUSINESS_CODES[keyof typeof BUSINESS_CODES];

// 業務コードの詳細情報
export interface BusinessCodeInfo {
  name: string;
  description: string;
  category: string;
  is_system: boolean;
  default_permissions: string[];
  settings?: Record<string, unknown>;
}

// 業務コードのカテゴリ
export type BusinessCodeCategory = 
  | 'system'      // システム管理
  | 'financial'   // 財務関連
  | 'construction' // 工事関連
  | 'general'     // 一般業務
  | 'operational' // 運用業務
  | 'administrative'; // 管理業務

// 権限名の型（業務コード.アクション）
export type PermissionName = `${BusinessCode}.${string}`;

// 注意: 判定関数は services/features/business/businessCodeService.ts に移動しました

// 業務コードの表示名マッピング
export const BUSINESS_CODE_DISPLAY_NAMES: Record<BusinessCode, string> = {
  // システム管理
  [BUSINESS_CODES.USER]: 'ユーザー管理',
  [BUSINESS_CODES.ROLE]: '役割管理',
  [BUSINESS_CODES.DEPARTMENT]: '部署管理',
  [BUSINESS_CODES.SYSTEM]: 'システム管理',
  [BUSINESS_CODES.APPROVAL]: '承認管理',
  
  // ビジネスロジック
  [BUSINESS_CODES.ESTIMATE]: '見積',
  [BUSINESS_CODES.BUDGET]: '予算',
  [BUSINESS_CODES.PURCHASE]: '発注',
  [BUSINESS_CODES.CONSTRUCTION]: '工事',
  [BUSINESS_CODES.GENERAL]: '一般'
} as const;

// 業務コードのカテゴリ表示名
export const BUSINESS_CODE_CATEGORY_NAMES: Record<BusinessCodeCategory, string> = {
  system: 'システム管理',
  financial: '財務関連',
  construction: '工事関連',
  general: '一般業務',
  operational: '運用業務',
  administrative: '管理業務'
} as const;

// 業務コードの詳細情報（完全ハードコーディング）
export const ALL_BUSINESS_CODES: Record<BusinessCode, BusinessCodeInfo> = {
  // システム管理
  [BUSINESS_CODES.USER]: {
    name: 'ユーザー管理',
    description: 'ユーザーの作成・編集・削除・閲覧業務',
    category: 'system',
    is_system: true,
    default_permissions: ['user.view', 'user.create', 'user.edit', 'user.delete']
  },
  [BUSINESS_CODES.ROLE]: {
    name: '役割管理',
    description: '役割の作成・編集・削除・閲覧業務',
    category: 'system',
    is_system: true,
    default_permissions: ['role.view', 'role.create', 'role.edit', 'role.delete']
  },
  [BUSINESS_CODES.DEPARTMENT]: {
    name: '部署管理',
    description: '部署の作成・編集・削除・閲覧業務',
    category: 'system',
    is_system: true,
    default_permissions: ['department.view', 'department.create', 'department.edit', 'department.delete']
  },
  [BUSINESS_CODES.SYSTEM]: {
    name: 'システム管理',
    description: 'システム設定・管理業務',
    category: 'system',
    is_system: true,
    default_permissions: ['system.view', 'system.edit']
  },
  [BUSINESS_CODES.APPROVAL]: {
    name: '承認管理',
    description: '承認フロー・承認依頼の管理業務',
    category: 'system',
    is_system: true,
    default_permissions: ['approval.flow.view', 'approval.flow.create', 'approval.flow.edit', 'approval.flow.delete', 'approval.usage']
  },
  
  // ビジネスロジック
  [BUSINESS_CODES.ESTIMATE]: {
    name: '見積',
    description: '見積書の作成・承認業務',
    category: 'financial',
    is_system: false,
    default_permissions: ['estimate.create', 'estimate.view', 'estimate.edit', 'estimate.delete', 'estimate.approval.request', 'estimate.approval.view', 'estimate.approval.approve', 'estimate.approval.reject', 'estimate.approval.return', 'estimate.approval.cancel'],
    settings: { max_amount: 10000000, currency: 'JPY', validity_days: 30 }
  },
  [BUSINESS_CODES.BUDGET]: {
    name: '予算',
    description: '予算の申請・承認業務',
    category: 'financial',
    is_system: false,
    default_permissions: ['budget.create', 'budget.view', 'budget.edit', 'budget.delete', 'budget.approval.request', 'budget.approval.view', 'budget.approval.approve', 'budget.approval.reject', 'budget.approval.return', 'budget.approval.cancel'],
    settings: { fiscal_year: true, currency: 'JPY' }
  },
  [BUSINESS_CODES.PURCHASE]: {
    name: '発注',
    description: '発注の申請・承認業務',
    category: 'financial',
    is_system: false,
    default_permissions: ['purchase.create', 'purchase.view', 'purchase.edit', 'purchase.delete', 'purchase.approval.request', 'purchase.approval.view', 'purchase.approval.approve', 'purchase.approval.reject', 'purchase.approval.return', 'purchase.approval.cancel'],
    settings: { max_amount: 5000000, currency: 'JPY', vendor_required: true }
  },
  [BUSINESS_CODES.CONSTRUCTION]: {
    name: '工事',
    description: '工事関連の承認業務',
    category: 'construction',
    is_system: false,
    default_permissions: ['construction.create', 'construction.view', 'construction.edit', 'construction.delete', 'construction.approval.request', 'construction.approval.view', 'construction.approval.approve', 'construction.approval.reject', 'construction.approval.return', 'construction.approval.cancel'],
    settings: { max_amount: 50000000, currency: 'JPY', validity_days: 60 }
  },
  [BUSINESS_CODES.GENERAL]: {
    name: '一般',
    description: '一般的な承認業務',
    category: 'general',
    is_system: false,
    default_permissions: ['general.create', 'general.view', 'general.edit', 'general.delete', 'general.approval.request', 'general.approval.view', 'general.approval.approve', 'general.approval.reject', 'general.approval.return', 'general.approval.cancel'],
    settings: {}
  }
} as const;

// 注意: 処理ロジックは services/features/business/businessCodeService.ts に移動しました
