'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { Partner } from '@/types/features/partners/partner'
import { useDeletePartner } from '@/hooks/features/partners/usePartners'

interface PartnerDetailHeaderProps {
  partner: Partner
  onEditClick: () => void
  onDeleteSuccess: () => void
  canEdit: boolean
  canDelete: boolean
}

export function PartnerDetailHeader({
  partner,
  onEditClick,
  onDeleteSuccess,
  canEdit,
  canDelete
}: PartnerDetailHeaderProps) {
  const router = useRouter()
  const deletePartner = useDeletePartner()

  const handleDelete = async () => {
    try {
      await deletePartner.mutateAsync(partner.id)
      onDeleteSuccess()
    } catch (error) {
      console.error('取引先の削除に失敗しました:', error)
      // エラーハンドリング（必要に応じてトースト通知を追加）
    }
  }

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 左側: 戻るボタンとタイトル */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // 一覧ページに遷移する前に、URLパラメータでデータ更新を指示
                router.push('/partners?refresh=true')
              }}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>戻る</span>
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {partner.partner_name}
              </h1>
              <p className="text-gray-600">
                取引先コード: {partner.partner_code}
              </p>
            </div>
          </div>

          {/* 右側: 操作ボタン */}
          <div className="flex items-center space-x-2">
            {canEdit && (
              <Button
                onClick={onEditClick}
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>編集</span>
              </Button>
            )}

            {canDelete && (
              <Button
                variant="destructive"
                className="flex items-center space-x-2"
                onClick={() => {
                  if (confirm('この取引先を削除しますか？この操作は取り消すことができません。')) {
                    handleDelete()
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span>削除</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
