<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalFlow extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'description',
        'flow_type', // estimate, budget, order, progress, payment
        'is_active',
        'is_system',
        'priority',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_system' => 'boolean',
            'priority' => 'integer',
        ];
    }

    /**
     * 承認フローに属するステップとのリレーション
     */
    public function steps(): HasMany
    {
        return $this->hasMany(ApprovalStep::class)->orderBy('step_order');
    }

    /**
     * 承認フローに属する条件とのリレーション
     */
    public function conditions(): HasMany
    {
        return $this->hasMany(ApprovalCondition::class);
    }

    /**
     * 承認フローに属する承認依頼とのリレーション
     */
    public function requests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class);
    }

    /**
     * 作成者とのリレーション
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * 更新者とのリレーション
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * アクティブな承認フローのみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * 特定のタイプの承認フローを取得するスコープ
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('flow_type', $type);
    }

    /**
     * システム承認フローのみを取得するスコープ
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * 優先度順にソートするスコープ
     */
    public function scopeOrderByPriority($query, $direction = 'asc')
    {
        return $query->orderBy('priority', $direction);
    }

    /**
     * 承認フローが条件に合致するかチェック
     */
    public function matchesConditions(array $data): bool
    {
        foreach ($this->conditions as $condition) {
            if (!$condition->evaluate($data)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 承認フローのステップ数を取得
     */
    public function getStepCount(): int
    {
        return $this->steps()->count();
    }

    /**
     * 承認フローが使用可能かチェック
     */
    public function isUsable(): bool
    {
        return $this->is_active && $this->steps()->exists();
    }
}
