# 承認フロー機能 実装ガイド

## 概要
既存の仕様書（`system-level-based-personal-approval-flow.md`）に基づいて、承認フロー機能を実装するための具体的な手順とコード例を提供します。

## 実装前の準備

### 1. 既存仕様書の確認
- `docs/approval/system-level-based-personal-approval-flow.md` を必ず確認
- データベース設計、画面設計、API設計の詳細仕様を理解

### 2. 現在の実装状況確認
- 既存の承認フロー機能（95%完成）
- システム権限レベル機能
- 権限管理システム

## 実装手順

### ステップ1: 権限データの初期設定

#### 1.1 承認フロー関連権限の追加
```php
// PermissionSeeder.php に追加
$approvalFlowPermissions = [
    ['name' => 'approval.flow.view', 'display_name' => '承認フロー設定閲覧', 'description' => '承認フロー設定を閲覧する権限', 'module' => 'approval', 'action' => 'flow', 'resource' => 'view', 'is_system' => true],
    ['name' => 'approval.flow.create', 'display_name' => '承認フロー設定作成', 'description' => '承認フロー設定を作成する権限', 'module' => 'approval', 'action' => 'flow', 'resource' => 'create', 'is_system' => true],
    ['name' => 'approval.flow.edit', 'display_name' => '承認フロー設定編集', 'description' => '承認フロー設定を編集する権限', 'module' => 'approval', 'action' => 'flow', 'resource' => 'edit', 'is_system' => true],
    ['name' => 'approval.flow.delete', 'display_name' => '承認フロー設定削除', 'description' => '承認フロー設定を削除する権限', 'module' => 'approval', 'action' => 'flow', 'resource' => 'delete', 'is_system' => true],
    ['name' => 'estimate.approval.request', 'display_name' => '見積承認依頼作成', 'description' => '見積承認依頼を作成する権限', 'module' => 'estimate', 'action' => 'approval', 'resource' => 'request', 'is_system' => false],
    ['name' => 'estimate.approval.cancel', 'display_name' => '見積承認依頼キャンセル', 'description' => '見積承認依頼をキャンセルする権限', 'module' => 'estimate', 'action' => 'approval', 'resource' => 'cancel', 'is_system' => false],
];
```

#### 1.2 システム権限レベル別権限設定シーダー
```php
// SystemLevelPermissionSeeder.php
class SystemLevelPermissionSeeder extends Seeder
{
    public function run()
    {
        // 上長以上に承認権限を付与
        $supervisorLevel = SystemLevel::where('code', 'supervisor')->first();
        $approvalPermissions = Permission::whereIn('name', [
            'estimate.approval.view',
            'estimate.approval.approve',
            'estimate.approval.reject',
            'estimate.approval.return',
            'estimate.approval.request'
        ])->get();
        
        $supervisorLevel->permissions()->attach($approvalPermissions->pluck('id'), [
            'granted_at' => now(),
            'granted_by' => 1 // システム管理者のID
        ]);
        
        // システム管理者に全権限を付与
        $systemAdminLevel = SystemLevel::where('code', 'system_admin')->first();
        $allPermissions = Permission::all();
        
        $systemAdminLevel->permissions()->attach($allPermissions->pluck('id'), [
            'granted_at' => now(),
            'granted_by' => 1
        ]);
        
        // 事務長以上に最終承認権限を付与
        $officeManagerLevel = SystemLevel::where('code', 'office_manager')->first();
        $finalApprovalPermissions = Permission::whereIn('name', [
            'estimate.approval.view',
            'estimate.approval.approve',
            'estimate.approval.reject',
            'estimate.approval.return'
        ])->get();
        
        $officeManagerLevel->permissions()->attach($finalApprovalPermissions->pluck('id'), [
            'granted_at' => now(),
            'granted_by' => 1
        ]);
    }
}
```

### ステップ2: データベースマイグレーション

#### 2.1 承認フロー設定テーブル作成
```php
// 2024_01_15_000000_create_approval_flow_settings_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_flow_settings', function (Blueprint $table) {
            $table->id();
            $table->string('flow_type', 50)->default('estimate');
            $table->string('setting_name', 255);
            $table->text('description')->nullable();
            
            // システム権限レベルベースの承認者設定
            $table->string('first_approver_system_level', 50);
            $table->string('final_approver_system_level', 50);
            
            // 追加条件（オプション）
            $table->json('first_approver_conditions')->nullable();
            $table->json('final_approver_conditions')->nullable();
            
            // 設定メタデータ
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // インデックス
            $table->unique(['flow_type', 'is_default']);
            $table->index('first_approver_system_level');
            $table->index('final_approver_system_level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_flow_settings');
    }
};
```

