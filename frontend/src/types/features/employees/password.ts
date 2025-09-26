// パスワード変更関連の型定義

export interface PasswordChangeData {
  password: string
  password_confirmation: string
  current_password: string
}

export interface PasswordChangeResponse {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}
