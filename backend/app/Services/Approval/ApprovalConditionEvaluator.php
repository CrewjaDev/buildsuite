<?php

namespace App\Services\Approval;

class ApprovalConditionEvaluator
{
    /**
     * 承認依頼データに基づいて条件分岐を判定
     */
    public function evaluateCondition(array $condition, array $requestData): bool
    {
        $field = $condition['field'] ?? '';
        $operator = $condition['operator'] ?? '==';
        $value = $condition['value'] ?? null;

        switch ($field) {
            case 'amount':
                return $this->evaluateAmountCondition($operator, $value, $requestData);
            case 'vendor_type':
                return $this->evaluateVendorTypeCondition($operator, $value, $requestData);
            case 'project_type':
                return $this->evaluateProjectTypeCondition($operator, $value, $requestData);
            case 'department_id':
                return $this->evaluateDepartmentCondition($operator, $value, $requestData);
            case 'user_id':
                return $this->evaluateUserCondition($operator, $value, $requestData);
            default:
                return $this->evaluateCustomCondition($condition, $requestData);
        }
    }

    /**
     * 金額条件の判定
     */
    private function evaluateAmountCondition(string $operator, $value, array $requestData): bool
    {
        $amount = $requestData['amount'] ?? 0;

        return $this->compareValues($amount, $operator, $value);
    }

    /**
     * 業者タイプ条件の判定
     */
    private function evaluateVendorTypeCondition(string $operator, $value, array $requestData): bool
    {
        $vendorType = $requestData['vendor_type'] ?? '';

        return $this->compareValues($vendorType, $operator, $value);
    }

    /**
     * プロジェクトタイプ条件の判定
     */
    private function evaluateProjectTypeCondition(string $operator, $value, array $requestData): bool
    {
        $projectType = $requestData['project_type'] ?? '';

        return $this->compareValues($projectType, $operator, $value);
    }

    /**
     * 部署条件の判定
     */
    private function evaluateDepartmentCondition(string $operator, $value, array $requestData): bool
    {
        $departmentId = $requestData['department_id'] ?? null;

        return $this->compareValues($departmentId, $operator, $value);
    }

    /**
     * ユーザー条件の判定
     */
    private function evaluateUserCondition(string $operator, $value, array $requestData): bool
    {
        $userId = $requestData['user_id'] ?? null;

        return $this->compareValues($userId, $operator, $value);
    }

    /**
     * カスタム条件の判定（拡張用）
     */
    private function evaluateCustomCondition(array $condition, array $requestData): bool
    {
        $field = $condition['field'] ?? '';
        $operator = $condition['operator'] ?? '==';
        $value = $condition['value'] ?? null;

        $dataValue = $requestData[$field] ?? null;

        return $this->compareValues($dataValue, $operator, $value);
    }

    /**
     * 値の比較処理
     */
    private function compareValues($dataValue, string $operator, $conditionValue): bool
    {
        switch ($operator) {
            case '>=':
                return $dataValue >= $conditionValue;
            case '>':
                return $dataValue > $conditionValue;
            case '<=':
                return $dataValue <= $conditionValue;
            case '<':
                return $dataValue < $conditionValue;
            case '==':
                return $dataValue == $conditionValue;
            case '!=':
                return $dataValue != $conditionValue;
            case 'in':
                return in_array($dataValue, (array)$conditionValue);
            case 'not_in':
                return !in_array($dataValue, (array)$conditionValue);
            case 'contains':
                return is_string($dataValue) && str_contains($dataValue, $conditionValue);
            case 'starts_with':
                return is_string($dataValue) && str_starts_with($dataValue, $conditionValue);
            case 'ends_with':
                return is_string($dataValue) && str_ends_with($dataValue, $conditionValue);
            case 'regex':
                return is_string($dataValue) && preg_match($conditionValue, $dataValue);
            default:
                return false;
        }
    }

    /**
     * 複数条件の組み合わせ判定（AND条件）
     */
    public function evaluateMultipleConditions(array $conditions, array $requestData): bool
    {
        foreach ($conditions as $condition) {
            if (!$this->evaluateCondition($condition, $requestData)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 複数条件の組み合わせ判定（OR条件）
     */
    public function evaluateAnyCondition(array $conditions, array $requestData): bool
    {
        foreach ($conditions as $condition) {
            if ($this->evaluateCondition($condition, $requestData)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 条件の妥当性チェック
     */
    public function validateCondition(array $condition): bool
    {
        $requiredFields = ['field', 'operator', 'value'];
        
        foreach ($requiredFields as $field) {
            if (!isset($condition[$field])) {
                return false;
            }
        }

        $validOperators = [
            '>=', '>', '<=', '<', '==', '!=', 
            'in', 'not_in', 'contains', 'starts_with', 'ends_with', 'regex'
        ];

        return in_array($condition['operator'], $validOperators);
    }

    /**
     * 条件の説明文を生成
     */
    public function generateConditionDescription(array $condition): string
    {
        $field = $condition['field'] ?? '';
        $operator = $condition['operator'] ?? '';
        $value = $condition['value'] ?? '';

        $fieldNames = [
            'amount' => '金額',
            'vendor_type' => '業者タイプ',
            'project_type' => 'プロジェクトタイプ',
            'department_id' => '部署',
            'user_id' => 'ユーザー',
        ];

        $operatorNames = [
            '>=' => '以上',
            '>' => 'より大きい',
            '<=' => '以下',
            '<' => 'より小さい',
            '==' => '等しい',
            '!=' => '等しくない',
            'in' => 'に含まれる',
            'not_in' => 'に含まれない',
            'contains' => 'を含む',
            'starts_with' => 'で始まる',
            'ends_with' => 'で終わる',
        ];

        $fieldName = $fieldNames[$field] ?? $field;
        $operatorName = $operatorNames[$operator] ?? $operator;

        if (is_array($value)) {
            $value = implode(', ', $value);
        }

        return "{$fieldName} {$operatorName} {$value}";
    }
}
