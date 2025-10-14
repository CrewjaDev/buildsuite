// 共通の型定義

// 基本的なエンティティ型
export interface BaseEntity {
  id: number
  created_at: string
  updated_at: string
}

// ページネーション関連の型
export interface PaginationParams {
  page?: number
  pageSize?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginationResponse<T> {
  data: T[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// APIレスポンスの基本型
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}

// エラーレスポンスの型
export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
  status?: number
}

// 検索・フィルター関連の型
export interface SearchParams {
  search?: string
  filters?: Record<string, string | number | boolean | null | undefined>
}

// ステータス関連の型
export type Status = 'active' | 'inactive' | 'pending' | 'approved' | 'rejected'

// 承認関連の型
export interface ApprovalStatus {
  status: 'pending' | 'approved' | 'rejected' | 'returned'
  approver?: string
  approved_at?: string
  comments?: string
}

// ファイル関連の型
export interface FileUpload {
  file: File
  name: string
  size: number
  type: string
}

// 通知関連の型
export interface Notification {
  id: number
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  created_at: string
}

// 権限関連の型
export interface Permission {
  id: number
  name: string
  display_name: string
  module: string
  action: string
  resource: string
}

export interface Role {
  id: number
  name: string
  display_name: string
  description?: string
  permissions: Permission[]
}

export interface Department {
  id: number
  name: string
  code: string
  parent_id?: number
  children?: Department[]
}

// システム権限レベルの型
export interface SystemLevel {
  id: number
  name: string
  display_name: string
  priority: number
  permissions: Permission[]
}
