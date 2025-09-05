import { EstimateCreateForm } from '@/components/features/estimates/EstimateCreate/EstimateCreateForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreateEstimatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">新規見積作成</h1>
        <p className="text-gray-600">新しい見積書を作成します</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>見積情報登録</CardTitle>
          <CardDescription>
            見積の基本情報を登録します。見積明細は後から編集画面で追加してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EstimateCreateForm 
            onSuccess={(estimateId) => {
              // 成功時の処理（詳細画面に遷移）
              window.location.href = `/estimates/${estimateId}`
            }}
            onCancel={() => {
              // キャンセル時の処理
              window.history.back()
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
