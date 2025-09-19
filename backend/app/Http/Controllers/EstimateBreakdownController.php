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
            // 見積内訳を取得（一式扱い対応のため詳細項目も含める）
            $breakdowns = DB::select("
                SELECT 
                    eb.id, eb.estimate_id, eb.parent_id, eb.breakdown_type, eb.name, eb.display_order, 
                    eb.description, eb.quantity, eb.unit, eb.unit_price, eb.direct_amount, eb.calculated_amount, 
                    eb.estimated_cost, eb.supplier_id, eb.construction_method, eb.construction_classification_id,
                    eb.remarks, eb.order_request_content, eb.is_active,
                    cc.classification_name as construction_classification_name,
                    p.partner_name as supplier_name
                FROM estimate_breakdowns eb
                LEFT JOIN construction_classifications cc ON eb.construction_classification_id = cc.id
                LEFT JOIN partners p ON eb.supplier_id = p.id
                WHERE eb.estimate_id = ? AND eb.deleted_at IS NULL 
                ORDER BY eb.display_order
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
            $parentId = $validated['parent_id'] ?? null;
            
            if ($parentId === null) {
                // 親がnullの場合
                $maxOrder = DB::select("
                    SELECT COALESCE(MAX(display_order), 0) as max_order 
                    FROM estimate_breakdowns 
                    WHERE estimate_id = ? AND parent_id IS NULL AND deleted_at IS NULL
                ", [$validated['estimate_id']]);
            } else {
                // 親が指定されている場合
                $maxOrder = DB::select("
                    SELECT COALESCE(MAX(display_order), 0) as max_order 
                    FROM estimate_breakdowns 
                    WHERE estimate_id = ? AND parent_id = ? AND deleted_at IS NULL
                ", [$validated['estimate_id'], $parentId]);
            }

            $displayOrder = ($maxOrder[0]->max_order ?? 0) + 1;

            $breakdownId = \Illuminate\Support\Str::uuid();
            
            DB::table('estimate_breakdowns')->insert([
                'id' => $breakdownId,
                'estimate_id' => $validated['estimate_id'],
                'parent_id' => $parentId,
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
            \Log::error('見積内訳作成エラー: ' . $e->getMessage(), [
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
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
    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            // リクエストパラメータを取得
            $deleteItems = $request->input('deleteItems', false);
            $moveItemsTo = $request->input('moveItemsTo');

            // 削除前に内訳が存在するかチェック
            $breakdown = DB::table('estimate_breakdowns')
                ->where('id', $id)
                ->where('deleted_at', null)
                ->first();

            if (!$breakdown) {
                return response()->json(['error' => '見積内訳が見つかりません'], 404);
            }

            // この内訳に紐づく見積明細を取得
            $linkedItems = DB::table('estimate_items')
                ->where('breakdown_id', $id)
                ->where('deleted_at', null)
                ->get();

            // 見積内訳を削除
            $deleted = DB::table('estimate_breakdowns')
                ->where('id', $id)
                ->where('deleted_at', null)
                ->update([
                    'deleted_at' => now(),
                    'updated_at' => now()
                ]);

            if ($deleted === 0) {
                return response()->json(['error' => '見積内訳の削除に失敗しました'], 500);
            }

            // 明細の処理
            if ($linkedItems->count() > 0) {
                if ($deleteItems) {
                    // 明細も一緒に削除
                    DB::table('estimate_items')
                        ->where('breakdown_id', $id)
                        ->where('deleted_at', null)
                        ->update([
                            'deleted_at' => now(),
                            'updated_at' => now()
                        ]);
                    
                    $message = '見積内訳と紐づいていた明細を削除しました。';
                } else {
                    // 明細を移動
                    $targetBreakdownId = $moveItemsTo === '' ? null : $moveItemsTo;
                    
                    DB::table('estimate_items')
                        ->where('breakdown_id', $id)
                        ->where('deleted_at', null)
                        ->update([
                            'breakdown_id' => $targetBreakdownId,
                            'updated_at' => now()
                        ]);
                    
                    if ($targetBreakdownId === null) {
                        $message = '見積内訳を削除しました。紐づいていた明細は独立した明細として残されました。';
                    } else {
                        $message = '見積内訳を削除しました。紐づいていた明細は他の内訳に移動されました。';
                    }
                }
            } else {
                $message = '見積内訳を削除しました。';
            }

            return response()->json([
                'message' => $message
            ]);
        } catch (\Exception $e) {
            \Log::error('見積内訳削除エラー: ' . $e->getMessage(), [
                'breakdown_id' => $id,
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => '削除エラー: ' . $e->getMessage()
            ], 500);
        }
    }
}
