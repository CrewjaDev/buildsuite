# チーム別承認フロー実装計画書

## 1. 概要

### 1.1 目的
既存のdepartmentテーブルを活用して、チーム別の承認ルートを実現する。Aチーム、Bチーム、Cチームそれぞれに独立した承認フローを設定し、各チームメンバーが自分のチームの承認フローのみを使用できるシステムを構築する。

### 1.2 対象組織
```
Aチーム（部署）
リーダ 山田
メンバー 久保井、中野、三浦

Bチーム（部署）
リーダ 田中
メンバー 高井、工藤、三野

Cチーム（部署）
リーダ 吉田
メンバー 光枝、古賀

野瀬社長（最終決裁者）
```

### 1.3 実現する機能
- チーム別の独立した承認フロー
- 部署ベースの承認依頼権限
- チームリーダーによる承認権限
- 社長による最終決裁権限
- 柔軟な承認条件設定

## 2. データベース設計

### 2.1 既存テーブルの確認
既存のdepartmentテーブルとusersテーブルの構造を確認し、承認フローとの連携を設計する。

#### 2.1.1 departmentsテーブル
```sql
-- 既存のdepartmentsテーブル構造
CREATE TABLE departments (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### 2.1.2 usersテーブル
```sql
-- usersテーブルのdepartment_idとの連携
-- department_idカラムが存在することを前提
```

### 2.2 approval_flowsテーブルの拡張
```sql
-- approval_flowsテーブルにJSONカラムを追加
ALTER TABLE approval_flows ADD COLUMN requesters JSON;
ALTER TABLE approval_flows ADD COLUMN approval_steps JSON;

-- インデックスの追加（パフォーマンス向上）
CREATE INDEX idx_approval_flows_requesters ON approval_flows USING GIN (requesters);
CREATE INDEX idx_approval_flows_approval_steps ON approval_flows USING GIN (approval_steps);
```

### 2.3 マスタデータの準備
```sql
-- 部署データの準備
INSERT INTO departments (id, name, code, description) VALUES
(1, 'Aチーム', 'team_a', 'Aチーム（山田リーダー）'),
(2, 'Bチーム', 'team_b', 'Bチーム（田中リーダー）'),
(3, 'Cチーム', 'team_c', 'Cチーム（吉田リーダー）');

-- ユーザーデータの準備（department_idとの紐づけ）
UPDATE users SET department_id = 1 WHERE name IN ('久保井', '中野', '三浦');
UPDATE users SET department_id = 2 WHERE name IN ('高井', '工藤', '三野');
UPDATE users SET department_id = 3 WHERE name IN ('光枝', '古賀');
UPDATE users SET department_id = 1 WHERE name = '山田'; -- Aチームリーダー
UPDATE users SET department_id = 2 WHERE name = '田中'; -- Bチームリーダー
UPDATE users SET department_id = 3 WHERE name = '吉田'; -- Cチームリーダー
```

## 3. バックエンド実装

### 3.1 マイグレーション作成
```bash
# マイグレーションファイルの作成
php artisan make:migration add_json_columns_to_approval_flows_table
```

#### 3.1.1 マイグレーション内容
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddJsonColumnsToApprovalFlowsTable extends Migration
{
    public function up()
    {
        Schema::table('approval_flows', function (Blueprint $table) {
            $table->json('requesters')->nullable()->comment('承認依頼者設定');
            $table->json('approval_steps')->nullable()->comment('承認ステップ設定');
        });
    }

    public function down()
    {
        Schema::table('approval_flows', function (Blueprint $table) {
            $table->dropColumn(['requesters', 'approval_steps']);
        });
    }
}
```

### 3.2 モデルの更新

