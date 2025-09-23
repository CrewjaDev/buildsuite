# 承認管理ページ実装計画書

## 概要

承認管理ページは、承認フローシステムの**設定管理専用画面**です。システム管理者が承認フローの設定・管理を行うための管理画面であり、通常の承認操作は各業務機能（見積管理、予算管理、発注管理など）で行います。

### 役割の明確化

- **承認管理ページ**: 承認フローの設定・管理（システム管理者向け）
- **業務機能ページ**: 承認依頼の作成・承認操作（一般ユーザー向け）

### 利用権限

- **対象ユーザー**: システム管理者、承認フロー管理権限を持つユーザー
- **権限チェック**: `approval.flow.manage` 権限が必要
- **アクセス制御**: 権限のないユーザーはアクセス不可

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **UI ライブラリ**: Shadcn/ui + TanStack Table v8
- **状態管理**: TanStack Query v5 + Redux Toolkit v2.8.2
- **型安全性**: TypeScript 5 (strict mode)
- **スタイリング**: Tailwind CSS v4

## ページ構成

### 1. メインページ構造

```
/approvals (承認管理 - 設定管理専用)
├── タブナビゲーション
│   ├── 承認フロー設定
│   └── 承認フローテンプレート
└── 各タブのコンテンツ
```

### 2. タブ構成

#### 2.1 承認フロー設定タブ
- **目的**: 承認フローの作成・編集・管理（システム管理者向け）
- **主要機能**:
  - 承認フロー一覧表示
  - 承認フロー作成・編集
  - 承認フロー複製・削除
  - 承認フロー有効/無効切り替え
  - 承認フロー詳細表示
  - 承認フロー条件設定
  - 承認者設定

#### 2.2 承認フローテンプレートタブ
- **目的**: 承認フローテンプレートの管理
- **主要機能**:
  - テンプレート一覧表示
  - テンプレート作成・編集
  - テンプレートから承認フロー作成
  - テンプレート複製・削除


## コンポーネント設計

### 1. メインコンポーネント

#### 1.1 ApprovalsPage
```typescript
// app/(features)/approvals/page.tsx
interface ApprovalsPageProps {
  // ページ全体の状態管理
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('flows')
  
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="w-full max-w-none px-4 py-6 space-y-6">
        {/* ページヘッダー */}
        <PageHeader />
        
        {/* タブナビゲーション */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="flows">承認フロー設定</TabsTrigger>
            <TabsTrigger value="templates">テンプレート</TabsTrigger>
          </TabsList>
          
          <TabsContent value="flows">
            <ApprovalFlowManagement />
          </TabsContent>
          
          <TabsContent value="templates">
            <ApprovalFlowTemplateManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

### 2. 承認フロー管理コンポーネント

#### 2.1 ApprovalFlowManagement
```typescript
// components/features/approvals/ApprovalFlowManagement.tsx
interface ApprovalFlowManagementProps {
  // 承認フロー管理の状態
}

