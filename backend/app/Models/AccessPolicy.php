<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccessPolicy extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'business_code',
        'action',
        'resource_type',
        'conditions',
        'scope',
        'effect',
        'priority',
        'is_active',
        'is_system',
        'metadata',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'conditions' => 'array',
            'scope' => 'array',
            'metadata' => 'array',
            'is_active' => 'boolean',
            'is_system' => 'boolean',
            'priority' => 'integer',
        ];
    }

    /**
     * ビジネスコードとのリレーション（単一）
     */
    public function businessCode()
    {
        return $this->belongsTo(BusinessCode::class, 'business_code', 'code');
    }

    /**
     * ビジネスコードとのリレーション（複数）
     */
    public function businessCodes(): BelongsToMany
    {
        return $this->belongsToMany(BusinessCode::class, 'business_code_access_policies')
            ->withPivot(['is_active'])
            ->withTimestamps();
    }

    /**
     * アクティブなポリシーのみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * システムポリシーのみを取得するスコープ
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * ビジネスコード別にポリシーを取得するスコープ
     */
    public function scopeForBusinessCode($query, string $businessCode)
    {
        return $query->where('business_code', $businessCode);
    }

    /**
     * アクション別にポリシーを取得するスコープ
     */
    public function scopeForAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * リソースタイプ別にポリシーを取得するスコープ
     */
    public function scopeForResourceType($query, string $resourceType)
    {
        return $query->where('resource_type', $resourceType);
    }

    /**
     * 許可ポリシーのみを取得するスコープ
     */
    public function scopeAllow($query)
    {
        return $query->where('effect', 'allow');
    }

    /**
     * 拒否ポリシーのみを取得するスコープ
     */
    public function scopeDeny($query)
    {
        return $query->where('effect', 'deny');
    }

    /**
     * 優先度順にソートするスコープ
     */
    public function scopeOrderByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }

    /**
     * ポリシーが適用可能かどうかを判定
     */
    public function isApplicable(string $businessCode, string $action, string $resourceType): bool
    {
        return $this->business_code === $businessCode 
            && $this->action === $action 
            && $this->resource_type === $resourceType 
            && $this->is_active;
    }

    /**
     * 条件式を評価
     */
    public function evaluateConditions(array $context): bool
    {
        if (empty($this->conditions)) {
            return true;
        }

        return $this->evaluateConditionGroup($this->conditions, $context);
    }

    /**
     * 条件グループを再帰的に評価
     */
    private function evaluateConditionGroup(array $conditions, array $context): bool
    {
        $operator = $conditions['operator'] ?? 'and';
        $rules = $conditions['rules'] ?? [];

        if (empty($rules)) {
            return true;
        }

        $results = [];
        foreach ($rules as $rule) {
            if (isset($rule['operator']) && isset($rule['rules'])) {
                // ネストした条件グループ
                $results[] = $this->evaluateConditionGroup($rule, $context);
            } else {
                // 単一の条件
                $results[] = $this->evaluateSingleCondition($rule, $context);
            }
        }

        return $operator === 'and' 
            ? !in_array(false, $results, true)
            : in_array(true, $results, true);
    }

    /**
     * 単一の条件を評価
     */
    private function evaluateSingleCondition(array $condition, array $context): bool
    {
        $field = $condition['field'] ?? '';
        $operator = $condition['operator'] ?? '';
        $value = $condition['value'] ?? null;

        if (empty($field) || empty($operator)) {
            return true;
        }

        $contextValue = $this->getContextValue($field, $context);

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
        // ドット記法でのネストした値の取得をサポート
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
     * スコープを評価
     */
    public function evaluateScope(array $context): bool
    {
        if (empty($this->scope)) {
            return true;
        }

        return $this->evaluateConditionGroup($this->scope, $context);
    }
}
