'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Check, Shield, Settings, Eye, Trash2, X, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { usePolicyTemplatesByAction } from '@/hooks/features/permission/usePolicyTemplates'
import { usePermissionDepartments } from '@/hooks/useDepartments'
import { useActiveDepartments } from '@/hooks/useDepartments'
import { useActivePositions } from '@/hooks/usePositions'
import { useActiveSystemLevels } from '@/hooks/useSystemLevels'
import { useRoles } from '@/hooks/features/permission/useRoles'
import { useUsers } from '@/hooks/features/permission/useUsers'
import { DepartmentSelectionInput } from './DepartmentSelectionInput'
import type { PolicyOptions } from '@/services/features/permission/abacPolicyService'
import type { PolicyTemplate } from '@/services/features/permission/policyTemplateService'

// 共通のJSON照会ダイアログコンポーネント
interface JsonModalProps {
  isOpen: boolean
  onClose: () => void
  conditions: Record<string, unknown>
  title?: string
}

const JsonModal: React.FC<JsonModalProps> = ({ isOpen, onClose, conditions, title = "条件式（JSON）" }) => {
  if (!isOpen) return null

  const handleCopy = () => {
    const conditionJson = JSON.stringify(conditions, null, 2)
    navigator.clipboard.writeText(conditionJson).then(() => {
      toast.success('JSONをクリップボードにコピーしました')
    }).catch(() => {
      toast.error('コピーに失敗しました')
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="p-4">
            <div className="bg-gray-50 rounded-lg p-4 max-h-[50vh] overflow-y-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(conditions, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4 mr-2" />
              コピー
            </Button>
            <Button onClick={onClose}>
              閉じる
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


// 利用者制限の条件ビルダーコンポーネント
interface UserAccessConditionBuilderProps {
  templateId: number
  paramKey: string
  currentValue: unknown
  onParameterChange: (templateId: number, paramKey: string, value: unknown) => void
  availableFields: Record<string, string>
  availableOperators: Record<string, string>
  fieldOperators?: Record<string, Record<string, string>>
  maxDepth?: number
}

interface ConditionRule {
  field?: string
  operator?: string
  value?: unknown
  rules?: ConditionRule[]
}

const UserAccessConditionBuilder: React.FC<UserAccessConditionBuilderProps> = ({
  templateId,
  paramKey,
  currentValue,
  onParameterChange,
  availableFields,
  availableOperators,
  fieldOperators
}) => {
  const [conditions, setConditions] = React.useState<ConditionRule>(() => {
    
    if (currentValue && typeof currentValue === 'object') {
      const condition = currentValue as ConditionRule
      
      // rulesがオブジェクト形式の場合は配列形式に変換
      if (condition.rules && !Array.isArray(condition.rules)) {
        condition.rules = []
      }
      // ネストした条件も配列形式に変換
      if (condition.rules && Array.isArray(condition.rules)) {
        condition.rules = condition.rules.map((rule) => {
          if (rule.rules && !Array.isArray(rule.rules)) {
            return { ...rule, rules: [] }
          }
          return rule
        })
      }
      return condition
    }
    return { operator: 'and', rules: [] }
  })
  

  const [showJsonPreview, setShowJsonPreview] = React.useState(false)

  // 既存フックを使用したデータ取得
  const { data: departmentsData } = useActiveDepartments()
  const { data: positionsData } = useActivePositions()
  const { data: systemLevelsData } = useActiveSystemLevels()
  const { data: rolesData } = useRoles()
  const { data: usersData } = useUsers({ is_active: true, per_page: 1000 })


  // 型定義
  type SystemLevel = { id: number; code: string; display_name: string }
  type Role = { id: number; name: string; display_name: string }
  type User = { id: number; name: string; employee_name?: string }
  type Option = { value: string | number; label: string }

  const addCondition = () => {
    const newCondition: ConditionRule = {
      field: Object.keys(availableFields)[0],
      operator: 'in', // デフォルト演算子を 'in' に設定
      value: []
    }
    
    setConditions(prev => ({
      ...prev,
      rules: [...(prev.rules || []), newCondition]
    }))
  }

  const addGroup = () => {
    const newGroup: ConditionRule = {
      operator: 'and',
      rules: []
    }
    
    setConditions(prev => ({
      ...prev,
      rules: [...(prev.rules || []), newGroup]
    }))
  }

  const updateCondition = (index: number, updatedCondition: ConditionRule) => {
    setConditions(prev => ({
      ...prev,
      rules: prev.rules?.map((rule, i) => {
        if (i === index) {
          // rulesがオブジェクト形式の場合は配列形式に変換
          if (updatedCondition.rules && !Array.isArray(updatedCondition.rules)) {
            updatedCondition.rules = []
          }
          // ネストした条件も配列形式に変換
          if (updatedCondition.rules && Array.isArray(updatedCondition.rules)) {
            updatedCondition.rules = updatedCondition.rules.map(nestedRule => {
              if (nestedRule.rules && !Array.isArray(nestedRule.rules)) {
                return { ...nestedRule, rules: [] }
              }
              return nestedRule
            })
          }
          return updatedCondition
        }
        return rule
      }) || []
    }))
  }

  const removeCondition = (index: number) => {
    setConditions(prev => ({
      ...prev,
      rules: prev.rules?.filter((_, i) => i !== index) || []
    }))
  }

  const updateOperator = (newOperator: string) => {
    setConditions(prev => ({ ...prev, operator: newOperator }))
  }

  // フィールドに応じた演算子を取得
  const getOperatorsForField = (field: string): Record<string, string> => {
    if (fieldOperators && fieldOperators[field]) {
      return fieldOperators[field]
    }
    return availableOperators
  }

  // フィールドに応じた値選択オプションを取得
  const getValueOptions = (field: string) => {
    switch (field) {
      case 'user.department_id':
        return (departmentsData || []).map(dept => ({ value: Number(dept.id), label: dept.name })) // 数値に変換
      case 'user.position_id':
        return (positionsData || []).map(pos => ({ value: Number(pos.id), label: pos.name })) // 数値に変換
      case 'user.system_level_id':
        return (Array.isArray(systemLevelsData) ? systemLevelsData : []).map((level: SystemLevel) => ({ value: Number(level.id), label: level.display_name })) // 数値に変換
      case 'user.role_ids':
        return (Array.isArray(rolesData) ? rolesData : []).map((role: Role) => ({ value: Number(role.id), label: role.display_name })) // 数値に変換
      case 'user.id':
        return (Array.isArray(usersData?.users) ? usersData.users : []).map((user: User) => ({ 
          value: Number(user.id), // 数値に変換
          label: user.employee_name ? `${user.employee_name} (${user.name})` : user.name 
        }))
      case 'data.created_by':
        return (Array.isArray(usersData?.users) ? usersData.users : []).map((user: User) => ({ 
          value: Number(user.id), // 数値に変換
          label: user.employee_name ? `${user.employee_name} (${user.name})` : user.name 
        }))
      default:
        return []
    }
  }

  // 値入力コンポーネント
  const renderValueInput = (field: string, operator: string, value: unknown, onChange: (value: unknown) => void) => {
    const options = getValueOptions(field)
    
    // 「以上」「以下」の場合
    if (operator === 'gte' || operator === 'lte') {
      if (field === 'user.system_level_id' || field === 'user.position_id') {
        // システムレベル・職位: ドロップダウン（優先順位ベース）
        // 配列の場合は最初の要素を取得、そうでなければそのまま使用
        const selectValue = Array.isArray(value) ? (value[0] as string || '') : (value as string || '')
        
        return (
          <select
            value={selectValue}
            onChange={(e) => onChange(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
          >
            <option value="">選択してください</option>
            {options.map((option: Option, index: number) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      }
    }
    
    // 「含む」の場合: チェックボックス形式
    if (operator === 'in' && options.length > 0) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : [])
      
      const handleCheckboxChange = (optionValue: string | number, checked: boolean) => {
        if (checked) {
          // 値を追加
          const newValues = [...currentValues, optionValue]
          onChange(newValues)
        } else {
          // 値を削除
          const newValues = currentValues.filter(v => v !== optionValue)
          onChange(newValues.length > 0 ? newValues : [])
        }
      }
      
      return (
        <div className="flex-1">
          <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2 space-y-1">
            {options.map((option: Option, index: number) => (
              <label key={index} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={currentValues.includes(option.value)}
                  onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {currentValues.length > 0 && (
            <div className="mt-1 text-xs text-gray-600">
              選択済み: {currentValues.length}個
            </div>
          )}
        </div>
      )
    } else {
      return (
        <input
          type="text"
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="値を入力"
          className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
        />
      )
    }
  }

  // 条件変更時に親コンポーネントに通知
  React.useEffect(() => {
    // rulesがオブジェクト形式の場合は配列形式に変換してから保存
    const sanitizedConditions = {
      ...conditions,
      rules: Array.isArray(conditions.rules) ? conditions.rules : []
    }
    
    // 不要なネストを削除: 単一のネストした条件を直接展開
    if (sanitizedConditions.rules && sanitizedConditions.rules.length === 1) {
      const singleRule = sanitizedConditions.rules[0]
      if (singleRule.operator === 'and' && Array.isArray(singleRule.rules) && singleRule.rules.length > 0) {
        sanitizedConditions.rules = singleRule.rules
      }
    }
    
    // ネストした条件も配列形式に変換
    if (sanitizedConditions.rules) {
      sanitizedConditions.rules = sanitizedConditions.rules.map(rule => {
        if (rule.rules && !Array.isArray(rule.rules)) {
          return { ...rule, rules: [] }
        }
        return rule
      })
    }
    
    // 空の条件や無効な条件をフィルタリング
    if (sanitizedConditions.rules) {
      sanitizedConditions.rules = sanitizedConditions.rules.filter(rule => {
        // フィールドと演算子が設定されている条件のみを保持
        if (rule.field && rule.operator) {
          // 値が空の配列の場合は除外
          if (rule.operator === 'in' && Array.isArray(rule.value) && rule.value.length === 0) {
            return false
          }
          return true
        }
        // ネストした条件の場合は再帰的にチェック
        if (rule.operator === 'and' || rule.operator === 'or') {
          return rule.rules && Array.isArray(rule.rules) && rule.rules.length > 0
        }
        return false
      })
    }
    
    // ネストした条件の構造を修正
    if (sanitizedConditions.rules) {
      sanitizedConditions.rules = sanitizedConditions.rules.map(rule => {
        if (rule.operator === 'and' || rule.operator === 'or') {
          // ネストした条件のrulesがオブジェクト形式の場合は配列形式に変換
          if (rule.rules && typeof rule.rules === 'object' && !Array.isArray(rule.rules)) {
            return { ...rule, rules: [] }
          }
        }
        // user.access_restrictionフィールドの場合は、フィールドを削除してネストした条件のみを保持
        if (rule.field === 'user.access_restriction' && (rule.operator === 'and' || rule.operator === 'or')) {
          return {
            operator: rule.operator,
            rules: Array.isArray(rule.rules) ? rule.rules : []
          }
        }
        return rule
      })
    }
    
    // user.access_restrictionフィールドを含む条件を展開
    if (sanitizedConditions.rules) {
      const expandedRules: ConditionRule[] = []
      sanitizedConditions.rules.forEach(rule => {
        if (rule.field === 'user.access_restriction' && (rule.operator === 'and' || rule.operator === 'or')) {
          // user.access_restrictionフィールドの場合は、ネストした条件を直接展開
          if (Array.isArray(rule.rules)) {
            expandedRules.push(...rule.rules)
          } else if (rule.rules && typeof rule.rules === 'object' && 'rules' in rule.rules) {
            // オブジェクト形式の場合は、rulesプロパティを展開
            const nestedRules = (rule.rules as { rules: ConditionRule[] }).rules
            if (Array.isArray(nestedRules)) {
              expandedRules.push(...nestedRules)
            }
          }
        } else {
          expandedRules.push(rule)
        }
      })
      sanitizedConditions.rules = expandedRules
    }
    
    // 再帰的にuser.access_restrictionフィールドを展開
    const expandUserAccessRestriction = (rules: ConditionRule[]): ConditionRule[] => {
      const result: ConditionRule[] = []
      rules.forEach(rule => {
        if (rule.field === 'user.access_restriction' && (rule.operator === 'and' || rule.operator === 'or')) {
          if (Array.isArray(rule.rules)) {
            result.push(...expandUserAccessRestriction(rule.rules))
          } else if (rule.rules && typeof rule.rules === 'object' && 'rules' in rule.rules) {
            const nestedRules = (rule.rules as { rules: ConditionRule[] }).rules
            if (Array.isArray(nestedRules)) {
              result.push(...expandUserAccessRestriction(nestedRules))
            }
          }
        } else if (rule.rules && Array.isArray(rule.rules)) {
          // ネストした条件も再帰的に処理
          result.push({
            ...rule,
            rules: expandUserAccessRestriction(rule.rules)
          })
        } else {
          result.push(rule)
        }
      })
      return result
    }
    
    if (sanitizedConditions.rules) {
      sanitizedConditions.rules = expandUserAccessRestriction(sanitizedConditions.rules)
    }
    
    
    // 「以上」「以下」演算子の場合、値を単一の数値に変換（再帰的に処理）
    const convertGteLteValues = (rules: ConditionRule[]): ConditionRule[] => {
      return rules.map(rule => {
        if (rule.operator === 'gte' || rule.operator === 'lte') {
          let numericValue
          if (Array.isArray(rule.value) && rule.value.length > 0) {
            // 配列の場合、最初の要素を取得
            numericValue = rule.value[0]
          } else {
            // 単一値の場合
            numericValue = rule.value
          }
          
          // 文字列を数値に変換
          const numValue = typeof numericValue === 'string' ? parseInt(numericValue, 10) : numericValue
          if (!isNaN(numValue)) {
            return { ...rule, value: numValue }
          }
        } else if (rule.rules && Array.isArray(rule.rules)) {
          // ネストした条件も再帰的に処理
          return { ...rule, rules: convertGteLteValues(rule.rules) }
        }
        return rule
      })
    }
    
    if (sanitizedConditions.rules) {
      sanitizedConditions.rules = convertGteLteValues(sanitizedConditions.rules)
    }
    
    // すべての値を数値に変換（「含む」演算子の場合）
    const convertAllValuesToNumbers = (rules: ConditionRule[]): ConditionRule[] => {
      return rules.map(rule => {
        if (rule.operator === 'in' && Array.isArray(rule.value)) {
          const numericValues = rule.value.map(v => {
            const num = Number(v)
            return isNaN(num) ? v : num
          })
          return { ...rule, value: numericValues }
        } else if (rule.rules && Array.isArray(rule.rules)) {
          // ネストした条件も再帰的に処理
          return { ...rule, rules: convertAllValuesToNumbers(rule.rules) }
        }
        return rule
      })
    }
    
    if (sanitizedConditions.rules) {
      sanitizedConditions.rules = convertAllValuesToNumbers(sanitizedConditions.rules)
    }
    
    
    onParameterChange(templateId, paramKey, sanitizedConditions)
  }, [conditions, templateId, paramKey, onParameterChange])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">論理結合:</label>
        <select
          value={conditions.operator || 'and'}
          onChange={(e) => updateOperator(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="and">AND（すべて満たす）</option>
          <option value="or">OR（いずれか満たす）</option>
        </select>
      </div>

      <div className="space-y-2">
        {conditions.rules?.map((rule, index) => (
          <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
            {rule.field ? (
              // 条件行
              <>
                <select
                  value={rule.field}
                  onChange={(e) => updateCondition(index, { ...rule, field: e.target.value })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {Object.entries(availableFields).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                
                <select
                  value={rule.operator}
                  onChange={(e) => updateCondition(index, { ...rule, operator: e.target.value })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {Object.entries(getOperatorsForField(rule.field || '')).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                
                {renderValueInput(rule.field || '', rule.operator || '', rule.value, (value) => 
                  updateCondition(index, { ...rule, value })
                )}
              </>
            ) : (
              // グループ行
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-2">グループ条件</div>
                        <div className="ml-4 space-y-2">
                          {Array.isArray(rule.rules) ? rule.rules.map((subRule, subIndex) => (
                            <div key={subIndex} className="flex items-center gap-2">
                              <select
                                value={subRule.field}
                                onChange={(e) => {
                                  const newRules = Array.isArray(rule.rules) ? [...rule.rules] : []
                                  newRules[subIndex] = { ...subRule, field: e.target.value, value: [] }
                                  updateCondition(index, { ...rule, rules: newRules })
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                {Object.entries(availableFields).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                              
                              <select
                                value={subRule.operator}
                                onChange={(e) => {
                                  const newRules = Array.isArray(rule.rules) ? [...rule.rules] : []
                                  newRules[subIndex] = { ...subRule, operator: e.target.value }
                                  updateCondition(index, { ...rule, rules: newRules })
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                {Object.entries(getOperatorsForField(subRule.field || '')).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                              
                              {renderValueInput(subRule.field || '', subRule.operator || '', subRule.value, (value) => {
                                const newRules = Array.isArray(rule.rules) ? [...rule.rules] : []
                                newRules[subIndex] = { ...subRule, value }
                                updateCondition(index, { ...rule, rules: newRules })
                              })}
                              
                              <button
                                onClick={() => {
                                  const newRules = Array.isArray(rule.rules) ? [...rule.rules] : []
                                  newRules.splice(subIndex, 1)
                                  updateCondition(index, { ...rule, rules: newRules })
                                }}
                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                              >
                                削除
                              </button>
                            </div>
                          )) : null}
                          
                          <button
                            onClick={() => {
                              const newRules = Array.isArray(rule.rules) ? [...rule.rules] : []
                              newRules.push({
                                field: Object.keys(availableFields)[0],
                                operator: 'in', // デフォルト演算子を 'in' に設定
                                value: []
                              })
                              updateCondition(index, { ...rule, rules: newRules })
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            条件を追加
                          </button>
                        </div>
              </div>
            )}
            
            <button
              onClick={() => removeCondition(index)}
              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
            >
              削除
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={addCondition}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          条件を追加
        </button>
        <button
          onClick={addGroup}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          グループを追加
        </button>
      </div>

      <div className="mt-4">
        <button
          onClick={() => setShowJsonPreview(!showJsonPreview)}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 mb-2"
        >
          {showJsonPreview ? 'JSON非表示' : 'JSON表示'}
        </button>
        
        {showJsonPreview && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm font-medium text-blue-800 mb-2">設定内容プレビュー:</div>
            <pre className="text-xs text-blue-700 overflow-x-auto overflow-y-auto whitespace-pre-wrap max-h-[30vh]">
              {JSON.stringify(conditions, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

// 条件式の詳細表示を生成する共通関数
const generateConditionDetail = (template: PolicyTemplate, params: Record<string, unknown> | undefined, departments: Array<{id: number; name: string}>) => {
  const restrictionType = params?.restriction_type as string
  
  if (template.template_code === 'department_restriction' && restrictionType) {
    if (restrictionType === 'in') {
      const departmentIds = params?.department_ids as number[]
      if (departmentIds && departmentIds.length > 0) {
        // 部署マスタから部署名を取得
        const departmentNames = departmentIds.map(id => {
          const department = departments.find(dept => dept.id === id)
          return department ? department.name : `部署ID:${id}`
        })
        return `特定部署制限（${departmentNames.join('、')}）`
      } else {
        return '特定部署制限（部署未選択）'
      }
    } else if (restrictionType === 'eq') {
      return '自部署制限（自分の部署のみ）'
    } else if (restrictionType === 'exists') {
      return '全部署制限（全部署アクセス）'
    }
  } else if (template.name === '金額制限' && restrictionType) {
    if (restrictionType === 'lte') {
      const amount = params?.amount_limit as number
      return `金額上限制限（${amount.toLocaleString()}円以下）`
    } else if (restrictionType === 'gte') {
      const amount = params?.min_amount as number
      return `金額下限制限（${amount.toLocaleString()}円以上）`
    } else if (restrictionType === 'between') {
      const minAmount = params?.min_amount as number
      const maxAmount = params?.amount_limit as number
      return `金額範囲制限（${minAmount.toLocaleString()}円〜${maxAmount.toLocaleString()}円）`
    }
  } else if (template.name === 'ステータス制限') {
    const allowedStatuses = params?.allowed_statuses
    if (Array.isArray(allowedStatuses) && allowedStatuses.length > 0) {
      return `ステータス制限（${allowedStatuses.join('、')}）`
    }
    return 'ステータス制限（条件未設定）'
  } else if (template.name === '期間制限') {
    const startDate = params?.start_date
    const endDate = params?.end_date
    if (startDate && endDate) {
      return `期間制限（${startDate}〜${endDate}）`
    } else if (startDate) {
      return `期間制限（${startDate}以降）`
    } else if (endDate) {
      return `期間制限（${endDate}以前）`
    }
    return '期間制限（条件未設定）'
  } else if (template.template_code === 'user_access_restriction') {
    // 利用者制限の条件式表示
    const builderRules = params?.builder_rules
    console.log('利用者制限の表示処理:', { template: template.name, builderRules, params })
    if (builderRules && typeof builderRules === 'object') {
      const rules = (builderRules as { rules?: unknown[] }).rules
      if (Array.isArray(rules) && rules.length > 0) {
        return `利用者制限（${rules.length}個の条件）`
      }
      return `利用者制限（${JSON.stringify(builderRules).length > 50 ? '複合条件' : '条件設定済み'}）`
    }
    return '利用者制限（条件未設定）'
  } else if (template.name === '時間制限' && restrictionType) {
    if (restrictionType === 'business_hours') {
      return '営業時間制限（9:00〜18:00）'
    } else if (restrictionType === 'weekday') {
      return '平日制限（月〜金）'
    } else if (restrictionType === 'custom_hours') {
      const startTime = params?.start_time as string
      const endTime = params?.end_time as string
      return `カスタム時間制限（${startTime}〜${endTime}）`
    }
  }
  
  return template.name
}

// ウィザードステップの型定義
export interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  component: React.ComponentType<WizardStepProps>
  isCompleted: boolean
  isAccessible: boolean
}

// ウィザードステップの共通プロパティ
export interface WizardStepProps {
  data: WizardData
  setData: (data: Partial<WizardData>) => void
  options: PolicyOptions | null
  onNext: () => void
  onPrevious: () => void
  onComplete: () => void
  isLoading?: boolean
}

// ウィザード全体のデータ型
export interface WizardData {
  // Step 1: 基本情報
  name: string
  description: string
  business_code: string
  action: string
  resource_type: string
  effect: 'allow' | 'deny'
  priority: number
  is_active: boolean
  
  // Step 2: テンプレート選択
  selectedTemplates: PolicyTemplate[]
  templateParameters: Record<string, Record<string, unknown>>
  
  // Step 3: 条件式生成・調整
  conditions: Record<string, unknown>
  scope: string
  
  // Step 4: 確認・作成
  metadata: Record<string, unknown>
}

interface PolicyWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: WizardData) => void
  options: PolicyOptions | null
  initialData?: Partial<WizardData>
  isEditMode?: boolean
}

const STEPS: Omit<WizardStep, 'isCompleted' | 'isAccessible'>[] = [
  {
    id: 'basic-info',
    title: '基本情報',
    description: 'ポリシーの基本設定を行います',
    icon: <Shield className="h-5 w-5" />,
    component: BasicInfoStep,
  },
  {
    id: 'template-selection',
    title: 'テンプレート選択',
    description: '条件テンプレートを選択します',
    icon: <Settings className="h-5 w-5" />,
    component: TemplateSelectionStep,
  },
  {
    id: 'condition-adjustment',
    title: '条件式調整',
    description: '選択したテンプレートのパラメータを調整します',
    icon: <Settings className="h-5 w-5" />,
    component: ConditionAdjustmentStep,
  },
  {
    id: 'confirmation',
    title: '確認・作成',
    description: '設定内容を確認してポリシーを作成します',
    icon: <Eye className="h-5 w-5" />,
    component: ConfirmationStep,
  },
]

export default function PolicyWizard({
  isOpen,
  onClose,
  onComplete,
  options,
  initialData = {},
  isEditMode = false
}: PolicyWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 初期化時に直接データを設定
  const [wizardData, setWizardData] = useState<WizardData>(() => {
    
    // 編集モードの場合は初期データを設定
    if (isEditMode && initialData) {
      
      // テンプレート情報を復元
      let selectedTemplates: PolicyTemplate[] = [];
      if (initialData.metadata?.template_info) {
        const templateInfo = initialData.metadata.template_info as {
          selected_templates?: number[];
          template_parameters?: Record<string, Record<string, unknown>>;
        };
        
        if (templateInfo.selected_templates) {
          const templateIds = templateInfo.selected_templates;
        
        // 仮のテンプレートオブジェクトを作成（後で実際のテンプレート情報で更新）
        selectedTemplates = templateIds.map(id => ({
          id,
          name: `Template ${id}`,
          description: '復元中...',
          template_code: `temp_${id}`,
          category: '復元中',
          condition_type: '復元中',
          condition_rule: {},
          parameters: {
            required_fields: [],
            configurable_values: {}
          },
          applicable_actions: [],
          tags: [],
          is_system: false,
          is_active: true,
          priority: 50,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as PolicyTemplate));
        
        }
      }
      
      // 基本情報を直接復元
      const editData = {
        name: initialData.name || '',
        description: initialData.description || '',
        business_code: initialData.business_code || '',
        action: initialData.action || '',
        resource_type: initialData.resource_type || '',
        effect: initialData.effect || 'allow',
        priority: initialData.priority || 50,
        is_active: initialData.is_active ?? true,
        selectedTemplates: selectedTemplates,
        templateParameters: initialData.templateParameters || {},
        conditions: initialData.conditions || { operator: 'and', rules: [] },
        scope: initialData.scope || '',
        metadata: initialData.metadata || {},
      };
      
      
      return editData;
    }
    
    // 新規作成モードの場合はデフォルト値
    const newData = {
      name: initialData?.name || '',
      description: initialData?.description || '',
      business_code: initialData?.business_code || '',
      action: initialData?.action || '',
      resource_type: initialData?.resource_type || '',
      effect: initialData?.effect || 'allow',
      priority: initialData?.priority || 50,
      is_active: initialData?.is_active ?? true,
      selectedTemplates: initialData?.selectedTemplates || [],
      templateParameters: initialData?.templateParameters || {},
      conditions: initialData?.conditions || { operator: 'and', rules: [] },
      scope: initialData?.scope || '',
      metadata: initialData?.metadata || {},
    };
    return newData;
  })


  // ビジネスコードの動的更新
  React.useEffect(() => {
    if (!isEditMode && initialData.business_code && initialData.business_code !== wizardData.business_code) {
      setWizardData(prev => ({
        ...prev,
        business_code: initialData.business_code!
      }));
    }
  }, [isEditMode, initialData.business_code, wizardData.business_code])

  const [isLoading, setIsLoading] = useState(false)

  // ステップの状態を計算
  const steps: WizardStep[] = STEPS.map((step, index) => ({
    ...step,
    isCompleted: index < currentStepIndex,
    isAccessible: index <= currentStepIndex,
  }))
  

  const currentStep = steps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  // データ更新
  const handleSetData = (data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }))
  }

  // ステップナビゲーション
  const handleNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    }
  }, [currentStepIndex, steps.length])

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }, [currentStepIndex])

  // ポリシー作成・更新
  const handleComplete = useCallback(async () => {
    if (isSubmitting) return // 重複送信を防止
    
    setIsSubmitting(true)
    setIsLoading(true)
    try {
      // 条件式の検証
      if (!wizardData.conditions || !wizardData.conditions.rules || !Array.isArray(wizardData.conditions.rules) || wizardData.conditions.rules.length === 0) {
        toast.error('有効な条件式を設定してください')
        return
      }
      
      // user.access_restrictionフィールドを展開
      const expandUserAccessRestriction = (rules: ConditionRule[]): ConditionRule[] => {
        const result: ConditionRule[] = []
        rules.forEach(rule => {
          if (rule.field === 'user.access_restriction' && (rule.operator === 'and' || rule.operator === 'or')) {
            if (Array.isArray(rule.rules)) {
              result.push(...expandUserAccessRestriction(rule.rules))
            } else if (rule.rules && typeof rule.rules === 'object') {
              const rulesObj = rule.rules as Record<string, unknown>
              if ('rules' in rulesObj && Array.isArray(rulesObj.rules)) {
                const nestedRules = rulesObj.rules as ConditionRule[]
                result.push(...expandUserAccessRestriction(nestedRules))
              }
            }
          } else if (rule.rules && Array.isArray(rule.rules)) {
            // ネストした条件も再帰的に処理
            result.push({
              ...rule,
              rules: expandUserAccessRestriction(rule.rules)
            })
          } else {
            result.push(rule)
          }
        })
        return result
      }
      
      // 条件式を展開
      const expandedConditions = {
        ...wizardData.conditions,
        rules: expandUserAccessRestriction(wizardData.conditions.rules)
      }
      
      
      // 条件式の詳細検証
      const hasValidConditions = expandedConditions.rules.some(rule => {
        if (rule.field && rule.operator) {
          // 値が空の配列の場合は無効
          if (rule.operator === 'in' && Array.isArray(rule.value) && rule.value.length === 0) {
            return false
          }
          return true
        }
        return false
      })
      
      if (!hasValidConditions) {
        toast.error('有効な条件を少なくとも1つ設定してください')
        return
      }
      
      // テンプレート情報をメタデータに追加
      const policyData = {
        ...wizardData,
        conditions: expandedConditions, // 展開された条件式を使用
        metadata: {
          ...wizardData.metadata,
          template_info: {
            selected_templates: wizardData.selectedTemplates.map(t => t.id),
            template_parameters: wizardData.templateParameters
          }
        }
      }
      
      await onComplete(policyData)
      onClose()
    } catch (error) {
      console.error('Policy creation/update error:', error)
      toast.error(isEditMode ? 'ポリシーの更新に失敗しました' : 'ポリシーの作成に失敗しました')
    } finally {
      setIsSubmitting(false)
      setIsLoading(false)
    }
  }, [wizardData, onComplete, onClose, isEditMode, isSubmitting])

  // ステップ検証
  const isCurrentStepValid = useCallback(() => {
    switch (currentStep.id) {
      case 'basic-info':
        return wizardData.name && wizardData.business_code && wizardData.action && wizardData.resource_type
      case 'template-selection':
        return wizardData.selectedTemplates.length > 0
      case 'condition-adjustment':
        return Object.keys(wizardData.conditions).length > 0
      case 'confirmation':
        return true
      default:
        return false
    }
  }, [currentStep.id, wizardData])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {isEditMode ? 'ポリシー編集ウィザード' : 'ポリシー作成ウィザード'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                ステップ {currentStepIndex + 1} / {steps.length}: {currentStep.title}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
          
          {/* プログレスバー */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* ステップインジケーター */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center space-y-2 ${
                  step.isAccessible ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step.isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : index === currentStepIndex
                      ? 'border-primary text-primary'
                      : 'border-muted-foreground text-muted-foreground'
                  }`}
                >
                  {step.isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium ${
                    index === currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          <currentStep.component
            data={wizardData}
            setData={handleSetData}
            options={options}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleComplete}
            isLoading={isLoading}
          />
        </CardContent>

        <div className="border-t p-4 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            前へ
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            
            {currentStepIndex === steps.length - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={!isCurrentStepValid() || isLoading || isSubmitting}
              >
                {isLoading || isSubmitting ? (isEditMode ? '更新中...' : '作成中...') : (isEditMode ? 'ポリシーを更新' : 'ポリシーを作成')}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isCurrentStepValid()}
              >
                次へ
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ステップ1: 基本情報
function BasicInfoStep({ data, setData, options }: WizardStepProps) {
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">基本情報の設定</h3>
        <p className="text-sm text-muted-foreground">
          ポリシーの基本設定を行います。必須項目を入力してください。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">ポリシー名 *</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({ name: e.target.value })}
            placeholder="ポリシー名を入力"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">ビジネスコード *</label>
          <input
            type="text"
            value={options?.business_codes.find(bc => bc.code === data.business_code)?.name || data.business_code || ''}
            readOnly
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
            placeholder="ビジネスコードが選択されていません"
          />
          <p className="text-xs text-muted-foreground mt-1">
            ビジネスコードは前の画面で選択されたものが自動設定されます
          </p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">説明</label>
        <textarea
          value={data.description}
          onChange={(e) => setData({ description: e.target.value })}
          placeholder="ポリシーの説明を入力"
          rows={3}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">アクション *</label>
          <select
            value={data.action}
            onChange={(e) => setData({ action: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">アクションを選択</option>
            {options?.actions && Object.entries(options.actions).map(([key, value]) => (
              <option key={key} value={key}>
                {value} ({key})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium">リソースタイプ *</label>
          <select
            value={data.resource_type}
            onChange={(e) => setData({ resource_type: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">リソースタイプを選択</option>
            {options?.resource_types && Object.entries(options.resource_types).map(([key, value]) => (
              <option key={key} value={key}>
                {value} ({key})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium">効果 *</label>
          <select
            value={data.effect}
            onChange={(e) => setData({ effect: e.target.value as 'allow' | 'deny' })}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="allow">許可</option>
            <option value="deny">拒否</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">優先度</label>
          <input
            type="number"
            value={data.priority || 50}
            onChange={(e) => setData({ priority: parseInt(e.target.value) || 50 })}
            min={0}
            max={1000}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="is-active"
            checked={data.is_active}
            onChange={(e) => setData({ is_active: e.target.checked })}
            className="rounded border-gray-300"
          />
          <label htmlFor="is-active" className="text-sm font-medium">
            アクティブ
          </label>
        </div>
      </div>
    </div>
  )
}



// ステップ4: 確認・作成
function ConfirmationStep({ data, options }: WizardStepProps) {
  const [showJsonModal, setShowJsonModal] = React.useState(false)
  const { data: departmentsResponse } = usePermissionDepartments()
  const departments = departmentsResponse?.data || []
  
  // user.access_restrictionフィールドを展開する関数
  const expandUserAccessRestriction = (rules: ConditionRule[]): ConditionRule[] => {
    const result: ConditionRule[] = []
    rules.forEach(rule => {
      if (rule.field === 'user.access_restriction' && (rule.operator === 'and' || rule.operator === 'or')) {
        if (Array.isArray(rule.rules)) {
          result.push(...expandUserAccessRestriction(rule.rules))
        } else if (rule.rules && typeof rule.rules === 'object') {
          const rulesObj = rule.rules as Record<string, unknown>
          if ('rules' in rulesObj && Array.isArray(rulesObj.rules)) {
            const nestedRules = rulesObj.rules as ConditionRule[]
            result.push(...expandUserAccessRestriction(nestedRules))
          }
        }
      } else if (rule.rules && Array.isArray(rule.rules)) {
        // ネストした条件も再帰的に処理
        result.push({
          ...rule,
          rules: expandUserAccessRestriction(rule.rules)
        })
      } else {
        result.push(rule)
      }
    })
    return result
  }
  
  // 展開された条件式を取得
  const getExpandedConditions = () => {
    if (!data.conditions || !data.conditions.rules || !Array.isArray(data.conditions.rules)) {
      return data.conditions
    }
    
    return {
      ...data.conditions,
      rules: expandUserAccessRestriction(data.conditions.rules)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">設定内容の確認</h3>
        <p className="text-sm text-muted-foreground">
          以下の設定でポリシーを作成します。内容を確認してください。
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">ポリシー名</label>
            <div className="text-lg font-semibold">{data.name}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">ビジネスコード</label>
            <div className="text-lg font-semibold">
              {options?.business_codes.find(bc => bc.code === data.business_code)?.name || data.business_code}
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">説明</label>
          <div className="text-lg font-semibold">
            {data.description || 'なし'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">アクション</label>
            <div className="text-lg font-semibold">{data.action}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">リソースタイプ</label>
            <div className="text-lg font-semibold">{data.resource_type}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">効果</label>
            <Badge variant={data.effect === 'allow' ? 'default' : 'destructive'}>
              {data.effect === 'allow' ? '許可' : '拒否'}
            </Badge>
          </div>
        </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">優先度</label>
                    <div className="text-lg font-semibold">{data.priority}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">状態</label>
                    <Badge variant={data.is_active ? "default" : "secondary"}>
                      {data.is_active ? 'アクティブ' : '非アクティブ'}
                    </Badge>
                  </div>
                </div>

                {data.selectedTemplates.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">使用テンプレート</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {data.selectedTemplates.map((template) => (
                        <Badge key={template.id} variant="outline">
                          {template.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {data.conditions && Object.keys(data.conditions).length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-muted-foreground">条件式</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowJsonModal(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        照会
                      </Button>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="space-y-2">
                        {data.selectedTemplates.map((template, index) => {
                          const params = data.templateParameters?.[template.id.toString()]
                          const conditionDetail = generateConditionDetail(template, params, departments)

                          return (
                            <div key={template.id} className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {index > 0 && (
                                  <span className="text-muted-foreground mr-2">かつ</span>
                                )}
                                {conditionDetail}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {data.scope && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">適用範囲</label>
                    <div className="text-lg font-semibold">{data.scope}</div>
                  </div>
                )}

      {/* JSON表示モーダル */}
      <JsonModal
        isOpen={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        conditions={getExpandedConditions()}
        title="条件式（JSON）"
      />
      </div>
    </div>
  )
}

// ステップ2: テンプレート選択
function TemplateSelectionStep({ data, setData }: WizardStepProps) {
  
  const { data: templatesResponse, isLoading: templatesLoading } = usePolicyTemplatesByAction(data.action)
  const templates = React.useMemo(() => templatesResponse?.data || [], [templatesResponse?.data])
  
  
  // テンプレート情報の復元
  React.useEffect(() => {
    if (data.selectedTemplates.length > 0 && templates.length > 0) {
      const restoredTemplates = data.selectedTemplates.filter(t => t.name.startsWith('Template '))
      
      if (restoredTemplates.length > 0) {
        const updatedTemplates = data.selectedTemplates.map(selectedTemplate => {
          if (selectedTemplate.name.startsWith('Template ')) {
            const actualTemplate = templates.find(t => t.id === selectedTemplate.id)
            return actualTemplate || selectedTemplate
          }
          return selectedTemplate
        })
        
        // 変更があった場合のみ更新
        const hasChanges = updatedTemplates.some((template, index) => 
          template.id !== data.selectedTemplates[index]?.id || 
          template.name !== data.selectedTemplates[index]?.name
        )
        
        if (hasChanges) {
          setData({ selectedTemplates: updatedTemplates })
        }
      }
    }
  }, [templates, data.selectedTemplates, setData])

  const handleTemplateSelect = (template: PolicyTemplate) => {
    const isSelected = data.selectedTemplates.some(t => t.id === template.id)
    if (isSelected) {
      setData({
        selectedTemplates: data.selectedTemplates.filter(t => t.id !== template.id)
      })
    } else {
      setData({
        selectedTemplates: [...data.selectedTemplates, template]
      })
    }
  }

  // 属性カテゴリ別にテンプレートを分類
  const categorizedTemplates = templates.reduce((acc, template) => {
    let category: string
    
    // テンプレート名とフィールドから属性カテゴリを判定
    const field = template.condition_rule?.field
    
    // user_access_restrictionテンプレートは特別にユーザー属性として分類
    if (template.template_code === 'user_access_restriction') {
      category = 'ユーザー属性'
    } else if (field?.startsWith('user.')) {
      category = 'ユーザー属性'
    } else if (field?.startsWith('data.')) {
      category = 'リソース属性'
    } else if (field?.startsWith('environment.') || field?.startsWith('request.')) {
      category = '環境属性'
    } else if (template.name.includes('時間制限') || template.name.includes('曜日制限') || template.name.includes('IP制限')) {
      category = '環境属性'
    } else {
      category = 'その他'
    }
    
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {} as Record<string, PolicyTemplate[]>)

  if (templatesLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-muted-foreground">テンプレートを読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">テンプレート選択</h3>
        <p className="text-sm text-muted-foreground mb-3">
          アクセス制御の条件を設定するテンプレートを選択してください。属性カテゴリ別に整理されています。
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-2">属性カテゴリの説明:</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span><strong>ユーザー属性:</strong> ログインユーザーの情報（部署、職位など）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span><strong>リソース属性:</strong> アクセス対象データの情報（金額、作成者など）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span><strong>環境属性:</strong> アクセス時の環境情報（時間、曜日など）</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!data.action ? (
        <div className="text-center py-8 text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>アクションを選択してください</p>
          <p className="text-sm">前のステップでアクションを選択してからテンプレートを選択できます</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>このアクションに対応するテンプレートがありません</p>
          <p className="text-sm">テンプレートなしで進むか、別のアクションを選択してください</p>
        </div>
      ) : (
        <>
          {/* 属性カテゴリ別のテンプレート選択 */}
          <div className="space-y-6">
            {['ユーザー属性', 'リソース属性', '環境属性', 'その他'].map((category) => {
              const categoryTemplates = categorizedTemplates[category] || []
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      category === 'ユーザー属性' ? 'bg-blue-500' :
                      category === 'リソース属性' ? 'bg-green-500' :
                      category === '環境属性' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`}></div>
                    <h4 className="text-lg font-semibold">{category}</h4>
                    <span className="text-sm text-muted-foreground">
                      ({categoryTemplates.length}個のテンプレート)
                    </span>
                  </div>
                  
                  {categoryTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryTemplates.map((template) => {
                        const isSelected = data.selectedTemplates.some(t => t.id === template.id)
                        return (
                          <div
                            key={template.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-sm' 
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                            onClick={() => handleTemplateSelect(template)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm mb-1">{template.name}</h5>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {template.description || ''}
                                </p>
                                
                                {template.condition_rule?.field && (
                                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-2">
                                    対象: {template.condition_rule.field}
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap gap-1">
                                  {template.tags.map((tag) => (
                                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="ml-2">
                                {isSelected && (
                                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-muted-foreground">
                      <p className="text-sm">このカテゴリには利用可能なテンプレートがありません</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {data.selectedTemplates.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium mb-3 text-blue-900">選択済みテンプレート</h4>
              <div className="space-y-2">
                {data.selectedTemplates.map((template) => {
                  // テンプレートの属性カテゴリを判定
                  let category = 'その他'
                  const field = template.condition_rule?.field
                  
                  // user_access_restrictionテンプレートは特別にユーザー属性として分類
                  if (template.template_code === 'user_access_restriction') {
                    category = 'ユーザー属性'
                  } else if (field?.startsWith('user.')) {
                    category = 'ユーザー属性'
                  } else if (field?.startsWith('data.')) {
                    category = 'リソース属性'
                  } else if (field?.startsWith('environment.') || field?.startsWith('request.')) {
                    category = '環境属性'
                  } else if (template.name.includes('時間制限') || template.name.includes('曜日制限') || template.name.includes('IP制限')) {
                    category = '環境属性'
                  }
                  
                  return (
                    <div key={template.id} className="p-3 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${
                              category === 'ユーザー属性' ? 'bg-blue-500' :
                              category === 'リソース属性' ? 'bg-green-500' :
                              category === '環境属性' ? 'bg-orange-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div className="font-medium text-sm">{template.name}</div>
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {category}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {template.description || ''}
                          </div>
                          {template.condition_rule?.field && (
                            <div className="text-xs text-blue-600 mt-1">
                              対象: {template.condition_rule.field}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTemplateSelect(template)}
                          className="text-destructive hover:text-destructive ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ステップ3: 条件式調整
function ConditionAdjustmentStep({ data, setData }: WizardStepProps) {
  // テンプレートパラメータ管理
  const [templateParameters, setTemplateParameters] = React.useState<Record<string, Record<string, unknown>>>(() => {
    // 編集時のテンプレートパラメータを初期化
    if (data.templateParameters && Object.keys(data.templateParameters).length > 0) {
      return data.templateParameters;
    }
    return {};
  })
  const [showJsonModal, setShowJsonModal] = React.useState(false)
  
  const { data: departmentsResponse } = usePermissionDepartments()
  const departments = departmentsResponse?.data || []
  
  // user.access_restrictionフィールドを展開する関数
  const expandUserAccessRestriction = (rules: ConditionRule[]): ConditionRule[] => {
    const result: ConditionRule[] = []
    rules.forEach(rule => {
      if (rule.field === 'user.access_restriction' && (rule.operator === 'and' || rule.operator === 'or')) {
        if (Array.isArray(rule.rules)) {
          result.push(...expandUserAccessRestriction(rule.rules))
        } else if (rule.rules && typeof rule.rules === 'object') {
          const rulesObj = rule.rules as Record<string, unknown>
          if ('rules' in rulesObj && Array.isArray(rulesObj.rules)) {
            const nestedRules = rulesObj.rules as ConditionRule[]
            result.push(...expandUserAccessRestriction(nestedRules))
          }
        }
      } else if (rule.rules && Array.isArray(rule.rules)) {
        // ネストした条件も再帰的に処理
        result.push({
          ...rule,
          rules: expandUserAccessRestriction(rule.rules)
        })
      } else {
        result.push(rule)
      }
    })
    return result
  }
  
  // 展開された条件式を取得
  const getExpandedConditions = () => {
    if (!data.conditions || !data.conditions.rules || !Array.isArray(data.conditions.rules)) {
      return data.conditions
    }
    
    return {
      ...data.conditions,
      rules: expandUserAccessRestriction(data.conditions.rules)
    }
  }


  // パラメータ変更ハンドラー
  const handleParameterChange = useCallback((templateId: number, paramKey: string, value: unknown) => {
    setTemplateParameters(prev => {
      const newParams = {
        ...prev,
        [templateId]: {
          ...prev[templateId],
          [paramKey]: value
        }
      }
      
        // パラメータ検証ルール
        const template = data.selectedTemplates.find(t => t.id === templateId)
        if (template?.template_code === 'department_restriction') {
          // 特定部署制限の場合、部署が選択されていない場合は警告（インライン表示）
        }
      
      // 条件生成を手動トリガー
      setShouldGenerateConditions(true)
      
      return newParams
    })
  }, [data.selectedTemplates])

  // 条件生成トリガー
  const [shouldGenerateConditions, setShouldGenerateConditions] = React.useState(false)
  
  React.useEffect(() => {
    if (shouldGenerateConditions && data.selectedTemplates.length > 0 && Object.keys(templateParameters).length > 0) {
      const hasValidParameters = data.selectedTemplates.some(template => {
        const templateParams = templateParameters[template.id.toString()]
        return templateParams && Object.keys(templateParams).length > 0
      })
      
      if (hasValidParameters) {
        // 条件生成ロジック
        const generateConditionsFromTemplates = async (selectedTemplates: PolicyTemplate[], parameters: Record<string, Record<string, unknown>>) => {
          if (selectedTemplates.length === 0) {
            setData({ conditions: {} })
            return
          }

          // パラメータ検証：無効なパラメータをチェック
          const hasInvalidParams = selectedTemplates.some(template => {
            const templateParams = parameters[template.id.toString()] || {}
            
            // 部署制限の検証
            if (template.template_code === 'department_restriction') {
              const restrictionType = templateParams['restriction_type']
              const departmentIds = templateParams['department_ids']
              
              if (restrictionType === 'in' && (!departmentIds || !Array.isArray(departmentIds) || departmentIds.length === 0)) {
                return true // 無効なパラメータ
              }
            }
            
            // 利用者制限の検証
            if (template.template_code === 'user_access_restriction') {
              const builderRules = templateParams['builder_rules']
              if (builderRules && typeof builderRules === 'object' && 'rules' in builderRules) {
                const rules = (builderRules as { rules: unknown[] }).rules
                if (Array.isArray(rules)) {
                  // 空の条件や無効な条件をチェック
                  const hasValidRules = rules.some((rule: unknown) => {
                    if (typeof rule === 'object' && rule !== null && 'field' in rule && 'operator' in rule) {
                      const ruleObj = rule as Record<string, unknown>
                      if (ruleObj.field && ruleObj.operator) {
                        // 値が空の配列の場合は無効
                        if (ruleObj.operator === 'in' && Array.isArray(ruleObj.value) && ruleObj.value.length === 0) {
                          return false
                        }
                        return true
                      }
                    }
                    return false
                  })
                  if (!hasValidRules) {
                    return true // 無効なパラメータ
                  }
                }
              }
            }
            
            return false
          })

          if (hasInvalidParams) {
            console.log('パラメータが不完全なため、条件生成をスキップします')
            return
          }

          let response: Response | null = null

          try {
            const templateIds = selectedTemplates.map(t => t.id)
            const combinedParameters: Record<string, unknown> = {}

            // パラメータの収集
            selectedTemplates.forEach(template => {
              const templateParams = parameters[template.id.toString()] || {}
              Object.keys(templateParams).forEach(key => {
                let value = templateParams[key]
                
                // 期間制限の日付値の特別処理
                if (template.template_code === 'period_restriction' && (key === 'start_date' || key === 'end_date')) {
                  // 空の値やnullの場合は送信しない
                  if (!value || value === 'null' || value === '') {
                    return // このパラメータをスキップ
                  }
                  // 日付値を文字列として確実に処理
                  value = String(value)
                  console.log(`Date parameter processed: ${key} = ${value} (type: ${typeof value})`)
                }
                
                combinedParameters[`${template.id}_${key}`] = value
              })
            })

            // 条件式生成APIを呼び出し
            const requestBody = {
              template_ids: templateIds,
              operator: 'and',
              parameters: combinedParameters,
            }
            
            console.log('API Request:', requestBody)
            
            response = await fetch('/api/policy-templates/generate-combined-condition', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            })
            
            console.log('API Response Status:', response.status)

            if (response.ok) {
              const result = await response.json()
              setData({
                conditions: result.data.condition,
                templateParameters: parameters
              })
            } else {
              const errorText = await response.text()
              console.error('API Error Response:', errorText)
              toast.error(`API エラー: ${response.status} - ${errorText}`)
            }
          } catch (error) {
            console.error('条件式生成エラー:', error)
            toast.error('条件式の生成に失敗しました')
          }
        }
        
        generateConditionsFromTemplates(data.selectedTemplates, templateParameters)
        setShouldGenerateConditions(false)
      }
    }
  }, [shouldGenerateConditions, templateParameters, data.selectedTemplates, setData])


  const hasGeneratedConditions = data.conditions && Object.keys(data.conditions).length > 0

  // パラメータ入力
  const renderParameterInput = (template: PolicyTemplate, paramKey: string, param: Record<string, unknown>) => {
    const currentValue = templateParameters[template.id.toString()]?.[paramKey] ?? param.default

    switch (param.type) {
      case 'select':
        return (
          <select
            value={currentValue as string}
            onChange={(e) => handleParameterChange(template.id, paramKey, e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {(param.options as Array<{value: string; label: string}> || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      case 'number':
        return (
          <input
            type="number"
            value={currentValue as number}
            onChange={(e) => handleParameterChange(template.id, paramKey, Number(e.target.value))}
            min={param.min as number}
            max={param.max as number}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )
      case 'text':
        return (
          <input
            type="text"
            value={currentValue as string}
            onChange={(e) => handleParameterChange(template.id, paramKey, e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )
      case 'array':
        // ステータス選択のUI
        if (paramKey === 'allowed_statuses') {
          const statusOptions = [
            { value: '下書き', label: '下書き' },
            { value: '承認依頼中', label: '承認依頼中' },
            { value: '承認済み', label: '承認済み' },
            { value: '却下', label: '却下' },
            { value: 'キャンセル', label: 'キャンセル' }
          ]
          const selectedStatuses = Array.isArray(currentValue) ? currentValue : []
          
          return (
            <div className="space-y-2">
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2 space-y-1">
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(option.value)}
                      onChange={(e) => {
                        const newStatuses = e.target.checked
                          ? [...selectedStatuses, option.value]
                          : selectedStatuses.filter(s => s !== option.value)
                        handleParameterChange(template.id, paramKey, newStatuses)
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {selectedStatuses.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  選択済み: {selectedStatuses.length}個
                </div>
              )}
            </div>
          )
        }
        return (
          <div className="text-sm text-muted-foreground">
            配列タイプのパラメータ: {JSON.stringify(currentValue)}
          </div>
        )
      case 'date':
        return (
          <input
            type="date"
            value={currentValue as string || ''}
            onChange={(e) => {
              console.log('Date input changed:', { templateId: template.id, paramKey, value: e.target.value, type: typeof e.target.value })
              handleParameterChange(template.id, paramKey, e.target.value)
            }}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )
      case 'condition_builder':
        return (
          <div className="mt-2">
            <UserAccessConditionBuilder
              templateId={template.id}
              paramKey={paramKey}
              currentValue={currentValue}
              onParameterChange={handleParameterChange}
              availableFields={param.available_fields as Record<string, string> || {}}
              availableOperators={param.available_operators as Record<string, string> || {}}
              fieldOperators={param.field_operators as Record<string, Record<string, string>> || {}}
              maxDepth={param.max_depth as number || 5}
            />
          </div>
        )
      case 'department_selection':
        const restrictionType = templateParameters[template.id.toString()]?.['restriction_type'] as string;
        const departmentIds = templateParameters[template.id.toString()]?.['department_ids'] as number[];
        const needsDepartmentSelection = restrictionType === 'in' && (!departmentIds || !Array.isArray(departmentIds) || departmentIds.length === 0);
        
        
        return (
          <div className="mt-2">
            {restrictionType === 'in' ? (
              <div>
                <DepartmentSelectionInput 
                  templateId={template.id}
                  paramKey={paramKey}
                  currentValue={currentValue}
                  onParameterChange={handleParameterChange}
                />
                {(needsDepartmentSelection || restrictionType === 'in') && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          <strong>注意:</strong> 特定部署制限を選択した場合、部署を選択してください
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                制限の種類に応じて自動設定されます。現在の制限タイプ: {restrictionType || '未設定'}
              </p>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">条件式調整</h3>
        <p className="text-sm text-muted-foreground mb-3">
          選択したテンプレートのパラメータを調整してください。属性カテゴリ別に整理されています。
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-2">調整手順:</div>
            <div className="space-y-1 text-xs">
              <div>1. 各属性カテゴリのテンプレートパラメータを設定</div>
              <div>2. 設定内容に応じて条件式が自動生成されます</div>
              <div>3. 生成された条件式を確認してポリシーを作成</div>
            </div>
          </div>
        </div>
      </div>

      {data.selectedTemplates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>テンプレートが選択されていません</p>
          <p className="text-sm">前のステップでテンプレートを選択してください</p>
        </div>
      ) : (
        <>
          {/* 属性カテゴリ別のテンプレートパラメータ調整 */}
          <div className="space-y-6">
            {['ユーザー属性', 'リソース属性', '環境属性', 'その他'].map((category) => {
              // カテゴリ別にテンプレートを分類
              const categoryTemplates = data.selectedTemplates.filter(template => {
                const field = template.condition_rule?.field
                // user_access_restrictionテンプレートは特別にユーザー属性として分類
                if (template.template_code === 'user_access_restriction') {
                  return category === 'ユーザー属性'
                } else if (field?.startsWith('user.')) {
                  return category === 'ユーザー属性'
                } else if (field?.startsWith('data.')) {
                  return category === 'リソース属性'
                } else if (field?.startsWith('environment.') || field?.startsWith('request.')) {
                  return category === '環境属性'
                } else {
                  return category === 'その他'
                }
              })

              if (categoryTemplates.length === 0) return null

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      category === 'ユーザー属性' ? 'bg-blue-500' :
                      category === 'リソース属性' ? 'bg-green-500' :
                      category === '環境属性' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`}></div>
                    <h4 className="text-lg font-semibold">{category}</h4>
                    <span className="text-sm text-muted-foreground">
                      ({categoryTemplates.length}個のテンプレート)
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {categoryTemplates.map((template) => (
                      <div key={template.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <h5 className="font-medium">{template.name}</h5>
                          {template.condition_rule?.field && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              対象: {template.condition_rule.field}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description || ''}
                        </p>
                        
                        <div className="space-y-3">
                          {template.parameters?.configurable_values && Object.entries(template.parameters.configurable_values).map(([paramKey, param]) => {
                            // 金額制限の場合は制限タイプに応じて表示を制御
                            if (template.template_code === 'amount_limit_restriction') {
                              const restrictionType = templateParameters[template.id.toString()]?.['restriction_type'] ?? 'lte'
                              
                              // 制限タイプに応じて表示するパラメータを決定
                              if (paramKey === 'amount_limit' && (restrictionType === 'gte')) {
                                return null // 下限制限の場合は金額上限を非表示
                              }
                              if (paramKey === 'min_amount' && (restrictionType === 'lte')) {
                                return null // 上限制限の場合は金額下限を非表示
                              }
                            }
                            
                            return (
                              <div key={paramKey}>
                                <label className="text-sm font-medium">
                                  {param.label}
                                  {param.unit && <span className="text-muted-foreground ml-1">({param.unit})</span>}
                                </label>
                                {renderParameterInput(template, paramKey, param)}
                                {param.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{param.description}</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 条件式の表示（属性カテゴリ別） */}
          {hasGeneratedConditions && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">生成された条件式</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowJsonModal(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  JSON照会
                </Button>
              </div>
              
              {/* 属性カテゴリ別の条件表示 */}
              <div className="space-y-4">
                {['ユーザー属性', 'リソース属性', '環境属性', 'その他'].map((category) => {
                  const categoryTemplates = data.selectedTemplates.filter(template => {
                    const field = template.condition_rule?.field
                    // user_access_restrictionテンプレートは特別にユーザー属性として分類
                    if (template.template_code === 'user_access_restriction') {
                      return category === 'ユーザー属性'
                    } else if (field?.startsWith('user.')) {
                      return category === 'ユーザー属性'
                    } else if (field?.startsWith('data.')) {
                      return category === 'リソース属性'
                    } else if (field?.startsWith('environment.') || field?.startsWith('request.')) {
                      return category === '環境属性'
                    } else {
                      return category === 'その他'
                    }
                  })

                  if (categoryTemplates.length === 0) return null

                  return (
                    <div key={category} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-3 h-3 rounded-full ${
                          category === 'ユーザー属性' ? 'bg-blue-500' :
                          category === 'リソース属性' ? 'bg-green-500' :
                          category === '環境属性' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`}></div>
                        <h5 className="font-medium">{category}の条件</h5>
                      </div>
                      
                      <div className="space-y-2">
                        {categoryTemplates.map((template, index) => {
                          const params = templateParameters[template.id.toString()]
                          const conditionDetail = generateConditionDetail(template, params, departments)

                          return (
                            <div key={template.id} className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {index > 0 && (
                                  <span className="text-muted-foreground mr-2">かつ</span>
                                )}
                                {conditionDetail}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* スコープ設定 */}
          <div>
            <h4 className="font-medium mb-2">スコープ設定</h4>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">適用範囲</label>
                <input
                  type="text"
                  value={data.scope}
                  onChange={(e) => setData({ scope: e.target.value })}
                  placeholder="例: 全社、営業部、管理部"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* JSON表示モーダル */}
      <JsonModal
        isOpen={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        conditions={getExpandedConditions()}
        title="条件式（JSON）"
      />
    </div>
  )
}
