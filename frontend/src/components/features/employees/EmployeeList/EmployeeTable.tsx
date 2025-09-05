'use client'

import { useState, useCallback } from 'react'
import { Employee } from '@/services/features/employees/employeeService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Edit, Eye, Settings } from 'lucide-react'

interface EmployeeTableProps {
  data: Employee[]
  isLoading: boolean
  error: Error | null
  onEdit: (employee: Employee) => void
  onView: (employee: Employee) => void
  onSystemAccess: (employee: Employee) => void
  onRowClick: (employee: Employee) => void
  onPageSizeChange: (pageSize: number) => void
  onPageChange: (page: number) => void
  currentPage?: number
  totalCount?: number
  pageSize?: number
}

export function EmployeeTable({
  data,
  isLoading,
  error,
  onEdit,
  onView,
  onSystemAccess,
  onRowClick,
  onPageSizeChange,
  onPageChange,
  currentPage = 1,
  totalCount = 0,
  pageSize = 20
}: EmployeeTableProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleRowClick = useCallback((employee: Employee, e: React.MouseEvent) => {
    // ボタンクリックの場合は行クリックを無効化
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    onRowClick(employee)
  }, [onRowClick])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">データを読み込んでいます...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">データの取得に失敗しました</p>
            <Button onClick={() => window.location.reload()}>再試行</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">該当する社員が見つかりませんでした</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* テーブルヘッダー */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    社員情報
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    所属・職位
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    システム権限
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((employee) => (
                  <tr
                    key={employee.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      hoveredRow === employee.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={(e) => handleRowClick(employee, e)}
                    onMouseEnter={() => setHoveredRow(employee.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* 社員情報 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {employee.employee_id}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {employee.gender && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {employee.gender === 'male' ? '男性' : employee.gender === 'female' ? '女性' : employee.gender}
                            </span>
                          )}
                        </div>
                        {employee.email && (
                          <div className="text-xs text-gray-400">
                            {employee.email}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 所属・職位 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900">
                          {employee.department.name}
                        </div>
                        {employee.position && (
                          <div className="text-sm text-gray-500">
                            {employee.position.name}
                          </div>
                        )}
                        {employee.job_title && (
                          <div className="flex items-center mt-1">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {employee.job_title}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* システム権限 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <Badge variant={employee.has_system_access ? "default" : "secondary"}>
                          {employee.has_system_access ? "権限あり" : "権限なし"}
                        </Badge>
                        {employee.user && (
                          <>
                            <div className="text-xs text-gray-500">
                              ID: {employee.user.login_id}
                            </div>
                            {employee.user.system_level_info && (
                              <div className="text-xs text-gray-400">
                                {String(employee.user.system_level_info.display_name || '')}
                              </div>
                            )}
                            {employee.user.is_admin && (
                              <Badge variant="destructive" className="text-xs">
                                管理者
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    {/* ステータス */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <Badge variant={employee.is_active ? "default" : "secondary"}>
                          {employee.is_active ? "有効" : "無効"}
                        </Badge>
                        {employee.user?.is_locked && (
                          <Badge variant="destructive" className="text-xs">
                            ロック中
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* 操作 */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onView(employee)
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          詳細
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(employee)
                          }}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          編集
                        </Button>
                        <Button
                          variant={employee.has_system_access ? "secondary" : "default"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSystemAccess(employee)
                          }}
                          className="flex items-center gap-1"
                        >
                          <Settings className="h-3 w-3" />
                          権限
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ページネーション */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-700">
                {totalCount}件中 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)}件を表示
              </p>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="text-sm border rounded px-2 py-1"
              >
                <option value={10}>10件</option>
                <option value={20}>20件</option>
                <option value={50}>50件</option>
                <option value={100}>100件</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                前へ
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = i + 1
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNumber)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                次へ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
