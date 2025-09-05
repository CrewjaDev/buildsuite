'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Settings, Trash2, ArrowLeft } from 'lucide-react'
import { Employee } from '@/services/features/employees/employeeService'
import { useRouter } from 'next/navigation'
import { useDeleteEmployee } from '@/hooks/features/employee/useEmployeeForm'
import { useToast } from '@/components/ui/toast'

interface EmployeeDetailHeaderProps {
  employee: Employee
  onEditClick: () => void
  onSystemAccessClick: () => void
  onDeleteSuccess: () => void
  canEdit?: boolean
  canDelete?: boolean
  canManageSystemAccess?: boolean
}

export function EmployeeDetailHeader({
  employee,
  onEditClick,
  onSystemAccessClick,
  onDeleteSuccess,
  canEdit = true,
  canDelete = true,
  canManageSystemAccess = true
}: EmployeeDetailHeaderProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteEmployeeMutation = useDeleteEmployee()

  const handleBackClick = () => {
    router.push('/employees')
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true)
      await deleteEmployeeMutation.mutateAsync(employee.id)
      
      addToast({
        title: '削除完了',
        description: '社員データが正常に削除されました',
        type: 'success',
      })

      setShowDeleteConfirm(false)
      onDeleteSuccess()
      
      // 社員一覧ページに戻る
      router.push('/employees')
    } catch (error) {
      console.error('Employee deletion failed:', error)
      addToast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '社員の削除に失敗しました',
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              一覧に戻る
            </Button>
            
            <div className="border-l h-6" />
            
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {employee.name}
                </h1>
                <Badge variant={employee.is_active ? "default" : "secondary"}>
                  {employee.is_active ? "有効" : "無効"}
                </Badge>
                {employee.has_system_access && (
                  <Badge variant="outline">
                    システム権限あり
                  </Badge>
                )}
                {employee.user?.is_admin && (
                  <Badge variant="destructive">
                    管理者
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>ID: {employee.employee_id}</span>
                <span>部署: {employee.department.name}</span>
                {employee.position && (
                  <span>職位: {employee.position.name}</span>
                )}
                {employee.job_title && (
                  <span>役職: {employee.job_title}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                編集
              </Button>
            )}
            
            {canManageSystemAccess && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSystemAccessClick}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                システム権限
              </Button>
            )}
            
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? '削除中...' : '削除'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              社員削除の確認
            </h3>
            <p className="text-gray-600 mb-6">
              <strong>{employee.name}</strong> さんのデータを削除しますか？
              <br />
              この操作は取り消すことができません。
              {employee.has_system_access && (
                <>
                  <br />
                  <span className="text-red-600 font-medium">
                    ※ システム利用権限も同時に削除されます
                  </span>
                </>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? '削除中...' : '削除'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
