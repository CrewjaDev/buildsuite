<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Models\Estimate;
use App\Models\EstimateItem;
use App\Models\Partner;
use App\Models\ProjectType;
use App\Models\ConstructionClassification;

class EstimateController extends Controller
{
    use AuthorizesRequests;
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

            // ABACポリシーによるフィルタリング
            $estimates = $query->get();
            $accessibleEstimates = $estimates->filter(function ($estimate) use ($user) {
                return $user->can('view', $estimate);
            });

            // 検索条件をABACフィルタリング後のコレクションに適用
            if ($request->filled('search')) {
                $search = $request->search;
                $accessibleEstimates = $accessibleEstimates->filter(function ($estimate) use ($search) {
                    return str_contains($estimate->estimate_number, $search) ||
                           str_contains($estimate->project_name, $search) ||
                           ($estimate->partner && str_contains($estimate->partner->partner_name, $search));
                });
            }

            // 列フィルターの適用
            $columnFilters = [
                'estimate_number' => $request->get('estimate_number'),
                'partner_name' => $request->get('partner_name'),
                'project_name' => $request->get('project_name'),
                'total_amount' => $request->get('total_amount'),
                'created_by_name' => $request->get('created_by_name'),
                'status' => $request->get('status'),
                'estimate_date' => $request->get('estimate_date'),
                'project_description' => $request->get('project_description'),
            ];

            foreach ($columnFilters as $field => $value) {
                if (!empty($value)) {
                    $accessibleEstimates = $accessibleEstimates->filter(function ($estimate) use ($field, $value) {
                        switch ($field) {
                            case 'estimate_number':
                                return str_contains($estimate->estimate_number, $value);
                            case 'partner_name':
                                return $estimate->partner && str_contains($estimate->partner->partner_name, $value);
                            case 'project_name':
                                return str_contains($estimate->project_name, $value);
                            case 'total_amount':
                                return str_contains((string)$estimate->total_amount, $value);
                            case 'created_by_name':
                                return $estimate->creatorEmployee && str_contains($estimate->creatorEmployee->name, $value);
                            case 'status':
                                return str_contains($estimate->status, $value);
                            case 'estimate_date':
                                return $estimate->issue_date && str_contains($estimate->issue_date, $value);
                            case 'project_description':
                                return str_contains($estimate->project_location, $value);
                            default:
                                return true;
                        }
                    });
                }
            }

            // ステータスフィルター
            if ($request->filled('status') && $request->status !== 'all') {
                $accessibleEstimates = $accessibleEstimates->where('status', $request->status);
            }

            // プロジェクトタイプフィルター
            if ($request->filled('project_type_id')) {
                $accessibleEstimates = $accessibleEstimates->where('project_type_id', $request->project_type_id);
            }

            // 工事分類フィルター
            if ($request->filled('construction_classification_id')) {
                $accessibleEstimates = $accessibleEstimates->where('construction_classification_id', $request->construction_classification_id);
            }

            // 日付範囲フィルター
            if ($request->filled('date_from')) {
                $accessibleEstimates = $accessibleEstimates->filter(function ($estimate) use ($request) {
                    return $estimate->created_at >= $request->date_from;
                });
            }
            if ($request->filled('date_to')) {
                $accessibleEstimates = $accessibleEstimates->filter(function ($estimate) use ($request) {
                    return $estimate->created_at <= $request->date_to . ' 23:59:59';
                });
            }

            // ソート処理
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            // ソート可能なフィールドのマッピング
            $sortableFields = [
                'estimate_number' => 'estimate_number',
                'project_name' => 'project_name',
                'partner_name' => 'partner.partner_name',
                'total_amount' => 'total_amount',
                'created_by_name' => 'creatorEmployee.name',
                'status' => 'status',
                'estimate_date' => 'issue_date',
                'project_description' => 'project_location',
                'created_at' => 'created_at',
                'updated_at' => 'updated_at'
            ];
            
            if (isset($sortableFields[$sortBy])) {
                $sortField = $sortableFields[$sortBy];
                
                // リレーションのフィールドの場合は特別な処理
                if (str_contains($sortField, '.')) {
                    $accessibleEstimates = $accessibleEstimates->sortBy(function ($estimate) use ($sortField) {
                        $parts = explode('.', $sortField);
                        $value = $estimate;
                        foreach ($parts as $part) {
                            $value = $value?->$part;
                        }
                        return $value;
                    }, SORT_REGULAR, $sortOrder === 'desc');
                } else {
                    $accessibleEstimates = $accessibleEstimates->sortBy($sortField, SORT_REGULAR, $sortOrder === 'desc');
                }
            }

            // ページネーション
            $perPage = $request->get('per_page', 20);
            $page = $request->get('page', 1);
            $offset = ($page - 1) * $perPage;
            $estimates = $accessibleEstimates->slice($offset, $perPage)->values();

