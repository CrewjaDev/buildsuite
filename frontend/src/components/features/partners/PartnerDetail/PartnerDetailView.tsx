'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Partner } from '@/types/features/partners/partner'

interface PartnerDetailViewProps {
  partner: Partner
}

export function PartnerDetailView({ partner }: PartnerDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">取引先コード</label>
              <p className="text-sm text-gray-900">{partner.partner_code}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">取引先名</label>
              <p className="text-sm text-gray-900">{partner.partner_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">取引先名（印刷用）</label>
              <p className="text-sm text-gray-900">{partner.partner_name_print || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">取引先名（カナ）</label>
              <p className="text-sm text-gray-900">{partner.partner_name_kana || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">取引先区分</label>
              <p className="text-sm text-gray-900">
                {partner.partner_type === 'customer' ? '顧客' : 
                 partner.partner_type === 'supplier' ? '仕入先' : '両方'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">状態</label>
              <Badge variant={partner.is_active ? 'default' : 'secondary'}>
                {partner.is_active ? '有効' : '無効'}
              </Badge>
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
            <div>
              <label className="text-sm font-medium text-gray-500">代表者</label>
              <p className="text-sm text-gray-900">{partner.representative || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">代表者（カナ）</label>
              <p className="text-sm text-gray-900">{partner.representative_kana || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">支店名</label>
              <p className="text-sm text-gray-900">{partner.branch_name || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">郵便番号</label>
              <p className="text-sm text-gray-900">{partner.postal_code || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">住所</label>
              <p className="text-sm text-gray-900">{partner.address || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">建物名</label>
              <p className="text-sm text-gray-900">{partner.building_name || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">電話番号</label>
              <p className="text-sm text-gray-900">{partner.phone || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">FAX</label>
              <p className="text-sm text-gray-900">{partner.fax || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">メールアドレス</label>
              <p className="text-sm text-gray-900">{partner.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">請求書番号</label>
              <p className="text-sm text-gray-900">{partner.invoice_number || '-'}</p>
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
            <div>
              <label className="text-sm font-medium text-gray-500">外注フラグ</label>
              <Badge variant={partner.is_subcontractor ? 'default' : 'secondary'}>
                {partner.is_subcontractor ? '外注先' : '外注先以外'}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">締切日</label>
              <p className="text-sm text-gray-900">{partner.closing_date || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">入金条件</label>
              <p className="text-sm text-gray-900">{partner.deposit_terms || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">入金日</label>
              <p className="text-sm text-gray-900">{partner.deposit_date || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">入金方法</label>
              <p className="text-sm text-gray-900">{partner.deposit_method || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">現金割合（%）</label>
              <p className="text-sm text-gray-900">{partner.cash_allocation || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">手形割合（%）</label>
              <p className="text-sm text-gray-900">{partner.bill_allocation || '-'}</p>
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
            <div>
              <label className="text-sm font-medium text-gray-500">設立日</label>
              <p className="text-sm text-gray-900">{partner.establishment_date || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">資本金</label>
              <p className="text-sm text-gray-900">{partner.capital_stock || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">前年売上</label>
              <p className="text-sm text-gray-900">{partner.previous_sales || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">従業員数</label>
              <p className="text-sm text-gray-900">{partner.employee_count || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">事業内容</label>
              <p className="text-sm text-gray-900">{partner.business_description || '-'}</p>
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
            <div>
              <label className="text-sm font-medium text-gray-500">銀行名</label>
              <p className="text-sm text-gray-900">{partner.bank_name || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">支店名</label>
              <p className="text-sm text-gray-900">{partner.branch_name_bank || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">口座種別</label>
              <p className="text-sm text-gray-900">
                {partner.account_type === 'savings' ? '普通預金' : 
                 partner.account_type === 'current' ? '当座預金' : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">口座番号</label>
              <p className="text-sm text-gray-900">{partner.account_number || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">口座名義</label>
              <p className="text-sm text-gray-900">{partner.account_holder || '-'}</p>
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
            <div>
              <label className="text-sm font-medium text-gray-500">ログインID</label>
              <p className="text-sm text-gray-900">{partner.login_id || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">仕訳コード</label>
              <p className="text-sm text-gray-900">{partner.journal_code || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
