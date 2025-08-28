'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/common/data-display/DataTable'
import { useUsers } from '@/hooks/useUsers'
import { User } from '@/lib/userService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function UsersPage() {
  const router = useRouter()
  
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

  // イベントハンドラー
  const handleEditUser = useCallback((user: User) => {
    console.log('編集:', user)
    // 詳細ページの編集モードに遷移
    router.push(`/users/${user.id}?mode=edit`)
  }, [router])

  const handleDeleteUser = useCallback((user: User) => {
    console.log('削除:', user)
    // TODO: 削除確認モーダルを開く
  }, [])

  const handleRowClick = useCallback((user: User) => {
    console.log('行クリック:', user)
    // 詳細ページに遷移
    router.push(`/users/${user.id}`)
  }, [router])

  // デバッグ用：データをコンソールに出力
  console.log('Users data:', data)

  // カラム定義
  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      accessorKey: 'employee_id',
      header: '社員ID',
      size: 120,
      minSize: 120,
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'name',
      header: '社員名',
      size: 200,
      minSize: 200,
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const name = row.getValue('name') as string
        const nameKana = row.original.name_kana as string
        return (
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-gray-500">{nameKana}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'gender',
      header: '性別',
      size: 80,
      minSize: 80,
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const gender = row.original.gender as string
        return gender === 'male' ? '男性' : gender === 'female' ? '女性' : 'その他'
      },
    },
    {
      accessorKey: 'department',
      header: '所属部門',
      size: 150,
      minSize: 150,
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const department = row.original.department as { name?: string } | null
        return department?.name || '未設定'
      },
    },
    {
      accessorKey: 'position',
      header: '職位',
      size: 120,
      minSize: 120,
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const position = row.original.position as { display_name?: string; name?: string } | null
        return position?.display_name || position?.name || '未設定'
      },
    },
    {
      accessorKey: 'job_title',
      header: '役職',
      size: 120,
      minSize: 120,
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const jobTitle = row.original.job_title as string
        return jobTitle || '未設定'
      },
    },
    {
      accessorKey: 'hire_date',
      header: '入社年月日',
      size: 120,
      minSize: 120,
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const hireDate = row.original.hire_date as string
        if (!hireDate) return '未設定'
        const date = new Date(hireDate)
        return date.toLocaleDateString('ja-JP')
      },
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      size: 120,
      minSize: 120,
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
  ], [handleEditUser, handleDeleteUser])

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
      key: 'position',
      label: '職位',
      options: [
        { value: 'director', label: '取締役' },
        { value: 'department_manager', label: '部長' },
        { value: 'section_chief', label: '課長' },
        { value: 'staff', label: '担当' },
        { value: 'employee', label: '社員' },
      ],
    },
    {
      key: 'gender',
      label: '性別',
      options: [
        { value: 'male', label: '男性' },
        { value: 'female', label: '女性' },
        { value: 'other', label: 'その他' },
      ],
    },
  ]

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
