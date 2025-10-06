<?php

namespace App\Services;

use App\Models\AccessPolicy;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class ABACPolicyEvaluationService
{
    /**
     * ポリシー評価の詳細結果
     */
    public function evaluatePolicyDetailed(
        AccessPolicy $policy, 
        User $user, 
        array $context = []
    ): array {
        $userContext = $this->buildUserContext($user, $context);
        
        $result = [
            'policy_id' => $policy->id,
            'policy_name' => $policy->name,
            'effect' => $policy->effect,
            'priority' => $policy->priority,
            'conditions_evaluation' => $this->evaluateConditionsDetailed($policy, $userContext),
            'scope_evaluation' => $this->evaluateScopeDetailed($policy, $userContext),
            'overall_result' => false,
            'reason' => '',
        ];

        // 全体の結果を判定
        $conditionsPassed = $result['conditions_evaluation']['passed'];
        $scopePassed = $result['scope_evaluation']['passed'];
        
        $result['overall_result'] = $conditionsPassed && $scopePassed;
        
        if (!$conditionsPassed) {
            $result['reason'] = 'Conditions not met';
        } elseif (!$scopePassed) {
            $result['reason'] = 'Scope not matched';
        } else {
            $result['reason'] = 'Policy applied successfully';
        }

        return $result;
    }

    /**
     * 条件式の詳細評価
     */
    private function evaluateConditionsDetailed(AccessPolicy $policy, array $context): array
    {
        if (empty($policy->conditions)) {
            return [
                'passed' => true,
                'reason' => 'No conditions defined',
                'details' => []
            ];
        }

        $details = $this->evaluateConditionGroupDetailed($policy->conditions, $context);
        
        return [
            'passed' => $details['result'],
            'reason' => $details['reason'],
            'details' => $details['details']
        ];
    }

    /**
     * スコープの詳細評価
     */
    private function evaluateScopeDetailed(AccessPolicy $policy, array $context): array
    {
        if (empty($policy->scope)) {
            return [
                'passed' => true,
                'reason' => 'No scope defined',
                'details' => []
            ];
        }

        $details = $this->evaluateConditionGroupDetailed($policy->scope, $context);
        
        return [
            'passed' => $details['result'],
            'reason' => $details['reason'],
            'details' => $details['details']
        ];
    }

    /**
     * 条件グループの詳細評価
     */
    private function evaluateConditionGroupDetailed(array $conditions, array $context): array
    {
        $operator = $conditions['operator'] ?? 'and';
        $rules = $conditions['rules'] ?? [];

        if (empty($rules)) {
            return [
                'result' => true,
                'reason' => 'No rules defined',
                'details' => []
            ];
        }

        $results = [];
        $details = [];

        foreach ($rules as $index => $rule) {
            if (isset($rule['operator']) && isset($rule['rules'])) {
                // ネストした条件グループ
                $nestedResult = $this->evaluateConditionGroupDetailed($rule, $context);
                $results[] = $nestedResult['result'];
                $details[] = [
                    'type' => 'group',
                    'index' => $index,
                    'operator' => $rule['operator'],
                    'result' => $nestedResult['result'],
                    'details' => $nestedResult['details']
                ];
            } else {
                // 単一の条件
                $conditionResult = $this->evaluateSingleConditionDetailed($rule, $context);
                $results[] = $conditionResult['result'];
                $details[] = [
                    'type' => 'condition',
                    'index' => $index,
                    'field' => $rule['field'] ?? '',
                    'operator' => $rule['operator'] ?? '',
                    'value' => $rule['value'] ?? null,
                    'context_value' => $conditionResult['context_value'],
                    'result' => $conditionResult['result'],
                    'reason' => $conditionResult['reason']
                ];
            }
        }

        $finalResult = $operator === 'and' 
            ? !in_array(false, $results, true)
            : in_array(true, $results, true);

        return [
            'result' => $finalResult,
            'reason' => $this->getGroupReason($operator, $results),
            'details' => $details
        ];
    }

    /**
     * 単一の条件の詳細評価
     */
    private function evaluateSingleConditionDetailed(array $condition, array $context): array
    {
        $field = $condition['field'] ?? '';
        $operator = $condition['operator'] ?? '';
        $value = $condition['value'] ?? null;

        if (empty($field) || empty($operator)) {
            return [
                'result' => true,
                'reason' => 'Invalid condition format',
                'context_value' => null
            ];
        }

        $contextValue = $this->getContextValue($field, $context);
        $result = $this->evaluateCondition($operator, $contextValue, $value);

        return [
            'result' => $result,
            'reason' => $this->getConditionReason($operator, $contextValue, $value, $result),
            'context_value' => $contextValue
        ];
    }

    /**
     * 条件を評価
     */
    private function evaluateCondition(string $operator, $contextValue, $value): bool
    {
        return match ($operator) {
            'eq' => $contextValue === $value,
            'ne' => $contextValue !== $value,
            'gt' => $contextValue > $value,
            'gte' => $contextValue >= $value,
            'lt' => $contextValue < $value,
            'lte' => $contextValue <= $value,
            'in' => is_array($value) && in_array($contextValue, $value),
            'nin' => is_array($value) && !in_array($contextValue, $value),
            'contains' => is_string($contextValue) && str_contains($contextValue, $value),
            'starts_with' => is_string($contextValue) && str_starts_with($contextValue, $value),
            'ends_with' => is_string($contextValue) && str_ends_with($contextValue, $value),
            'exists' => $contextValue !== null,
            'not_exists' => $contextValue === null,
            default => true,
        };
    }

    /**
     * コンテキストから値を取得
     */
    private function getContextValue(string $field, array $context)
    {
        $keys = explode('.', $field);
        $value = $context;

        foreach ($keys as $key) {
            if (is_array($value) && array_key_exists($key, $value)) {
                $value = $value[$key];
            } else {
                return null;
            }
        }

        return $value;
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

        return array_merge($context, $additionalContext);
    }

    /**
     * 条件の理由を取得
     */
    private function getConditionReason(string $operator, $contextValue, $value, bool $result): string
    {
        if ($result) {
            return "Condition passed: {$contextValue} {$operator} {$value}";
        } else {
            return "Condition failed: {$contextValue} {$operator} {$value}";
        }
    }

    /**
     * グループの理由を取得
     */
    private function getGroupReason(string $operator, array $results): string
    {
        $passedCount = count(array_filter($results));
        $totalCount = count($results);
        
        if ($operator === 'and') {
            return "AND condition: {$passedCount}/{$totalCount} conditions passed";
        } else {
            return "OR condition: {$passedCount}/{$totalCount} conditions passed";
        }
    }

    /**
     * ポリシー評価のログを記録
     */
    public function logPolicyEvaluation(
        AccessPolicy $policy, 
        User $user, 
        array $context, 
        bool $result
    ): void {
        Log::info('ABAC Policy Evaluation', [
            'policy_id' => $policy->id,
            'policy_name' => $policy->name,
            'user_id' => $user->id,
            'user_name' => $user->name,
            'effect' => $policy->effect,
            'result' => $result,
            'context' => $context,
            'timestamp' => now()->toISOString(),
        ]);
    }
}
