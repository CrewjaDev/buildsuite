<?php

namespace App\Services;

use App\Models\AccessPolicy;
use App\Models\BusinessCode;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ABACPolicyService
{
    /**
     * ポリシー評価結果のキャッシュ時間（秒）
     */
    private const CACHE_TTL = 300; // 5分

    /**
     * ユーザーが指定されたアクションを実行できるかどうかを判定
     */
    public function canAccess(User $user, string $action, string $resourceType, array $context = []): bool
    {
        try {
            // ビジネスコードを取得
            $businessCode = $this->getBusinessCodeFromAction($action);
            if (!$businessCode) {
                return true; // ビジネスコードが特定できない場合は許可
            }

            // 適用可能なポリシーを取得
            $policies = $this->getApplicablePolicies($businessCode, $action, $resourceType);
            
            if ($policies->isEmpty()) {
                return true; // ポリシーが存在しない場合は許可
            }

            // ユーザーコンテキストを構築
            $userContext = $this->buildUserContext($user, $context);

            // ポリシーを優先度順に評価
            foreach ($policies->sortByDesc('priority') as $policy) {
                if ($this->evaluatePolicy($policy, $userContext)) {
                    return $policy->effect === 'allow';
                }
            }

            // デフォルトは拒否
            return false;

        } catch (\Exception $e) {
            Log::error('ABAC policy evaluation failed', [
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
     * アクションからビジネスコードを取得
     */
    private function getBusinessCodeFromAction(string $action): ?string
    {
        $parts = explode('.', $action);
        return $parts[0] ?? null;
    }

    /**
     * 適用可能なポリシーを取得
     */
    private function getApplicablePolicies(string $businessCode, string $action, string $resourceType): Collection
    {
        $cacheKey = "abac_policies:{$businessCode}:{$action}:{$resourceType}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($businessCode, $action, $resourceType) {
            return AccessPolicy::active()
                ->forBusinessCode($businessCode)
                ->forAction($action)
                ->forResourceType($resourceType)
                ->orderByPriority()
                ->get();
        });
    }

    /**
     * ユーザーコンテキストを構築
     */
    private function buildUserContext(User $user, array $additionalContext = []): array
    {
        $context = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'department_id' => $user->department_id,
                'position_id' => $user->position_id,
                'system_level_id' => $user->system_level_id,
            ],
            'roles' => $user->roles->pluck('name')->toArray(),
            'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
        ];

        // 部署情報を追加
        if ($user->department) {
            $context['department'] = [
                'id' => $user->department->id,
                'name' => $user->department->name,
                'code' => $user->department->code,
            ];
        }

        // 職位情報を追加
        if ($user->position) {
            $context['position'] = [
                'id' => $user->position->id,
                'name' => $user->position->name,
                'level' => $user->position->level,
            ];
        }

        // システム権限レベル情報を追加
        if ($user->systemLevel) {
            $context['system_level'] = [
                'id' => $user->system_level_id,
                'name' => $user->systemLevel->name,
                'level' => $user->systemLevel->level,
            ];
        }

        // 追加コンテキストをマージ
        return array_merge($context, $additionalContext);
    }

    /**
     * ポリシーを評価
     */
    private function evaluatePolicy(AccessPolicy $policy, array $context): bool
    {
        // 条件式を評価
        if (!$policy->evaluateConditions($context)) {
            return false;
        }

        // スコープを評価
        if (!$policy->evaluateScope($context)) {
            return false;
        }

        return true;
    }

    /**
     * ポリシーを作成
     */
    public function createPolicy(array $data): AccessPolicy
    {
        $policy = AccessPolicy::create($data);
        
        // キャッシュをクリア
        $this->clearPolicyCache($policy);
        
        return $policy;
    }

    /**
     * ポリシーを更新
     */
    public function updatePolicy(AccessPolicy $policy, array $data): AccessPolicy
    {
        $policy->update($data);
        
        // キャッシュをクリア
        $this->clearPolicyCache($policy);
        
        return $policy;
    }

    /**
     * ポリシーを削除
     */
    public function deletePolicy(AccessPolicy $policy): bool
    {
        $result = $policy->delete();
        
        // キャッシュをクリア
        $this->clearPolicyCache($policy);
        
        return $result;
    }

    /**
     * ビジネスコードにポリシーを関連付け
     */
    public function attachToBusinessCode(AccessPolicy $policy, BusinessCode $businessCode): void
    {
        $policy->businessCodes()->syncWithoutDetaching([
            $businessCode->id => ['is_active' => true]
        ]);
        
        // キャッシュをクリア
        $this->clearPolicyCache($policy);
    }

    /**
     * ビジネスコードからポリシーの関連付けを解除
     */
    public function detachFromBusinessCode(AccessPolicy $policy, BusinessCode $businessCode): void
    {
        $policy->businessCodes()->detach($businessCode->id);
        
        // キャッシュをクリア
        $this->clearPolicyCache($policy);
    }

    /**
     * ポリシーキャッシュをクリア
     */
    private function clearPolicyCache(AccessPolicy $policy): void
    {
        $cacheKey = "abac_policies:{$policy->business_code}:{$policy->action}:{$policy->resource_type}";
        Cache::forget($cacheKey);
    }

    /**
     * 全ポリシーキャッシュをクリア
     */
    public function clearAllPolicyCache(): void
    {
        Cache::flush();
    }

    /**
     * ポリシーの一覧を取得
     */
    public function getPolicies(array $filters = []): Collection
    {
        $query = AccessPolicy::query();

        if (isset($filters['business_code'])) {
            $query->forBusinessCode($filters['business_code']);
        }

        if (isset($filters['action'])) {
            $query->forAction($filters['action']);
        }

        if (isset($filters['resource_type'])) {
            $query->forResourceType($filters['resource_type']);
        }

        if (isset($filters['effect'])) {
            $query->where('effect', $filters['effect']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query->orderByPriority()->get();
    }

    /**
     * ポリシーの統計情報を取得
     */
    public function getPolicyStats(): array
    {
        return [
            'total' => AccessPolicy::count(),
            'active' => AccessPolicy::active()->count(),
            'inactive' => AccessPolicy::where('is_active', false)->count(),
            'system' => AccessPolicy::system()->count(),
            'by_effect' => [
                'allow' => AccessPolicy::allow()->count(),
                'deny' => AccessPolicy::deny()->count(),
            ],
            'by_business_code' => AccessPolicy::selectRaw('business_code, COUNT(*) as count')
                ->groupBy('business_code')
                ->pluck('count', 'business_code')
                ->toArray(),
        ];
    }
}
