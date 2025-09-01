<?php

namespace App\Http\Controllers;

use App\Models\Partner;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PartnerController extends Controller
{
    /**
     * 取引先一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        $query = Partner::with(['creator']);

        // 検索条件
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('partner_code', 'like', "%{$search}%")
                  ->orWhere('partner_name', 'like', "%{$search}%")
                  ->orWhere('partner_name_kana', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // 取引先区分フィルタ
        if ($request->filled('partner_type')) {
            $query->where('partner_type', $request->get('partner_type'));
        }

        // アクティブ状態フィルタ
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // 外注フラグフィルタ
        if ($request->filled('is_subcontractor')) {
            $query->where('is_subcontractor', $request->boolean('is_subcontractor'));
        }

        // ソート
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // ページネーション
        $perPage = $request->get('pageSize', 10);
        $page = $request->get('page', 1);
        $partners = $query->paginate($perPage, ['*'], 'page', $page);

        // レスポンスデータを整形
        $partners->getCollection()->transform(function ($partner) {
            return [
                'id' => $partner->id,
                'partner_code' => $partner->partner_code,
                'partner_name' => $partner->partner_name,
                'partner_name_print' => $partner->partner_name_print,
                'partner_name_kana' => $partner->partner_name_kana,
                'partner_type' => $partner->partner_type,
                'representative' => $partner->representative,
                'phone' => $partner->phone,
                'email' => $partner->email,
                'is_subcontractor' => $partner->is_subcontractor,
                'is_active' => $partner->is_active,
                'status' => $partner->is_active ? 'active' : 'inactive',
                'creator' => $partner->creator ? [
                    'id' => $partner->creator->id,
                    'name' => $partner->creator->name,
                ] : null,
                'createdAt' => $partner->created_at->toISOString(),
                'updatedAt' => $partner->updated_at->toISOString(),
            ];
        });

        return response()->json([
            'partners' => $partners->items(),
            'totalCount' => $partners->total(),
        ]);
    }

    /**
     * 特定の取引先を取得
     */
    public function show(int $id): JsonResponse
    {
        $partner = Partner::with(['creator'])->find($id);

        if (!$partner) {
            return response()->json([
                'success' => false,
                'message' => '取引先が見つかりません',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatPartnerData($partner),
        ]);
    }

    /**
     * 新しい取引先を作成
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'partner_code' => 'required|string|max:50|unique:partners',
            'partner_name' => 'required|string|max:255',
            'partner_name_print' => 'nullable|string|max:255',
            'partner_name_kana' => 'nullable|string|max:255',
            'partner_type' => ['required', Rule::in(['customer', 'supplier', 'both'])],
            'representative' => 'nullable|string|max:255',
            'representative_kana' => 'nullable|string|max:255',
            'branch_name' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'address' => 'nullable|string',
            'building_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'fax' => 'nullable|string|max:50',
            'invoice_number' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'is_subcontractor' => 'boolean',
            'closing_date' => 'nullable|integer|min:1|max:99',
            'deposit_terms' => 'nullable|string|max:50',
            'deposit_date' => 'nullable|integer|min:1|max:99',
            'deposit_method' => 'nullable|string|max:50',
            'cash_allocation' => 'nullable|numeric|min:0|max:100',
            'bill_allocation' => 'nullable|numeric|min:0|max:100',
            'payment_date' => 'nullable|integer|min:1|max:99',
            'payment_method' => 'nullable|string|max:50',
            'payment_cash_allocation' => 'nullable|numeric|min:0|max:100',
            'payment_bill_allocation' => 'nullable|numeric|min:0|max:100',
            'establishment_date' => 'nullable|date',
            'capital_stock' => 'nullable|integer|min:0',
            'previous_sales' => 'nullable|integer|min:0',
            'employee_count' => 'nullable|integer|min:0',
            'business_description' => 'nullable|string',
            'bank_name' => 'nullable|string|max:255',
            'branch_name_bank' => 'nullable|string|max:255',
            'account_type' => ['nullable', Rule::in(['savings', 'current'])],
            'account_number' => 'nullable|string|max:50',
            'account_holder' => 'nullable|string|max:255',
            'login_id' => 'nullable|string|max:100',
            'journal_code' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $partnerData = $validator->validated();
        $partnerData['is_active'] = $partnerData['is_active'] ?? true;
        $partnerData['is_subcontractor'] = $partnerData['is_subcontractor'] ?? false;

        $partner = Partner::create([
            ...$partnerData,
            'created_by' => auth()->id()
        ]);

        $partner->load(['creator']);

        return response()->json([
            'success' => true,
            'message' => '取引先が正常に作成されました',
            'data' => $this->formatPartnerData($partner),
        ], 201);
    }

    /**
     * 取引先情報を更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $partner = Partner::find($id);

        if (!$partner) {
            return response()->json([
                'success' => false,
                'message' => '取引先が見つかりません',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'partner_code' => ['required', 'string', 'max:50', Rule::unique('partners')->ignore($id)],
            'partner_name' => 'required|string|max:255',
            'partner_name_print' => 'nullable|string|max:255',
            'partner_name_kana' => 'nullable|string|max:255',
            'partner_type' => ['required', Rule::in(['customer', 'supplier', 'both'])],
            'representative' => 'nullable|string|max:255',
            'representative_kana' => 'nullable|string|max:255',
            'branch_name' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'address' => 'nullable|string',
            'building_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'fax' => 'nullable|string|max:50',
            'invoice_number' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'is_subcontractor' => 'boolean',
            'closing_date' => 'nullable|integer|min:1|max:99',
            'deposit_terms' => 'nullable|string|max:50',
            'deposit_date' => 'nullable|integer|min:1|max:99',
            'deposit_method' => 'nullable|string|max:50',
            'cash_allocation' => 'nullable|numeric|min:0|max:100',
            'bill_allocation' => 'nullable|numeric|min:0|max:100',
            'payment_date' => 'nullable|integer|min:1|max:99',
            'payment_method' => 'nullable|string|max:50',
            'payment_cash_allocation' => 'nullable|numeric|min:0|max:100',
            'payment_bill_allocation' => 'nullable|numeric|min:0|max:100',
            'establishment_date' => 'nullable|date',
            'capital_stock' => 'nullable|integer|min:0',
            'previous_sales' => 'nullable|integer|min:0',
            'employee_count' => 'nullable|integer|min:0',
            'business_description' => 'nullable|string',
            'bank_name' => 'nullable|string|max:255',
            'branch_name_bank' => 'nullable|string|max:255',
            'account_type' => ['nullable', Rule::in(['savings', 'current'])],
            'account_number' => 'nullable|string|max:50',
            'account_holder' => 'nullable|string|max:255',
            'login_id' => 'nullable|string|max:100',
            'journal_code' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $partnerData = $validator->validated();
        $partner->update($partnerData);

        // 関連データを読み込み
        $partner->load(['creator']);

        return response()->json([
            'success' => true,
            'message' => '取引先が正常に更新されました',
            'data' => $this->formatPartnerData($partner),
        ]);
    }

    /**
     * 取引先を削除
     */
    public function destroy(int $id): JsonResponse
    {
        $partner = Partner::find($id);

        if (!$partner) {
            return response()->json([
                'success' => false,
                'message' => '取引先が見つかりません',
            ], 404);
        }

        $partner->delete();

        return response()->json([
            'success' => true,
            'message' => '取引先が正常に削除されました',
        ]);
    }

    /**
     * 取引先のアクティブ状態を切り替え
     */
    public function toggleActive(int $id): JsonResponse
    {
        $partner = Partner::find($id);

        if (!$partner) {
            return response()->json([
                'success' => false,
                'message' => '取引先が見つかりません',
            ], 404);
        }

        $partner->update(['is_active' => !$partner->is_active]);
        $message = $partner->is_active ? '取引先が有効化されました' : '取引先が無効化されました';

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'is_active' => $partner->is_active,
                'status' => $partner->is_active ? 'active' : 'inactive',
            ],
        ]);
    }

    /**
     * 取引先作成・編集用のオプションデータを取得
     */
    public function getOptions(): JsonResponse
    {
        $partnerTypes = [
            ['value' => 'customer', 'label' => '顧客'],
            ['value' => 'supplier', 'label' => '仕入先'],
            ['value' => 'both', 'label' => '両方'],
        ];

        $accountTypes = [
            ['value' => 'savings', 'label' => '普通預金'],
            ['value' => 'current', 'label' => '当座預金'],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'partner_types' => $partnerTypes,
                'account_types' => $accountTypes,
            ],
        ]);
    }

    /**
     * 取引先データをフォーマット
     */
    private function formatPartnerData(Partner $partner): array
    {
        return [
            'id' => $partner->id,
            'partner_code' => $partner->partner_code,
            'partner_name' => $partner->partner_name,
            'partner_name_print' => $partner->partner_name_print,
            'partner_name_kana' => $partner->partner_name_kana,
            'partner_type' => $partner->partner_type,
            'representative' => $partner->representative,
            'representative_kana' => $partner->representative_kana,
            'branch_name' => $partner->branch_name,
            'postal_code' => $partner->postal_code,
            'address' => $partner->address,
            'building_name' => $partner->building_name,
            'phone' => $partner->phone,
            'fax' => $partner->fax,
            'invoice_number' => $partner->invoice_number,
            'email' => $partner->email,
            'is_subcontractor' => $partner->is_subcontractor,
            'closing_date' => $partner->closing_date,
            'deposit_terms' => $partner->deposit_terms,
            'deposit_date' => $partner->deposit_date,
            'deposit_method' => $partner->deposit_method,
            'cash_allocation' => $partner->cash_allocation,
            'bill_allocation' => $partner->bill_allocation,
            'payment_date' => $partner->payment_date,
            'payment_method' => $partner->payment_method,
            'payment_cash_allocation' => $partner->payment_cash_allocation,
            'payment_bill_allocation' => $partner->payment_bill_allocation,
            'establishment_date' => $partner->establishment_date,
            'capital_stock' => $partner->capital_stock,
            'previous_sales' => $partner->previous_sales,
            'employee_count' => $partner->employee_count,
            'business_description' => $partner->business_description,
            'bank_name' => $partner->bank_name,
            'branch_name_bank' => $partner->branch_name_bank,
            'account_type' => $partner->account_type,
            'account_number' => $partner->account_number,
            'account_holder' => $partner->account_holder,
            'login_id' => $partner->login_id,
            'journal_code' => $partner->journal_code,
            'is_active' => $partner->is_active,
            'status' => $partner->is_active ? 'active' : 'inactive',
            'creator' => $partner->creator ? [
                'id' => $partner->creator->id,
                'name' => $partner->creator->name,
            ] : null,
            'created_at' => $partner->created_at,
            'updated_at' => $partner->updated_at,
        ];
    }
}
