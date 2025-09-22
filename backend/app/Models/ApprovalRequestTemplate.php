<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalRequestTemplate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'request_type',
        'template_data',
        'is_active',
        'is_system',
        'usage_count',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'template_data' => 'array',
        'is_active' => 'boolean',
        'is_system' => 'boolean',
        'usage_count' => 'integer',
    ];

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
     * 承認依頼タイプとのリレーション
     */
    public function requestType(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequestType::class, 'request_type', 'code');
    }

    /**
     * 使用回数を増加
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }
}
