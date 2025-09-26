import { useMutation } from '@tanstack/react-query'
import { passwordService } from '@/services/features/employees/passwordService'
import type { PasswordChangeData } from '@/types/features/employees'

export function usePasswordChange() {
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: PasswordChangeData }) =>
      passwordService.updatePassword(userId, data),
  })
}
