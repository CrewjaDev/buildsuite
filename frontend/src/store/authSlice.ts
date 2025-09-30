import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UserDetail } from '@/types/user'

interface AuthState {
  user: UserDetail | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  effectivePermissions: string[]
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  effectivePermissions: [],
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: UserDetail; token: string; effectivePermissions: string[] }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.effectivePermissions = action.payload.effectivePermissions
      state.isAuthenticated = true
      state.loading = false
    },
    updateUser: (state, action: PayloadAction<UserDetail>) => {
      state.user = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.effectivePermissions = []
      state.isAuthenticated = false
      state.loading = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const { setCredentials, updateUser, logout, setLoading } = authSlice.actions
export default authSlice.reducer