export function ApprovalFlowManagement() {
  const [activeSubTab, setActiveSubTab] = useState('list')
  
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <ApprovalFlowHeader />
      
      {/* サブタブナビゲーション */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="list">フロー一覧</TabsTrigger>
          <TabsTrigger value="templates">テンプレート</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <ApprovalFlowList />
        </TabsContent>
        
        <TabsContent value="templates">
          <ApprovalFlowTemplateSelector />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

#### 2.2 ApprovalFlowList
```typescript
// components/features/approvals/ApprovalFlowList.tsx
interface ApprovalFlowListProps {
  flows: ApprovalFlow[]
  loading: boolean
  onRefresh: () => void
}

export function ApprovalFlowList({ flows, loading, onRefresh }: ApprovalFlowListProps) {
  const [selectedFlow, setSelectedFlow] = useState<ApprovalFlow | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <ApprovalFlowListHeader onRefresh={onRefresh} />
      
      {/* フロー一覧テーブル */}
      <ApprovalFlowTable 
        flows={flows}
        loading={loading}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />
      
      {/* 詳細ダイアログ */}
      <ApprovalFlowDetailDialog 
        flow={selectedFlow}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
      
      {/* 編集ダイアログ */}
      <ApprovalFlowEditDialog 
        flow={selectedFlow}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
```

#### 2.3 ApprovalFlowTable
```typescript
// components/features/approvals/ApprovalFlowTable.tsx
interface ApprovalFlowTableProps {
  flows: ApprovalFlow[]
  loading: boolean
  onViewDetail: (flow: ApprovalFlow) => void
  onEdit: (flow: ApprovalFlow) => void
  onDelete: (id: number) => void
  onToggleStatus: (id: number, isActive: boolean) => void
}

export function ApprovalFlowTable({ 
  flows, 
  loading, 
  onViewDetail, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: ApprovalFlowTableProps) {
  const columns: ColumnDef<ApprovalFlow>[] = [
    {
      accessorKey: 'name',
      header: 'フロー名',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('name')}</div>
          {row.original.description && (
            <div className="text-sm text-gray-500">{row.original.description}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'flow_type',
      header: 'タイプ',
      cell: ({ row }) => (
        <Badge variant="outline">
          {getFlowTypeLabel(row.getValue('flow_type'))}
        </Badge>
      ),
    },
    {
      accessorKey: 'approval_steps',
      header: 'ステップ数',
      cell: ({ row }) => (
        <Badge className={getStepBadgeColor(row.original.approval_steps?.length || 0)}>
          {row.original.approval_steps?.length || 0}段階
        </Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'ステータス',
      cell: ({ row }) => getStatusBadge(row.original),
    },
    {
      accessorKey: 'priority',
      header: '優先度',
    },
    {
      accessorKey: 'created_at',
      header: '作成日',
      cell: ({ row }) => formatDate(row.getValue('created_at')),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <ApprovalFlowActions 
          flow={row.original}
          onViewDetail={onViewDetail}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ),
    },
  ]
  
  return (
    <Card>
      <CardContent className="p-0">
        <DataTable 
          columns={columns}
          data={flows}
          loading={loading}
        />
      </CardContent>
    </Card>
  )
}
```

### 3. 承認フローテンプレート管理コンポーネント

#### 3.1 ApprovalFlowTemplateManagement
```typescript
// components/features/approvals/ApprovalFlowTemplateManagement.tsx
interface ApprovalFlowTemplateManagementProps {
  // テンプレート管理の状態
}

export function ApprovalFlowTemplateManagement() {
  const [activeSubTab, setActiveSubTab] = useState('list')
  
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <ApprovalFlowTemplateHeader />
      
      {/* サブタブナビゲーション */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="list">テンプレート一覧</TabsTrigger>
          <TabsTrigger value="create">テンプレート作成</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <ApprovalFlowTemplateList />
        </TabsContent>
        
        <TabsContent value="create">
          <ApprovalFlowTemplateCreator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

#### 3.2 ApprovalFlowTemplateList
```typescript
// components/features/approvals/ApprovalFlowTemplateList.tsx
interface ApprovalFlowTemplateListProps {
  // テンプレート一覧の状態
}

export function ApprovalFlowTemplateList() {
  const { data: templates, isLoading } = useApprovalFlowTemplates()
  const [selectedTemplate, setSelectedTemplate] = useState<ApprovalFlowTemplate | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <ApprovalFlowTemplateListHeader />
      
      {/* テンプレート一覧テーブル */}
      <ApprovalFlowTemplateTable 
        templates={templates}
        loading={isLoading}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateFlow={handleCreateFlow}
      />
      
      {/* 詳細ダイアログ */}
      <ApprovalFlowTemplateDetailDialog 
        template={selectedTemplate}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
      
      {/* 編集ダイアログ */}
      <ApprovalFlowTemplateEditDialog 
        template={selectedTemplate}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
```


## データ構造

### 1. 承認フロー型定義

```typescript
// types/features/approvals/approvalFlows.ts
export interface ApprovalFlow {
  id: number
  name: string
  description?: string
  flow_type: 'estimate' | 'budget' | 'purchase' | 'contract' | 'general'
  conditions?: {
    amount_min?: number
    amount_max?: number
    project_types?: string[]
    departments?: number[]
    [key: string]: any
  }
  requesters?: Array<{
    type: 'system_level' | 'position' | 'user' | 'department'
    value: string | number
    display_name: string
  }>
  approval_steps?: Array<{
    step: number
    name: string
    approvers: Array<{
      type: 'system_level' | 'position' | 'user' | 'department' | 'conditional' | 'parallel'
      value?: string | number
      display_name: string
      condition?: {
        field: string
        operator: string
        value: any
      }
      approvers?: Array<{
        type: string
        value: string | number
        display_name: string
      }>
    }>
    available_permissions: string[]
    condition: {
      type: 'required' | 'optional'
      display_name: string
    }
  }>
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### 2. 承認依頼型定義

```typescript
// types/features/approvals/approvalRequests.ts
export interface ApprovalRequest {
  id: number
  approval_flow_id: number
  request_type: string
  request_id: string
  title: string
  description?: string
  request_data: any
  current_step: number
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'returned' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  requested_by: number
  requested_at: string
  approved_by?: number
  approved_at?: string
  expires_at?: string
  approval_flow?: ApprovalFlow
  requester?: User
  approver?: User
  histories?: ApprovalHistory[]
}
```

### 3. 承認履歴型定義

```typescript
// types/features/approvals/approvalHistories.ts
export interface ApprovalHistory {
  id: number
  approval_request_id: number
  step: number
  action: 'approve' | 'reject' | 'return' | 'cancel'
  acted_by: number
  acted_at: string
  comment?: string
  delegated_to?: number
  delegated_at?: string
  approval_request?: ApprovalRequest
  actor?: User
  delegate?: User
}
```

## API設計

### 1. 承認フローAPI

```typescript
// services/features/approvals/approvalFlows.ts
export const approvalFlowService = {
  // 承認フロー一覧取得
  getApprovalFlows: (params?: {
    page?: number
    per_page?: number
    flow_type?: string
    is_active?: boolean
    search?: string
  }) => Promise<PaginatedResponse<ApprovalFlow>>,
  
  // 承認フロー詳細取得
  getApprovalFlow: (id: number) => Promise<ApprovalFlow>,
  
  // 承認フロー作成
  createApprovalFlow: (data: CreateApprovalFlowRequest) => Promise<ApprovalFlow>,
  
  // 承認フロー更新
  updateApprovalFlow: (id: number, data: UpdateApprovalFlowRequest) => Promise<ApprovalFlow>,
  
  // 承認フロー削除
  deleteApprovalFlow: (id: number) => Promise<void>,
  
  // 承認フロー複製
  duplicateApprovalFlow: (id: number) => Promise<ApprovalFlow>,
  
  // 承認フローテンプレート取得
  getTemplates: () => Promise<Record<string, ApprovalFlowTemplate>>,
  
  // 承認フロー作成（テンプレートから）
  createFromTemplate: (templateId: string, data: any) => Promise<ApprovalFlow>,
}
```

### 2. 承認フローテンプレートAPI

```typescript
// services/features/approvals/approvalFlowTemplates.ts
export const approvalFlowTemplateService = {
  // テンプレート一覧取得
  getApprovalFlowTemplates: (params?: {
    page?: number
    per_page?: number
    flow_type?: string
    search?: string
  }) => Promise<PaginatedResponse<ApprovalFlowTemplate>>,
  
  // テンプレート詳細取得
  getApprovalFlowTemplate: (id: number) => Promise<ApprovalFlowTemplate>,
  
  // テンプレート作成
  createApprovalFlowTemplate: (data: CreateApprovalFlowTemplateRequest) => Promise<ApprovalFlowTemplate>,
  
  // テンプレート更新
  updateApprovalFlowTemplate: (id: number, data: UpdateApprovalFlowTemplateRequest) => Promise<ApprovalFlowTemplate>,
  
  // テンプレート削除
  deleteApprovalFlowTemplate: (id: number) => Promise<void>,
  
  // テンプレートから承認フロー作成
  createFlowFromTemplate: (templateId: number, data: any) => Promise<ApprovalFlow>,
}
```


## 状態管理

### 1. Redux Slice

```typescript
// store/slices/approvalSlice.ts
interface ApprovalState {
  flows: {
    data: ApprovalFlow[]
    loading: boolean
    error: string | null
    currentFlow: ApprovalFlow | null
  }
  requests: {
    data: ApprovalRequest[]
    loading: boolean
    error: string | null
    currentRequest: ApprovalRequest | null
  }
  histories: {
    data: ApprovalHistory[]
    loading: boolean
    error: string | null
  }
}

export const approvalSlice = createSlice({
  name: 'approval',
  initialState,
  reducers: {
    // 承認フロー関連
    fetchApprovalFlowsStart: (state) => {
      state.flows.loading = true
      state.flows.error = null
    },
    fetchApprovalFlowsSuccess: (state, action) => {
      state.flows.loading = false
      state.flows.data = action.payload
    },
    fetchApprovalFlowsFailure: (state, action) => {
      state.flows.loading = false
      state.flows.error = action.payload
    },
    
    // 承認依頼関連
    fetchApprovalRequestsStart: (state) => {
      state.requests.loading = true
      state.requests.error = null
    },
    fetchApprovalRequestsSuccess: (state, action) => {
      state.requests.loading = false
      state.requests.data = action.payload
    },
    fetchApprovalRequestsFailure: (state, action) => {
      state.requests.loading = false
      state.requests.error = action.payload
    },
    
    // 承認履歴関連
    fetchApprovalHistoriesStart: (state) => {
      state.histories.loading = true
      state.histories.error = null
    },
    fetchApprovalHistoriesSuccess: (state, action) => {
      state.histories.loading = false
      state.histories.data = action.payload
    },
    fetchApprovalHistoriesFailure: (state, action) => {
      state.histories.loading = false
      state.histories.error = action.payload
    },
  },
})
```

### 2. TanStack Query Hooks

```typescript
// hooks/useApprovalFlows.ts
export const useApprovalFlows = (params?: ApprovalFlowParams) => {
  return useQuery({
    queryKey: ['approvalFlows', params],
    queryFn: () => approvalFlowService.getApprovalFlows(params),
    staleTime: 5 * 60 * 1000, // 5分
  })
}

export const useApprovalFlow = (id: number) => {
  return useQuery({
    queryKey: ['approvalFlow', id],
    queryFn: () => approvalFlowService.getApprovalFlow(id),
    enabled: !!id,
  })
}

export const useCreateApprovalFlow = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: approvalFlowService.createApprovalFlow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalFlows'] })
    },
  })
}

export const useUpdateApprovalFlow = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateApprovalFlowRequest }) =>
      approvalFlowService.updateApprovalFlow(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['approvalFlows'] })
      queryClient.invalidateQueries({ queryKey: ['approvalFlow', id] })
    },
  })
}

export const useDeleteApprovalFlow = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: approvalFlowService.deleteApprovalFlow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalFlows'] })
    },
  })
}
```

## UI/UX設計

### 1. レスポンシブデザイン

```typescript
// モバイル対応
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  
  return { isMobile }
}

// モバイル用のカード表示
const MobileApprovalFlowCard = ({ flow }: { flow: ApprovalFlow }) => {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{flow.name}</h3>
        <Badge variant={flow.is_active ? 'default' : 'secondary'}>
          {flow.is_active ? '有効' : '無効'}
        </Badge>
      </div>
      <p className="text-sm text-gray-600 mb-3">{flow.description}</p>
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Badge variant="outline">{getFlowTypeLabel(flow.flow_type)}</Badge>
          <Badge variant="outline">{flow.approval_steps?.length || 0}段階</Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onViewDetail(flow)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(flow)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
```

### 2. アクセシビリティ

```typescript
// キーボードナビゲーション対応
const ApprovalFlowTable = () => {
  const handleKeyDown = (event: KeyboardEvent, flow: ApprovalFlow) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onViewDetail(flow)
    }
  }
  
  return (
    <Table>
      <TableBody>
        {flows.map((flow) => (
          <TableRow 
            key={flow.id}
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, flow)}
            className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
          >
            {/* テーブルセル */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### 3. ローディング状態

```typescript
// スケルトンローディング
const ApprovalFlowSkeleton = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[60px]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

## パフォーマンス最適化

### 1. 仮想化スクロール

```typescript
// 大量データ対応
import { useVirtualizer } from '@tanstack/react-virtual'

const VirtualizedApprovalFlowTable = ({ flows }: { flows: ApprovalFlow[] }) => {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: flows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  })
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ApprovalFlowRow flow={flows[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 2. デバウンス検索

```typescript
// 検索の最適化
import { useDebouncedCallback } from 'use-debounce'

const ApprovalFlowSearch = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebouncedCallback((value: string) => {
    // 検索API呼び出し
    onSearch(value)
  }, 300)
  
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    debouncedSearch(value)
  }
  
  return (
    <Input
      placeholder="承認フローを検索..."
      value={searchTerm}
      onChange={(e) => handleSearchChange(e.target.value)}
    />
  )
}
```

### 3. メモ化

```typescript
// コンポーネントのメモ化
const ApprovalFlowRow = React.memo(({ flow }: { flow: ApprovalFlow }) => {
  return (
    <TableRow>
      <TableCell>{flow.name}</TableCell>
      <TableCell>{getFlowTypeLabel(flow.flow_type)}</TableCell>
      <TableCell>{flow.approval_steps?.length || 0}</TableCell>
      <TableCell>{getStatusBadge(flow)}</TableCell>
      <TableCell>
        <ApprovalFlowActions flow={flow} />
      </TableCell>
    </TableRow>
  )
})

// コールバックのメモ化
const ApprovalFlowActions = React.memo(({ flow }: { flow: ApprovalFlow }) => {
  const handleEdit = useCallback(() => {
    onEdit(flow)
  }, [flow])
  
  const handleDelete = useCallback(() => {
    onDelete(flow.id)
  }, [flow.id])
  
  return (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={handleEdit}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
})
```

## エラーハンドリング

### 1. エラー境界

```typescript
// エラー境界コンポーネント
class ApprovalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Approval Error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              エラーが発生しました
            </h3>
            <p className="text-gray-600 mb-4">
              承認管理ページでエラーが発生しました。ページを再読み込みしてください。
            </p>
            <Button onClick={() => window.location.reload()}>
              再読み込み
            </Button>
          </CardContent>
        </Card>
      )
    }
    
    return this.props.children
  }
}
```

### 2. エラー表示

```typescript
// エラー表示コンポーネント
const ApprovalErrorDisplay = ({ error, onRetry }: { 
  error: string; 
  onRetry: () => void 
}) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>エラー</AlertTitle>
      <AlertDescription>
        {error}
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-2">
          再試行
        </Button>
      </AlertDescription>
    </Alert>
  )
}
```

## テスト戦略

### 1. ユニットテスト

```typescript
// ApprovalFlowList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ApprovalFlowList } from './ApprovalFlowList'

