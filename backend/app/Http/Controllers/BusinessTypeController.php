<?php

namespace App\Http\Controllers;

use App\Models\BusinessType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BusinessTypeController extends Controller
{
    /**
     * ビジネスタイプ一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        $query = BusinessType::query();

        // アクティブなもののみフィルタ
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // カテゴリでフィルタ
        if ($request->has('category')) {
            $query->where('category', $request->get('category'));
        }

        // ソート順で並び替え
        $query->orderBy('sort_order')->orderBy('name');

        $businessTypes = $query->get();

        return response()->json([
            'success' => true,
            'data' => $businessTypes,
            'message' => 'ビジネスタイプ一覧を取得しました'
        ]);
    }

    /**
     * 特定のビジネスタイプを取得
     */
    public function show(BusinessType $businessType): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $businessType,
            'message' => 'ビジネスタイプを取得しました'
        ]);
    }

    /**
     * カテゴリ別のビジネスタイプを取得
     */
    public function getByCategory(string $category): JsonResponse
    {
        $businessTypes = BusinessType::where('category', $category)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $businessTypes,
            'message' => "カテゴリ「{$category}」のビジネスタイプを取得しました"
        ]);
    }

    /**
     * アクティブなビジネスタイプのみを取得
     */
    public function getActive(): JsonResponse
    {
        $businessTypes = BusinessType::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $businessTypes,
            'message' => 'アクティブなビジネスタイプ一覧を取得しました'
        ]);
    }
}
