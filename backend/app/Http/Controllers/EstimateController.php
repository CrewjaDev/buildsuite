<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Estimate;
use App\Models\EstimateItem;
use App\Models\Partner;
use App\Models\ProjectType;
use App\Models\ConstructionClassification;

class EstimateController extends Controller
{
    /**
     * 見積一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Estimate::with(['partner', 'projectType', 'constructionClassification'])
                ->orderBy('created_at', 'desc');

            // 検索条件
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('estimate_number', 'like', "%{$search}%")
                      ->orWhere('project_name', 'like', "%{$search}%")
                      ->orWhereHas('partner', function ($partnerQuery) use ($search) {
                          $partnerQuery->where('name', 'like', "%{$search}%");
                      });
                });
            }

            // ステータスフィルター
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // プロジェクトタイプフィルター
            if ($request->filled('project_type_id')) {
                $query->where('project_type_id', $request->project_type_id);
            }

            // 工事分類フィルター
            if ($request->filled('construction_classification_id')) {
                $query->where('construction_classification_id', $request->construction_classification_id);
            }

            // 日付範囲フィルター
            if ($request->filled('date_from')) {
                $query->where('created_at', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
            }

            // ページネーション
            $perPage = $request->get('per_page', 20);
            $estimates = $query->paginate($perPage);

            return response()->json([
                'data' => $estimates->items(),
                'meta' => [
                    'current_page' => $estimates->currentPage(),
                    'last_page' => $estimates->lastPage(),
                    'per_page' => $estimates->perPage(),
                    'total' => $estimates->total(),
                    'from' => $estimates->firstItem(),
                    'to' => $estimates->lastItem(),
                ],
                'message' => '見積一覧を取得しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => '見積一覧の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積詳細を取得
     */
    public function show(string $id): JsonResponse
    {
        try {
            $estimate = Estimate::with([
                'partner', 
                'projectType', 
                'constructionClassification',
                'items' => function ($query) {
                    $query->orderBy('sort_order', 'asc');
                }
            ])->findOrFail($id);

            return response()->json([
                'data' => $estimate,
                'message' => '見積詳細を取得しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => '見積詳細の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積を作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'estimate_number' => 'required|string|max:50|unique:estimates',
                'project_name' => 'required|string|max:255',
                'partner_id' => 'required|exists:partners,id',
                'project_type_id' => 'required|exists:project_types,id',
                'construction_classification_id' => 'required|exists:construction_classifications,id',
                'total_amount' => 'required|numeric|min:0',
                'status' => 'required|in:draft,sent,approved,rejected',
                'valid_until' => 'required|date|after:today',
                'remarks' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $estimate = Estimate::create($request->all());

            // 見積明細があれば作成
            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $index => $item) {
                    $estimate->items()->create([
                        'name' => $item['name'],
                        'description' => $item['description'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit' => $item['unit'],
                        'unit_price' => $item['unit_price'],
                        'amount' => $item['quantity'] * $item['unit_price'],
                        'sort_order' => $index + 1,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'data' => $estimate->load(['partner', 'projectType', 'constructionClassification', 'items']),
                'message' => '見積を作成しました'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => '見積の作成に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積を更新
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $estimate = Estimate::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'estimate_number' => 'sometimes|required|string|max:50|unique:estimates,estimate_number,' . $id,
                'project_name' => 'sometimes|required|string|max:255',
                'partner_id' => 'sometimes|required|exists:partners,id',
                'project_type_id' => 'sometimes|required|exists:project_types,id',
                'construction_classification_id' => 'sometimes|required|exists:construction_classifications,id',
                'total_amount' => 'sometimes|required|numeric|min:0',
                'status' => 'sometimes|required|in:draft,sent,approved,rejected',
                'valid_until' => 'sometimes|required|date',
                'remarks' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $estimate->update($request->all());

            // 見積明細の更新
            if ($request->has('items') && is_array($request->items)) {
                // 既存の明細を削除
                $estimate->items()->delete();

                // 新しい明細を作成
                foreach ($request->items as $index => $item) {
                    $estimate->items()->create([
                        'name' => $item['name'],
                        'description' => $item['description'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit' => $item['unit'],
                        'unit_price' => $item['unit_price'],
                        'amount' => $item['quantity'] * $item['unit_price'],
                        'sort_order' => $index + 1,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'data' => $estimate->load(['partner', 'projectType', 'constructionClassification', 'items']),
                'message' => '見積を更新しました'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => '見積の更新に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積を削除
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $estimate = Estimate::findOrFail($id);

            // 見積明細も削除
            $estimate->items()->delete();
            $estimate->delete();

            return response()->json([
                'message' => '見積を削除しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => '見積の削除に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積のステータスを更新
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:draft,sent,approved,rejected',
                'remarks' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $estimate = Estimate::findOrFail($id);
            $estimate->update([
                'status' => $request->status,
                'remarks' => $request->remarks,
            ]);

            return response()->json([
                'data' => $estimate,
                'message' => '見積のステータスを更新しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => '見積のステータス更新に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積の複製
     */
    public function duplicate(string $id): JsonResponse
    {
        try {
            $originalEstimate = Estimate::with('items')->findOrFail($id);

            DB::beginTransaction();

            // 新しい見積番号を生成
            $newEstimateNumber = $this->generateEstimateNumber();

            // 見積を複製
            $newEstimate = $originalEstimate->replicate();
            $newEstimate->estimate_number = $newEstimateNumber;
            $newEstimate->status = 'draft';
            $newEstimate->created_at = now();
            $newEstimate->save();

            // 見積明細も複製
            foreach ($originalEstimate->items as $item) {
                $newItem = $item->replicate();
                $newItem->estimate_id = $newEstimate->id;
                $newItem->save();
            }

            DB::commit();

            return response()->json([
                'data' => $newEstimate->load(['partner', 'projectType', 'constructionClassification', 'items']),
                'message' => '見積を複製しました'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => '見積の複製に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 見積番号を生成
     */
    private function generateEstimateNumber(): string
    {
        $year = date('Y');
        $lastEstimate = Estimate::where('estimate_number', 'like', "EST-{$year}-%")
            ->orderBy('estimate_number', 'desc')
            ->first();

        if ($lastEstimate) {
            $lastNumber = (int) substr($lastEstimate->estimate_number, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return sprintf('EST-%s-%03d', $year, $newNumber);
    }
}
