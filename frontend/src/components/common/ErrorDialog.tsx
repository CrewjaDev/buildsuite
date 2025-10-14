import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface ErrorDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  onClose,
  title = 'エラーが発生しました',
  message
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
