<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Log;

class PolicyTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_code',
        'name',
        'description',
        'category',
        'condition_type',
        'condition_rule',
        'parameters',
        'applicable_actions',
        'tags',
        'is_system',
        'is_active',
        'priority',
        'metadata',
    ];

    protected $casts = [
        'condition_rule' => 'array',
        'parameters' => 'array',
        'applicable_actions' => 'array',
        'tags' => 'array',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * アクティブなテンプレートのみを取得
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * システムテンプレートのみを取得
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * カテゴリでフィルタ
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * アクションでフィルタ
     */
    public function scopeByAction($query, $action)
    {
        return $query->whereJsonContains('applicable_actions', $action);
    }

    /**
     * 条件ルールを取得
     */
    public function getConditionRuleAttribute($value)
    {
        return json_decode($value, true);
    }

    /**
     * 条件ルールを設定
     */
    public function setConditionRuleAttribute($value)
    {
        $this->attributes['condition_rule'] = json_encode($value);
    }

    /**
     * パラメータを取得
     */
    public function getParametersAttribute($value)
    {
        return $value ? json_decode($value, true) : null;
    }

    /**
     * パラメータを設定
     */
    public function setParametersAttribute($value)
    {
        $this->attributes['parameters'] = $value ? json_encode($value) : null;
    }

    /**
     * 適用可能なアクションを取得
     */
    public function getApplicableActionsAttribute($value)
    {
        return json_decode($value, true);
    }

    /**
     * 適用可能なアクションを設定
     */
    public function setApplicableActionsAttribute($value)
    {
        $this->attributes['applicable_actions'] = json_encode($value);
    }

    /**
     * タグを取得
     */
    public function getTagsAttribute($value)
    {
        return $value ? json_decode($value, true) : [];
    }

    /**
     * タグを設定
     */
    public function setTagsAttribute($value)
    {
        $this->attributes['tags'] = $value ? json_encode($value) : null;
    }

    /**
     * メタデータを取得
     */
    public function getMetadataAttribute($value)
    {
        return $value ? json_decode($value, true) : null;
    }

    /**
     * メタデータを設定
     */
    public function setMetadataAttribute($value)
    {
        $this->attributes['metadata'] = $value ? json_encode($value) : null;
    }

    /**
     * テンプレートから条件式を生成
     */
    public function generateCondition($params = [])
    {
        log::debug('generateCondition called for template: ' . $this->template_code . ' (ID: ' . $this->id . ')');
        log::debug('Parameters received: ' . json_encode($params));
        
        $condition = $this->condition_rule;
        
        // 部署制限の特別処理
        if ($this->template_code === 'department_restriction') {
            return $this->generateDepartmentRestrictionCondition($params);
        }
        
        // 金額制限の特別処理
        if ($this->template_code === 'amount_limit_restriction') {
            return $this->generateAmountRestrictionCondition($params);
        }
        
        // ステータス制限の特別処理
        if ($this->template_code === 'status_restriction') {
            return $this->generateStatusRestrictionCondition($params);
        }
        
        // 期間制限の特別処理
        if ($this->template_code === 'period_restriction') {
            log::debug('Period restriction template detected, calling generatePeriodRestrictionCondition');
            return $this->generatePeriodRestrictionCondition($params);
        }
        
        // パラメータの置換
        if ($this->parameters && isset($this->parameters['configurable_values']) && $params) {
            foreach ($this->parameters['configurable_values'] as $key => $param) {
                if (isset($params[$key])) {
                    $condition = $this->replaceParameter($condition, $key, $params[$key]);
                }
            }
        }
        
        return $condition;
    }

    /**
     * 部署制限の条件生成
     */
    private function generateDepartmentRestrictionCondition($params)
    {
        $restrictionType = $params['restriction_type'] ?? 'eq';
        
        // パラメータ検証ルール
        if ($restrictionType === 'in' && empty($params['department_ids'])) {
            throw new \InvalidArgumentException('特定部署制限の場合、department_idsパラメータが必要です');
        }
        
        switch ($restrictionType) {
            case 'eq':
                // 自部署制限
                return [
                    'field' => 'data.department_id',
                    'operator' => 'eq',
                    'value' => 'user.department_id'
                ];
                
            case 'in':
                // 特定部署制限
                $departmentIds = $params['department_ids'] ?? [];
                return [
                    'field' => 'data.department_id',
                    'operator' => 'in',
                    'value' => $departmentIds
                ];
                
            case 'exists':
                // 全部署制限（常にtrue）
                return [
                    'field' => 'data.department_id',
                    'operator' => 'exists',
                    'value' => true
                ];
                
            default:
                return [
                    'field' => 'data.department_id',
                    'operator' => 'eq',
                    'value' => 'user.department_id'
                ];
        }
    }

    /**
     * パラメータを置換
     */
    private function replaceParameter($condition, $key, $value)
    {
        $placeholder = '{{' . $key . '}}';
        
        // 期間制限の日付値の特別処理
        if (($key === 'start_date' || $key === 'end_date') && $value) {
            // 数値の場合は日付文字列に変換
            if (is_numeric($value)) {
                if ($key === 'start_date') {
                    $value = $value . '-01-01'; // 年のみの場合は1月1日に設定
                } else {
                    $value = $value . '-12-31'; // 年のみの場合は12月31日に設定
                }
            } else {
                $value = (string)$value;
            }
            error_log("Date parameter processed: {$key} = {$value} (type: " . gettype($value) . ")");
        }
        
        if (is_array($condition)) {
            foreach ($condition as $k => $v) {
                if (is_array($v)) {
                    $condition[$k] = $this->replaceParameter($v, $key, $value);
                } elseif ($v === $placeholder) {
                    $condition[$k] = $value;
                }
            }
        } elseif ($condition === $placeholder) {
            $condition = $value;
        }
        
        return $condition;
    }

    /**
     * 金額制限の条件生成
     */
    private function generateAmountRestrictionCondition($params)
    {
        $restrictionType = $params['restriction_type'] ?? 'lte';
        
        switch ($restrictionType) {
            case 'lte':
                // 上限制限
                $amountLimit = $params['amount_limit'] ?? 1000000;
                return [
                    'field' => 'data.amount',
                    'operator' => 'lte',
                    'value' => (int)$amountLimit
                ];
                
            case 'gte':
                // 下限制限
                $minAmount = $params['min_amount'] ?? 0;
                return [
                    'field' => 'data.amount',
                    'operator' => 'gte',
                    'value' => (int)$minAmount
                ];
                
            case 'between':
                // 範囲制限
                $minAmount = $params['min_amount'] ?? 0;
                $amountLimit = $params['amount_limit'] ?? 1000000;
                return [
                    'operator' => 'and',
                    'rules' => [
                        [
                            'field' => 'data.amount',
                            'operator' => 'gte',
                            'value' => (int)$minAmount
                        ],
                        [
                            'field' => 'data.amount',
                            'operator' => 'lte',
                            'value' => (int)$amountLimit
                        ]
                    ]
                ];
                
            default:
                // デフォルトは上限制限
                $amountLimit = $params['amount_limit'] ?? 1000000;
                return [
                    'field' => 'data.amount',
                    'operator' => 'lte',
                    'value' => (int)$amountLimit
                ];
        }
    }

    /**
     * ステータス制限の条件生成
     */
    private function generateStatusRestrictionCondition($params)
    {
        $allowedStatuses = $params['allowed_statuses'] ?? ['承認済み', '承認依頼中'];
        
        // 配列でない場合は配列に変換
        if (!is_array($allowedStatuses)) {
            $allowedStatuses = [$allowedStatuses];
        }
        
        return [
            'field' => 'data.status',
            'operator' => 'in',
            'value' => $allowedStatuses
        ];
    }

    /**
     * 期間制限の条件生成
     */
    private function generatePeriodRestrictionCondition($params)
    {
        // デバッグ用ログ
        Log::debug('Period restriction params: ' . json_encode($params));
        
        $startDate = $params['start_date'] ?? null;
        $endDate = $params['end_date'] ?? null;
        
        // デバッグ用ログ
        Log::debug('Start date: ' . var_export($startDate, true) . ' (type: ' . gettype($startDate) . ')');
        Log::debug('End date: ' . var_export($endDate, true) . ' (type: ' . gettype($endDate) . ')');
        
        // 日付の値を正しく処理
        if ($startDate) {
            // 数値の場合は日付文字列に変換
            if (is_numeric($startDate)) {
                $startDate = $startDate . '-01-01'; // 年のみの場合は1月1日に設定
            } else {
                $startDate = (string)$startDate;
            }
            Log::debug("Start date processed: {$startDate} (type: " . gettype($startDate) . ")");
        }
        
        if ($endDate) {
            // 数値の場合は日付文字列に変換
            if (is_numeric($endDate)) {
                $endDate = $endDate . '-12-31'; // 年のみの場合は12月31日に設定
            } else {
                $endDate = (string)$endDate;
            }
            Log::debug("End date processed: {$endDate} (type: " . gettype($endDate) . ")");
        }
        
        // 開始日と終了日の両方が設定されている場合
        if ($startDate && $endDate && $startDate !== 'null' && $endDate !== 'null') {
            Log::debug("Returning period restriction condition with both dates: start={$startDate}, end={$endDate}");
            $result = [
                'operator' => 'and',
                'rules' => [
                    [
                        'field' => 'data.created_at',
                        'operator' => 'gte',
                        'value' => $startDate
                    ],
                    [
                        'field' => 'data.created_at',
                        'operator' => 'lte',
                        'value' => $endDate
                    ]
                ]
            ];
            Log::debug("Period restriction condition result: " . json_encode($result));
            return $result;
        }
        
        // 開始日のみ設定されている場合
        if ($startDate && $startDate !== 'null') {
            Log::debug("Returning period restriction condition with start date only: {$startDate}");
            return [
                'field' => 'data.created_at',
                'operator' => 'gte',
                'value' => $startDate
            ];
        }
        
        // 終了日のみ設定されている場合
        if ($endDate && $endDate !== 'null') {
            Log::debug("Returning period restriction condition with end date only: {$endDate}");
            return [
                'field' => 'data.created_at',
                'operator' => 'lte',
                'value' => $endDate
            ];
        }
        
        // デフォルト（期間制限なし）
        Log::debug("Returning default period restriction condition");
        return [
            'field' => 'data.created_at',
            'operator' => 'exists',
            'value' => true
        ];
    }
}
