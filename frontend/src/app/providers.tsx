'use client'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { store, persistor } from '@/store/store'
import { ToastProvider } from '@/components/ui/toast'
import { Toaster } from 'sonner'
import AuthProvider from '@/components/common/AuthProvider'
import { TimeoutProvider, useTimeout } from '@/contexts/TimeoutContext'
import { setTimeoutNotificationCallback } from '@/lib/api'
import { useEffect } from 'react'

// React Queryクライアントの設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分間キャッシュ
      gcTime: 10 * 60 * 1000, // 10分間メモリ保持
      retry: 1, // リトライ回数を減らす
      refetchOnWindowFocus: false, // フォーカス時の再取得を無効化
      refetchOnReconnect: false, // 再接続時の再取得を無効化
      refetchOnMount: false, // マウント時の再取得を無効化
    },
    mutations: {
      retry: 1,
    },
  },
})

// タイムアウト通知の設定コンポーネント
function TimeoutNotificationSetup() {
  const { showTimeoutDialog } = useTimeout()

  useEffect(() => {
    // APIタイムアウト通知のコールバックを設定
    setTimeoutNotificationCallback(showTimeoutDialog)
    
    // クリーンアップ
    return () => {
      setTimeoutNotificationCallback(null)
    }
  }, [showTimeoutDialog])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <TimeoutProvider>
            <TimeoutNotificationSetup />
            <AuthProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </TimeoutProvider>
        </PersistGate>
      </Provider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}