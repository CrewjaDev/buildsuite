'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Trash2, Shield, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { 
  useABACPolicies, 
  useABACPolicyOptions, 
  useCreateABACPolicy, 
  useUpdateABACPolicy, 
  useDeleteABACPolicy
} from '@/hooks/features/permission/useABACPolicies';
import { 
  usePolicyTemplatesByAction,
  useGenerateCombinedCondition
} from '@/hooks/features/permission/usePolicyTemplates';
import PolicyWizard, { type WizardData } from './PolicyWizard';
import type { AccessPolicy } from '@/services/features/permission/abacPolicyService';
import type { PolicyTemplate } from '@/services/features/permission/policyTemplateService';


export default function ABACPolicyManagement() {
  // 選択されたビジネスコードの状態
  const [selectedBusinessCode, setSelectedBusinessCode] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');

  // React Query hooks
  const { data: policiesResponse, isLoading: policiesLoading } = useABACPolicies(
    selectedBusinessCode ? { business_code: selectedBusinessCode } : {}
  );
  const { data: optionsResponse, isLoading: optionsLoading } = useABACPolicyOptions();
  const createPolicyMutation = useCreateABACPolicy();
  const updatePolicyMutation = useUpdateABACPolicy();
  const deletePolicyMutation = useDeleteABACPolicy();
  
  // テンプレート関連のhooks
  const { data: templatesResponse, isLoading: templatesLoading } = usePolicyTemplatesByAction(selectedAction);
  const generateCombinedConditionMutation = useGenerateCombinedCondition();

  const policies = policiesResponse?.data?.data || [];
  const options = optionsResponse?.data || null;
  const templates = templatesResponse?.data || [];
  const loading = policiesLoading || optionsLoading || templatesLoading;
  
  // ダイアログ状態
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [templateSelectDialogOpen, setTemplateSelectDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<AccessPolicy | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<PolicyTemplate[]>([]);

  




  const handleDelete = async (policy: AccessPolicy) => {
    if (!confirm(`ポリシー「${policy.name}」を削除しますか？`)) return;
    
    deletePolicyMutation.mutate(policy.id);
  };


  const handleTemplateSelect = (template: PolicyTemplate) => {
    const isSelected = selectedTemplates.some(t => t.id === template.id);
    if (isSelected) {
      setSelectedTemplates(selectedTemplates.filter(t => t.id !== template.id));
    } else {
      setSelectedTemplates([...selectedTemplates, template]);
    }
  };

  const handleGenerateFromTemplates = async () => {
    if (selectedTemplates.length === 0) {
      toast.error('テンプレートを選択してください');
      return;
    }

    const templateIds = selectedTemplates.map(t => t.id);
    const parameters: Record<string, unknown> = {};

    // パラメータの収集（簡易版）
    selectedTemplates.forEach(template => {
      if (template.parameters?.configurable_values) {
        Object.keys(template.parameters.configurable_values).forEach(key => {
          const param = template.parameters!.configurable_values![key];
          if (param.default !== undefined) {
            parameters[key] = param.default;
          }
        });
      }
    });

    generateCombinedConditionMutation.mutate({
      template_ids: templateIds,
      operator: 'and',
      parameters: parameters,
    }, {
      onSuccess: () => {
        setTemplateSelectDialogOpen(false);
        setSelectedTemplates([]); // 選択をリセット
        toast.success('テンプレートから条件式を生成しました');
      }
    });
  };

  const handleWizardComplete = async (wizardData: WizardData) => {
    const policyData = {
      name: wizardData.name,
      description: wizardData.description,
      business_code: wizardData.business_code,
      action: wizardData.action,
      resource_type: wizardData.resource_type,
      conditions: wizardData.conditions,
      scope: wizardData.scope,
      effect: wizardData.effect,
      priority: wizardData.priority,
      is_active: wizardData.is_active,
      metadata: wizardData.metadata,
    };

    createPolicyMutation.mutate(policyData);
  };

  const handleEdit = async (wizardData: WizardData) => {
    if (!selectedPolicy) return;
    
    const policyData = {
      name: wizardData.name,
      description: wizardData.description,
      business_code: wizardData.business_code,
      action: wizardData.action,
      resource_type: wizardData.resource_type,
      conditions: wizardData.conditions,
      scope: wizardData.scope,
      effect: wizardData.effect,
      priority: wizardData.priority,
      is_active: wizardData.is_active,
      metadata: wizardData.metadata,
    };

    updatePolicyMutation.mutate(
      { id: selectedPolicy.id, data: policyData },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          resetForm();
        },
        onError: () => {
          toast.error('ポリシーの更新に失敗しました');
        }
      }
    );
  };

  const resetForm = () => {
    setSelectedPolicy(null);
  };

  const openEditDialog = (policy: AccessPolicy) => {
    console.log('🚨 CRITICAL DEBUG - openEditDialog - selectedPolicy:', policy);
    console.log('🚨 CRITICAL DEBUG - policy.metadata:', policy.metadata);
    console.log('🚨 CRITICAL DEBUG - policy.name:', policy.name);
    console.log('🚨 CRITICAL DEBUG - policy.description:', policy.description);
    console.log('🚨 CRITICAL DEBUG - policy.business_code:', policy.business_code);
    console.log('🚨 CRITICAL DEBUG - policy.action:', policy.action);
    console.log('🚨 CRITICAL DEBUG - policy.resource_type:', policy.resource_type);
    console.log('🚨 CRITICAL DEBUG - policy.effect:', policy.effect);
    console.log('🚨 CRITICAL DEBUG - policy.priority:', policy.priority);
    console.log('🚨 CRITICAL DEBUG - policy.is_active:', policy.is_active);
    console.log('🚨 CRITICAL DEBUG - policy.conditions:', policy.conditions);
    setSelectedPolicy(policy);
    setEditDialogOpen(true);
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
        <div className="flex flex-col gap-3">

          {/* 作成ボタン */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                console.log('Opening wizard with selectedBusinessCode:', selectedBusinessCode);
                // ビジネスコードが選択されていない場合は選択を促す
                if (!selectedBusinessCode) {
                  toast.error('ビジネスコードを選択してください');
                  return;
                }
                setWizardOpen(true);
              }}
              className="flex items-center gap-2"
              disabled={!selectedBusinessCode}
            >
              <Wand2 className="h-4 w-4" />
              ウィザードで作成
            </Button>
            
            <Button
              onClick={() => setTemplateSelectDialogOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
              disabled={!selectedBusinessCode || !selectedAction}
            >
              <Shield className="h-4 w-4" />
              テンプレートから作成
            </Button>
          </div>
        </div>
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

      {/* アクション選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">アクション選択</CardTitle>
          <CardDescription>
            テンプレートから作成する場合は、アクションを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="action-select">アクション</Label>
              <Select
                value={selectedAction}
                onValueChange={setSelectedAction}
              >
                <SelectTrigger>
                  <SelectValue placeholder="アクションを選択してください" />
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
            {selectedAction && (
              <div className="text-sm text-muted-foreground">
                選択中: {options?.actions?.[selectedAction]}
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

      {/* 新規作成ダイアログ - 一画面形式は削除済み */}

              {/* 編集ウィザード */}
              {editDialogOpen && (
                <PolicyWizard
                  isOpen={editDialogOpen}
                  onClose={() => setEditDialogOpen(false)}
                  onComplete={handleEdit}
                  options={options}
                  isEditMode={true}
                initialData={(() => {
                  const templateInfo = selectedPolicy?.metadata?.template_info as {
                    selected_templates?: number[];
                    template_parameters?: Record<string, Record<string, unknown>>;
                  } | undefined;
                  
                  const initialData = {
                    name: selectedPolicy?.name || '',
                    description: selectedPolicy?.description || '',
                    business_code: selectedPolicy?.business_code || '',
                    action: selectedPolicy?.action || '',
                    resource_type: selectedPolicy?.resource_type || '',
                    effect: selectedPolicy?.effect || 'allow',
                    priority: selectedPolicy?.priority || 50,
                    is_active: selectedPolicy?.is_active ?? true,
                    selectedTemplates: [], // テンプレートIDは空配列（PolicyWizard内で復元される）
                    templateParameters: templateInfo?.template_parameters || {}, // テンプレートパラメータを復元
                    conditions: selectedPolicy?.conditions || {},
                    scope: selectedPolicy?.scope || '',
                    metadata: selectedPolicy?.metadata || {} // 元のmetadataをそのまま渡す
                  };
                  
                  // 緊急デバッグ：initialDataの内容を詳細確認
                  console.log('🚨 EMERGENCY DEBUG - initialData.name:', initialData.name);
                  console.log('🚨 EMERGENCY DEBUG - initialData.description:', initialData.description);
                  console.log('🚨 EMERGENCY DEBUG - initialData.business_code:', initialData.business_code);
                  console.log('🚨 EMERGENCY DEBUG - initialData.action:', initialData.action);
                  console.log('🚨 EMERGENCY DEBUG - initialData.resource_type:', initialData.resource_type);
                  console.log('🚨 EMERGENCY DEBUG - initialData.effect:', initialData.effect);
                  console.log('🚨 EMERGENCY DEBUG - initialData.priority:', initialData.priority);
                  console.log('🚨 EMERGENCY DEBUG - initialData.is_active:', initialData.is_active);
                  console.log('🚨 EMERGENCY DEBUG - initialData.templateParameters:', initialData.templateParameters);
                  console.log('🚨 EMERGENCY DEBUG - initialData.conditions:', initialData.conditions);
                  console.log('🔍 PolicyWizard initialData:', initialData);
                  console.log('🔍 PolicyWizard templateParameters:', templateInfo?.template_parameters);
                  console.log('🔍 PolicyWizard selectedPolicy:', selectedPolicy);
                  console.log('🔍 PolicyWizard templateInfo:', templateInfo);
                  return initialData;
                })()}
                />
              )}


      {/* テンプレート選択ダイアログ */}
      <TemplateSelectDialog
        open={templateSelectDialogOpen}
        onOpenChange={setTemplateSelectDialogOpen}
        templates={templates}
        selectedTemplates={selectedTemplates}
        onTemplateSelect={handleTemplateSelect}
        onGenerate={handleGenerateFromTemplates}
        loading={generateCombinedConditionMutation.isPending}
      />

              {/* ポリシー作成ウィザード */}
              {!editDialogOpen && (
                <PolicyWizard
                  isOpen={wizardOpen}
                  onClose={() => setWizardOpen(false)}
                  onComplete={handleWizardComplete}
                  options={options}
                  isEditMode={false}
                  initialData={{
                    business_code: selectedBusinessCode,
                    action: selectedAction,
                  }}
                />
              )}
    </div>
  );
}



// テンプレート選択ダイアログ
const TemplateSelectDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: PolicyTemplate[];
  selectedTemplates: PolicyTemplate[];
  onTemplateSelect: (template: PolicyTemplate) => void;
  onGenerate: () => void;
  loading?: boolean;
}> = ({ open, onOpenChange, templates, selectedTemplates, onTemplateSelect, onGenerate, loading }) => {
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, PolicyTemplate[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>テンプレートから条件式を生成</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-2">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryTemplates.map((template) => {
                  const isSelected = selectedTemplates.some(t => t.id === template.id);
                  return (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => onTemplateSelect(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {template.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="ml-2">
                            {isSelected && (
                              <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selectedTemplates.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">選択されたテンプレート:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTemplates.map((template) => (
                <Badge key={template.id} variant="default">
                  {template.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={onGenerate} 
            disabled={selectedTemplates.length === 0 || loading}
          >
            {loading ? '生成中...' : '条件式を生成'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
