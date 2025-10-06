<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class IntegratedPermissionService
{
    /**
     * 統合された権限チェック
     * RBACとABACを組み合わせて権限を判定
     */
    public function canAccess(
        User $user, 
        string $action, 
        string $resourceType = null, 
        array $data = null
    ): bool {
        try {
            // 1. RBACチェック（既存の権限システム）
            if (!$this->hasRBACPermission($user, $action)) {
                Log::info('RBAC permission denied', [
                    'user_id' => $user->id,
                    'action' => $action,
                    'resource_type' => $resourceType
                ]);
                return false;
            }

            // 2. ABACチェック（データレベル制御）
            if ($resourceType && $data) {
                $abacService = app(ABACPolicyService::class);
                $context = $this->buildDataContext($data);
                
                $abacResult = $abacService->canAccess($user, $action, $resourceType, $context);
                
                Log::info('ABAC policy evaluation', [
                    'user_id' => $user->id,
                    'action' => $action,
                    'resource_type' => $resourceType,
                    'result' => $abacResult
                ]);
                
                return $abacResult;
            }

            // 3. RBACのみで判定（データレベル制御が不要な場合）
            return true;

        } catch (\Exception $e) {
            Log::error('Integrated permission check failed', [
                'user_id' => $user->id,
                'action' => $action,
                'resource_type' => $resourceType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // エラー時は安全側に倒して拒否
            return false;
        }
    }

    /**
     * RBAC権限チェック（既存のPermissionServiceを使用）
     */
    private function hasRBACPermission(User $user, string $action): bool
    {
        return PermissionService::hasPermission($user, $action);
    }

    /**
     * データコンテキストを構築
     */
    private function buildDataContext(array $data): array
    {
        $context = [
            'data' => $data,
            'timestamp' => now()->toISOString(),
        ];

        // リソース固有のコンテキストを追加
        if (isset($data['id'])) {
            $context['resource_id'] = $data['id'];
        }

        if (isset($data['created_by'])) {
            $context['created_by'] = $data['created_by'];
        }

        if (isset($data['department_id'])) {
            $context['resource_department_id'] = $data['department_id'];
        }

        if (isset($data['amount'])) {
            $context['amount'] = $data['amount'];
        }

        if (isset($data['status'])) {
            $context['status'] = $data['status'];
        }

        return $context;
    }

    /**
     * ユーザーがビジネスコードを利用できるかチェック（統合版）
     */
    public function canUseBusinessCode(User $user, string $businessCode): bool
    {
        return PermissionService::canUseBusinessCode($user, $businessCode);
    }

    /**
     * ユーザーが利用可能なビジネスコード一覧を取得（統合版）
     */
    public function getAvailableBusinessCodes(User $user): array
    {
        return PermissionService::getAvailableBusinessCodes($user);
    }

    /**
     * ユーザーが利用可能なシステム機能一覧を取得（統合版）
     */
    public function getAvailableSystemFeatures(User $user): array
    {
        return PermissionService::getAvailableSystemFeatures($user);
    }

    /**
     * ユーザーが利用可能なビジネス機能一覧を取得（統合版）
     */
    public function getAvailableBusinessFeatures(User $user): array
    {
        return PermissionService::getAvailableBusinessFeatures($user);
    }

    /**
     * ユーザーの統合権限リストを取得（統合版）
     */
    public function getUserEffectivePermissions(User $user): array
    {
        return PermissionService::getUserEffectivePermissions($user);
    }

    /**
     * 詳細な権限チェック結果を取得
     */
    public function getDetailedPermissionCheck(
        User $user, 
        string $action, 
        string $resourceType = null, 
        array $data = null
    ): array {
        $result = [
            'user_id' => $user->id,
            'action' => $action,
            'resource_type' => $resourceType,
            'rbac_result' => false,
            'abac_result' => null,
            'final_result' => false,
            'reason' => '',
            'timestamp' => now()->toISOString(),
        ];

        // RBACチェック
        $rbacResult = $this->hasRBACPermission($user, $action);
        $result['rbac_result'] = $rbacResult;

        if (!$rbacResult) {
            $result['reason'] = 'RBAC permission denied';
            return $result;
        }

        // ABACチェック（必要な場合のみ）
        if ($resourceType && $data) {
            $abacService = app(ABACPolicyService::class);
            $context = $this->buildDataContext($data);
            
            $abacResult = $abacService->canAccess($user, $action, $resourceType, $context);
            $result['abac_result'] = $abacResult;
            
            if (!$abacResult) {
                $result['reason'] = 'ABAC policy denied';
                return $result;
            }
        }

        $result['final_result'] = true;
        $result['reason'] = 'Access granted';

        return $result;
    }

    /**
     * 権限チェックの統計情報を取得
     */
    public function getPermissionStats(User $user): array
    {
        $stats = [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'rbac_permissions' => count($this->getUserEffectivePermissions($user)),
            'available_business_codes' => count($this->getAvailableBusinessCodes($user)),
            'available_system_features' => count($this->getAvailableSystemFeatures($user)),
            'available_business_features' => count($this->getAvailableBusinessFeatures($user)),
            'is_admin' => $user->is_admin,
            'system_level' => $user->system_level,
            'department' => $user->department ? $user->department->name : null,
            'position' => $user->position ? $user->position->name : null,
        ];

        return $stats;
    }

    /**
     * 段階的移行用：ABACポリシーが設定されているかチェック
     */
    public function hasABACPolicy(string $businessCode, string $action, string $resourceType): bool
    {
        $abacService = app(ABACPolicyService::class);
        $policies = $abacService->getPolicies([
            'business_code' => $businessCode,
            'action' => $action,
            'resource_type' => $resourceType,
            'is_active' => true
        ]);

        return $policies->isNotEmpty();
    }

    /**
     * 段階的移行用：RBACからABACへの移行状況を取得
     */
    public function getMigrationStatus(): array
    {
        $abacService = app(ABACPolicyService::class);
        $stats = $abacService->getPolicyStats();

        return [
            'total_abac_policies' => $stats['total'],
            'active_abac_policies' => $stats['active'],
            'policies_by_business_code' => $stats['by_business_code'],
            'migration_progress' => $this->calculateMigrationProgress($stats),
        ];
    }

    /**
     * 移行進捗を計算
     */
    private function calculateMigrationProgress(array $stats): array
    {
        $businessCodes = BusinessCodeService::getAllBusinessCodes();
        $progress = [];

        foreach ($businessCodes as $code => $config) {
            $policyCount = $stats['by_business_code'][$code] ?? 0;
            $expectedPolicies = count($config['default_permissions'] ?? []);
            
            $progress[$code] = [
                'business_code' => $code,
                'name' => $config['name'] ?? $code,
                'policy_count' => $policyCount,
                'expected_policies' => $expectedPolicies,
                'completion_rate' => $expectedPolicies > 0 ? ($policyCount / $expectedPolicies) * 100 : 0,
                'is_complete' => $policyCount >= $expectedPolicies,
            ];
        }

        return $progress;
    }
}