#### 2.2 見積テーブル拡張
```php
// 2024_01_15_000001_add_approval_fields_to_estimates_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estimates', function (Blueprint $table) {
            $table->foreignId('approval_request_id')->nullable()->constrained('approval_requests');
            $table->string('approval_status', 20)->default('draft');
            $table->foreignId('approval_flow_id')->nullable()->constrained('approval_flows');
        });
    }

    public function down(): void
    {
        Schema::table('estimates', function (Blueprint $table) {
            $table->dropForeign(['approval_request_id']);
            $table->dropForeign(['approval_flow_id']);
            $table->dropColumn(['approval_request_id', 'approval_status', 'approval_flow_id']);
        });
    }
};
```

### ステップ3: モデル実装

#### 3.1 ApprovalFlowSettingモデル
```php
// app/Models/ApprovalFlowSetting.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalFlowSetting extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'flow_type',
        'setting_name',
        'description',
        'first_approver_system_level',
        'final_approver_system_level',
        'first_approver_conditions',
        'final_approver_conditions',
        'is_active',
        'is_default',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'first_approver_conditions' => 'array',
        'final_approver_conditions' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
    ];

    // リレーション
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function firstApproverSystemLevel(): BelongsTo
    {
        return $this->belongsTo(SystemLevel::class, 'first_approver_system_level', 'code');
    }

    public function finalApproverSystemLevel(): BelongsTo
    {
        return $this->belongsTo(SystemLevel::class, 'final_approver_system_level', 'code');
    }

    // スコープ
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeByFlowType($query, $flowType)
    {
        return $query->where('flow_type', $flowType);
    }
}
```

### ステップ4: サービス実装

#### 4.1 ApprovalFlowService
```php
// app/Services/ApprovalFlowService.php
<?php

namespace App\Services;

use App\Models\ApprovalFlow;
use App\Models\ApprovalFlowSetting;
use App\Models\ApprovalStep;
use App\Models\Estimate;
use App\Models\SystemLevel;
use App\Models\User;
use Illuminate\Support\Collection;

class ApprovalFlowService
{
    /**
     * 承認フロー設定を取得
     */
    public function getApprovalFlowSetting(Estimate $estimate): ?ApprovalFlowSetting
    {
        // 条件に基づいて適切な設定を選択
        $settings = ApprovalFlowSetting::active()
            ->byFlowType('estimate')
            ->orderBy('is_default', 'desc')
            ->get();

        foreach ($settings as $setting) {
            if ($this->matchesConditions($estimate, $setting)) {
                return $setting;
            }
        }

        // デフォルト設定を返す
        return ApprovalFlowSetting::active()
            ->byFlowType('estimate')
            ->default()
            ->first();
    }

    /**
     * 承認フローを作成
     */
    public function createApprovalFlow(Estimate $estimate): ApprovalFlow
    {
        $setting = $this->getApprovalFlowSetting($estimate);
        
        if (!$setting) {
            throw new \Exception('承認フロー設定が見つかりません');
        }

        // 承認フローを作成
        $approvalFlow = ApprovalFlow::create([
            'name' => $setting->setting_name,
            'description' => $setting->description,
            'flow_type' => 'estimate',
            'is_active' => true,
            'created_by' => auth()->id(),
        ]);

        // 承認ステップを作成
        $this->createApprovalSteps($approvalFlow, $setting, $estimate);

        return $approvalFlow;
    }

    /**
     * 承認ステップを作成
     */
    private function createApprovalSteps(ApprovalFlow $approvalFlow, ApprovalFlowSetting $setting, Estimate $estimate)
    {
        $steps = [];

        // 第1承認ステップ
        $steps[] = [
            'approval_flow_id' => $approvalFlow->id,
            'step_order' => 1,
            'step_name' => '第1承認',
            'approver_type' => 'system_level',
            'approver_id' => $setting->first_approver_system_level,
            'approver_condition' => $setting->first_approver_conditions,
            'is_required' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // 最終承認ステップ
        $steps[] = [
            'approval_flow_id' => $approvalFlow->id,
            'step_order' => 2,
            'step_name' => '最終承認',
            'approver_type' => 'system_level',
            'approver_id' => $setting->final_approver_system_level,
            'approver_condition' => $setting->final_approver_conditions,
            'is_required' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        ApprovalStep::insert($steps);
    }

    /**
     * 条件マッチング
     */
    private function matchesConditions(Estimate $estimate, ApprovalFlowSetting $setting): bool
    {
        // デフォルト設定は常にマッチ
        if ($setting->is_default) {
            return true;
        }

        // カスタム条件の実装
        // 例：1000万円以上の場合は高額案件用設定を使用
        if (isset($setting->first_approver_conditions['min_amount'])) {
            $minAmount = $setting->first_approver_conditions['min_amount'];
            if ($estimate->total_amount < $minAmount) {
                return false;
            }
        }

        return true;
    }

    /**
     * 承認者候補を取得
     */
    public function getApproverCandidates(string $systemLevelCode): Collection
    {
        $requiredLevel = SystemLevel::where('code', $systemLevelCode)->first();
        
        if (!$requiredLevel) {
            return collect();
        }

        return User::whereHas('systemLevel', function ($query) use ($requiredLevel) {
            $query->where('priority', '>=', $requiredLevel->priority);
        })
        ->where('is_active', true)
        ->with(['employee.department', 'systemLevel'])
        ->get()
        ->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->employee->name ?? $user->login_id,
                'system_level' => $user->systemLevel->display_name,
                'department' => $user->employee->department->name ?? '未設定',
            ];
        });
    }
}
```

