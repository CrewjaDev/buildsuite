'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { TemplateData, TemplateDataForm } from '@/types/features/approvals/templateData'

interface TemplateDataEditorProps {
  value: TemplateData
  onChange: (value: TemplateData) => void
}

export function TemplateDataEditor({ value, onChange }: TemplateDataEditorProps) {
  const [formData, setFormData] = useState<TemplateDataForm>({
    title_format: value.title_format || '',
    description_template: value.description_template || '',
    required_fields: Object.entries(value.required_fields || {}).map(([key, label]) => ({ key, label })),
    optional_fields: Object.entries(value.optional_fields || {}).map(([key, label]) => ({ key, label })),
    default_values: Object.entries(value.default_values || {}).map(([key, value]) => ({ key, value })),
    field_configs: value.field_configs || []
  })

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    // フォームデータをテンプレートデータに変換
    const templateData: TemplateData = {
      title_format: formData.title_format,
      description_template: formData.description_template,
      required_fields: Object.fromEntries(formData.required_fields.map(f => [f.key, f.label])),
      optional_fields: Object.fromEntries(formData.optional_fields.map(f => [f.key, f.label])),
      default_values: Object.fromEntries(formData.default_values.map(f => [f.key, f.value])),
      field_configs: formData.field_configs
    }
    onChange(templateData)
  }, [formData]) // eslint-disable-line react-hooks/exhaustive-deps

  const addRequiredField = () => {
    setFormData(prev => ({
      ...prev,
      required_fields: [...prev.required_fields, { key: '', label: '' }]
    }))
  }

  const addPresetRequiredField = (key: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      required_fields: [...prev.required_fields, { key, label }]
    }))
  }

  const addPresetOptionalField = (key: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      optional_fields: [...prev.optional_fields, { key, label }]
    }))
  }

  // 実際のデータベーステーブルフィールドのプリセット
  const commonFields = [
    // 見積関連フィールド (estimates テーブル)
    { key: 'estimate_number', label: '見積番号' },
    { key: 'partner_id', label: '取引先ID' },
    { key: 'project_type_id', label: '工事種別ID' },
    { key: 'project_name', label: '工事名称' },
    { key: 'project_location', label: '工事場所' },
    { key: 'project_period_start', label: '工事期間開始日' },
    { key: 'project_period_end', label: '工事期間終了日' },
    { key: 'description', label: '工事内容詳細' },
    { key: 'status', label: '見積ステータス' },
    { key: 'issue_date', label: '発行日' },
    { key: 'expiry_date', label: '有効期限' },
    { key: 'currency', label: '通貨' },
    { key: 'subtotal', label: '小計' },
    { key: 'overhead_rate', label: '一般管理費率' },
    { key: 'overhead_amount', label: '一般管理費額' },
    { key: 'cost_expense_rate', label: '原価経費率' },
    { key: 'cost_expense_amount', label: '原価経費額' },
    { key: 'material_expense_rate', label: '材料経費率' },
    { key: 'material_expense_amount', label: '材料経費額' },
    { key: 'tax_rate', label: '消費税率' },
    { key: 'tax_amount', label: '消費税額' },
    { key: 'discount_rate', label: '割引率' },
    { key: 'discount_amount', label: '割引額' },
    { key: 'total_amount', label: '合計金額' },
    { key: 'profit_margin', label: '利益率' },
    { key: 'profit_amount', label: '利益額' },
    { key: 'payment_terms', label: '支払条件' },
    { key: 'delivery_terms', label: '納期条件' },
    { key: 'warranty_period', label: '保証期間' },
    { key: 'notes', label: '備考' },
    { key: 'created_by', label: '作成者ID' },
    { key: 'approved_by', label: '承認者ID' },
    { key: 'approved_at', label: '承認日時' },

    // 取引先関連フィールド (partners テーブル)
    { key: 'partner_code', label: '取引先コード' },
    { key: 'partner_name', label: '取引先名' },
    { key: 'partner_name_print', label: '取引先名（印刷用）' },
    { key: 'partner_name_kana', label: '取引先名フリガナ' },
    { key: 'partner_type', label: '取引先区分' },
    { key: 'representative', label: '代表者' },
    { key: 'representative_kana', label: '代表者名フリガナ' },
    { key: 'branch_name', label: '支店・営業所名' },
    { key: 'postal_code', label: '郵便番号' },
    { key: 'address', label: '住所' },
    { key: 'building_name', label: '建物名' },
    { key: 'phone', label: '電話番号' },
    { key: 'fax', label: 'FAX番号' },
    { key: 'invoice_number', label: 'インボイス登録番号' },
    { key: 'email', label: 'メールアドレス' },
    { key: 'is_subcontractor', label: '外注フラグ' },
    { key: 'closing_date', label: '締日' },
    { key: 'deposit_terms', label: '入金サイト' },
    { key: 'deposit_date', label: '入金日' },
    { key: 'deposit_method', label: '入金方法区分' },
    { key: 'cash_allocation', label: '現金配分' },
    { key: 'bill_allocation', label: '手形配分' },
    { key: 'payment_date', label: '支払日' },
    { key: 'payment_method', label: '支払方法区分' },
    { key: 'payment_cash_allocation', label: '支払現金配分' },
    { key: 'payment_bill_allocation', label: '支払手形配分' },
    { key: 'establishment_date', label: '設立年月日' },
    { key: 'capital_stock', label: '資本金' },
    { key: 'previous_sales', label: '昨期売上高' },
    { key: 'employee_count', label: '従業員数' },
    { key: 'business_description', label: '事業内容' },
    { key: 'bank_name', label: '銀行名' },
    { key: 'branch_name_bank', label: '支店名' },
    { key: 'account_type', label: '口座種別' },
    { key: 'account_number', label: '口座番号' },
    { key: 'account_holder', label: '口座名義' },
    { key: 'login_id', label: 'ログインID' },
    { key: 'journal_code', label: '仕訳コード' },

    // 承認依頼関連フィールド (approval_requests テーブル)
    { key: 'approval_flow_id', label: '承認フローID' },
    { key: 'request_type', label: '依頼タイプ' },
    { key: 'request_id', label: '依頼元ID' },
    { key: 'title', label: 'タイトル' },
    { key: 'request_data', label: '依頼データ' },
    { key: 'current_step', label: '現在のステップ' },
    { key: 'priority', label: '優先度' },
    { key: 'requested_by', label: '依頼者' },
    { key: 'approved_by', label: '承認者' },
    { key: 'approved_at', label: '承認日時' },
    { key: 'rejected_by', label: '却下者' },
    { key: 'rejected_at', label: '却下日時' },
    { key: 'returned_by', label: '差し戻し者' },
    { key: 'returned_at', label: '差し戻し日時' },
    { key: 'cancelled_by', label: 'キャンセル者' },
    { key: 'cancelled_at', label: 'キャンセル日時' },
    { key: 'expires_at', label: '期限日時' },

    // 見積明細関連フィールド (estimate_items テーブル)
    { key: 'breakdown_id', label: '小内訳ID' },
    { key: 'name', label: '品名・仕様' },
    { key: 'quantity', label: '数量' },
    { key: 'unit', label: '単位' },
    { key: 'unit_price', label: '単価' },
    { key: 'amount', label: '金額' },
    { key: 'estimated_cost', label: '予想原価' },
    { key: 'supplier_id', label: '発注先ID' },
    { key: 'construction_method', label: '工法' },
    { key: 'construction_classification_id', label: '工事分類ID' },
    { key: 'remarks', label: '備考' },
    { key: 'order_request_content', label: '発注依頼内容' },
    { key: 'display_order', label: '表示順序' }
  ]

  const removeRequiredField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      required_fields: prev.required_fields.filter((_, i) => i !== index)
    }))
  }

  const updateRequiredField = (index: number, field: 'key' | 'label', value: string) => {
    setFormData(prev => ({
      ...prev,
      required_fields: prev.required_fields.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }))
  }

  const addOptionalField = () => {
    setFormData(prev => ({
      ...prev,
      optional_fields: [...prev.optional_fields, { key: '', label: '' }]
    }))
  }

  const removeOptionalField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      optional_fields: prev.optional_fields.filter((_, i) => i !== index)
    }))
  }

  const updateOptionalField = (index: number, field: 'key' | 'label', value: string) => {
    setFormData(prev => ({
      ...prev,
      optional_fields: prev.optional_fields.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }))
  }

  const addDefaultValue = () => {
    setFormData(prev => ({
      ...prev,
      default_values: [...prev.default_values, { key: '', value: '' }]
    }))
  }

  const removeDefaultValue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      default_values: prev.default_values.filter((_, i) => i !== index)
    }))
  }

  const updateDefaultValue = (index: number, field: 'key' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      default_values: prev.default_values.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }))
  }

  const generatePreview = () => {
    const sampleData = {
      estimate_number: 'EST-2024-001',
      client_name: 'サンプル株式会社',
      total_amount: '1,500,000',
      delivery_date: '2024-02-15'
    }

    let title = formData.title_format
    Object.entries(sampleData).forEach(([key, value]) => {
      title = title.replace(`{${key}}`, value)
    })

    let description = formData.description_template
    Object.entries(sampleData).forEach(([key, value]) => {
      description = description.replace(`{${key}}`, value)
    })

    return { title, description }
  }

  return (
    <div className="space-y-6">
      {/* 基本設定 */}
      <Card>
        <CardHeader>
          <CardTitle>基本設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title_format">タイトル形式</Label>
            <Input
              id="title_format"
              value={formData.title_format}
              onChange={(e) => setFormData(prev => ({ ...prev, title_format: e.target.value }))}
              placeholder="見積承認依頼: {estimate_number}"
            />
            <p className="text-sm text-gray-500 mt-1">
              プレースホルダー: {`{estimate_number}`}, {`{client_name}`}, {`{total_amount}`} など
            </p>
          </div>
          <div>
            <Label htmlFor="description_template">説明テンプレート</Label>
            <Textarea
              id="description_template"
              value={formData.description_template}
              onChange={(e) => setFormData(prev => ({ ...prev, description_template: e.target.value }))}
              placeholder="以下の見積について承認をお願いします。"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 必須フィールド */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            必須フィールド
            <div className="flex space-x-2">
              <Button onClick={addRequiredField} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                手動追加
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* プリセットフィールド選択 */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">実際のデータベースフィールドから選択</Label>
            <div className="space-y-3">
              {/* 見積関連フィールド */}
              <div>
                <Label className="text-xs font-medium text-blue-600 mb-1 block">見積関連 (estimates テーブル)</Label>
                <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border rounded-md p-2">
                  {commonFields.filter(f => f.key.includes('estimate') || f.key.includes('project') || f.key.includes('total_amount') || f.key.includes('tax') || f.key.includes('discount') || f.key.includes('payment') || f.key.includes('delivery') || f.key.includes('warranty') || f.key.includes('notes') || f.key.includes('created_by') || f.key.includes('approved_by')).map((field) => (
                    <Button
                      key={field.key}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left h-auto p-1 text-xs"
                      onClick={() => addPresetRequiredField(field.key, field.label)}
                    >
                      <div>
                        <div className="font-medium">{field.label}</div>
                        <div className="text-gray-500">{field.key}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 取引先関連フィールド */}
              <div>
                <Label className="text-xs font-medium text-green-600 mb-1 block">取引先関連 (partners テーブル)</Label>
                <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border rounded-md p-2">
                  {commonFields.filter(f => f.key.includes('partner') || f.key.includes('representative') || f.key.includes('branch') || f.key.includes('postal') || f.key.includes('address') || f.key.includes('phone') || f.key.includes('fax') || f.key.includes('email') || f.key.includes('bank') || f.key.includes('account')).map((field) => (
                    <Button
                      key={field.key}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left h-auto p-1 text-xs"
                      onClick={() => addPresetRequiredField(field.key, field.label)}
                    >
                      <div>
                        <div className="font-medium">{field.label}</div>
                        <div className="text-gray-500">{field.key}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 承認依頼関連フィールド */}
              <div>
                <Label className="text-xs font-medium text-purple-600 mb-1 block">承認依頼関連 (approval_requests テーブル)</Label>
                <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border rounded-md p-2">
                  {commonFields.filter(f => f.key.includes('approval') || f.key.includes('request') || f.key.includes('title') || f.key.includes('current_step') || f.key.includes('priority') || f.key.includes('approved') || f.key.includes('rejected') || f.key.includes('returned') || f.key.includes('cancelled') || f.key.includes('expires')).map((field) => (
                    <Button
                      key={field.key}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left h-auto p-1 text-xs"
                      onClick={() => addPresetRequiredField(field.key, field.label)}
                    >
                      <div>
                        <div className="font-medium">{field.label}</div>
                        <div className="text-gray-500">{field.key}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 見積明細関連フィールド */}
              <div>
                <Label className="text-xs font-medium text-orange-600 mb-1 block">見積明細関連 (estimate_items テーブル)</Label>
                <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border rounded-md p-2">
                  {commonFields.filter(f => f.key.includes('breakdown') || f.key.includes('name') || f.key.includes('quantity') || f.key.includes('unit') || f.key.includes('unit_price') || f.key.includes('amount') || f.key.includes('estimated_cost') || f.key.includes('supplier') || f.key.includes('construction') || f.key.includes('order_request') || f.key.includes('display_order')).map((field) => (
                    <Button
                      key={field.key}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left h-auto p-1 text-xs"
                      onClick={() => addPresetRequiredField(field.key, field.label)}
                    >
                      <div>
                        <div className="font-medium">{field.label}</div>
                        <div className="text-gray-500">{field.key}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 手動入力フィールド */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">手動で追加したフィールド</Label>
            {formData.required_fields.map((field, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="フィールドキー"
                  value={field.key}
                  onChange={(e) => updateRequiredField(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="表示名"
                  value={field.label}
                  onChange={(e) => updateRequiredField(index, 'label', e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeRequiredField(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {formData.required_fields.length === 0 && (
              <p className="text-gray-500 text-center py-4">必須フィールドが設定されていません</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 任意フィールド */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            任意フィールド
            <div className="flex space-x-2">
              <Button onClick={addOptionalField} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                手動追加
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* プリセットフィールド選択 */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">実際のデータベースフィールドから選択</Label>
            <div className="space-y-3">
              {/* 見積関連フィールド */}
              <div>
                <Label className="text-xs font-medium text-blue-600 mb-1 block">見積関連 (estimates テーブル)</Label>
                <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border rounded-md p-2">
                  {commonFields.filter(f => f.key.includes('estimate') || f.key.includes('project') || f.key.includes('total_amount') || f.key.includes('tax') || f.key.includes('discount') || f.key.includes('payment') || f.key.includes('delivery') || f.key.includes('warranty') || f.key.includes('notes') || f.key.includes('created_by') || f.key.includes('approved_by')).map((field) => (
                    <Button
                      key={field.key}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left h-auto p-1 text-xs"
                      onClick={() => addPresetOptionalField(field.key, field.label)}
                    >
                      <div>
                        <div className="font-medium">{field.label}</div>
                        <div className="text-gray-500">{field.key}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 取引先関連フィールド */}
              <div>
                <Label className="text-xs font-medium text-green-600 mb-1 block">取引先関連 (partners テーブル)</Label>
                <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border rounded-md p-2">
                  {commonFields.filter(f => f.key.includes('partner') || f.key.includes('representative') || f.key.includes('branch') || f.key.includes('postal') || f.key.includes('address') || f.key.includes('phone') || f.key.includes('fax') || f.key.includes('email') || f.key.includes('bank') || f.key.includes('account')).map((field) => (
                    <Button
                      key={field.key}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left h-auto p-1 text-xs"
                      onClick={() => addPresetOptionalField(field.key, field.label)}
                    >
                      <div>
                        <div className="font-medium">{field.label}</div>
                        <div className="text-gray-500">{field.key}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 承認依頼関連フィールド */}
              <div>
                <Label className="text-xs font-medium text-purple-600 mb-1 block">承認依頼関連 (approval_requests テーブル)</Label>
                <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border rounded-md p-2">
                  {commonFields.filter(f => f.key.includes('approval') || f.key.includes('request') || f.key.includes('title') || f.key.includes('current_step') || f.key.includes('priority') || f.key.includes('approved') || f.key.includes('rejected') || f.key.includes('returned') || f.key.includes('cancelled') || f.key.includes('expires')).map((field) => (
                    <Button
                      key={field.key}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left h-auto p-1 text-xs"
                      onClick={() => addPresetOptionalField(field.key, field.label)}
                    >
                      <div>
                        <div className="font-medium">{field.label}</div>
                        <div className="text-gray-500">{field.key}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 見積明細関連フィールド */}
              <div>
                <Label className="text-xs font-medium text-orange-600 mb-1 block">見積明細関連 (estimate_items テーブル)</Label>
                <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto border rounded-md p-2">
                  {commonFields.filter(f => f.key.includes('breakdown') || f.key.includes('name') || f.key.includes('quantity') || f.key.includes('unit') || f.key.includes('unit_price') || f.key.includes('amount') || f.key.includes('estimated_cost') || f.key.includes('supplier') || f.key.includes('construction') || f.key.includes('order_request') || f.key.includes('display_order')).map((field) => (
                    <Button
                      key={field.key}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-left h-auto p-1 text-xs"
                      onClick={() => addPresetOptionalField(field.key, field.label)}
                    >
                      <div>
                        <div className="font-medium">{field.label}</div>
                        <div className="text-gray-500">{field.key}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 手動入力フィールド */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">手動で追加したフィールド</Label>
            {formData.optional_fields.map((field, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="フィールドキー"
                  value={field.key}
                  onChange={(e) => updateOptionalField(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="表示名"
                  value={field.label}
                  onChange={(e) => updateOptionalField(index, 'label', e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeOptionalField(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {formData.optional_fields.length === 0 && (
              <p className="text-gray-500 text-center py-4">任意フィールドが設定されていません</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* デフォルト値 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            デフォルト値
            <Button onClick={addDefaultValue} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.default_values.map((field, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="フィールドキー"
                  value={field.key}
                  onChange={(e) => updateDefaultValue(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="デフォルト値"
                  value={String(field.value)}
                  onChange={(e) => updateDefaultValue(index, 'value', e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeDefaultValue(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {formData.default_values.length === 0 && (
              <p className="text-gray-500 text-center py-4">デフォルト値が設定されていません</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* プレビュー */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            プレビュー
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  プレビュー
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>テンプレートプレビュー</DialogTitle>
                  <DialogDescription>
                    設定したテンプレートのプレビューを表示します
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>タイトル</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {generatePreview().title}
                    </div>
                  </div>
                  <div>
                    <Label>説明</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {generatePreview().description}
                    </div>
                  </div>
                  <div>
                    <Label>必須フィールド</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.required_fields.map((field, index) => (
                        <Badge key={index} variant="destructive">
                          {field.label || field.key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>任意フィールド</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.optional_fields.map((field, index) => (
                        <Badge key={index} variant="secondary">
                          {field.label || field.key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <Label className="text-sm font-medium">タイトル形式</Label>
              <p className="text-sm text-gray-600">{formData.title_format || '未設定'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">説明テンプレート</Label>
              <p className="text-sm text-gray-600">{formData.description_template || '未設定'}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <Label className="text-sm font-medium">必須フィールド</Label>
                <p className="text-sm text-gray-600">{formData.required_fields.length}個</p>
              </div>
              <div>
                <Label className="text-sm font-medium">任意フィールド</Label>
                <p className="text-sm text-gray-600">{formData.optional_fields.length}個</p>
              </div>
              <div>
                <Label className="text-sm font-medium">デフォルト値</Label>
                <p className="text-sm text-gray-600">{formData.default_values.length}個</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
