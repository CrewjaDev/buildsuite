<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalHistory extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'approval_request_id',
        'approval_step_id',
        'action', // approve, reject, return, cancel, delegate
        'acted_by',
        'acted_at',
        'comment',
        'delegated_to',
        'delegated_at',
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
            'acted_at' => 'datetime',
            'delegated_at' => 'datetime',
        ];
    }

    /**
     * 承認依頼とのリレーション
     */
    public function request(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequest::class, 'approval_request_id');
    }

    /**
     * 承認ステップとのリレーション
     */
    public function step(): BelongsTo
    {
        return $this->belongsTo(ApprovalStep::class, 'approval_step_id');
    }

    /**
     * 実行者とのリレーション
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acted_by');
    }

    /**
     * 委譲先とのリレーション
     */
    public function delegate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delegated_to');
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
     * アクションが承認かチェック
     */
    public function isApprove(): bool
    {
        return $this->action === 'approve';
    }

    /**
     * アクションが却下かチェック
     */
    public function isReject(): bool
    {
        return $this->action === 'reject';
    }

    /**
     * アクションが差し戻しかチェック
     */
    public function isReturn(): bool
    {
        return $this->action === 'return';
    }

    /**
     * アクションがキャンセルかチェック
     */
    public function isCancel(): bool
    {
        return $this->action === 'cancel';
    }

    /**
     * アクションが委譲かチェック
     */
    public function isDelegate(): bool
    {
        return $this->action === 'delegate';
    }

    /**
     * アクションの表示名を取得
     */
    public function getActionDisplayName(): string
    {
        switch ($this->action) {
            case 'approve':
                return '承認';
            case 'reject':
                return '却下';
            case 'return':
                return '差し戻し';
            case 'cancel':
                return 'キャンセル';
            case 'delegate':
                return '委譲';
            default:
                return $this->action;
        }
    }

    /**
     * アクションの色を取得
     */
    public function getActionColor(): string
    {
        switch ($this->action) {
            case 'approve':
                return 'success';
            case 'reject':
                return 'danger';
            case 'return':
                return 'warning';
            case 'cancel':
                return 'secondary';
            case 'delegate':
                return 'info';
            default:
                return 'primary';
        }
    }

    /**
     * 承認アクションのみを取得するスコープ
     */
    public function scopeApproves($query)
    {
        return $query->where('action', 'approve');
    }

    /**
     * 却下アクションのみを取得するスコープ
     */
    public function scopeRejects($query)
    {
        return $query->where('action', 'reject');
    }

    /**
     * 差し戻しアクションのみを取得するスコープ
     */
    public function scopeReturns($query)
    {
        return $query->where('action', 'return');
    }

    /**
     * 特定のユーザーが実行したアクションのみを取得するスコープ
     */
    public function scopeByActor($query, User $user)
    {
        return $query->where('acted_by', $user->id);
    }

    /**
     * 特定の承認依頼の履歴のみを取得するスコープ
     */
    public function scopeByRequest($query, int $requestId)
    {
        return $query->where('approval_request_id', $requestId);
    }

    /**
     * 特定の承認ステップの履歴のみを取得するスコープ
     */
    public function scopeByStep($query, int $stepId)
    {
        return $query->where('approval_step_id', $stepId);
    }

    /**
     * 最近の履歴のみを取得するスコープ
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('acted_at', '>=', now()->subDays($days));
    }
}