### ステップ5: コントローラー実装

#### 5.1 ApprovalFlowSettingController
```php
// app/Http/Controllers/ApprovalFlowSettingController.php
<?php

namespace App\Http\Controllers;

use App\Models\ApprovalFlowSetting;
use Illuminate\Http\Request;

class ApprovalFlowSettingController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!auth()->user()->hasSystemLevel('system_admin')) {
                abort(403, '承認フロー設定権限がありません');
            }
            return $next($request);
        });
    }

    public function index()
    {
        $settings = ApprovalFlowSetting::with(['createdBy', 'firstApproverSystemLevel', 'finalApproverSystemLevel'])
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($settings);
    }

    public function store(Request $request)
    {
        $request->validate([
            'setting_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'first_approver_system_level' => 'required|exists:system_levels,code',
            'final_approver_system_level' => 'required|exists:system_levels,code',
            'first_approver_conditions' => 'nullable|array',
            'final_approver_conditions' => 'nullable|array',
            'is_default' => 'boolean',
        ]);

        // デフォルト設定の場合は既存のデフォルトを無効化
        if ($request->is_default) {
            ApprovalFlowSetting::where('flow_type', 'estimate')
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $setting = ApprovalFlowSetting::create([
            'flow_type' => 'estimate',
            'setting_name' => $request->setting_name,
            'description' => $request->description,
            'first_approver_system_level' => $request->first_approver_system_level,
            'final_approver_system_level' => $request->final_approver_system_level,
            'first_approver_conditions' => $request->first_approver_conditions,
            'final_approver_conditions' => $request->final_approver_conditions,
            'is_default' => $request->is_default ?? false,
            'created_by' => auth()->id(),
        ]);

        return response()->json($setting, 201);
    }

    public function update(Request $request, ApprovalFlowSetting $setting)
    {
        $request->validate([
            'setting_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'first_approver_system_level' => 'required|exists:system_levels,code',
            'final_approver_system_level' => 'required|exists:system_levels,code',
            'first_approver_conditions' => 'nullable|array',
            'final_approver_conditions' => 'nullable|array',
            'is_default' => 'boolean',
        ]);

        // デフォルト設定の場合は既存のデフォルトを無効化
        if ($request->is_default && !$setting->is_default) {
            ApprovalFlowSetting::where('flow_type', 'estimate')
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $setting->update([
            'setting_name' => $request->setting_name,
            'description' => $request->description,
            'first_approver_system_level' => $request->first_approver_system_level,
            'final_approver_system_level' => $request->final_approver_system_level,
            'first_approver_conditions' => $request->first_approver_conditions,
            'final_approver_conditions' => $request->final_approver_conditions,
            'is_default' => $request->is_default ?? false,
            'updated_by' => auth()->id(),
        ]);

        return response()->json($setting);
    }

    public function destroy(ApprovalFlowSetting $setting)
    {
        if ($setting->is_default) {
            return response()->json(['error' => 'デフォルト設定は削除できません'], 400);
        }

        $setting->delete();
        return response()->json(['message' => '設定を削除しました']);
    }
}
```

