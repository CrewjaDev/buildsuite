'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export interface ConditionRule {
  id: string
  field: string
  operator: string
  value: string | number | boolean
  type: 'string' | 'number' | 'boolean'
}

export interface ConditionGroup {
  id: string
  operator: 'and' | 'or'
  rules: ConditionRule[]
  groups: ConditionGroup[]
}

export interface ConditionBuilderProps {
  value: Record<string, unknown>
  onChange: (condition: Record<string, unknown>) => void
  availableFields?: Array<{
    key: string
    label: string
    type: 'string' | 'number' | 'boolean'
    description?: string
  }>
  className?: string
}

const OPERATORS = {
  string: [
    { value: 'eq', label: '等しい' },
    { value: 'ne', label: '等しくない' },
    { value: 'contains', label: '含む' },
    { value: 'not_contains', label: '含まない' },
    { value: 'starts_with', label: 'で始まる' },
    { value: 'ends_with', label: 'で終わる' },
    { value: 'in', label: 'いずれかに等しい' },
    { value: 'not_in', label: 'いずれにも等しくない' },
  ],
  number: [
    { value: 'eq', label: '等しい' },
    { value: 'ne', label: '等しくない' },
    { value: 'gt', label: 'より大きい' },
    { value: 'gte', label: '以上' },
    { value: 'lt', label: 'より小さい' },
    { value: 'lte', label: '以下' },
    { value: 'in', label: 'いずれかに等しい' },
    { value: 'not_in', label: 'いずれにも等しくない' },
  ],
  boolean: [
    { value: 'eq', label: '等しい' },
    { value: 'ne', label: '等しくない' },
  ],
}

const DEFAULT_FIELDS = [
  { key: 'user_id', label: 'ユーザーID', type: 'number' as const, description: 'ユーザーの一意識別子' },
  { key: 'department_id', label: '部署ID', type: 'number' as const, description: '部署の一意識別子' },
  { key: 'role', label: 'ロール', type: 'string' as const, description: 'ユーザーのロール' },
  { key: 'status', label: 'ステータス', type: 'string' as const, description: 'データのステータス' },
  { key: 'amount', label: '金額', type: 'number' as const, description: '金額の値' },
  { key: 'is_active', label: 'アクティブ', type: 'boolean' as const, description: 'アクティブ状態' },
  { key: 'created_at', label: '作成日時', type: 'string' as const, description: '作成日時' },
  { key: 'updated_at', label: '更新日時', type: 'string' as const, description: '更新日時' },
]

