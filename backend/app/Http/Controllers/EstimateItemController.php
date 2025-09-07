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
}