#### 3.2.1 ApprovalFlowモデルの更新
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalFlow extends Model
{
    protected $fillable = [
        'name',
        'description',
        'is_active',
        'requesters',
        'approval_steps'
    ];

    protected $casts = [
        'requesters' => 'array',
        'approval_steps' => 'array',
        'is_active' => 'boolean'
    ];

    // 承認依頼者権限チェック
    public function canCreateApprovalRequest($userId)
    {
        $user = User::find($userId);
        if (!$user) return false;

        foreach ($this->requesters as $requester) {
            switch ($requester['type']) {
                case 'department':
                    if ($user->department_id == $requester['value']) {
                        return true;
                    }
                    break;
                case 'user':
                    if ($userId == $requester['value']) {
                        return true;
                    }
                    break;
                case 'system_level':
                    if ($user->system_level_id == $requester['value']) {
                        return true;
                    }
                    break;
                case 'position':
                    if ($user->position_id == $requester['value']) {
                        return true;
                    }
                    break;
            }
        }
        return false;
    }

    // 承認者権限チェック
    public function canApprove($userId, $step)
    {
        $user = User::find($userId);
        if (!$user) return false;

        $stepConfig = $this->approval_steps[$step - 1] ?? null;
        if (!$stepConfig) return false;

        foreach ($stepConfig['approvers'] as $approver) {
            switch ($approver['type']) {
                case 'department':
                    if ($user->department_id == $approver['value']) {
                        return true;
                    }
                    break;
                case 'user':
                    if ($userId == $approver['value']) {
                        return true;
                    }
                    break;
                case 'system_level':
                    if ($user->system_level_id == $approver['value']) {
                        return true;
                    }
                    break;
                case 'position':
                    if ($user->position_id == $approver['value']) {
                        return true;
                    }
                    break;
            }
        }
        return false;
    }

    // 承認条件の判定
    public function isStepCompleted($approvalRequest, $step)
    {
        $stepConfig = $this->approval_steps[$step - 1] ?? null;
        if (!$stepConfig) return false;

        $approvals = ApprovalHistory::where('approval_request_id', $approvalRequest->id)
            ->where('step', $step)
            ->where('action', 'approve')
            ->get();

        $condition = $stepConfig['condition'];
        $totalApprovers = count($stepConfig['approvers']);
        $approvedCount = count($approvals);

        switch ($condition['type']) {
            case 'required':
                return $approvedCount === $totalApprovers;
            case 'majority':
                return $approvedCount > ($totalApprovers / 2);
            case 'optional':
                return $approvedCount > 0;
            default:
                return false;
        }
    }
}
```

### 3.3 コントローラーの実装

#### 3.3.1 ApprovalFlowControllerの更新
```php
<?php

namespace App\Http\Controllers;

use App\Models\ApprovalFlow;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ApprovalFlowController extends Controller
{
    // 承認フロー一覧取得
    public function index(Request $request): JsonResponse
    {
        $flows = ApprovalFlow::where('is_active', true)
            ->with(['approvalRequests' => function ($query) {
                $query->where('status', 'pending');
            }])
            ->get();

        return response()->json($flows);
    }

    // 承認フロー作成
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'requesters' => 'required|array',
            'approval_steps' => 'required|array|min:1|max:3',
            'is_active' => 'boolean'
        ]);

        $flow = ApprovalFlow::create([
            'name' => $request->name,
            'description' => $request->description,
            'requesters' => $request->requesters,
            'approval_steps' => $request->approval_steps,
            'is_active' => $request->is_active ?? true
        ]);

        return response()->json($flow, 201);
    }

    // 承認フロー更新
    public function update(Request $request, ApprovalFlow $approvalFlow): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'requesters' => 'required|array',
            'approval_steps' => 'required|array|min:1|max:3',
            'is_active' => 'boolean'
        ]);

        $approvalFlow->update([
            'name' => $request->name,
            'description' => $request->description,
            'requesters' => $request->requesters,
            'approval_steps' => $request->approval_steps,
            'is_active' => $request->is_active ?? true
        ]);

        return response()->json($approvalFlow);
    }

    // ユーザーが使用可能な承認フロー取得
    public function getAvailableFlows(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $flows = ApprovalFlow::where('is_active', true)->get();
        
        $availableFlows = $flows->filter(function ($flow) use ($userId) {
            return $flow->canCreateApprovalRequest($userId);
        });

        return response()->json($availableFlows->values());
    }

    // 部署一覧取得（承認フロー設定用）
    public function getDepartments(): JsonResponse
    {
        $departments = Department::where('is_active', true)
            ->select('id', 'name', 'code')
            ->get();

        return response()->json($departments);
    }

    // ユーザー一覧取得（承認フロー設定用）
    public function getUsers(): JsonResponse
    {
        $users = User::with('department')
            ->select('id', 'name', 'department_id')
            ->get();

        return response()->json($users);
    }
}
```

### 3.4 承認依頼処理の実装

#### 3.4.1 ApprovalRequestControllerの更新
```php
<?php

