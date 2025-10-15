'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface TimeoutDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const TimeoutDialog: React.FC<TimeoutDialogProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            タイムアウトが発生しました
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-700 mb-4">
            サーバーとの通信がタイムアウトしました。ネットワーク接続を確認してから、再度お試しください。
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-700">
              しばらく待っても問題が解決しない場合は、ページを再読み込みしてください。
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={onClose} 
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
          >
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
