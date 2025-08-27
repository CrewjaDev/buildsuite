<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalCondition extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'approval_flow_id',
        'condition_type', // amount, department, role, project, custom
        'field_name',
        'operator', // equals, not_equals, greater_than, less_than, contains, in, not_in
        'value',
        'value_type', // string, integer, float, boolean, array
        'is_active',
        'priority',
        'description',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'array',
            'is_active' => 'boolean',
            'priority' => 'integer',
        ];
    }

    /**
     * 承認フローとのリレーション
     */
    public function flow(): BelongsTo
    {
        return $this->belongsTo(ApprovalFlow::class, 'approval_flow_id');
    }

    /**
     * 作成者とのリレーション
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * 更新者とのリレーション
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * 条件を評価
     */
    public function evaluate(array $data): bool
    {
        if (!$this->is_active) {
            return true;
        }

        $fieldValue = $this->getFieldValue($data);
        return $this->compareValues($fieldValue, $this->value, $this->operator);
    }

    /**
     * フィールド値を取得
     */
    private function getFieldValue(array $data)
    {
        $fieldName = $this->field_name;
        
        // ネストしたフィールドの処理（例: request_data.amount）
        if (str_contains($fieldName, '.')) {
            $keys = explode('.', $fieldName);
            $value = $data;
            
            foreach ($keys as $key) {
                if (is_array($value) && isset($value[$key])) {
                    $value = $value[$key];
                } else {
                    return null;
                }
            }
            
            return $value;
        }
        
        return $data[$fieldName] ?? null;
    }

    /**
     * 値を比較
     */
    private function compareValues($actualValue, $expectedValue, string $operator): bool
    {
        switch ($operator) {
            case 'equals':
                return $actualValue == $expectedValue;
            case 'not_equals':
                return $actualValue != $expectedValue;
            case 'greater_than':
                return $actualValue > $expectedValue;
            case 'less_than':
                return $actualValue < $expectedValue;
            case 'greater_than_or_equal':
                return $actualValue >= $expectedValue;
            case 'less_than_or_equal':
                return $actualValue <= $expectedValue;
            case 'contains':
                return str_contains($actualValue, $expectedValue);
            case 'not_contains':
                return !str_contains($actualValue, $expectedValue);
            case 'in':
                return in_array($actualValue, (array)$expectedValue);
            case 'not_in':
                return !in_array($actualValue, (array)$expectedValue);
            case 'is_null':
                return is_null($actualValue);
            case 'is_not_null':
                return !is_null($actualValue);
            case 'is_empty':
                return empty($actualValue);
            case 'is_not_empty':
                return !empty($actualValue);
            default:
                return false;
        }
    }

    /**
     * 条件の表示名を取得
     */
    public function getDisplayName(): string
    {
        $fieldDisplayName = $this->getFieldDisplayName();
        $operatorDisplayName = $this->getOperatorDisplayName();
        $valueDisplayName = $this->getValueDisplayName();

        return "{$fieldDisplayName} {$operatorDisplayName} {$valueDisplayName}";
    }

    /**
     * フィールドの表示名を取得
     */
    private function getFieldDisplayName(): string
    {
        $fieldNames = [
            'amount' => '金額',
            'total_amount' => '合計金額',
            'department_id' => '部署',
            'role_id' => '役割',
            'project_id' => 'プロジェクト',
            'request_type' => '依頼タイプ',
            'priority' => '優先度',
            'requested_by' => '依頼者',
        ];

        return $fieldNames[$this->field_name] ?? $this->field_name;
    }

    /**
     * 演算子の表示名を取得
     */
    private function getOperatorDisplayName(): string
    {
        $operatorNames = [
            'equals' => '等しい',
            'not_equals' => '等しくない',
            'greater_than' => 'より大きい',
            'less_than' => 'より小さい',
            'greater_than_or_equal' => '以上',
            'less_than_or_equal' => '以下',
            'contains' => '含む',
            'not_contains' => '含まない',
            'in' => '含まれる',
            'not_in' => '含まれない',
            'is_null' => '空',
            'is_not_null' => '空でない',
            'is_empty' => '空',
            'is_not_empty' => '空でない',
        ];

        return $operatorNames[$this->operator] ?? $this->operator;
    }

    /**
     * 値の表示名を取得
     */
    private function getValueDisplayName(): string
    {
        if (is_array($this->value)) {
            return implode(', ', $this->value);
        }

        return (string)$this->value;
    }

    /**
     * 条件タイプの表示名を取得
     */
    public function getConditionTypeDisplayName(): string
    {
        $typeNames = [
            'amount' => '金額条件',
            'department' => '部署条件',
            'role' => '役割条件',
            'project' => 'プロジェクト条件',
            'custom' => 'カスタム条件',
        ];

        return $typeNames[$this->condition_type] ?? $this->condition_type;
    }

    /**
     * アクティブな条件のみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * 特定のタイプの条件のみを取得するスコープ
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('condition_type', $type);
    }

    /**
     * 特定のフィールドの条件のみを取得するスコープ
     */
    public function scopeByField($query, string $fieldName)
    {
        return $query->where('field_name', $fieldName);
    }

    /**
     * 優先度順にソートするスコープ
     */
    public function scopeOrderByPriority($query, $direction = 'asc')
    {
        return $query->orderBy('priority', $direction);
    }

    /**
     * 金額条件のみを取得するスコープ
     */
    public function scopeAmountConditions($query)
    {
        return $query->where('condition_type', 'amount');
    }

    /**
     * 部署条件のみを取得するスコープ
     */
    public function scopeDepartmentConditions($query)
    {
        return $query->where('condition_type', 'department');
    }

    /**
     * 役割条件のみを取得するスコープ
     */
    public function scopeRoleConditions($query)
    {
        return $query->where('condition_type', 'role');
    }
}
