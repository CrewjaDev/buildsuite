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
                       description, direct_amount, calculated_amount, estimated_cost, is_active
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
                       description, direct_amount, calculated_amount, estimated_cost, is_active
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
                       description, direct_amount, calculated_amount, estimated_cost, is_active
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

    /**
     * 見積内訳作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'estimate_id' => 'required|string',
                'parent_id' => 'nullable|string',
                'breakdown_type' => 'required|in:large,medium,small',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'quantity' => 'nullable|numeric|min:0',
                'unit' => 'nullable|string|max:50',
                'unit_price' => 'nullable|numeric|min:0',
                'direct_amount' => 'nullable|numeric|min:0',
                'estimated_cost' => 'nullable|numeric|min:0'
            ]);

            // display_orderを計算（同じ親の下での最大値+1）
            $maxOrder = DB::select("
                SELECT COALESCE(MAX(display_order), 0) as max_order 
                FROM estimate_breakdowns 
                WHERE estimate_id = ? AND parent_id = ? AND deleted_at IS NULL
            ", [$validated['estimate_id'], $validated['parent_id']]);

            $displayOrder = ($maxOrder[0]->max_order ?? 0) + 1;

            $breakdownId = \Illuminate\Support\Str::uuid();
            
            DB::table('estimate_breakdowns')->insert([
                'id' => $breakdownId,
                'estimate_id' => $validated['estimate_id'],
                'parent_id' => $validated['parent_id'],
                'breakdown_type' => $validated['breakdown_type'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? '',
                'quantity' => $validated['quantity'] ?? 1,
                'unit' => $validated['unit'] ?? '式',
                'unit_price' => $validated['unit_price'] ?? 0,
                'direct_amount' => $validated['direct_amount'] ?? 0,
                'calculated_amount' => 0,
                'estimated_cost' => $validated['estimated_cost'] ?? 0,
                'display_order' => $displayOrder,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'data' => [
                    'id' => $breakdownId,
                    'estimate_id' => $validated['estimate_id']
                ],
                'message' => '見積内訳を作成しました'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'バリデーションエラー',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => '作成エラー: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積内訳更新
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'parent_id' => 'nullable|string',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'quantity' => 'nullable|numeric|min:0',
                'unit' => 'nullable|string|max:50',
                'unit_price' => 'nullable|numeric|min:0',
                'direct_amount' => 'nullable|numeric|min:0',
                'estimated_cost' => 'nullable|numeric|min:0'
            ]);

            $updated = DB::table('estimate_breakdowns')
                ->where('id', $id)
                ->where('deleted_at', null)
                ->update([
                    'parent_id' => $validated['parent_id'] ?? null,
                    'name' => $validated['name'],
                    'description' => $validated['description'] ?? '',
                    'quantity' => $validated['quantity'] ?? 1,
                    'unit' => $validated['unit'] ?? '式',
                    'unit_price' => $validated['unit_price'] ?? 0,
                    'direct_amount' => $validated['direct_amount'] ?? 0,
                    'estimated_cost' => $validated['estimated_cost'] ?? 0,
                    'updated_at' => now()
                ]);

            if ($updated === 0) {
                return response()->json(['error' => '見積内訳が見つかりません'], 404);
            }

            // estimate_idを取得
            $breakdown = DB::select("
                SELECT estimate_id 
                FROM estimate_breakdowns 
                WHERE id = ? AND deleted_at IS NULL
            ", [$id]);

            return response()->json([
                'data' => [
                    'id' => $id,
                    'estimate_id' => $breakdown[0]->estimate_id ?? null
                ],
                'message' => '見積内訳を更新しました'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'バリデーションエラー',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => '更新エラー: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積内訳削除
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $deleted = DB::table('estimate_breakdowns')
                ->where('id', $id)
                ->where('deleted_at', null)
                ->update([
                    'deleted_at' => now(),
                    'updated_at' => now()
                ]);

            if ($deleted === 0) {
                return response()->json(['error' => '見積内訳が見つかりません'], 404);
            }

            return response()->json([
                'message' => '見積内訳を削除しました'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => '削除エラー: ' . $e->getMessage()
            ], 500);
        }
    }
}
