'use client'

import React from 'react'
import { usePermissionDepartments } from '@/hooks/useDepartments'

interface DepartmentSelectionInputProps {
  templateId: number
  paramKey: string
  currentValue: unknown
  onParameterChange: (templateId: number, paramKey: string, value: unknown) => void
}

export function DepartmentSelectionInput({ 
  templateId, 
  paramKey, 
  currentValue, 
  onParameterChange 
}: DepartmentSelectionInputProps) {
  const { data: departmentsResponse, isLoading, error } = usePermissionDepartments()
  const departments = departmentsResponse?.data || []
  
  // デバッグ情報をコンソールに出力
  // デバッグログを削除
  
  const selectedDepartmentIds = Array.isArray(currentValue) ? currentValue as number[] : []

  const handleDepartmentToggle = (departmentId: number, checked: boolean) => {
    let newSelection: number[]
    if (checked) {
      newSelection = [...selectedDepartmentIds, departmentId]
    } else {
      newSelection = selectedDepartmentIds.filter(id => id !== departmentId)
    }
    onParameterChange(templateId, paramKey, newSelection)
  }

  const handleSelectAll = () => {
    if (selectedDepartmentIds.length === departments.length) {
      onParameterChange(templateId, paramKey, [])
    } else {
      onParameterChange(templateId, paramKey, departments.map((dept: { id: number }) => dept.id))
    }
  }

  if (isLoading) {
    return (
      <div className="mt-2">
        <p className="text-sm text-muted-foreground mb-2">
          制限の種類に応じて自動設定
        </p>
        <div className="p-3 border rounded-md">
          <p className="text-sm text-muted-foreground">部署データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-2">
        <p className="text-sm text-muted-foreground mb-2">
          制限の種類に応じて自動設定
        </p>
        <div className="p-3 border rounded-md bg-red-50">
          <p className="text-sm text-red-600">部署データの取得に失敗しました</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <p className="text-sm text-muted-foreground mb-2">
        制限の種類に応じて自動設定
      </p>
      {departments.length === 0 ? (
        <div className="p-3 border rounded-md">
          <p className="text-sm text-muted-foreground">部署データがありません</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedDepartmentIds.length === departments.length}
              onChange={handleSelectAll}
              className="rounded"
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              全部署選択
            </label>
          </div>
          
          <div className="space-y-2">
            {departments.map((department: { id: number; name: string }) => (
              <div key={department.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`department-${department.id}`}
                  checked={selectedDepartmentIds.includes(department.id)}
                  onChange={(e) => handleDepartmentToggle(department.id, e.target.checked)}
                  className="rounded"
                />
                <label 
                  htmlFor={`department-${department.id}`} 
                  className="text-sm cursor-pointer"
                >
                  {department.name}
                </label>
              </div>
            ))}
          </div>
          
          {selectedDepartmentIds.length > 0 && (
            <div className="text-xs text-muted-foreground mt-2">
              選択済み: {selectedDepartmentIds.length}部署
            </div>
          )}
        </div>
      )}
    </div>
  )
}