namespace App\Http\Controllers;

use App\Models\ApprovalRequest;
use App\Models\ApprovalFlow;
use App\Models\ApprovalHistory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ApprovalRequestController extends Controller
{
    // 承認依頼作成
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'approval_flow_id' => 'required|exists:approval_flows,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'request_data' => 'nullable|array'
        ]);

        $userId = $request->user()->id;
        $approvalFlow = ApprovalFlow::find($request->approval_flow_id);

        // 承認依頼者権限チェック
        if (!$approvalFlow->canCreateApprovalRequest($userId)) {
            return response()->json([
                'message' => '承認依頼の権限がありません'
            ], 403);
        }

        $approvalRequest = ApprovalRequest::create([
            'user_id' => $userId,
            'approval_flow_id' => $approvalFlow->id,
            'title' => $request->title,
            'description' => $request->description,
            'request_data' => $request->request_data,
            'status' => 'pending',
            'current_step' => 1
        ]);

        // 第1ステップの承認者に通知
        $this->notifyApprovers($approvalRequest, 1);

        return response()->json($approvalRequest, 201);
    }

    // 承認処理
    public function approve(Request $request, ApprovalRequest $approvalRequest): JsonResponse
    {
        $request->validate([
            'comment' => 'nullable|string'
        ]);

        $userId = $request->user()->id;
        $currentStep = $approvalRequest->current_step;

        // 承認者権限チェック
        if (!$approvalRequest->approvalFlow->canApprove($userId, $currentStep)) {
            return response()->json([
                'message' => '承認権限がありません'
            ], 403);
        }

        // 承認履歴を記録
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'step' => $currentStep,
            'approver_id' => $userId,
            'action' => 'approve',
            'comment' => $request->comment,
            'acted_at' => now()
        ]);

        // 承認条件をチェック
        if ($approvalRequest->approvalFlow->isStepCompleted($approvalRequest, $currentStep)) {
            // 次のステップへ
            if ($currentStep < count($approvalRequest->approvalFlow->approval_steps)) {
                $approvalRequest->update(['current_step' => $currentStep + 1]);
                $this->notifyApprovers($approvalRequest, $currentStep + 1);
            } else {
                // 最終承認完了
                $approvalRequest->update(['status' => 'approved']);
            }
        }

        return response()->json($approvalRequest);
    }

    // 承認者通知
    private function notifyApprovers(ApprovalRequest $approvalRequest, int $step)
    {
        $stepConfig = $approvalRequest->approvalFlow->approval_steps[$step - 1];
        $approvers = [];

        foreach ($stepConfig['approvers'] as $approver) {
            switch ($approver['type']) {
                case 'department':
                    $approvers = array_merge($approvers, 
                        User::where('department_id', $approver['value'])->pluck('id')->toArray());
                    break;
                case 'user':
                    $approvers[] = $approver['value'];
                    break;
                case 'system_level':
                    $approvers = array_merge($approvers, 
                        User::where('system_level_id', $approver['value'])->pluck('id')->toArray());
                    break;
                case 'position':
                    $approvers = array_merge($approvers, 
                        User::where('position_id', $approver['value'])->pluck('id')->toArray());
                    break;
            }
        }

        // 通知処理（メール、Slack等）
        foreach ($approvers as $approverId) {
            // 通知ロジックを実装
        }
    }
}
```

## 4. フロントエンド実装

### 4.1 承認フロー設定画面

#### 4.1.1 ApprovalFlowForm.tsx
```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ApprovalFlowFormProps {
  flow?: ApprovalFlow;
  onSave: (flow: ApprovalFlow) => void;
  onCancel: () => void;
}

