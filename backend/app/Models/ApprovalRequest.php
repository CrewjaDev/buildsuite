<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalRequest extends Model
{
    use SoftDeletes;

    // メインステータス定数
    const STATUS_PENDING = 'pending';      // 承認待ち（承認フロー進行中）
    const STATUS_APPROVED = 'approved';    // 承認済み（全ステップ完了）
    const STATUS_REJECTED = 'rejected';    // 却下（承認者が却下）
    const STATUS_RETURNED = 'returned';    // 差し戻し（承認者が差し戻し）
    const STATUS_CANCELLED = 'cancelled';  // キャンセル（申請者がキャンセル）
    
    // サブステータス定数（pendingステータス専用）
    const SUB_STATUS_REVIEWING = 'reviewing';          // 審査中（承認者が内容確認中）
    const SUB_STATUS_STEP_APPROVED = 'step_approved';  // ステップ承認済み（次のステップ待ち）
    const SUB_STATUS_EXPIRED = 'expired';              // 期限切れ（承認期限超過）
    const SUB_STATUS_EDITING = 'editing';              // 編集中（排他制御）
    const SUB_STATUS_NONE = null;                      // サブステータスなし（未開封状態）

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
        'sub_status', // サブステータス（pendingステータス専用）
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
        'editing_user_id', // 編集中のユーザーID
        'editing_started_at', // 編集開始日時
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
            'editing_started_at' => 'datetime',
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
     * 承認フローとのリレーション（エイリアス）
     */
    public function approvalFlow(): BelongsTo
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
     * 依頼者とのリレーション（エイリアス）
     */
    public function requestedBy(): BelongsTo
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
     * 承認者とのリレーション（エイリアス）
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * 承認履歴とのリレーション
     */
    public function histories(): HasMany
    {
        return $this->hasMany(ApprovalHistory::class, 'approval_request_id');
    }

    /**
     * 却下者とのリレーション
     */
    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    /**
     * 却下者とのリレーション（エイリアス）
     */
    public function rejectedBy(): BelongsTo
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
     * 差し戻し者とのリレーション（エイリアス）
     */
    public function returnedBy(): BelongsTo
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
     * キャンセル者とのリレーション（エイリアス）
     */
    public function cancelledBy(): BelongsTo
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
     * 編集中のユーザーとのリレーション
     */
    public function editingUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'editing_user_id');
    }

    /**
     * ステータスが保留中かチェック
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * サブステータスが審査中かチェック
     */
    public function isReviewing(): bool
    {
        return $this->status === self::STATUS_PENDING && $this->sub_status === self::SUB_STATUS_REVIEWING;
    }

    /**
     * サブステータスが編集中かチェック
     */
    public function isEditing(): bool
    {
        return $this->status === self::STATUS_PENDING && $this->sub_status === self::SUB_STATUS_EDITING;
    }

    /**
     * サブステータスがステップ承認済みかチェック
     */
    public function isStepApproved(): bool
    {
        return $this->status === self::STATUS_PENDING && $this->sub_status === self::SUB_STATUS_STEP_APPROVED;
    }

    /**
     * サブステータスが期限切れかチェック
     */
    public function isSubStatusExpired(): bool
    {
        return $this->status === self::STATUS_PENDING && $this->sub_status === self::SUB_STATUS_EXPIRED;
    }

    /**
     * サブステータスが未開封（null）かチェック
     */
    public function isUnopened(): bool
    {
        return $this->status === self::STATUS_PENDING && $this->sub_status === self::SUB_STATUS_NONE;
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
     * 編集可能かチェック
     */
    public function canEdit(User $user): bool
    {
        // 承認フロー設定による制御
        $flowConfig = $this->approvalFlow->flow_config ?? [];
        $editingConfig = $flowConfig['editing'] ?? [];
        
        // 基本条件：pendingステータスで、未開封または編集中
        if (!$this->isPending()) {
            return false;
        }
        
        // サブステータスによる制御
        $allowedSubStatuses = $editingConfig['allowed_sub_statuses'] ?? ['null', 'editing'];
        
        if ($this->sub_status === null && !in_array('null', $allowedSubStatuses)) {
            return false;
        }
        
        if ($this->sub_status === self::SUB_STATUS_EDITING && !in_array('editing', $allowedSubStatuses)) {
            return false;
        }
        
        if ($this->sub_status === self::SUB_STATUS_REVIEWING && !in_array('reviewing', $allowedSubStatuses)) {
            return false;
        }
        
        if ($this->sub_status === self::SUB_STATUS_STEP_APPROVED && !in_array('step_approved', $allowedSubStatuses)) {
            return false;
        }
        
        // 排他制御：編集中の場合は、編集中のユーザーのみ編集可能
        if ($this->isEditing()) {
            return $this->editing_user_id === $user->id;
        }
        
        // 承認者優先：審査中の場合は、承認者のみ編集可能
        if ($this->isReviewing()) {
            return $this->isApprover($user);
        }
        
        return true;
    }

    /**
     * キャンセル可能かチェック
     */
    public function canCancel(User $user): bool
    {
        // 承認フロー設定による制御
        $flowConfig = $this->approvalFlow->flow_config ?? [];
        $cancellationConfig = $flowConfig['cancellation'] ?? [];
        
        // 基本条件：pendingステータス
        if (!$this->isPending()) {
            return false;
        }
        
        // サブステータスによる制御
        $allowedSubStatuses = $cancellationConfig['allowed_sub_statuses'] ?? ['null', 'editing'];
        
        if ($this->sub_status === null && !in_array('null', $allowedSubStatuses)) {
            return false;
        }
        
        if ($this->sub_status === self::SUB_STATUS_EDITING && !in_array('editing', $allowedSubStatuses)) {
            return false;
        }
        
        if ($this->sub_status === self::SUB_STATUS_REVIEWING && !in_array('reviewing', $allowedSubStatuses)) {
            return false;
        }
        
        if ($this->sub_status === self::SUB_STATUS_STEP_APPROVED && !in_array('step_approved', $allowedSubStatuses)) {
            return false;
        }
        
        // ユーザー権限チェック
        return $this->isRequester($user) || $user->is_admin;
    }

    /**
     * 編集ロックを開始
     */
    public function startEditing(User $user): bool
    {
        if (!$this->canEdit($user)) {
            return false;
        }
        
        // 既に編集中の場合は、編集中のユーザーのみロック取得可能
        if ($this->isEditing() && $this->editing_user_id !== $user->id) {
            return false;
        }
        
        $this->update([
            'sub_status' => self::SUB_STATUS_EDITING,
            'editing_user_id' => $user->id,
            'editing_started_at' => now(),
        ]);
        
        return true;
    }

    /**
     * 編集ロックを解除
     */
    public function stopEditing(User $user): bool
    {
        if (!$this->isEditing() || $this->editing_user_id !== $user->id) {
            return false;
        }
        
        $this->update([
            'sub_status' => self::SUB_STATUS_NONE,
            'editing_user_id' => null,
            'editing_started_at' => null,
        ]);
        
        return true;
    }

    /**
     * 審査開始（承認者が開封）
     */
    public function startReviewing(User $user): bool
    {
        if (!$this->isApprover($user) || !$this->isPending()) {
            return false;
        }
        
        // 編集中の場合は、編集中のユーザーに優先権がある
        if ($this->isEditing()) {
            return false;
        }
        
        $this->update([
            'sub_status' => self::SUB_STATUS_REVIEWING,
            'editing_user_id' => null,
            'editing_started_at' => null,
        ]);
        
        return true;
    }

    /**
     * 審査完了処理
     */
    public function completeReviewing(User $user): bool
    {
        if (!$this->isApprover($user) || !$this->isPending()) {
            return false;
        }
        
        // 審査中でない場合は処理しない
        if ($this->sub_status !== self::SUB_STATUS_REVIEWING) {
            return false;
        }
        
        $this->update([
            'sub_status' => null, // サブステータスをクリア
        ]);
        
        return true;
    }

    /**
     * ステップ承認完了
     */
    public function completeStepApproval(): bool
    {
        if (!$this->isPending()) {
            return false;
        }
        
        $this->update([
            'sub_status' => self::SUB_STATUS_STEP_APPROVED,
            'editing_user_id' => null,
            'editing_started_at' => null,
        ]);
        
        return true;
    }

    /**
     * 状態表示用の情報を取得
     */
    public function getStatusDisplay(): array
    {
        $statusInfo = [
            'main_status' => $this->status,
            'sub_status' => $this->sub_status,
            'display_text' => '',
            'display_color' => '',
            'icon' => '',
            'is_editable' => false,
            'is_cancellable' => false,
        ];
        
        switch ($this->status) {
            case self::STATUS_PENDING:
                switch ($this->sub_status) {
                    case self::SUB_STATUS_NONE:
                        $statusInfo['display_text'] = '承認待ち（未開封）';
                        $statusInfo['display_color'] = 'warning';
                        $statusInfo['icon'] = 'clock';
                        $statusInfo['is_editable'] = true;
                        $statusInfo['is_cancellable'] = true;
                        break;
                    case self::SUB_STATUS_REVIEWING:
                        $statusInfo['display_text'] = '審査中';
                        $statusInfo['display_color'] = 'info';
                        $statusInfo['icon'] = 'eye';
                        $statusInfo['is_editable'] = false;
                        $statusInfo['is_cancellable'] = false;
                        break;
                    case self::SUB_STATUS_EDITING:
                        $statusInfo['display_text'] = '編集中';
                        $statusInfo['display_color'] = 'primary';
                        $statusInfo['icon'] = 'edit';
                        $statusInfo['is_editable'] = true;
                        $statusInfo['is_cancellable'] = true;
                        break;
                    case self::SUB_STATUS_STEP_APPROVED:
                        $statusInfo['display_text'] = 'ステップ承認済み';
                        $statusInfo['display_color'] = 'success';
                        $statusInfo['icon'] = 'check';
                        $statusInfo['is_editable'] = false;
                        $statusInfo['is_cancellable'] = false;
                        break;
                    case self::SUB_STATUS_EXPIRED:
                        $statusInfo['display_text'] = '期限切れ';
                        $statusInfo['display_color'] = 'danger';
                        $statusInfo['icon'] = 'exclamation-triangle';
                        $statusInfo['is_editable'] = false;
                        $statusInfo['is_cancellable'] = true;
                        break;
                }
                break;
            case self::STATUS_APPROVED:
                $statusInfo['display_text'] = '承認済み';
                $statusInfo['display_color'] = 'success';
                $statusInfo['icon'] = 'check-circle';
                break;
            case self::STATUS_REJECTED:
                $statusInfo['display_text'] = '却下';
                $statusInfo['display_color'] = 'danger';
                $statusInfo['icon'] = 'times-circle';
                break;
            case self::STATUS_RETURNED:
                $statusInfo['display_text'] = '差し戻し';
                $statusInfo['display_color'] = 'warning';
                $statusInfo['icon'] = 'undo';
                break;
            case self::STATUS_CANCELLED:
                $statusInfo['display_text'] = 'キャンセル';
                $statusInfo['display_color'] = 'secondary';
                $statusInfo['icon'] = 'ban';
                break;
        }
        
        return $statusInfo;
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
        $steps = $this->approvalFlow->approval_steps ?? [];
        
        if (empty($steps) || $this->current_step < 1) {
            return false;
        }
        
        // ステップ0（承認依頼作成）を除外した実際の承認ステップを検索
        foreach ($steps as $step) {
            $stepNumber = $step['step'] ?? 0;
            if ($stepNumber === $this->current_step) {
                $approvers = $step['approvers'] ?? [];
                
                foreach ($approvers as $approver) {
                    if ($this->matchesApprover($user, $approver)) {
                        return true;
                    }
                }
                break;
            }
        }
        
        return false;
    }
    
    /**
     * ユーザーが承認者条件に一致するかチェック
     */
    private function matchesApprover(User $user, array $approver): bool
    {
        $type = $approver['type'] ?? '';
        $value = $approver['value'] ?? null;
        
        switch ($type) {
            case 'position_id':
            case 'position':
                return $user->employee && $user->employee->position_id == $value;
            case 'department_id':
            case 'department':
                return $user->employee && $user->employee->department_id == $value;
            case 'user_id':
            case 'user': // 承認フローで使用されるタイプ
                return $user->id == $value;
            case 'role':
                // ユーザーが指定された役割を持っているかチェック
                return $user->roles()->where('role_id', $value)->exists();
            case 'system_level':
                // システム権限レベルのチェック
                if (is_numeric($value)) {
                    // 承認フローでIDが指定された場合
                    return $user->systemLevels()->where('system_level_id', $value)->wherePivot('is_active', true)->exists();
                } else {
                    // 承認フローでcodeが指定された場合（後方互換性）
                    return $user->systemLevels()->where('code', $value)->wherePivot('is_active', true)->exists();
                }
            default:
                return false;
        }
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

    /**
     * 指定されたユーザーの承認状態を取得
     */
    public function getUserApprovalStatus(User $user): array
    {
        // 承認フローの総ステップ数を取得
        $totalSteps = $this->getTotalSteps();
        
        // 依頼者の場合は承認フローの全体状況を返す
        if ($this->requested_by === $user->id) {
            if ($this->status === 'approved') {
                return [
                    'status' => 'finished',
                    'step' => $totalSteps, // 全ステップ完了
                    'total_steps' => $totalSteps,
                    'step_name' => '承認完了',
                    'can_act' => false,
                    'message' => '承認が完了しました'
                ];
            }
            
            if (in_array($this->status, ['rejected', 'returned'])) {
                return [
                    'status' => $this->status,
                    'step' => $this->current_step - 1, // 完了したステップ数
                    'total_steps' => $totalSteps,
                    'step_name' => $this->status === 'rejected' ? '却下' : '差し戻し',
                    'can_act' => false,
                    'message' => $this->status === 'rejected' ? '承認が却下されました' : '承認が差し戻しされました'
                ];
            }
            
            // 承認フローが進行中の場合
            return [
                'status' => 'pending',
                'step' => $this->current_step, // 現在のステップ番号
                'total_steps' => $totalSteps,
                'step_name' => '承認進行中',
                'can_act' => false,
                'message' => '承認フローが進行中です',
                'sub_status' => $this->sub_status // サブステータスを追加
            ];
        }
        
        // 承認フロー全体の状態をチェック
        if ($this->status === 'approved') {
            return [
                'status' => 'finished',
                'step' => $totalSteps, // 全ステップ完了
                'total_steps' => $totalSteps,
                'step_name' => '承認完了',
                'can_act' => false,
                'message' => '承認が完了しました',
                'sub_status' => $this->sub_status
            ];
        }
        
        if (in_array($this->status, ['rejected', 'returned'])) {
            return [
                'status' => $this->status,
                'step' => $this->current_step, // 現在のステップ番号
                'total_steps' => $totalSteps,
                'step_name' => $this->status === 'rejected' ? '却下' : '差し戻し',
                'can_act' => false,
                'message' => $this->status === 'rejected' ? '承認が却下されました' : '承認が差し戻しされました',
                'sub_status' => $this->sub_status
            ];
        }
        
        // ユーザーが担当するステップを特定（元のロジックを使用）
        $userStep = $this->getUserStepForApproval($user);
        
        if (!$userStep) {
            return [
                'status' => 'not_started',
                'step' => $this->current_step, // 現在のステップ番号
                'total_steps' => $totalSteps,
                'step_name' => '対象外',
                'can_act' => false,
                'message' => '承認対象ではありません',
                'sub_status' => $this->sub_status
            ];
        }
        
        // ユーザーのステップと現在のステップを比較
        if ($userStep['step'] < $this->current_step) {
            // ユーザーのステップは既に完了
            return [
                'status' => 'completed',
                'step' => $this->current_step, // 現在のステップ番号を表示
                'total_steps' => $totalSteps,
                'step_name' => '承認済み',
                'can_act' => false,
                'message' => '承認済み',
                'sub_status' => $this->sub_status
            ];
        }
        
        if ($userStep['step'] === $this->current_step) {
            // ユーザーのステップが現在のステップ
            \Log::info('ユーザー承認状態判定 - pending', [
                'user_id' => $user->id,
                'user_step' => $userStep['step'],
                'current_step' => $this->current_step,
                'can_act' => true
            ]);
            
            return [
                'status' => 'pending',
                'step' => $this->current_step, // 現在のステップ番号
                'total_steps' => $totalSteps,
                'step_name' => $userStep['name'],
                'can_act' => true,
                'message' => '承認待ち',
                'sub_status' => $this->sub_status
            ];
        }
        
        // ユーザーのステップはまだ開始されていない
        return [
            'status' => 'not_started',
            'step' => $this->current_step, // 現在のステップ番号
            'total_steps' => $totalSteps,
            'step_name' => $userStep['name'],
            'can_act' => false,
            'message' => '承認待ち（未開始）',
            'sub_status' => $this->sub_status
        ];
    }
    
    /**
     * 承認フローの総ステップ数を取得
     */
    public function getTotalSteps(): int
    {
        $flow = $this->approvalFlow;
        if (!$flow || !$flow->approval_steps) {
            return 0;
        }
        
        // ステップ0（承認依頼作成）を除外した実際の承認ステップ数を返す
        $actualSteps = array_filter($flow->approval_steps, function($step) {
            return ($step['step'] ?? 0) > 0;
        });
        
        return count($actualSteps);
    }
    
    /**
     * 指定されたユーザーが担当するステップを取得
     */
    public function getUserStep(User $user): ?array
    {
        $flow = $this->approvalFlow;
        if (!$flow || !$flow->approval_steps) {
            \Log::info('承認フロー情報なし', [
                'approval_request_id' => $this->id,
                'flow_exists' => $flow ? true : false,
                'steps_exists' => $flow && $flow->approval_steps ? true : false
            ]);
            return null;
        }
        
        \Log::info('承認フローステップ検索開始', [
            'user_id' => $user->id,
            'current_step' => $this->current_step,
            'approval_steps' => $flow->approval_steps
        ]);
        
        // 承認依頼作成者の場合は、現在の承認ステップを返す
        if ($this->isRequester($user)) {
            \Log::info('承認依頼作成者として現在のステップを返す', [
                'user_id' => $user->id,
                'current_step' => $this->current_step
            ]);
            
            // 現在のステップの情報を取得
            foreach ($flow->approval_steps as $step) {
                if (($step['step'] ?? 0) === $this->current_step) {
                    return [
                        'step' => $this->current_step,
                        'name' => $step['name'],
                        'approvers' => $step['approvers']
                    ];
                }
            }
        }
        
        // 承認者の場合
        foreach ($flow->approval_steps as $index => $step) {
            $stepNumber = $step['step'] ?? 0; // 実際のステップ番号を使用
            
            // ステップ0（承認依頼作成）をスキップ
            if ($stepNumber === 0) {
                continue;
            }
            
            // ユーザーがこのステップの承認者かチェック
            if ($this->isUserApproverForStep($user, $step)) {
                \Log::info('ユーザーの担当ステップ発見', [
                    'user_id' => $user->id,
                    'step_number' => $stepNumber,
                    'current_step' => $this->current_step,
                    'step' => $step
                ]);
                
                // 現在の承認ステップの承認者の場合は、現在のステップ番号を返す
                // 完了したステップの承認者の場合も、現在の承認ステップを返す
                $returnStep = ($stepNumber === $this->current_step) ? $stepNumber : $this->current_step;
                
                // 返すステップの情報を取得
                foreach ($flow->approval_steps as $returnStepData) {
                    if (($returnStepData['step'] ?? 0) === $returnStep) {
                        return [
                            'step' => $returnStep,
                            'name' => $returnStepData['name'],
                            'approvers' => $returnStepData['approvers']
                        ];
                    }
                }
            }
        }
        
        \Log::info('ユーザーの担当ステップなし', [
            'user_id' => $user->id
        ]);
        
        return null;
    }
    
    /**
     * 承認アクション判定用のユーザーステップ取得（元のロジック）
     */
    private function getUserStepForApproval(User $user): ?array
    {
        $flow = $this->approvalFlow;
        if (!$flow || !$flow->approval_steps) {
            return null;
        }
        
        foreach ($flow->approval_steps as $index => $step) {
            $stepNumber = $step['step'] ?? 0;
            
            // ステップ0（承認依頼作成）をスキップ
            if ($stepNumber === 0) {
                continue;
            }
            
            // ユーザーがこのステップの承認者かチェック
            if ($this->isUserApproverForStep($user, $step)) {
                return [
                    'step' => $stepNumber,
                    'name' => $step['name'],
                    'approvers' => $step['approvers']
                ];
            }
        }
        
        return null;
    }
    
    /**
     * ユーザーが指定されたステップの承認者かチェック
     */
    private function isUserApproverForStep(User $user, array $step): bool
    {
        if (!isset($step['approvers'])) {
            return false;
        }
        
        foreach ($step['approvers'] as $approver) {
            if ($this->matchesApprover($user, $approver)) {
                return true;
            }
        }
        
        return false;
    }
}
