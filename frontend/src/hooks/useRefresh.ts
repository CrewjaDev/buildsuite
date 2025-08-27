'use client'

import useSWR from 'swr'
import { useCallback } from 'react'
import { SWRConfiguration } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export const useRefresh = (url: string, options?: SWRConfiguration) => {
  const { data, mutate, isLoading, error } = useSWR(url, fetcher, {
    revalidateOnFocus: false, // フォーカス時の再検証を無効化
    revalidateOnReconnect: false, // 再接続時の再検証を無効化
    dedupingInterval: 60000, // 1分間の重複リクエストを防ぐ
    ...options
  })
  
  const refresh = useCallback(() => {
    mutate()
  }, [mutate])
  
  return { data, refresh, isLoading, error }
}