export default function ApprovalFlowForm({ flow, onSave, onCancel }: ApprovalFlowFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requesters: [] as Requester[],
    approval_steps: [] as ApprovalStep[],
    is_active: true
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // 部署とユーザー一覧を取得
    fetchDepartments();
    fetchUsers();
    
    if (flow) {
      setFormData(flow);
    }
  }, [flow]);

  const fetchDepartments = async () => {
    const response = await api.get('/approval-flows/departments');
    setDepartments(response.data);
  };

  const fetchUsers = async () => {
    const response = await api.get('/approval-flows/users');
    setUsers(response.data);
  };

  const addRequester = (type: string) => {
    const newRequester: Requester = {
      type,
      value: '',
      display_name: ''
    };
    setFormData(prev => ({
      ...prev,
      requesters: [...prev.requesters, newRequester]
    }));
  };

  const updateRequester = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      requesters: prev.requesters.map((requester, i) => 
        i === index ? { ...requester, [field]: value } : requester
      )
    }));
  };

  const addApprovalStep = () => {
    if (formData.approval_steps.length >= 3) return;
    
    const newStep: ApprovalStep = {
      step: formData.approval_steps.length + 1,
      name: `第${formData.approval_steps.length + 1}承認`,
      approvers: [],
      condition: { type: 'required', display_name: '必須承認' }
    };
    
    setFormData(prev => ({
      ...prev,
      approval_steps: [...prev.approval_steps, newStep]
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">フロー名</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例: Aチーム承認フロー"
            />
          </div>
          <div>
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="承認フローの説明"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>承認依頼者設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => addRequester('department')} variant="outline">
              部署を追加
            </Button>
            <Button onClick={() => addRequester('user')} variant="outline">
              ユーザーを追加
            </Button>
          </div>
          
          {formData.requesters.map((requester, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>タイプ</Label>
                <Select
                  value={requester.type}
                  onValueChange={(value) => updateRequester(index, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">部署</SelectItem>
                    <SelectItem value="user">ユーザー</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label>値</Label>
                {requester.type === 'department' ? (
                  <Select
                    value={requester.value}
                    onValueChange={(value) => {
                      const dept = departments.find(d => d.id.toString() === value);
                      updateRequester(index, 'value', value);
                      updateRequester(index, 'display_name', dept?.name || '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="部署を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={requester.value}
                    onValueChange={(value) => {
                      const user = users.find(u => u.id.toString() === value);
                      updateRequester(index, 'value', value);
                      updateRequester(index, 'display_name', user?.name || '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ユーザーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.department?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <Button
                onClick={() => setFormData(prev => ({
                  ...prev,
                  requesters: prev.requesters.filter((_, i) => i !== index)
                }))}
                variant="destructive"
                size="sm"
              >
                削除
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>承認ステップ設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={addApprovalStep} 
            disabled={formData.approval_steps.length >= 3}
            variant="outline"
          >
            ステップを追加 (最大3ステップ)
          </Button>
          
          {formData.approval_steps.map((step, stepIndex) => (
            <div key={stepIndex} className="border rounded-lg p-4 space-y-4">
              <div className="flex gap-2 items-center">
                <Label>ステップ名</Label>
                <Input
                  value={step.name}
                  onChange={(e) => {
                    const newSteps = [...formData.approval_steps];
                    newSteps[stepIndex].name = e.target.value;
                    setFormData(prev => ({ ...prev, approval_steps: newSteps }));
                  }}
                />
              </div>
              
              <div>
                <Label>承認者</Label>
                <div className="space-y-2">
                  {step.approvers.map((approver, approverIndex) => (
                    <div key={approverIndex} className="flex gap-2 items-end">
                      <Select
                        value={approver.type}
                        onValueChange={(value) => {
                          const newSteps = [...formData.approval_steps];
                          newSteps[stepIndex].approvers[approverIndex].type = value;
                          setFormData(prev => ({ ...prev, approval_steps: newSteps }));
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="department">部署</SelectItem>
                          <SelectItem value="user">ユーザー</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={approver.value}
                        onValueChange={(value) => {
                          const newSteps = [...formData.approval_steps];
                          newSteps[stepIndex].approvers[approverIndex].value = value;
                          if (approver.type === 'department') {
                            const dept = departments.find(d => d.id.toString() === value);
                            newSteps[stepIndex].approvers[approverIndex].display_name = dept?.name || '';
                          } else {
                            const user = users.find(u => u.id.toString() === value);
                            newSteps[stepIndex].approvers[approverIndex].display_name = user?.name || '';
                          }
                          setFormData(prev => ({ ...prev, approval_steps: newSteps }));
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="承認者を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {approver.type === 'department' ? (
                            departments.map(dept => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))
                          ) : (
                            users.map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name} ({user.department?.name})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        onClick={() => {
                          const newSteps = [...formData.approval_steps];
                          newSteps[stepIndex].approvers = newSteps[stepIndex].approvers.filter((_, i) => i !== approverIndex);
                          setFormData(prev => ({ ...prev, approval_steps: newSteps }));
                        }}
                        variant="destructive"
                        size="sm"
                      >
                        削除
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    onClick={() => {
                      const newSteps = [...formData.approval_steps];
                      newSteps[stepIndex].approvers.push({
                        type: 'user',
                        value: '',
                        display_name: ''
                      });
                      setFormData(prev => ({ ...prev, approval_steps: newSteps }));
                    }}
                    variant="outline"
                    size="sm"
                  >
                    承認者を追加
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>承認条件</Label>
                <Select
                  value={step.condition.type}
                  onValueChange={(value) => {
                    const newSteps = [...formData.approval_steps];
                    newSteps[stepIndex].condition = {
                      type: value,
                      display_name: value === 'required' ? '必須承認' : 
                                   value === 'majority' ? '過半数承認' : '任意承認'
                    };
                    setFormData(prev => ({ ...prev, approval_steps: newSteps }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="required">必須承認</SelectItem>
                    <SelectItem value="majority">過半数承認</SelectItem>
                    <SelectItem value="optional">任意承認</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave}>保存</Button>
        <Button onClick={onCancel} variant="outline">キャンセル</Button>
      </div>
    </div>
  );
}
```

### 4.2 承認依頼作成画面

#### 4.2.1 ApprovalRequestCreateDialog.tsx
```typescript
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ApprovalRequestCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApprovalRequestCreateDialog({ open, onClose, onSuccess }: ApprovalRequestCreateDialogProps) {
  const [availableFlows, setAvailableFlows] = useState<ApprovalFlow[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    request_data: {}
  });

  useEffect(() => {
    if (open) {
      fetchAvailableFlows();
    }
  }, [open]);

  const fetchAvailableFlows = async () => {
    try {
      const response = await api.get('/approval-flows/available');
      setAvailableFlows(response.data);
    } catch (error) {
      console.error('承認フローの取得に失敗しました:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/approval-requests', {
        approval_flow_id: selectedFlowId,
        ...formData
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('承認依頼の作成に失敗しました:', error);
    }
  };

  const selectedFlow = availableFlows.find(flow => flow.id.toString() === selectedFlowId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>承認依頼作成</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="flow">承認フロー</Label>
            <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
              <SelectTrigger>
                <SelectValue placeholder="承認フローを選択" />
              </SelectTrigger>
              <SelectContent>
                {availableFlows.map(flow => (
                  <SelectItem key={flow.id} value={flow.id.toString()}>
                    {flow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFlow && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">承認フロー情報</h4>
              <div className="space-y-2 text-sm">
                <div>承認ステップ: {selectedFlow.approval_steps.length}ステップ</div>
                {selectedFlow.approval_steps.map((step, index) => (
                  <div key={index}>
                    {step.name}: {step.approvers.map(a => a.display_name).join(', ')} 
                    ({step.condition.display_name})
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="title">件名</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="承認依頼の件名"
            />
          </div>

          <div>
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="詳細な説明"
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button onClick={onClose} variant="outline">キャンセル</Button>
            <Button onClick={handleSubmit} disabled={!selectedFlowId || !formData.title}>
              承認依頼を送信
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## 5. 実装手順

### Phase 1: データベース準備（1日）
1. **マイグレーション実行**
   ```bash
   php artisan migrate
   ```

2. **マスタデータ投入**
   ```bash
   php artisan db:seed --class=DepartmentSeeder
   php artisan db:seed --class=UserSeeder
   ```

3. **承認フローデータの準備**
   - Aチーム、Bチーム、Cチームの承認フローを手動で作成

### Phase 2: バックエンド実装（3日）
1. **モデルの更新**
   - ApprovalFlowモデルの更新
   - 権限チェックメソッドの実装

2. **コントローラーの実装**
   - ApprovalFlowControllerの更新
   - ApprovalRequestControllerの更新

3. **API エンドポイントの実装**
   - 承認フローCRUD
   - 承認依頼処理
   - 権限チェック

### Phase 3: フロントエンド実装（4日）
1. **承認フロー設定画面**
   - ApprovalFlowForm.tsxの実装
   - 部署・ユーザー選択UI

2. **承認依頼作成画面**
   - ApprovalRequestCreateDialog.tsxの実装
   - 利用可能フロー表示

3. **承認処理画面**
   - 承認依頼一覧
   - 承認・却下・差し戻し処理

### Phase 4: 統合・テスト（2日）
1. **フロントエンド・バックエンド統合**
2. **動作テスト**
   - チーム別承認フローの動作確認
   - 権限チェックの動作確認
   - 承認条件の動作確認

3. **エラーハンドリング**
   - 権限エラーの適切な表示
   - バリデーションエラーの処理

## 6. テスト計画

### 6.1 機能テスト
1. **承認フロー設定**
   - 部署ベースの承認依頼者設定
   - ユーザーベースの承認者設定
   - 承認条件の設定

2. **承認依頼処理**
   - チームメンバーによる承認依頼作成
   - 他チームの承認フローへのアクセス制限

3. **承認処理**
   - チームリーダーによる承認
   - 社長による最終承認
   - 承認条件の判定

### 6.2 権限テスト
1. **承認依頼権限**
   - AチームメンバーはAチームフローのみ使用可能
   - BチームメンバーはBチームフローのみ使用可能
   - CチームメンバーはCチームフローのみ使用可能

2. **承認権限**
   - 山田リーダーはAチームの承認のみ可能
   - 田中リーダーはBチームの承認のみ可能
   - 吉田リーダーはCチームの承認のみ可能
   - 野瀬社長は全チームの最終承認可能

### 6.3 エラーケーステスト
1. **権限エラー**
   - 権限のない承認フローへのアクセス
   - 権限のない承認処理

2. **データエラー**
   - 存在しない部署・ユーザーの指定
   - 不正な承認条件の設定

## 7. 運用・保守

### 7.1 監視項目
1. **パフォーマンス**
   - JSON形式データのアクセス速度
   - 承認者判定の処理時間

2. **データ整合性**
   - 承認フローと部署・ユーザーの整合性
   - 承認履歴の正確性

### 7.2 メンテナンス
1. **定期メンテナンス**
   - 不要な承認フローの削除
   - 承認履歴のアーカイブ

2. **組織変更対応**
   - 部署統合・分割時の承認フロー更新
   - 人事異動時の権限更新

## 8. 今後の拡張予定

### 8.1 機能拡張
1. **承認フローテンプレート**
   - よく使用される承認フローのテンプレート化
   - テンプレートからの承認フロー作成

2. **承認者代理設定**
   - 不在時の代理承認者設定
   - 自動的な代理承認者への通知

3. **承認フローバージョン管理**
   - 承認フローの変更履歴管理
   - 過去の承認フローでの承認依頼の処理

### 8.2 UI改善
1. **ドラッグ&ドロップ**
   - 承認ステップの順序変更
   - 承認者の並び替え

2. **視覚的表示**
   - 承認フローのフローチャート表示
   - 承認進捗の視覚的表示

3. **モバイル対応**
   - スマートフォンでの承認処理
   - プッシュ通知による承認依頼通知

この実装計画に従って、チーム別承認フローシステムを段階的に構築していきます。
