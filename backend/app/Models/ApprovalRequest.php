<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalRequest extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'approval_flow_id',
        'request_type', // estimate, budget, order, progress, payment
        'request_id', // 依頼元のID
        'title',
        'description',
        'request_data', // 依頼データ（JSON）
        'current_step',
        'status', // pending, approved, rejected, returned, cancelled
        'priority', // low, normal, high, urgent
        'requested_by',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'returned_by',
        'returned_at',
        'cancelled_by',
        'cancelled_at',
        'expires_at',
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
            'request_id' => 'string', // UUID as string
            'request_data' => 'array',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'returned_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * 承認フローとのリレーション
     */
    public function flow(): BelongsTo
    {
        return $this->belongsTo(ApprovalFlow::class, 'approval_flow_id');
    }

    /**
     * 依頼者とのリレーション
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * 承認者とのリレーション
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * 却下者とのリレーション
     */
    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    /**
     * 差し戻し者とのリレーション
     */
    public function returner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'returned_by');
    }

    /**
     * キャンセル者とのリレーション
     */
    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
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
     * 承認履歴とのリレーション
     */
    public function histories(): HasMany
    {
        return $this->hasMany(ApprovalHistory::class)->orderBy('created_at', 'desc');
    }

    /**
     * 現在のステップとのリレーション
     */
    public function currentStep(): BelongsTo
    {
        return $this->belongsTo(ApprovalStep::class, 'current_step');
    }

    /**
     * ステータスが保留中かチェック
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * ステータスが承認済みかチェック
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * ステータスが却下済みかチェック
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * ステータスが差し戻し済みかチェック
     */
    public function isReturned(): bool
    {
        return $this->status === 'returned';
    }

    /**
     * ステータスがキャンセル済みかチェック
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * 承認依頼が期限切れかチェック
     */
    public function isExpired(): bool
    {
        return $this->expires_at && now()->isAfter($this->expires_at);
    }

    /**
     * 承認依頼が完了しているかチェック
     */
    public function isCompleted(): bool
    {
        return in_array($this->status, ['approved', 'rejected', 'cancelled']);
    }

    /**
     * 承認依頼が進行中かチェック
     */
    public function isInProgress(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * 指定されたユーザーが承認者かチェック
     */
    public function isApprover(User $user): bool
    {
        if (!$this->currentStep) {
            return false;
        }

        return $this->currentStep->isApprover($user);
    }

    /**
     * 指定されたユーザーが依頼者かチェック
     */
    public function isRequester(User $user): bool
    {
        return $this->requested_by === $user->id;
    }

    /**
     * 承認依頼を承認
     */
    public function approve(User $user, string $comment = null): bool
    {
        if (!$this->isApprover($user)) {
            return false;
        }

        $this->update([
            'approved_by' => $user->id,
            'approved_at' => now(),
            'status' => 'approved',
        ]);

        // 承認履歴を記録
        $this->histories()->create([
            'approval_step_id' => $this->current_step,
            'action' => 'approve',
            'acted_by' => $user->id,
            'comment' => $comment,
        ]);

        return true;
    }

    /**
     * 承認依頼を却下
     */
    public function reject(User $user, string $comment = null): bool
    {
        if (!$this->isApprover($user)) {
            return false;
        }

        $this->update([
            'rejected_by' => $user->id,
            'rejected_at' => now(),
            'status' => 'rejected',
        ]);

        // 承認履歴を記録
        $this->histories()->create([
            'approval_step_id' => $this->current_step,
            'action' => 'reject',
            'acted_by' => $user->id,
            'comment' => $comment,
        ]);

        return true;
    }

    /**
     * 承認依頼を差し戻し
     */
    public function return(User $user, string $comment = null): bool
    {
        if (!$this->isApprover($user)) {
            return false;
        }

        $this->update([
            'returned_by' => $user->id,
            'returned_at' => now(),
            'status' => 'returned',
        ]);

        // 承認履歴を記録
        $this->histories()->create([
            'approval_step_id' => $this->current_step,
            'action' => 'return',
            'acted_by' => $user->id,
            'comment' => $comment,
        ]);

        return true;
    }

    /**
     * 承認依頼をキャンセル
     */
    public function cancel(User $user, string $comment = null): bool
    {
        if (!$this->isRequester($user) && !$user->is_admin) {
            return false;
        }

        $this->update([
            'cancelled_by' => $user->id,
            'cancelled_at' => now(),
            'status' => 'cancelled',
        ]);

        // 承認履歴を記録
        $this->histories()->create([
            'approval_step_id' => $this->current_step,
            'action' => 'cancel',
            'acted_by' => $user->id,
            'comment' => $comment,
        ]);

        return true;
    }

    /**
     * 次のステップに進む
     */
    public function moveToNextStep(): bool
    {
        $nextStep = $this->flow->steps()
            ->where('step_order', '>', $this->currentStep->step_order)
            ->orderBy('step_order')
            ->first();

        if ($nextStep) {
            $this->update(['current_step' => $nextStep->id]);
            return true;
        }

        // 次のステップがない場合は承認完了
        $this->update(['status' => 'approved']);
        return false;
    }

    /**
     * 保留中の承認依頼のみを取得するスコープ
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * 承認済みの承認依頼のみを取得するスコープ
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * 却下済みの承認依頼のみを取得するスコープ
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * 特定のタイプの承認依頼のみを取得するスコープ
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('request_type', $type);
    }

    /**
     * 特定のユーザーが承認者の承認依頼のみを取得するスコープ
     */
    public function scopeForApprover($query, User $user)
    {
        return $query->whereHas('currentStep', function ($q) use ($user) {
            $approvers = $q->getApprovers();
            $approverIds = collect($approvers)->pluck('id');
            $q->whereIn('approver_id', $approverIds);
        });
    }

    /**
     * 特定のユーザーが依頼者の承認依頼のみを取得するスコープ
     */
    public function scopeByRequester($query, User $user)
    {
        return $query->where('requested_by', $user->id);
    }
}
