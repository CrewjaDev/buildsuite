<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalRequestType extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'icon',
        'color',
        'default_approval_flow_id',
        'is_active',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * デフォルト承認フローとのリレーション
     */
    public function defaultApprovalFlow(): BelongsTo
    {
        return $this->belongsTo(ApprovalFlow::class, 'default_approval_flow_id');
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
     * 承認依頼テンプレートとのリレーション
     */
    public function templates()
    {
        return $this->hasMany(ApprovalRequestTemplate::class, 'request_type', 'code');
    }
}
