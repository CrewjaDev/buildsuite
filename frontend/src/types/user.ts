// 詳細なユーザー情報の型定義（データベーススキーマに基づく）
export interface UserDetail {
  // 基本情報
  id: number
  login_id: string
  employee_id: string
  name: string
  email?: string
  name_kana?: string
  birth_date?: string
  gender?: string
  
  // 連絡先情報
  phone?: string
  mobile_phone?: string
  
  // 住所情報
  postal_code?: string
  prefecture?: string
  address?: string
  
  // 所属情報
  position_id?: number
  job_title?: string
  hire_date?: string
  service_years?: number
  service_months?: number
  
  // システム情報
  system_level?: string
  is_active?: boolean
  is_admin?: boolean
  last_login_at?: string
  password_changed_at?: string
  password_expires_at?: string
  failed_login_attempts?: number
  locked_at?: string
  is_locked?: boolean
  is_password_expired?: boolean
  
  // リレーション情報
  position?: {
    id: number
    code: string
    name: string
    display_name: string
    level: number
  }
  roles?: Array<{
    id: number
    name: string
    display_name: string
    priority: number
  }>
  departments?: Array<{
    id: number
    name: string
    code: string
    position?: string
    is_primary: boolean
  }>
  systemLevel?: {
    id: number
    code: string
    name: string
    display_name: string
    priority: number
  }
  department?: {  // バックエンドのレスポンスに合わせて変更
    id: number
    name: string
    code: string
    position?: string
    is_primary: boolean
  }
  primary_department?: {
    id: number
    name: string
    code: string
    position?: string
    is_primary: boolean
  }
  
  // タイムスタンプ
  createdAt?: string  // バックエンドのレスポンスに合わせて変更
  updatedAt?: string  // バックエンドのレスポンスに合わせて変更
  deleted_at?: string
}

// ヘッダー用の簡略化されたユーザー型
export interface HeaderUser {
  id: number
  name: string
  email?: string
  avatar?: string
  is_admin?: boolean
  system_level?: string
  primary_department?: {
    id: number
    name: string
    code: string
    position?: string
    is_primary: boolean
  }
  last_login_at?: string
  is_active?: boolean
}

// ユーザーオプション型
export interface UserOptions {
  roles: Array<{
    id: number
    name: string
    display_name: string
    priority: number
  }>
  departments: Array<{
    id: number
    code: string
    name: string
  }>
  system_levels: Array<{
    id: number
    code: string
    name: string
    display_name: string
    description: string
    priority: number
    is_system: boolean
    is_active: boolean
  }>
  positions: Array<{
    id: number
    code: string
    name: string
    display_name: string
    description: string
    level: number
    sort_order: number
    is_active: boolean
  }>
}

// ユーザープロフィール型（既存のUserDetailを拡張）
export interface UserProfile extends UserDetail {
  phone?: string
  address?: string
  bio?: string
  preferences: {
    language: 'ja' | 'en'
    theme: 'light' | 'dark' | 'system'
    timezone: string
    dateFormat: string
  }
}

// ユーザー詳細からヘッダー用ユーザーを作成するヘルパー関数
export const createHeaderUser = (userDetail: UserDetail): HeaderUser => {
  return {
    id: userDetail.id,
    name: userDetail.name,
    email: userDetail.email,
    avatar: undefined, // 既存のシステムにはアバター機能がない
    is_admin: userDetail.is_admin,
    system_level: userDetail.system_level,
    primary_department: userDetail.primary_department,
    last_login_at: userDetail.last_login_at,
    is_active: userDetail.is_active
  }
}
