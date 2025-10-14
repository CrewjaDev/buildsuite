<?php

namespace App\Services;

use App\Models\User;
use App\Models\AccessPolicy;

/**
 * ABACポリシー評価サービス
 * ユーザー属性、リソース属性、環境属性に基づいてアクセス制御を判定
 */
class ABACPolicyEvaluationService
{
    /**
     * ポリシーを評価してアクセス許可を判定
     * 
     * @param User $user ユーザー
     * @param array $resourceData リソースデータ
     * @param array $environmentData 環境データ
     * @param string $action アクション
     * @return bool|null アクセス許可（null: ポリシー未設定, true: 許可, false: 拒否）
     */
    public function evaluateAccess(User $user, array $resourceData, array $environmentData = [], string $action = 'read', string $businessCode = 'estimate'): ?bool
    {
        // アクティブなポリシーを取得（ビジネスコード、アクション、リソースタイプでフィルタ）
        $policies = AccessPolicy::active()
            ->forBusinessCode($businessCode)
            ->forAction($action)
            ->forResourceType('estimate')
            ->orderByPriority()
            ->get();

        // ポリシーが設定されていない場合はnullを返す
        if ($policies->isEmpty()) {
            return null;
        }

        foreach ($policies as $policy) {
            if ($this->evaluatePolicy($policy, $user, $resourceData, $environmentData)) {
                return $policy->effect === 'allow';
            }
        }

        // ポリシーは存在するが、どの条件にも該当しない場合は拒否
        return false;
    }

    /**
     * 個別ポリシーの評価
     */
    private function evaluatePolicy(AccessPolicy $policy, User $user, array $resourceData, array $environmentData): bool
    {
        // コンテキストデータを構築
        $context = $this->buildContext($user, $resourceData, $environmentData);
        
        // AccessPolicyモデルの条件評価メソッドを使用
        return $policy->evaluateConditions($context);
    }

    /**
     * コンテキストデータを構築
     */
    private function buildContext(User $user, array $resourceData, array $environmentData): array
    {
        return [
            'user' => [
                'id' => $user->id,
                'department_id' => $user->primaryDepartment?->id,
                'position_id' => $user->employee?->position_id,
                'system_level_id' => $user->system_level_id,
                'role_ids' => $user->roles()->pluck('role_id')->toArray(),
                'is_admin' => $user->is_admin,
                'is_active' => $user->is_active,
            ],
            'data' => $resourceData,
            'request' => [
                'ip' => request()->ip(),
            ],
            'env' => array_merge([
                'current_time' => [
                    'hour' => (int)now()->format('H'),
                    'weekday' => now()->dayOfWeek,
                ],
                'business_hours' => $this->isBusinessHours(),
            ], $environmentData),
        ];
    }


    /**
     * 営業時間かどうかを判定
     */
    private function isBusinessHours(): bool
    {
        $hour = (int)now()->format('H');
        $weekday = now()->dayOfWeek;
        
        // 平日（月-金）の9:00-18:00を営業時間とする
        return $weekday >= 1 && $weekday <= 5 && $hour >= 9 && $hour < 18;
    }

    /**
     * ポリシーの説明文を生成
     */
    public function generatePolicyDescription(AccessPolicy $policy): string
    {
        return "{$policy->name}: {$policy->description}";
    }
}
