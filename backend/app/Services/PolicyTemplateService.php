<?php

namespace App\Services;

use App\Models\PolicyTemplate;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PolicyTemplateService
{
    /**
     * テンプレート一覧を取得
     */
    public function getTemplates(array $filters = []): Collection
    {
        $query = PolicyTemplate::query();

        // 検索条件
        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('template_code', 'like', "%{$search}%");
            });
        }

        // カテゴリでフィルタ
        if (isset($filters['category']) && $filters['category']) {
            $query->where('category', $filters['category']);
        }

        // アクションでフィルタ
        if (isset($filters['action']) && $filters['action']) {
            $query->whereJsonContains('applicable_actions', $filters['action']);
        }

        // システムテンプレートでフィルタ
        if (isset($filters['is_system'])) {
            $query->where('is_system', $filters['is_system']);
        }

        // アクティブ状態でフィルタ
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query->orderBy('category')
                    ->orderBy('priority', 'desc')
                    ->orderBy('name')
                    ->get();
    }

    /**
     * アクション別テンプレートを取得
     */
    public function getTemplatesByAction(string $action): Collection
    {
        return PolicyTemplate::whereJsonContains('applicable_actions', $action)
                            ->where('is_active', true)
                            ->orderBy('category')
                            ->orderBy('priority', 'desc')
                            ->orderBy('name')
                            ->get();
    }

    /**
     * カテゴリ別テンプレートを取得
     */
    public function getTemplatesByCategory(string $category): Collection
    {
        return PolicyTemplate::where('category', $category)
                            ->where('is_active', true)
                            ->orderBy('priority', 'desc')
                            ->orderBy('name')
                            ->get();
    }

    /**
     * テンプレートから条件式を生成
     */
    public function generateCondition(int $templateId, array $parameters = []): array
    {
        $template = PolicyTemplate::findOrFail($templateId);
        return $template->generateCondition($parameters);
    }

    /**
     * 複数テンプレートから条件式を組み合わせて生成
     */
    public function generateCombinedCondition(array $templateIds, string $operator = 'and', array $parameters = []): array
    {
        $templates = PolicyTemplate::whereIn('id', $templateIds)->get();
        
        if ($templates->count() !== count($templateIds)) {
            throw new \InvalidArgumentException('指定されたテンプレートが見つかりません');
        }

        $rules = [];
        foreach ($templates as $template) {
            $condition = $template->generateCondition($parameters);
            $rules[] = $condition;
        }

        return [
            'operator' => $operator,
            'rules' => $rules,
        ];
    }

    /**
     * テンプレートを作成
     */
    public function createTemplate(array $data): PolicyTemplate
    {
        $validatedData = $this->validateTemplateData($data);
        return PolicyTemplate::create($validatedData);
    }

    /**
     * テンプレートを更新
     */
    public function updateTemplate(PolicyTemplate $template, array $data): PolicyTemplate
    {
        $validatedData = $this->validateTemplateData($data, $template->id);
        $template->update($validatedData);
        return $template->fresh();
    }

    /**
     * テンプレートを削除
     */
    public function deleteTemplate(PolicyTemplate $template): bool
    {
        if ($template->is_system) {
            throw new \InvalidArgumentException('システムテンプレートは削除できません');
        }

        return $template->delete();
    }

    /**
     * テンプレートデータをバリデーション
     */
    private function validateTemplateData(array $data, ?int $excludeId = null): array
    {
        $rules = [
            'template_code' => 'required|string|max:100|unique:policy_templates,template_code' . ($excludeId ? ",{$excludeId}" : ''),
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'condition_type' => 'required|string|max:100',
            'condition_rule' => 'required|array',
            'parameters' => 'nullable|array',
            'applicable_actions' => 'required|array',
            'applicable_actions.*' => 'string',
            'tags' => 'nullable|array',
            'tags.*' => 'string',
            'is_system' => 'boolean',
            'is_active' => 'boolean',
            'priority' => 'integer|min:0|max:1000',
            'metadata' => 'nullable|array',
        ];

        $validator = Validator::make($data, $rules);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $validator->validated();
    }

    /**
     * テンプレートの統計情報を取得
     */
    public function getTemplateStats(): array
    {
        $total = PolicyTemplate::count();
        $active = PolicyTemplate::where('is_active', true)->count();
        $system = PolicyTemplate::where('is_system', true)->count();
        $custom = PolicyTemplate::where('is_system', false)->count();

        $byCategory = PolicyTemplate::selectRaw('category, COUNT(*) as count')
                                   ->groupBy('category')
                                   ->orderBy('count', 'desc')
                                   ->get()
                                   ->pluck('count', 'category')
                                   ->toArray();

        $byAction = [];
        $templates = PolicyTemplate::where('is_active', true)->get();
        foreach ($templates as $template) {
            foreach ($template->applicable_actions as $action) {
                $byAction[$action] = ($byAction[$action] ?? 0) + 1;
            }
        }

        return [
            'total' => $total,
            'active' => $active,
            'system' => $system,
            'custom' => $custom,
            'by_category' => $byCategory,
            'by_action' => $byAction,
        ];
    }

    /**
     * テンプレートのカテゴリ一覧を取得
     */
    public function getCategories(): array
    {
        return PolicyTemplate::select('category')
                            ->distinct()
                            ->orderBy('category')
                            ->pluck('category')
                            ->toArray();
    }

    /**
     * テンプレートのタグ一覧を取得
     */
    public function getTags(): array
    {
        $tags = PolicyTemplate::whereNotNull('tags')
                             ->get()
                             ->pluck('tags')
                             ->flatten()
                             ->unique()
                             ->sort()
                             ->values()
                             ->toArray();

        return $tags;
    }

    /**
     * テンプレートを複製
     */
    public function duplicateTemplate(PolicyTemplate $template, string $newName, string $newTemplateCode): PolicyTemplate
    {
        $data = $template->toArray();
        unset($data['id'], $data['created_at'], $data['updated_at']);
        
        $data['name'] = $newName;
        $data['template_code'] = $newTemplateCode;
        $data['is_system'] = false; // 複製はカスタムテンプレート

        return $this->createTemplate($data);
    }

    /**
     * テンプレートの使用状況を取得
     */
    public function getTemplateUsage(int $templateId): array
    {
        $template = PolicyTemplate::findOrFail($templateId);
        
        // 実際の使用状況は、AccessPolicyテーブルから条件式を解析して取得
        // ここでは簡易的な実装として、テンプレートの基本情報を返す
        
        return [
            'template' => $template,
            'usage_count' => 0, // TODO: 実際の使用回数を計算
            'last_used' => null, // TODO: 最後の使用日時を取得
        ];
    }

    /**
     * テンプレートの検証
     */
    public function validateTemplate(PolicyTemplate $template): array
    {
        $errors = [];

        // 条件ルールの検証
        if (empty($template->condition_rule)) {
            $errors[] = '条件ルールが設定されていません';
        }

        // 適用可能なアクションの検証
        if (empty($template->applicable_actions)) {
            $errors[] = '適用可能なアクションが設定されていません';
        }

        // パラメータの検証
        if ($template->parameters) {
            foreach ($template->parameters as $key => $param) {
                if (!isset($param['type']) || !isset($param['label'])) {
                    $errors[] = "パラメータ '{$key}' の設定が不完全です";
                }
            }
        }

        return [
            'is_valid' => empty($errors),
            'errors' => $errors,
        ];
    }
}
