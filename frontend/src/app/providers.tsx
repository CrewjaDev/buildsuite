'use client'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { store, persistor } from '@/store/store'

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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {children}
        </PersistGate>
      </Provider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}