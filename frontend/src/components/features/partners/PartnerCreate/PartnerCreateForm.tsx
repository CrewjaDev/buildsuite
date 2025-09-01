'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PopoverSearchFilter } from '@/components/common/data-display/DataTable'
import { CreatePartnerRequest } from '@/types/features/partners/partner'
import { useCreatePartner } from '@/hooks/features/partners/usePartners'

interface PartnerCreateFormProps {
  onSuccess: (partnerId: number) => void
  onCancel: () => void
}

export function PartnerCreateForm({ onSuccess, onCancel }: PartnerCreateFormProps) {
  const createPartner = useCreatePartner()
  const [formData, setFormData] = useState<CreatePartnerRequest>({
    partner_code: '',
    partner_name: '',
    partner_name_print: '',
    partner_name_kana: '',
    partner_type: 'customer',
    representative: '',
    representative_kana: '',
    branch_name: '',
    postal_code: '',
    address: '',
    building_name: '',
    phone: '',
    fax: '',
    invoice_number: '',
    email: '',
    is_subcontractor: false,
    closing_date: undefined,
    deposit_terms: '',
    deposit_date: undefined,
    deposit_method: '',
    cash_allocation: undefined,
    bill_allocation: undefined,
    payment_date: undefined,
    payment_method: '',
    payment_cash_allocation: undefined,
    payment_bill_allocation: undefined,
    establishment_date: '',
    capital_stock: undefined,
    previous_sales: undefined,
    employee_count: undefined,
    business_description: '',
    bank_name: '',
    branch_name_bank: '',
    account_type: undefined,
    account_number: '',
    account_holder: '',
    login_id: '',
    journal_code: '',
    is_active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const newPartner = await createPartner.mutateAsync(formData)
      onSuccess(newPartner.id)
    } catch (error) {
      console.error('取引先の作成に失敗しました:', error)
      // エラーハンドリング（必要に応じてトースト通知を追加）
    }
  }

  const handleInputChange = (field: keyof CreatePartnerRequest, value: string | number | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partner_code">取引先コード *</Label>
              <Input
                id="partner_code"
                value={formData.partner_code}
                onChange={(e) => handleInputChange('partner_code', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_name">取引先名 *</Label>
              <Input
                id="partner_name"
                value={formData.partner_name}
                onChange={(e) => handleInputChange('partner_name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_name_print">取引先名（印刷用）</Label>
              <Input
                id="partner_name_print"
                value={formData.partner_name_print}
                onChange={(e) => handleInputChange('partner_name_print', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_name_kana">取引先名（カナ）</Label>
              <Input
                id="partner_name_kana"
                value={formData.partner_name_kana}
                onChange={(e) => handleInputChange('partner_name_kana', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_type">取引先区分 *</Label>
              <PopoverSearchFilter
                options={[
                  { value: 'customer', label: '顧客' },
                  { value: 'supplier', label: '仕入先' },
                  { value: 'both', label: '両方' }
                ]}
                value={formData.partner_type}
                onValueChange={(value: string) => handleInputChange('partner_type', value)}
                placeholder="取引先区分を選択"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_active">状態</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_active">{formData.is_active ? '有効' : '無効'}</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 連絡先情報 */}
      <Card>
        <CardHeader>
          <CardTitle>連絡先情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="representative">代表者</Label>
              <Input
                id="representative"
                value={formData.representative}
                onChange={(e) => handleInputChange('representative', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="representative_kana">代表者（カナ）</Label>
              <Input
                id="representative_kana"
                value={formData.representative_kana}
                onChange={(e) => handleInputChange('representative_kana', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch_name">支店名</Label>
              <Input
                id="branch_name"
                value={formData.branch_name}
                onChange={(e) => handleInputChange('branch_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">郵便番号</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">住所</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building_name">建物名</Label>
              <Input
                id="building_name"
                value={formData.building_name}
                onChange={(e) => handleInputChange('building_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fax">FAX</Label>
              <Input
                id="fax"
                value={formData.fax}
                onChange={(e) => handleInputChange('fax', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_number">請求書番号</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => handleInputChange('invoice_number', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 取引情報 */}
      <Card>
        <CardHeader>
          <CardTitle>取引情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="is_subcontractor">外注フラグ</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="is_subcontractor"
                  type="checkbox"
                  checked={formData.is_subcontractor}
                  onChange={(e) => handleInputChange('is_subcontractor', e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_subcontractor">{formData.is_subcontractor ? '外注先' : '外注先以外'}</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing_date">締切日</Label>
              <Input
                id="closing_date"
                type="number"
                min="1"
                max="99"
                value={formData.closing_date || ''}
                onChange={(e) => handleInputChange('closing_date', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="1-99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit_terms">入金条件</Label>
              <Input
                id="deposit_terms"
                value={formData.deposit_terms}
                onChange={(e) => handleInputChange('deposit_terms', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit_date">入金日</Label>
              <Input
                id="deposit_date"
                type="number"
                min="1"
                max="99"
                value={formData.deposit_date || ''}
                onChange={(e) => handleInputChange('deposit_date', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="1-99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit_method">入金方法</Label>
              <Input
                id="deposit_method"
                value={formData.deposit_method}
                onChange={(e) => handleInputChange('deposit_method', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cash_allocation">現金割合（%）</Label>
              <Input
                id="cash_allocation"
                type="number"
                min="0"
                max="100"
                value={formData.cash_allocation || ''}
                onChange={(e) => handleInputChange('cash_allocation', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bill_allocation">手形割合（%）</Label>
              <Input
                id="bill_allocation"
                type="number"
                min="0"
                max="100"
                value={formData.bill_allocation || ''}
                onChange={(e) => handleInputChange('bill_allocation', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 企業情報 */}
      <Card>
        <CardHeader>
          <CardTitle>企業情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="establishment_date">設立日</Label>
              <Input
                id="establishment_date"
                type="date"
                value={formData.establishment_date}
                onChange={(e) => handleInputChange('establishment_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capital_stock">資本金</Label>
              <Input
                id="capital_stock"
                type="number"
                min="0"
                value={formData.capital_stock || ''}
                onChange={(e) => handleInputChange('capital_stock', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="previous_sales">前年売上</Label>
              <Input
                id="previous_sales"
                type="number"
                min="0"
                value={formData.previous_sales || ''}
                onChange={(e) => handleInputChange('previous_sales', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_count">従業員数</Label>
              <Input
                id="employee_count"
                type="number"
                min="0"
                value={formData.employee_count || ''}
                onChange={(e) => handleInputChange('employee_count', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="business_description">事業内容</Label>
              <Input
                id="business_description"
                value={formData.business_description}
                onChange={(e) => handleInputChange('business_description', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 銀行情報 */}
      <Card>
        <CardHeader>
          <CardTitle>銀行情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">銀行名</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => handleInputChange('bank_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch_name_bank">支店名</Label>
              <Input
                id="branch_name_bank"
                value={formData.branch_name_bank}
                onChange={(e) => handleInputChange('branch_name_bank', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_type">口座種別</Label>
              <PopoverSearchFilter
                options={[
                  { value: 'savings', label: '普通預金' },
                  { value: 'current', label: '当座預金' }
                ]}
                value={formData.account_type || ''}
                onValueChange={(value: string) => handleInputChange('account_type', value || undefined)}
                placeholder="口座種別を選択"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">口座番号</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => handleInputChange('account_number', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_holder">口座名義</Label>
              <Input
                id="account_holder"
                value={formData.account_holder}
                onChange={(e) => handleInputChange('account_holder', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* システム情報 */}
      <Card>
        <CardHeader>
          <CardTitle>システム情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="login_id">ログインID</Label>
              <Input
                id="login_id"
                value={formData.login_id}
                onChange={(e) => handleInputChange('login_id', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="journal_code">仕訳コード</Label>
              <Input
                id="journal_code"
                value={formData.journal_code}
                onChange={(e) => handleInputChange('journal_code', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作ボタン */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" disabled={createPartner.isPending}>
          {createPartner.isPending ? '作成中...' : '作成'}
        </Button>
      </div>
    </form>
  )
}