            // フロントエンド用にフィールドを追加
            $estimatesData = [];
            foreach ($estimates as $estimate) {
                $estimateData = $estimate->toArray();
                $estimateData['partner_name'] = $estimate->partner ? $estimate->partner->partner_name : null;
                $estimateData['project_type_name'] = $estimate->projectType ? $estimate->projectType->type_name : null;
                // Employeeテーブルから社員名を取得
                $estimateData['created_by_name'] = $estimate->creatorEmployee ? $estimate->creatorEmployee->name : null;
                $estimateData['responsible_user_name'] = $estimate->responsibleUser ? $estimate->responsibleUser->name : null;
                // フロントエンドで使用するフィールド名に合わせる
                $estimateData['estimate_date'] = $estimate->issue_date;
                $estimateData['construction_period_from'] = $estimate->project_period_start;
                $estimateData['construction_period_to'] = $estimate->project_period_end;
                $estimateData['project_description'] = $estimate->project_location;
                
                // 工事種別に紐づく項目を追加
                if ($estimate->projectType) {
                    $estimateData['overhead_rate'] = $estimate->projectType->overhead_rate;
                    $estimateData['cost_expense_rate'] = $estimate->projectType->cost_expense_rate;
                    $estimateData['material_expense_rate'] = $estimate->projectType->material_expense_rate;
                }
                // 取引先の詳細情報を追加
                if ($estimate->partner) {
                    $estimateData['partner_type'] = $estimate->partner->partner_type;
                    $estimateData['partner_address'] = $estimate->partner->address;
                    $estimateData['partner_contact_person'] = $estimate->partner->representative;
                    $estimateData['partner_phone'] = $estimate->partner->phone;
                    $estimateData['partner_email'] = $estimate->partner->email;
                }
                
                $estimatesData[] = $estimateData;
            }

            $totalCount = $accessibleEstimates->count();
            $lastPage = ceil($totalCount / $perPage);
            
            return response()->json([
                'data' => $estimatesData,
                'meta' => [
                    'current_page' => $page,
                    'last_page' => $lastPage,
                    'per_page' => $perPage,
                    'total' => $totalCount,
                    'from' => $offset + 1,
                    'to' => min($offset + $perPage, $totalCount),
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
                'responsibleUser.employee',
                'responsibleUserDepartment',
                'approvalRequest',
                'items' => function ($query) {
                    $query->orderBy('display_order', 'asc');
                }
            ])->whereNull('deleted_at')->findOrFail($id);

            $user = auth()->user();

            // Policyを使用した権限チェック
            try {
                $this->authorize('view', $estimate);
            } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
                // 権限エラーの場合、詳細なメッセージを返す
                $errorMessage = $this->getViewPermissionErrorMessage($user, $estimate);
                return response()->json([
                    'message' => '見積詳細の取得に失敗しました',
                    'error' => $errorMessage
                ], 403);
            }

            // アクセサーは自動的に動作するため、手動設定は不要
            // responsible_user_departmentは手動で追加（リレーション名と重複するため）
            $estimate->setAttribute('responsible_user_department', $estimate->getResponsibleUserDepartmentAttribute());
            
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

            // レスポンス用のデータを準備
            $responseData = $estimate->toArray();
            
            // 部署情報と担当者名を確実に文字列として設定（リレーションを上書き）
            $responseData['responsible_user_department'] = $estimate->getResponsibleUserDepartmentAttribute();
            $responseData['responsible_user_name'] = $estimate->getResponsibleUserNameAttribute();
            
            // 空文字列の場合はnullに変換
            if (empty($responseData['responsible_user_department'])) {
                $responseData['responsible_user_department'] = null;
            }
            if (empty($responseData['responsible_user_name'])) {
                $responseData['responsible_user_name'] = null;
            }
            
            // デバッグ情報を追加
            \Log::info('EstimateController show response data', [
                'estimate_id' => $estimate->id,
                'estimate_number' => $estimate->estimate_number,
                'responsible_user_department' => $responseData['responsible_user_department'],
                'responsible_user_name' => $responseData['responsible_user_name'],
                'responsible_user_department_type' => gettype($responseData['responsible_user_department']),
                'responsible_user_name_type' => gettype($responseData['responsible_user_name']),
                'responsible_user_department_id' => $estimate->responsible_user_department_id,
                'responsible_user_id' => $estimate->responsible_user_id,
                'department_id' => $estimate->department_id,
                'created_by' => $estimate->created_by,
            ]);
            
