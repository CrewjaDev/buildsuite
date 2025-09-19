<?php

namespace App\Http\Controllers;

use App\Models\EstimateItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class EstimateItemController extends Controller
{
    /**
     * 見積明細一覧取得
     */
    public function index(Request $request): JsonResponse
    {
        $estimateId = $request->query('estimate_id');
        
        if (!$estimateId) {
            return response()->json(['error' => 'estimate_id is required'], 400);
        }

        try {
            $items = DB::select("
                SELECT ei.id, ei.estimate_id, ei.breakdown_id, ei.name, ei.description, 
                       ei.quantity, ei.unit, ei.unit_price, ei.amount, ei.estimated_cost, 
                       ei.supplier_id, ei.construction_method, ei.construction_classification_id, 
                       ei.remarks, ei.order_request_content, ei.is_active, ei.display_order,
                       cc.classification_name as construction_classification_name
                FROM estimate_items ei
                LEFT JOIN construction_classifications cc ON ei.construction_classification_id = cc.id
                WHERE ei.estimate_id = ? AND ei.deleted_at IS NULL 
                ORDER BY ei.display_order
            ", [$estimateId]);

            return response()->json([
                'data' => $items,
                'message' => '見積明細一覧を取得しました'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'データ取得エラー: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積明細詳細取得
     */
    public function show(string $id): JsonResponse
    {
        try {
            $item = DB::select("
                SELECT ei.id, ei.estimate_id, ei.breakdown_id, ei.name, ei.description, 
                       ei.quantity, ei.unit, ei.unit_price, ei.amount, ei.estimated_cost, 
                       ei.supplier_id, ei.construction_method, ei.construction_classification_id, 
                       ei.remarks, ei.order_request_content, ei.is_active, ei.display_order,
                       cc.classification_name as construction_classification_name
                FROM estimate_items ei
                LEFT JOIN construction_classifications cc ON ei.construction_classification_id = cc.id
                WHERE ei.id = ? AND ei.deleted_at IS NULL
            ", [$id]);

            if (empty($item)) {
                return response()->json(['error' => '見積明細が見つかりません'], 404);
            }

            return response()->json([
                'data' => $item[0],
                'message' => '見積明細を取得しました'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'データ取得エラー: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積明細作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'estimate_id' => 'required|string',
                'breakdown_id' => 'nullable|string',
                'display_order' => 'required|integer',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'quantity' => 'required|numeric|min:0',
                'unit' => 'required|string|max:50',
                'unit_price' => 'required|numeric|min:0',
                'estimated_cost' => 'required|numeric|min:0',
                'supplier_id' => 'nullable|integer',
                'order_request_content' => 'nullable|string',
                'construction_method' => 'nullable|string|max:255',
                'construction_classification_id' => 'nullable|integer',
                'remarks' => 'nullable|string',
                'is_active' => 'boolean'
            ]);

            // 金額を自動計算
            $validated['amount'] = $validated['quantity'] * $validated['unit_price'];

            $item = EstimateItem::create($validated);

            return response()->json([
                'data' => $item,
                'message' => '見積明細を作成しました'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => '見積明細の作成に失敗しました: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積明細更新
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            // リクエストデータを取得（dataオブジェクト内のデータを直接取得）
            $requestData = $request->all();
            
            $validated = $request->validate([
                'display_order' => 'integer',
                'name' => 'string|max:255',
                'description' => 'nullable|string',
                'quantity' => 'numeric|min:0',
                'unit' => 'string|max:50',
                'unit_price' => 'numeric|min:0',
                'estimated_cost' => 'numeric|min:0',
                'supplier_id' => 'nullable|integer',
                'order_request_content' => 'nullable|string',
                'construction_method' => 'nullable|string|max:255',
                'construction_classification_id' => 'nullable|integer',
                'remarks' => 'nullable|string',
                'is_active' => 'boolean'
            ]);

            $item = EstimateItem::findOrFail($id);

            // 数量または単価が変更された場合は金額を再計算
            if (isset($validated['quantity']) || isset($validated['unit_price'])) {
                $quantity = $validated['quantity'] ?? $item->quantity;
                $unitPrice = $validated['unit_price'] ?? $item->unit_price;
                $validated['amount'] = $quantity * $unitPrice;
            }

            $item->update($validated);

            return response()->json([
                'data' => $item,
                'message' => '見積明細を更新しました'
            ]);
        } catch (\Exception $e) {
            \Log::error('見積明細更新エラー: ' . $e->getMessage(), [
                'id' => $id,
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => '見積明細の更新に失敗しました: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積明細削除
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $item = EstimateItem::findOrFail($id);
            $item->delete();

            return response()->json([
                'message' => '見積明細を削除しました'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => '見積明細の削除に失敗しました: ' . $e->getMessage()
            ], 500);
        }
    }
}
