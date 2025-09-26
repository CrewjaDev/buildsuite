import api from '@/lib/api'
import type { PasswordChangeData, PasswordChangeResponse } from '@/types/features/employees'

export const passwordService = {
  /**
   * ユーザーのパスワードを変更
   */
  async updatePassword(userId: number, data: PasswordChangeData): Promise<PasswordChangeResponse> {
    const response = await api.put(`/users/${userId}/password`, data)
    return response.data
  },
}
