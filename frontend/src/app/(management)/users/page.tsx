'use client'

import { useState, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/common/data-display/DataTable'
import { useUsers } from '@/hooks/useUsers'
import { User } from '@/lib/userService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function UsersPage() {
  // 状態管理
  const [searchValue, setSearchValue] = useState('')
  const [filters, setFilters] = useState<Record<string, string | number | boolean | null | undefined>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 検索パラメータ
  const searchParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    search: searchValue || undefined,
    ...filters
  }), [currentPage, pageSize, searchValue, filters])

  // データ取得
  const { data, isLoading, error } = useUsers(searchParams)

  // カラム定義
  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      accessorKey: 'employee_id',
      header: '社員ID',
      size: 120,
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'name',
      header: '氏名',
      size: 150,
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'email',
      header: 'メールアドレス',
      size: 250,
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'role',
      header: '役職',
      size: 120,
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      size: 100,
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        if (!value || value === 'all') return true
        const status = row.getValue(id) as string
        return status === value
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? '有効' : '無効'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: '作成日',
      size: 120,
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        if (!value || (!value.from && !value.to)) return true
        const date = new Date(row.getValue(id) as string)
        const fromDate = value.from ? new Date(value.from) : null
        const toDate = value.to ? new Date(value.to) : null
        
        if (fromDate && toDate) {
          return date >= fromDate && date <= toDate
        } else if (fromDate) {
          return date >= fromDate
        } else if (toDate) {
          return date <= toDate
        }
        return true
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'))
        return date.toLocaleDateString('ja-JP')
      },
    },
    {
      id: 'actions',
      header: '操作',
      size: 120,
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditUser(user)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteUser(user)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ], [])

  // フィルターオプション
  const filterOptions = [
    {
      key: 'status',
      label: 'ステータス',
      options: [
        { value: 'active', label: '有効' },
        { value: 'inactive', label: '無効' },
      ],
    },
    {
      key: 'role',
      label: '役職',
      options: [
        { value: 'admin', label: '管理者' },
        { value: 'manager', label: 'マネージャー' },
        { value: 'employee', label: '一般社員' },
      ],
    },
  ]

  // イベントハンドラー
  const handleEditUser = (user: User) => {
    console.log('編集:', user)
    // TODO: 編集モーダルを開く
  }

  const handleDeleteUser = (user: User) => {
    console.log('削除:', user)
    // TODO: 削除確認モーダルを開く
  }

  const handleRowClick = (user: User) => {
    console.log('行クリック:', user)
    // TODO: 詳細ページに遷移
  }

  const handlePageSizeChange = (newPageSize: number) => {
    console.log('ページサイズ変更:', newPageSize)
    setPageSize(newPageSize)
    setCurrentPage(1) // ページサイズ変更時は最初のページに戻る
  }

  const handleSearchChange = (value: string) => {
    console.log('検索変更:', value)
    setSearchValue(value)
    setCurrentPage(1) // 検索変更時は最初のページに戻る
  }

  const handleFilterChange = (newFilters: Record<string, string | number | boolean | null | undefined>) => {
    console.log('フィルター変更:', newFilters)
    setFilters(newFilters)
    setCurrentPage(1) // フィルター変更時は最初のページに戻る
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
          <p className="text-gray-600">システムユーザーの管理を行います</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新規ユーザー追加
        </Button>
      </div>

      {/* データテーブル */}
      <DataTable
        data={data?.users || []}
        columns={columns}
        isLoading={isLoading}
        error={error}
        enableColumnResizing={true}
        enableSorting={true}
        enableColumnFilters={true}
        onRowClick={handleRowClick}
        
        // 検索・フィルター
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="ユーザー名、メールアドレスで検索..."
        filterOptions={filterOptions}
        
        // ページネーション
        currentPage={currentPage}
        totalCount={data?.totalCount || 0}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}
