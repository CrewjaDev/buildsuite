'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Eye, TestTube, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { 
  useABACPolicies, 
  useABACPolicyOptions, 
  useCreateABACPolicy, 
  useUpdateABACPolicy, 
  useDeleteABACPolicy, 
  useTestABACPolicyConditions 
} from '@/hooks/features/permission/useABACPolicies';
import type { AccessPolicy, PolicyOptions } from '@/services/features/permission/abacPolicyService';


export default function ABACPolicyManagement() {
  // 選択されたビジネスコードの状態
  const [selectedBusinessCode, setSelectedBusinessCode] = useState<string>('');

  // React Query hooks
  const { data: policiesResponse, isLoading: policiesLoading } = useABACPolicies(
    selectedBusinessCode ? { business_code: selectedBusinessCode } : {}
  );
  const { data: optionsResponse, isLoading: optionsLoading } = useABACPolicyOptions();
  const createPolicyMutation = useCreateABACPolicy();
  const updatePolicyMutation = useUpdateABACPolicy();
  const deletePolicyMutation = useDeleteABACPolicy();
  const testConditionsMutation = useTestABACPolicyConditions();

  const policies = policiesResponse?.data?.data || [];
  const options = optionsResponse?.data || null;
  const loading = policiesLoading || optionsLoading;
  
  // ダイアログ状態
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<AccessPolicy | null>(null);
  
  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    business_code: '',
    action: '',
    resource_type: '',
    conditions: { operator: 'and', rules: [] } as Record<string, unknown>,
    scope: '',
    effect: 'allow' as 'allow' | 'deny',
    priority: 50,
    is_active: true,
    metadata: {},
  });

  // テスト用コンテキスト
  const [testContext, setTestContext] = useState('{}');

  const handleCreate = async () => {
    createPolicyMutation.mutate(formData, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleUpdate = async () => {
    if (!selectedPolicy) return;
    
    updatePolicyMutation.mutate(
      { id: selectedPolicy.id, data: formData },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          resetForm();
        }
      }
    );
  };

  const handleDelete = async (policy: AccessPolicy) => {
    if (!confirm(`ポリシー「${policy.name}」を削除しますか？`)) return;
    
    deletePolicyMutation.mutate(policy.id);
  };

  const handleTestConditions = async () => {
    try {
      const context = JSON.parse(testContext);
      testConditionsMutation.mutate({
        conditions: formData.conditions,
        test_context: context,
      });
    } catch {
      toast.error('テストコンテキストのJSON形式が正しくありません');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      business_code: '',
      action: '',
      resource_type: '',
      conditions: { operator: 'and', rules: [] } as Record<string, unknown>,
      scope: '',
      effect: 'allow',
      priority: 50,
      is_active: true,
      metadata: {},
    });
    setSelectedPolicy(null);
  };

  const openEditDialog = (policy: AccessPolicy) => {
    setSelectedPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description || '',
      business_code: policy.business_code,
      action: policy.action,
      resource_type: policy.resource_type,
      conditions: policy.conditions,
      scope: policy.scope || '',
      effect: policy.effect,
      priority: policy.priority,
      is_active: policy.is_active,
      metadata: policy.metadata || {},
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (policy: AccessPolicy) => {
    setSelectedPolicy(policy);
    setViewDialogOpen(true);
  };

  const openTestDialog = (policy: AccessPolicy) => {
    setSelectedPolicy(policy);
    setFormData(prev => ({ ...prev, conditions: policy.conditions }));
    setTestDialogOpen(true);
  };

  const getEffectLabel = (effect: string) => {
    return effect === 'allow' ? '許可' : '拒否';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ABACポリシー管理</h2>
          <p className="text-muted-foreground">
            属性ベースアクセス制御（ABAC）ポリシーの管理
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            // 選択されたビジネスコードを自動設定
            if (selectedBusinessCode) {
              setFormData(prev => ({
                ...prev,
                business_code: selectedBusinessCode
              }));
            }
            setCreateDialogOpen(true);
          }}
          className="flex items-center gap-2"
          disabled={!selectedBusinessCode}
        >
          <Plus className="h-4 w-4" />
          新規作成
        </Button>
      </div>

      {/* ビジネスコード選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ビジネスコード選択</CardTitle>
          <CardDescription>
            ポリシーを管理するビジネスコードを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="business-code-select">ビジネスコード</Label>
              <Select
                value={selectedBusinessCode}
                onValueChange={setSelectedBusinessCode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ビジネスコードを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {options?.business_codes.map((bc) => (
                    <SelectItem key={bc.code} value={bc.code}>
                      {bc.name} ({bc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBusinessCode && (
              <div className="text-sm text-muted-foreground">
                選択中: {options?.business_codes.find(bc => bc.code === selectedBusinessCode)?.name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* ポリシー一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedBusinessCode 
              ? `${options?.business_codes.find(bc => bc.code === selectedBusinessCode)?.name} のポリシー一覧`
              : 'ポリシー一覧'
            }
          </CardTitle>
          <CardDescription>
            {selectedBusinessCode 
              ? `選択されたビジネスコード「${selectedBusinessCode}」に紐づくポリシーを表示しています`
              : 'ビジネスコードを選択すると、そのビジネスコードに紐づくポリシーが表示されます'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>アクション</TableHead>
                <TableHead>効果</TableHead>
                <TableHead>優先度</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>作成日</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedBusinessCode ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="h-8 w-8 text-muted-foreground" />
                      <p>ビジネスコードを選択してください</p>
                      <p className="text-sm">上記のドロップダウンからビジネスコードを選択すると、そのビジネスコードに紐づくポリシーが表示されます</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : policies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="h-8 w-8 text-muted-foreground" />
                      <p>このビジネスコードにはポリシーがありません</p>
                      <p className="text-sm">「新規作成」ボタンからポリシーを作成できます</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                policies.map((policy) => (
                  <TableRow key={policy.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{policy.name}</div>
                      {policy.description && (
                        <div className="text-sm text-muted-foreground">
                          {policy.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{policy.action}</TableCell>
                  <TableCell>
                    <Badge variant={policy.effect === 'allow' ? 'default' : 'destructive'}>
                      {getEffectLabel(policy.effect)}
                    </Badge>
                  </TableCell>
                  <TableCell>{policy.priority}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={policy.is_active ? "default" : "secondary"}>
                        {policy.is_active ? 'アクティブ' : '非アクティブ'}
                      </Badge>
                      {policy.is_system && (
                        <Badge variant="outline">
                          システム
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(policy.created_at).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openViewDialog(policy)
                        }}
                        title="詳細表示"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openTestDialog(policy)
                        }}
                        title="条件式テスト"
                      >
                        <TestTube className="h-4 w-4" />
                      </Button>
                      {!policy.is_system && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDialog(policy)
                            }}
                            title="編集"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(policy)
                            }}
                            title="削除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新規作成ダイアログ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>新規ポリシー作成</DialogTitle>
          </DialogHeader>
          <PolicyForm
            formData={formData}
            setFormData={setFormData}
            options={options}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreate}>作成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>ポリシー編集</DialogTitle>
          </DialogHeader>
          <PolicyForm
            formData={formData}
            setFormData={setFormData}
            options={options}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdate}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 詳細表示ダイアログ */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>ポリシー詳細</DialogTitle>
          </DialogHeader>
          {selectedPolicy && (
            <PolicyView policy={selectedPolicy} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 条件式テストダイアログ */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>条件式テスト</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-context">テストコンテキスト (JSON形式)</Label>
              <Textarea
                id="test-context"
                rows={8}
                value={testContext}
                onChange={(e) => setTestContext(e.target.value)}
                placeholder='{"user_id": 1, "department_id": 1, "data": {"amount": 1000000}}'
              />
            </div>
            <div>
              <Label htmlFor="conditions">条件式</Label>
              <Textarea
                id="conditions"
                rows={6}
                value={JSON.stringify(formData.conditions, null, 2)}
                readOnly
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleTestConditions}>テスト実行</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ポリシーフォームコンポーネント
const PolicyForm: React.FC<{
  formData: {
    name: string;
    description: string;
    business_code: string;
    action: string;
    resource_type: string;
    conditions: Record<string, unknown>;
    scope: string;
    effect: 'allow' | 'deny';
    priority: number;
    is_active: boolean;
    metadata: Record<string, unknown>;
  };
  setFormData: (data: {
    name: string;
    description: string;
    business_code: string;
    action: string;
    resource_type: string;
    conditions: Record<string, unknown>;
    scope: string;
    effect: 'allow' | 'deny';
    priority: number;
    is_active: boolean;
    metadata: Record<string, unknown>;
  }) => void;
  options: PolicyOptions | null;
}> = ({ formData, setFormData, options }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="policy-name">名前 *</Label>
          <Input
            id="policy-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="ポリシー名を入力"
          />
        </div>
        <div>
          <Label htmlFor="business-code">ビジネスコード *</Label>
          <Input
            id="business-code"
            value={options?.business_codes.find(bc => bc.code === formData.business_code)?.name || formData.business_code}
            readOnly
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground mt-1">
            ビジネスコードは上記の選択から自動設定されます
          </p>
        </div>
      </div>
      
      <div>
        <Label htmlFor="policy-description">説明</Label>
        <Textarea
          id="policy-description"
          rows={2}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="ポリシーの説明を入力"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="action">アクション *</Label>
          <Select
            value={formData.action}
            onValueChange={(value) => setFormData({ ...formData, action: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="アクションを選択" />
            </SelectTrigger>
            <SelectContent>
              {options?.actions && Object.entries(options.actions).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value} ({key})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="resource-type">リソースタイプ *</Label>
          <Select
            value={formData.resource_type}
            onValueChange={(value) => setFormData({ ...formData, resource_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="リソースタイプを選択" />
            </SelectTrigger>
            <SelectContent>
              {options?.resource_types && Object.entries(options.resource_types).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value} ({key})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="effect">効果 *</Label>
          <Select
            value={formData.effect}
            onValueChange={(value) => setFormData({ ...formData, effect: value as 'allow' | 'deny' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="効果を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allow">許可</SelectItem>
              <SelectItem value="deny">拒否</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">優先度</Label>
          <Input
            id="priority"
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            min={0}
            max={1000}
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is-active">アクティブ</Label>
        </div>
      </div>
      
      <div>
        <Label htmlFor="conditions">条件式 (JSON形式) *</Label>
        <Textarea
          id="conditions"
          rows={8}
          value={JSON.stringify(formData.conditions, null, 2)}
          onChange={(e) => {
            try {
              const conditions = JSON.parse(e.target.value);
              setFormData({ ...formData, conditions });
            } catch {
              // JSON解析エラーは無視
            }
          }}
          placeholder='{"operator": "and", "rules": [{"field": "user_id", "operator": "eq", "value": 1}]}'
        />
      </div>
    </div>
  );
};

// ポリシー詳細表示コンポーネント
const PolicyView: React.FC<{ policy: AccessPolicy }> = ({ policy }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">名前</label>
          <div className="text-lg font-semibold">{policy.name}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">ビジネスコード</label>
          <div className="text-lg font-semibold">
            {policy.business_code_name || policy.business_code}
          </div>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium text-muted-foreground">説明</label>
        <div className="text-lg font-semibold">
          {policy.description || 'なし'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">アクション</label>
          <div className="text-lg font-semibold">{policy.action}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">リソースタイプ</label>
          <div className="text-lg font-semibold">{policy.resource_type}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">効果</label>
          <Badge variant={policy.effect === 'allow' ? 'default' : 'destructive'}>
            {policy.effect === 'allow' ? '許可' : '拒否'}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">優先度</label>
          <div className="text-lg font-semibold">{policy.priority}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">状態</label>
          <div className="flex items-center gap-2">
            <Badge variant={policy.is_active ? "default" : "secondary"}>
              {policy.is_active ? 'アクティブ' : '非アクティブ'}
            </Badge>
            {policy.is_system && (
              <Badge variant="outline">
                システム
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="policy-conditions">条件式</Label>
        <Textarea
          id="policy-conditions"
          rows={8}
          value={JSON.stringify(policy.conditions, null, 2)}
          readOnly
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">作成日</label>
          <div className="text-lg font-semibold">
            {new Date(policy.created_at).toLocaleString('ja-JP')}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">更新日</label>
          <div className="text-lg font-semibold">
            {new Date(policy.updated_at).toLocaleString('ja-JP')}
          </div>
        </div>
      </div>
    </div>
  );
};
