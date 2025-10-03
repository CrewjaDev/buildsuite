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
            $user = auth()->user();
            $query = Estimate::visibleTo($user)
                ->with(['partner', 'projectType', 'constructionClassification', 'creator', 'creatorEmployee', 'responsibleUser'])
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

            // フロントエンド用にフィールドを追加
            $estimatesData = $estimates->items();
            foreach ($estimatesData as $estimate) {
                $estimate->partner_name = $estimate->partner ? $estimate->partner->partner_name : null;
                $estimate->project_type_name = $estimate->projectType ? $estimate->projectType->type_name : null;
                // Employeeテーブルから社員名を取得
                $estimate->created_by_name = $estimate->creatorEmployee ? $estimate->creatorEmployee->name : null;
                $estimate->responsible_user_name = $estimate->responsibleUser ? $estimate->responsibleUser->name : null;
                // フロントエンドで使用するフィールド名に合わせる
                $estimate->estimate_date = $estimate->issue_date;
                $estimate->construction_period_from = $estimate->project_period_start;
                $estimate->construction_period_to = $estimate->project_period_end;
                $estimate->project_description = $estimate->project_location;
                
                // 工事種別に紐づく項目を追加
                if ($estimate->projectType) {
                    $estimate->overhead_rate = $estimate->projectType->overhead_rate;
                    $estimate->cost_expense_rate = $estimate->projectType->cost_expense_rate;
                    $estimate->material_expense_rate = $estimate->projectType->material_expense_rate;
                }
                // 取引先の詳細情報を追加
                if ($estimate->partner) {
                    $estimate->partner_type = $estimate->partner->partner_type;
                    $estimate->partner_address = $estimate->partner->address;
                    $estimate->partner_contact_person = $estimate->partner->representative;
                    $estimate->partner_phone = $estimate->partner->phone;
                    $estimate->partner_email = $estimate->partner->email;
                }
            }

            return response()->json([
                'data' => $estimatesData,
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
                'creatorEmployee',
                'responsibleUser',
                'approvalRequest',
                'items' => function ($query) {
                    $query->orderBy('display_order', 'asc');
                }
            ])->findOrFail($id);

            // フロントエンド用にフィールドを追加
            $estimate->partner_name = $estimate->partner ? $estimate->partner->partner_name : null;
            $estimate->project_type_name = $estimate->projectType ? $estimate->projectType->type_name : null;
            $estimate->created_by_name = $estimate->creatorEmployee ? $estimate->creatorEmployee->name : null;
            $estimate->responsible_user_name = $estimate->responsibleUser ? $estimate->responsibleUser->name : null;
            
            // フィールド名のマッピング（データベースのカラム名をフロントエンドのフィールド名に変換）
            $estimate->estimate_date = $estimate->issue_date;
            $estimate->construction_period_from = $estimate->project_period_start;
            $estimate->construction_period_to = $estimate->project_period_end;
            
            // 工事種別に紐づく項目を追加
            if ($estimate->projectType) {
                $estimate->overhead_rate = $estimate->projectType->overhead_rate;
                $estimate->cost_expense_rate = $estimate->projectType->cost_expense_rate;
                $estimate->material_expense_rate = $estimate->projectType->material_expense_rate;
            }
            // 取引先の詳細情報を追加
            if ($estimate->partner) {
                $estimate->partner_type = $estimate->partner->partner_type;
                $estimate->partner_address = $estimate->partner->address;
                $estimate->partner_contact_person = $estimate->partner->representative;
                $estimate->partner_phone = $estimate->partner->phone;
                $estimate->partner_email = $estimate->partner->email;
            }
            
            // 承認フローのステップ情報を追加
            if ($estimate->approvalRequest) {
                $estimate->current_step = $estimate->approvalRequest->current_step;
                $estimate->total_steps = $estimate->approvalRequest->getTotalSteps();
                $estimate->approval_status = $estimate->approvalRequest->status;
                $estimate->sub_status = $estimate->approvalRequest->sub_status;
            } else {
                $estimate->current_step = null;
                $estimate->total_steps = null;
                $estimate->approval_status = null;
                $estimate->sub_status = null;
            }

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
        \Log::info('見積作成API呼び出し開始', ['request_data' => $request->all()]);
        
        try {
            $validator = Validator::make($request->all(), [
                'estimate_number' => 'nullable|string|max:50|unique:estimates',
                'project_name' => 'required|string|max:255',
                'partner_id' => 'required|exists:partners,id',
                'project_type_id' => 'required|exists:project_types,id',
                'issue_date' => 'required|date',
                'expiry_date' => 'required|date|after:today',
                'notes' => 'nullable|string|max:1000',
                'project_location' => 'nullable|string|max:255',
                'project_period_start' => 'nullable|date',
                'project_period_end' => 'nullable|date|after_or_equal:project_period_start',
                'responsible_user_id' => 'nullable|exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $data = $request->all();
            $user = auth()->user();
            
            // 作成者は認証ユーザー（自動設定）
            $data['created_by'] = $user->id ?? 1;
            
            // 担当者が未設定の場合は作成者を担当者に設定
            $data['responsible_user_id'] = $data['responsible_user_id'] ?? $user->id;
            
            $data['visibility'] = 'private'; // 作成時はプライベート
            $data['department_id'] = $user->department_id ?? null; // ユーザーの部署ID
            
            // 必須フィールドのデフォルト値設定
            $data['status'] = $data['status'] ?? 'draft';
            $data['currency'] = $data['currency'] ?? 'JPY';
            $data['subtotal'] = $data['subtotal'] ?? 0;
            $data['overhead_rate'] = $data['overhead_rate'] ?? 0;
            $data['overhead_amount'] = $data['overhead_amount'] ?? 0;
            $data['cost_expense_rate'] = $data['cost_expense_rate'] ?? 0;
            $data['cost_expense_amount'] = $data['cost_expense_amount'] ?? 0;
            $data['material_expense_rate'] = $data['material_expense_rate'] ?? 0;
            $data['material_expense_amount'] = $data['material_expense_amount'] ?? 0;
            $data['tax_rate'] = $data['tax_rate'] ?? 0.10;
            $data['tax_amount'] = $data['tax_amount'] ?? 0;
            $data['discount_rate'] = $data['discount_rate'] ?? 0;
            $data['discount_amount'] = $data['discount_amount'] ?? 0;
            $data['total_amount'] = $data['total_amount'] ?? 0;
            $data['profit_margin'] = $data['profit_margin'] ?? 0;
            $data['profit_amount'] = $data['profit_amount'] ?? 0;
            $data['approval_status'] = $data['approval_status'] ?? 'none';
            
            // 現在有効な税率を自動設定
            $currentTaxRate = \App\Models\TaxRate::getCurrentTaxRate();
            if ($currentTaxRate) {
                $data['tax_rate'] = $currentTaxRate->rate;
                $data['tax_rate_id'] = $currentTaxRate->id;
            }
            
            \Log::info('見積作成データ', ['data' => $data]);
            
            $estimate = Estimate::create($data);
            
            \Log::info('見積作成成功', ['estimate_id' => $estimate->id]);

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
                        'display_order' => $index + 1,
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
                'project_location' => 'nullable|string',
                'partner_id' => 'sometimes|required|exists:partners,id',
                'project_type_id' => 'sometimes|required|exists:project_types,id',
                'construction_classification_id' => 'sometimes|required|exists:construction_classifications,id',
                'total_amount' => 'sometimes|required|numeric|min:0',
                'status' => 'sometimes|required|in:draft,sent,approved,rejected',
                'estimate_date' => 'sometimes|required|date',
                'issue_date' => 'sometimes|required|date',
                'expiry_date' => 'sometimes|required|date',
                'construction_period_from' => 'sometimes|required|date',
                'construction_period_to' => 'sometimes|required|date',
                'created_by' => 'sometimes|required|exists:users,id',
                'notes' => 'nullable|string|max:1000',
                'overhead_rate' => 'sometimes|numeric|min:0|max:100',
                'cost_expense_rate' => 'sometimes|numeric|min:0|max:100',
                'material_expense_rate' => 'sometimes|numeric|min:0|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // フロントエンドのフィールド名をデータベースのカラム名にマッピング
            $updateData = $request->all();
            
            // フィールド名のマッピング
            if (isset($updateData['estimate_date'])) {
                $updateData['issue_date'] = $updateData['estimate_date'];
                unset($updateData['estimate_date']);
            }
            
            if (isset($updateData['construction_period_from'])) {
                $updateData['project_period_start'] = $updateData['construction_period_from'];
                unset($updateData['construction_period_from']);
            }
            
            if (isset($updateData['construction_period_to'])) {
                $updateData['project_period_end'] = $updateData['construction_period_to'];
                unset($updateData['construction_period_to']);
            }

            $estimate->update($updateData);

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
                        'display_order' => $index + 1,
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
