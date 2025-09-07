<?php

namespace App\Http\Controllers;

use App\Models\EstimateBreakdown;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class EstimateBreakdownController extends Controller
{
    /**
     * 見積内訳一覧取得
     */
    public function index(Request $request): JsonResponse
    {
        $estimateId = $request->query('estimate_id');
        
        if (!$estimateId) {
            return response()->json(['error' => 'estimate_id is required'], 400);
        }

        try {
            $breakdowns = DB::select("
                SELECT id, estimate_id, parent_id, breakdown_type, name, display_order, 
                       description, direct_amount, calculated_amount, is_active
                FROM estimate_breakdowns 
                WHERE estimate_id = ? AND deleted_at IS NULL 
                ORDER BY display_order
            ", [$estimateId]);

            return response()->json([
                'data' => $breakdowns,
                'message' => '見積内訳一覧を取得しました'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'データ取得エラー: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積内訳の階層構造を取得
     */
    public function getTree(Request $request): JsonResponse
    {
        $estimateId = $request->query('estimate_id');
        
        if (!$estimateId) {
            return response()->json(['error' => 'estimate_id is required'], 400);
        }

        try {
            // 見積内訳を取得
            $breakdowns = DB::select("
                SELECT id, estimate_id, parent_id, breakdown_type, name, display_order, 
                       description, direct_amount, calculated_amount, is_active
                FROM estimate_breakdowns 
                WHERE estimate_id = ? AND deleted_at IS NULL 
                ORDER BY display_order
            ", [$estimateId]);

            // 見積明細を取得
            $items = DB::select("
                SELECT id, estimate_id, breakdown_id, name, description, quantity, unit,
                       unit_price, amount, estimated_cost, supplier_id, construction_method,
                       construction_classification_id, remarks, order_request_content,
                       is_active, display_order
                FROM estimate_items 
                WHERE estimate_id = ? AND deleted_at IS NULL 
                ORDER BY display_order
            ", [$estimateId]);

            // 階層構造を構築
            $tree = $this->buildBreakdownTree($breakdowns, $items);

            return response()->json([
                'data' => $tree,
                'message' => '見積内訳の階層構造を取得しました'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'データ取得エラー: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積内訳の階層構造を構築
     */
    private function buildBreakdownTree(array $breakdowns, array $items): array
    {
        // 内訳をIDでインデックス化
        $breakdownMap = [];
        foreach ($breakdowns as $breakdown) {
            $breakdown->children = [];
            $breakdown->items = [];
            $breakdownMap[$breakdown->id] = $breakdown;
        }

        // 明細を内訳に紐づけ
        foreach ($items as $item) {
            if (isset($breakdownMap[$item->breakdown_id])) {
                $breakdownMap[$item->breakdown_id]->items[] = $item;
            }
        }

        // 階層構造を構築
        $tree = [];
        foreach ($breakdowns as $breakdown) {
            if ($breakdown->parent_id === null) {
                // ルートレベルの内訳
                $tree[] = $breakdown;
            } else {
                // 子内訳として追加
                if (isset($breakdownMap[$breakdown->parent_id])) {
                    $breakdownMap[$breakdown->parent_id]->children[] = $breakdown;
                }
            }
        }

        return $tree;
    }

    /**
     * 見積内訳詳細取得
     */
    public function show(string $id): JsonResponse
    {
        try {
            $breakdown = DB::select("
                SELECT id, estimate_id, parent_id, breakdown_type, name, display_order, 
                       description, direct_amount, calculated_amount, is_active
                FROM estimate_breakdowns 
                WHERE id = ? AND deleted_at IS NULL
            ", [$id]);

            if (empty($breakdown)) {
                return response()->json(['error' => '見積内訳が見つかりません'], 404);
            }

            return response()->json([
                'data' => $breakdown[0],
                'message' => '見積内訳を取得しました'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'データ取得エラー: ' . $e->getMessage()
            ], 500);
        }
    }
}