            return response()->json([
                'data' => $responseData,
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
            
            // 部署IDを設定（作成者の部署を使用）
            $data['department_id'] = $user->primaryDepartment?->id;
            
            // 担当者の部署IDを取得して保存
            if ($data['responsible_user_id']) {
                $responsibleUser = \App\Models\User::find($data['responsible_user_id']);
                $data['responsible_user_department_id'] = $responsibleUser?->primaryDepartment?->id;
            }
            
            $data['visibility'] = 'private'; // 作成時はプライベート
            // department_idは既に上記で設定済み（重複設定を削除）
            
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

            // 作成された見積データを詳細情報付きで返す
            $estimateWithRelations = $estimate->load([
                'partner', 
                'projectType', 
                'constructionClassification', 
                'creatorEmployee',
                'responsibleUser.employee',
                'responsibleUserDepartment',
                'items'
            ]);
            
            // レスポンス用のデータを準備（showメソッドと同じ処理）
            $responseData = $estimateWithRelations->toArray();
            $responseData['responsible_user_department'] = $estimateWithRelations->getResponsibleUserDepartmentAttribute();
            $responseData['responsible_user_name'] = $estimateWithRelations->getResponsibleUserNameAttribute();
            
            // 空文字列の場合はnullに変換
            if (empty($responseData['responsible_user_department'])) {
                $responseData['responsible_user_department'] = null;
            }
            if (empty($responseData['responsible_user_name'])) {
                $responseData['responsible_user_name'] = null;
            }
            
            return response()->json([
                'data' => $responseData,
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
            $estimate = Estimate::whereNull('deleted_at')->findOrFail($id);
            $user = auth()->user();

            // Policyを使用した権限チェック
            try {
                $this->authorize('update', $estimate);
            } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
                // 権限エラーの場合、詳細なメッセージを返す
                $errorMessage = $this->getUpdatePermissionErrorMessage($user, $estimate);
                return response()->json([
                    'message' => '見積の更新に失敗しました',
                    'error' => $errorMessage
                ], 403);
            }

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
            $estimate = Estimate::whereNull('deleted_at')->findOrFail($id);
            $user = auth()->user();

            // Policyを使用した権限チェック
            try {
                $this->authorize('delete', $estimate);
            } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
                // 権限エラーの場合、詳細なメッセージを返す
                $errorMessage = $this->getDeletePermissionErrorMessage($user, $estimate);
                return response()->json([
                    'message' => '見積の削除に失敗しました',
                    'error' => $errorMessage
                ], 403);
            }

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
     * 閲覧権限エラーの詳細メッセージを生成
     */
    private function getViewPermissionErrorMessage($user, $estimate): string
    {
        // 基本的な権限チェック
        if (!\App\Services\PermissionService::hasPermission($user, 'estimate.view')) {
            return '見積閲覧権限がありません。管理者に権限の付与を依頼してください。';
        }

        // 作成者チェック
        if ($estimate->created_by !== $user->id) {
            return '作成者のみ見積を閲覧できます。';
        }

        // ABACポリシーが設定されていない場合
        return 'ABACポリシーが設定されていません。管理者にポリシーの設定を依頼してください。';
    }

    /**
     * 更新権限エラーの詳細メッセージを生成
     */
    private function getUpdatePermissionErrorMessage($user, $estimate): string
    {
        // 基本的な権限チェック
        if (!\App\Services\PermissionService::hasPermission($user, 'estimate.edit')) {
            return '見積編集権限がありません。管理者に権限の付与を依頼してください。';
        }

        // ステータスチェック
        if (!in_array($estimate->status, ['draft'])) {
            return '下書き状態の見積のみ編集できます。現在のステータス: ' . $estimate->status;
        }

        // 作成者チェック
        if ($estimate->created_by !== $user->id) {
            return '作成者のみ見積を編集できます。';
        }

        // ABACポリシーが設定されていない場合
        return 'ABACポリシーが設定されていません。管理者にポリシーの設定を依頼してください。';
    }

    /**
     * 削除権限エラーの詳細メッセージを生成
     */
    private function getDeletePermissionErrorMessage($user, $estimate): string
    {
        // 基本的な権限チェック
        if (!\App\Services\PermissionService::hasPermission($user, 'estimate.delete')) {
            return '見積削除権限がありません。管理者に権限の付与を依頼してください。';
        }

        // ステータスチェック
        if (!in_array($estimate->status, ['draft'])) {
            return '下書き状態の見積のみ削除できます。現在のステータス: ' . $estimate->status;
        }

        // 作成者チェック
        if ($estimate->created_by !== $user->id) {
            return '作成者のみ見積を削除できます。';
        }

        // ABACポリシーが設定されていない場合
        return 'ABACポリシーが設定されていません。管理者にポリシーの設定を依頼してください。';
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

            $estimate = Estimate::whereNull('deleted_at')->findOrFail($id);
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
        // 削除されたデータも含めて検索（withTrashed()を使用）
        $lastEstimate = Estimate::withTrashed()
            ->where('estimate_number', 'like', "EST-{$year}-%")
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
