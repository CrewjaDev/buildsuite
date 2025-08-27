import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, UserSearchParams, User } from '@/lib/userService'

export const useUsers = (params: UserSearchParams) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getUsers(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  })
}

export const useUser = (id: number) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUser(id),
    enabled: !!id,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      userService.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