describe('ApprovalFlowList', () => {
  const mockFlows: ApprovalFlow[] = [
    {
      id: 1,
      name: 'テスト承認フロー',
      flow_type: 'estimate',
      approval_steps: [
        {
          step: 1,
          name: '第1承認',
          approvers: [
            {
              type: 'system_level',
              value: 'supervisor',
              display_name: '上長'
            }
          ],
          available_permissions: ['estimate.approval.approve'],
          condition: { type: 'required', display_name: '必須承認' }
        }
      ],
      priority: 1,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]
  
  it('承認フロー一覧が正しく表示される', () => {
    render(
      <ApprovalFlowList 
        flows={mockFlows}
        loading={false}
        onRefresh={jest.fn()}
      />
    )
    
    expect(screen.getByText('テスト承認フロー')).toBeInTheDocument()
    expect(screen.getByText('見積')).toBeInTheDocument()
    expect(screen.getByText('1段階')).toBeInTheDocument()
  })
  
  it('編集ボタンが正しく動作する', () => {
    const onEdit = jest.fn()
    render(
      <ApprovalFlowList 
        flows={mockFlows}
        loading={false}
        onRefresh={jest.fn()}
        onEdit={onEdit}
      />
    )
    
    fireEvent.click(screen.getByRole('button', { name: /編集/i }))
    expect(onEdit).toHaveBeenCalledWith(mockFlows[0])
  })
})
```

### 2. 統合テスト

```typescript
// ApprovalFlowManagement.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApprovalFlowManagement } from './ApprovalFlowManagement'

describe('ApprovalFlowManagement Integration', () => {
  let queryClient: QueryClient
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })
  
  it('承認フロー一覧が正しく読み込まれる', async () => {
    // モックAPI
    jest.spyOn(approvalFlowService, 'getApprovalFlows').mockResolvedValue({
      data: mockFlows,
      meta: { total: 1, per_page: 10, current_page: 1 }
    })
    
    render(
      <QueryClientProvider client={queryClient}>
        <ApprovalFlowManagement />
      </QueryClientProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('テスト承認フロー')).toBeInTheDocument()
    })
  })
})
```

## 実装スケジュール

### Phase 1: 基盤実装（1週間）
- [ ] プロジェクト構造の設定
- [ ] 型定義の作成
- [ ] APIサービスの実装
- [ ] 基本コンポーネントの作成

### Phase 2: 承認フロー管理（2週間）
- [ ] 承認フロー一覧表示
- [ ] 承認フロー詳細表示
- [ ] 承認フロー作成・編集
- [ ] 承認フロー削除・複製
- [ ] 承認フロー条件設定
- [ ] 承認者設定

### Phase 3: 承認フローテンプレート管理（1週間）
- [ ] テンプレート一覧表示
- [ ] テンプレート詳細表示
- [ ] テンプレート作成・編集
- [ ] テンプレート削除・複製
- [ ] テンプレートから承認フロー作成

### Phase 4: 最適化・テスト（1週間）
- [ ] パフォーマンス最適化
- [ ] レスポンシブデザイン対応
- [ ] ユニットテスト・統合テスト
- [ ] エラーハンドリング強化

## まとめ

承認管理ページは、承認フローシステムの**設定管理専用画面**として、システム管理者が効率的に承認フローを管理できる重要な機能です。新しいJSONカラム設計に基づいて、以下の特徴を持つ実装を行います：

### 主要な特徴

1. **設定管理専用**: 承認フローの設定・管理に特化（承認操作は各業務機能で実行）
2. **権限ベースアクセス**: システム管理者のみがアクセス可能
3. **統合的な管理**: 承認フロー設定、テンプレート管理を一つの画面で管理
4. **直感的なUI**: タブベースのナビゲーションで機能を整理
5. **高性能**: 仮想化スクロール、メモ化、デバウンス検索による最適化
6. **アクセシビリティ**: キーボードナビゲーション、スクリーンリーダー対応
7. **レスポンシブ**: モバイル・タブレット・デスクトップ対応
8. **型安全性**: TypeScriptによる厳密な型定義
9. **テスト**: ユニットテスト・統合テストによる品質保証

### 業務フローとの分離

- **承認管理ページ**: 承認フローの設定・管理（システム管理者向け）
- **業務機能ページ**: 承認依頼の作成・承認操作（一般ユーザー向け）
  - 見積管理ページでの見積承認
  - 予算管理ページでの予算承認
  - 発注管理ページでの発注承認
  - 出来高管理ページでの出来高承認
  - 支払管理ページでの支払承認

この実装により、システム管理者は効率的に承認フローを設定・管理でき、一般ユーザーは各業務機能で直感的に承認操作を行えるようになります。
