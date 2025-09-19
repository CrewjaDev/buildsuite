<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ConstructionClassification;
use Illuminate\Http\JsonResponse;

class ConstructionClassificationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ConstructionClassification::query();

        // 検索条件
        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // アクティブなもののみ
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // ソート
        $sortBy = $request->get('sort_by', 'display_order');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // ページネーション
        $perPage = $request->get('per_page', 15);
        $classifications = $query->paginate($perPage);

        return response()->json($classifications);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $classification = ConstructionClassification::create([
            'name' => $request->name,
            'description' => $request->description,
            'display_order' => $request->display_order ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($classification, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $classification = ConstructionClassification::findOrFail($id);
        return response()->json($classification);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $classification = ConstructionClassification::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $classification->update([
            'name' => $request->name,
            'description' => $request->description,
            'display_order' => $request->display_order ?? $classification->display_order,
            'is_active' => $request->boolean('is_active', $classification->is_active),
        ]);

        return response()->json($classification);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $classification = ConstructionClassification::findOrFail($id);
        $classification->delete();

        return response()->json(['message' => '工事分類が削除されました。']);
    }

    /**
     * Get options for dropdown
     */
    public function getOptions(): JsonResponse
    {
        $options = ConstructionClassification::where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json($options);
    }
}