#### 5.2 EstimateApprovalController
```php
// app/Http/Controllers/EstimateApprovalController.php
<?php

namespace App\Http\Controllers;

use App\Models\ApprovalHistory;
use App\Models\ApprovalRequest;
use App\Models\Estimate;
use App\Services\ApprovalFlowService;
use Illuminate\Http\Request;

class EstimateApprovalController extends Controller
{
    protected $approvalFlowService;

    public function __construct(ApprovalFlowService $approvalFlowService)
    {
        $this->approvalFlowService = $approvalFlowService;
    }

    /**
     * 承認依頼を作成
     */
    public function requestApproval(Request $request, Estimate $estimate)
    {
        $user = auth()->user();

        // 権限チェック
        if (!$user->hasPermission('estimate.approval.request')) {
            abort(403, '承認依頼作成権限がありません');
        }

        // 既に承認依頼がある場合はエラー
        if ($estimate->approvalRequest) {
            return response()->json(['error' => '既に承認依頼が存在します'], 400);
        }

        // 承認フローを作成
        $approvalFlow = $this->approvalFlowService->createApprovalFlow($estimate);

        // 承認依頼を作成
        $approvalRequest = ApprovalRequest::create([
            'approval_flow_id' => $approvalFlow->id,
            'requestable_type' => Estimate::class,
            'requestable_id' => $estimate->id,
            'requested_by' => $user->id,
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        return response()->json($approvalRequest, 201);
    }

    /**
     * 承認処理
     */
    public function approve(Request $request, Estimate $estimate)
    {
        $user = auth()->user();

        // 権限チェック
        if (!$user->hasPermission('estimate.approval.approve')) {
            abort(403, '承認権限がありません');
        }

        $approvalRequest = $estimate->approvalRequest;
        if (!$approvalRequest) {
            abort(404, '承認依頼が見つかりません');
        }

        $currentStep = $approvalRequest->currentStep;
        if (!$currentStep) {
            abort(404, '承認ステップが見つかりません');
        }

        // 承認者として指定されているかチェック
        if ($currentStep->approver_type === 'system_level') {
            $requiredLevel = $currentStep->approver_id;
            if (!$user->hasSystemLevel($requiredLevel)) {
                abort(403, '承認権限がありません');
            }
        }

        // 承認処理実行
        $this->processApproval($approvalRequest, $user, $request->comment);

        return response()->json(['message' => '承認しました']);
    }

    /**
     * 却下処理
     */
    public function reject(Request $request, Estimate $estimate)
    {
        $user = auth()->user();

        // 権限チェック
        if (!$user->hasPermission('estimate.approval.reject')) {
            abort(403, '却下権限がありません');
        }

        $approvalRequest = $estimate->approvalRequest;
        if (!$approvalRequest) {
            abort(404, '承認依頼が見つかりません');
        }

        // 却下処理実行
        $this->processRejection($approvalRequest, $user, $request->comment);

        return response()->json(['message' => '却下しました']);
    }

    /**
     * 承認処理の実装
     */
    private function processApproval(ApprovalRequest $approvalRequest, $user, string $comment)
    {
        $currentStep = $approvalRequest->currentStep;
        
        // 承認履歴を作成
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'approval_step_id' => $currentStep->id,
            'approver_id' => $user->id,
            'action' => 'approved',
            'comment' => $comment,
            'approved_at' => now(),
        ]);

        // 次のステップがあるかチェック
        $nextStep = $approvalRequest->getNextStep();
        
        if ($nextStep) {
            // 次のステップに進む
            $approvalRequest->update([
                'current_step_id' => $nextStep->id,
                'status' => 'pending',
            ]);
        } else {
            // 承認完了
            $approvalRequest->update([
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            // 見積のステータスを更新
            $estimate = $approvalRequest->requestable;
            $estimate->update(['approval_status' => 'approved']);
        }
    }

    /**
     * 却下処理の実装
     */
    private function processRejection(ApprovalRequest $approvalRequest, $user, string $comment)
    {
        $currentStep = $approvalRequest->currentStep;
        
        // 却下履歴を作成
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'approval_step_id' => $currentStep->id,
            'approver_id' => $user->id,
            'action' => 'rejected',
            'comment' => $comment,
            'approved_at' => now(),
        ]);

        // 承認依頼を却下
        $approvalRequest->update([
            'status' => 'rejected',
            'rejected_at' => now(),
        ]);

        // 見積のステータスを更新
        $estimate = $approvalRequest->requestable;
        $estimate->update(['approval_status' => 'rejected']);
    }
}
```