export default function ConditionBuilder({
  value,
  onChange,
  availableFields = DEFAULT_FIELDS,
  className = ''
}: ConditionBuilderProps) {
  const [showJson, setShowJson] = useState(false)
  const [jsonInput, setJsonInput] = useState('')

  // 条件式をパースして内部形式に変換
  const parseCondition = useCallback((condition: Record<string, unknown>): ConditionGroup => {
    if (!condition || Object.keys(condition).length === 0) {
      return {
        id: 'root',
        operator: 'and',
        rules: [],
        groups: []
      }
    }

    // 既存の条件式をパース
    if (condition.operator && condition.rules) {
      return {
        id: 'root',
        operator: condition.operator as 'and' | 'or',
        rules: (condition.rules as Array<{field?: string; operator?: string; value?: unknown}>).map((rule, index) => ({
          id: `rule-${index}`,
          field: rule.field || '',
          operator: rule.operator || 'eq',
          value: (rule.value as string | number | boolean) || '',
          type: availableFields.find(f => f.key === rule.field)?.type || 'string'
        })),
        groups: []
      }
    }

    // 単一ルールの場合
    return {
      id: 'root',
      operator: 'and',
      rules: [{
        id: 'rule-0',
        field: condition.field as string || '',
        operator: condition.operator as string || 'eq',
        value: (condition.value as string | number | boolean) || '',
        type: availableFields.find(f => f.key === condition.field)?.type || 'string'
      }],
      groups: []
    }
  }, [availableFields])

  const [conditionGroup, setConditionGroup] = useState<ConditionGroup>(() => parseCondition(value))

  // 内部形式を条件式に変換
  const convertToCondition = useCallback((group: ConditionGroup): Record<string, unknown> => {
    if (group.rules.length === 0 && group.groups.length === 0) {
      return { operator: 'and', rules: [] }
    }

    if (group.rules.length === 1 && group.groups.length === 0) {
      const rule = group.rules[0]
      return {
        field: rule.field,
        operator: rule.operator,
        value: rule.type === 'number' ? Number(rule.value) : 
               rule.type === 'boolean' ? rule.value === 'true' : rule.value
      }
    }

    const allRules = [...group.rules, ...group.groups.map(convertToCondition)]
    return {
      operator: group.operator,
      rules: allRules
    }
  }, [])

  // 条件式の更新
  const updateCondition = useCallback((newGroup: ConditionGroup) => {
    setConditionGroup(newGroup)
    const condition = convertToCondition(newGroup)
    onChange(condition)
  }, [onChange, convertToCondition])

  // ルールの追加
  const addRule = useCallback(() => {
    const newRule: ConditionRule = {
      id: `rule-${Date.now()}`,
      field: '',
      operator: 'eq',
      value: '',
      type: 'string'
    }
    
    const newGroup = {
      ...conditionGroup,
      rules: [...conditionGroup.rules, newRule]
    }
    updateCondition(newGroup)
  }, [conditionGroup, updateCondition])

  // ルールの削除
  const removeRule = useCallback((ruleId: string) => {
    const newGroup = {
      ...conditionGroup,
      rules: conditionGroup.rules.filter(rule => rule.id !== ruleId)
    }
    updateCondition(newGroup)
  }, [conditionGroup, updateCondition])

  // ルールの更新
  const updateRule = useCallback((ruleId: string, updates: Partial<ConditionRule>) => {
    const newGroup = {
      ...conditionGroup,
      rules: conditionGroup.rules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }
    updateCondition(newGroup)
  }, [conditionGroup, updateCondition])

  // オペレーターの変更
  const updateOperator = useCallback((operator: 'and' | 'or') => {
    const newGroup = {
      ...conditionGroup,
      operator
    }
    updateCondition(newGroup)
  }, [conditionGroup, updateCondition])

  // フィールドタイプの取得
  const getFieldType = useCallback((fieldKey: string) => {
    return availableFields.find(f => f.key === fieldKey)?.type || 'string'
  }, [availableFields])

  // JSON表示の切り替え
  const toggleJsonView = useCallback(() => {
    if (!showJson) {
      setJsonInput(JSON.stringify(convertToCondition(conditionGroup), null, 2))
    }
    setShowJson(!showJson)
  }, [showJson, conditionGroup, convertToCondition])

  // JSONから条件式を読み込み
  const loadFromJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput)
      const newGroup = parseCondition(parsed)
      setConditionGroup(newGroup)
      onChange(parsed)
      setShowJson(false)
      toast.success('条件式を読み込みました')
    } catch {
      toast.error('JSON形式が正しくありません')
    }
  }, [jsonInput, parseCondition, onChange])

  // 条件式のコピー
  const copyCondition = useCallback(() => {
    const condition = convertToCondition(conditionGroup)
    navigator.clipboard.writeText(JSON.stringify(condition, null, 2))
    toast.success('条件式をクリップボードにコピーしました')
  }, [conditionGroup, convertToCondition])

  if (showJson) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">条件式 (JSON形式)</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyCondition}>
                <Copy className="h-4 w-4 mr-2" />
                コピー
              </Button>
              <Button variant="outline" size="sm" onClick={toggleJsonView}>
                <EyeOff className="h-4 w-4 mr-2" />
                ビルダー表示
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="json-input">条件式 (JSON形式)</Label>
              <Textarea
                id="json-input"
                rows={12}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"operator": "and", "rules": [{"field": "user_id", "operator": "eq", "value": 1}]}'
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={loadFromJson}>条件式を読み込み</Button>
              <Button variant="outline" onClick={() => setShowJson(false)}>
                キャンセル
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">条件式ビルダー</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyCondition}>
              <Copy className="h-4 w-4 mr-2" />
              コピー
            </Button>
            <Button variant="outline" size="sm" onClick={toggleJsonView}>
              <Eye className="h-4 w-4 mr-2" />
              条件式ビュー
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* オペレーター選択 */}
          {conditionGroup.rules.length > 1 && (
            <div className="flex items-center gap-4">
              <Label>条件の組み合わせ:</Label>
              <Select
                value={conditionGroup.operator}
                onValueChange={updateOperator}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">AND (すべて)</SelectItem>
                  <SelectItem value="or">OR (いずれか)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ルール一覧 */}
          <div className="space-y-3">
            {conditionGroup.rules.map((rule, index) => (
              <Card key={rule.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    {conditionGroup.rules.length > 1 && (
                      <span className="text-sm text-muted-foreground">
                        {conditionGroup.operator === 'and' ? 'AND' : 'OR'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* フィールド選択 */}
                    <div>
                      <Label htmlFor={`field-${rule.id}`}>フィールド</Label>
                      <Select
                        value={rule.field}
                        onValueChange={(value) => {
                          const fieldType = getFieldType(value)
                          updateRule(rule.id, { 
                            field: value, 
                            type: fieldType,
                            operator: 'eq',
                            value: fieldType === 'boolean' ? 'true' : ''
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="フィールドを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map((field) => (
                            <SelectItem key={field.key} value={field.key}>
                              <div>
                                <div className="font-medium">{field.label}</div>
                                {field.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {field.description}
                                  </div>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* オペレーター選択 */}
                    <div>
                      <Label htmlFor={`operator-${rule.id}`}>条件</Label>
                      <Select
                        value={rule.operator}
                        onValueChange={(value) => updateRule(rule.id, { operator: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATORS[rule.type].map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 値入力 */}
                    <div>
                      <Label htmlFor={`value-${rule.id}`}>値</Label>
                      {rule.type === 'boolean' ? (
                        <Select
                          value={rule.value.toString()}
                          onValueChange={(value) => updateRule(rule.id, { value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">true</SelectItem>
                            <SelectItem value="false">false</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`value-${rule.id}`}
                          type={rule.type === 'number' ? 'number' : 'text'}
                          value={rule.type === 'number' && typeof rule.value === 'string' && !rule.value.match(/^\d+$/) 
                            ? '' 
                            : rule.value.toString()}
                          onChange={(e) => {
                            const newValue = rule.type === 'number' ? Number(e.target.value) : e.target.value
                            updateRule(rule.id, { value: newValue })
                          }}
                          placeholder={rule.type === 'number' ? '数値を入力' : '値を入力'}
                        />
                      )}
                    </div>

                    {/* 削除ボタン */}
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRule(rule.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* ルール追加ボタン */}
          <Button variant="outline" onClick={addRule} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            条件を追加
          </Button>

          {/* プレビュー */}
          {conditionGroup.rules.length > 0 && showJson && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">条件式プレビュー:</Label>
              <pre className="mt-2 text-xs font-mono text-muted-foreground overflow-x-auto">
                {JSON.stringify(convertToCondition(conditionGroup), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
