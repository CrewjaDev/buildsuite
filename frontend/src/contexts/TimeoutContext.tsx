'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { TimeoutDialog } from '@/components/common/TimeoutDialog'

interface TimeoutContextType {
  showTimeoutDialog: () => void
  hideTimeoutDialog: () => void
  isTimeoutDialogOpen: boolean
}

const TimeoutContext = createContext<TimeoutContextType | undefined>(undefined)

export const useTimeout = () => {
  const context = useContext(TimeoutContext)
  if (context === undefined) {
    throw new Error('useTimeout must be used within a TimeoutProvider')
  }
  return context
}

interface TimeoutProviderProps {
  children: React.ReactNode
}

export const TimeoutProvider: React.FC<TimeoutProviderProps> = ({ children }) => {
  const [isTimeoutDialogOpen, setIsTimeoutDialogOpen] = useState(false)

  const showTimeoutDialog = useCallback(() => {
    setIsTimeoutDialogOpen(true)
  }, [])

  const hideTimeoutDialog = useCallback(() => {
    setIsTimeoutDialogOpen(false)
  }, [])

  const handleClose = useCallback(() => {
    // ダイアログを閉じてログアウト処理を実行
    setIsTimeoutDialogOpen(false)
    localStorage.removeItem('token')
    window.location.href = '/login'
  }, [])


  const value: TimeoutContextType = {
    showTimeoutDialog,
    hideTimeoutDialog,
    isTimeoutDialogOpen
  }

  return (
    <TimeoutContext.Provider value={value}>
      {children}
      <TimeoutDialog
        isOpen={isTimeoutDialogOpen}
        onClose={handleClose}
      />
    </TimeoutContext.Provider>
  )
}