### ステップ6: 権限設定画面

#### 6.1 SystemLevelPermissionController
```php
// app/Http/Controllers/SystemLevelPermissionController.php
<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\SystemLevel;
use Illuminate\Http\Request;

class SystemLevelPermissionController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!auth()->user()->is_admin) {
                abort(403, '権限設定権限がありません');
            }
            return $next($request);
        });
    }

    public function index()
    {
        $systemLevels = SystemLevel::with('permissions')->get();
        $permissions = Permission::all();
        
        return response()->json([
            'system_levels' => $systemLevels,
            'permissions' => $permissions
        ]);
    }

    public function update(Request $request, SystemLevel $systemLevel)
    {
        $request->validate([
            'permission_ids' => 'array'
        ]);
        
        $systemLevel->permissions()->sync($request->permission_ids, [
            'granted_at' => now(),
            'granted_by' => auth()->id()
        ]);
        
        return response()->json(['message' => '権限を更新しました']);
    }
}
```

## テスト実装

### 1. 権限テスト
```php
// tests/Feature/ApprovalFlowPermissionTest.php
<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Estimate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalFlowPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_system_admin_can_configure_approval_flow()
    {
        $user = User::factory()->create(['system_level' => 'system_admin']);
        
        $response = $this->actingAs($user)
            ->get('/api/approval-flow-settings');
            
        $response->assertStatus(200);
    }

    public function test_non_system_admin_cannot_configure_approval_flow()
    {
        $user = User::factory()->create(['system_level' => 'supervisor']);
        
        $response = $this->actingAs($user)
            ->get('/api/approval-flow-settings');
            
        $response->assertStatus(403);
    }

    public function test_supervisor_can_approve_estimate()
    {
        $user = User::factory()->create(['system_level' => 'supervisor']);
        $estimate = Estimate::factory()->create();
        
        $response = $this->actingAs($user)
            ->post("/api/estimates/{$estimate->id}/approve", [
                'comment' => '承認します'
            ]);
            
        $response->assertStatus(200);
    }
}
```

## 運用開始手順

### 1. データベースマイグレーション
```bash
php artisan migrate
```

### 2. シーダー実行
```bash
php artisan db:seed --class=PermissionSeeder
php artisan db:seed --class=SystemLevelPermissionSeeder
```

### 3. 初期設定
- システム管理者でログイン
- 承認フロー設定画面でデフォルト設定を作成
- 権限設定画面で各システム権限レベルに権限を割り当て

### 4. 動作確認
- 見積作成
- 承認依頼作成
- 承認処理
- 却下処理

## トラブルシューティング

### 1. 権限が反映されない
- シーダーが正しく実行されているか確認
- システム権限レベルと権限の紐づけが正しいか確認

### 2. 承認フローが作成されない
- 承認フロー設定が正しく作成されているか確認
- デフォルト設定が存在するか確認

### 3. 承認処理が失敗する
- ユーザーのシステム権限レベルが正しいか確認
- 承認ステップの設定が正しいか確認

## まとめ

この実装ガイドに従って実装することで、システム権限レベルベースの承認フロー機能が動作します。

**実装順序**:
1. 権限データの初期設定
2. データベースマイグレーション
3. モデル実装
4. サービス実装
5. コントローラー実装
6. 権限設定画面
7. テスト実装
8. 運用開始

**注意点**:
- システム管理者のみが承認フロー設定可能
- 上長以上が承認可能
- 既存の権限システムを活用
- 段階的な機能拡張に対応
