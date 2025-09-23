<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class Estimate extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * ルートモデルバインディングで使用するキー
     */
    public function getRouteKeyName()
    {
        return 'id';
    }

    /**
     * ルートモデルバインディングの解決
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where($field ?: $this->getRouteKeyName(), $value)->first();
    }

    protected $fillable = [
        // 基本情報（必須）
        'estimate_number',
        'partner_id',
        'project_type_id',
        'project_name',
        'project_location',
        'project_period_start',
        'project_period_end',
        'description',
        'status',
        'issue_date',
        'expiry_date',
        'currency',
        
        // 金額計算（必須）
        'subtotal',
        'overhead_rate',
        'overhead_amount',
        'cost_expense_rate',
        'cost_expense_amount',
        'material_expense_rate',
        'material_expense_amount',
        'tax_rate',
        'tax_amount',
        'discount_rate',
        'discount_amount',
        'total_amount',
        'profit_margin',
        'profit_amount',
        
        // 条件・備考
        'payment_terms',
        'delivery_terms',
        'warranty_period',
        'notes',
        
        // システム管理
        'created_by',
        'approved_by',
        
        // 承認関連
        'approval_request_id',
        'approval_flow_id',
        'approval_status',
    ];

    protected $casts = [
        // UUID
        'id' => 'string',
        
        // 日付・時刻
        'project_period_start' => 'date',
        'project_period_end' => 'date',
        'issue_date' => 'date',
        'expiry_date' => 'date',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        
        // 金額（小数点2桁）
        'subtotal' => 'decimal:2',
        'overhead_amount' => 'decimal:2',
        'cost_expense_amount' => 'decimal:2',
        'material_expense_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'profit_amount' => 'decimal:2',
        
        // 率（小数点2桁）※ Eloquentのdecimalキャストは scale 指定のみ
        'overhead_rate' => 'decimal:2',
        'cost_expense_rate' => 'decimal:2',
        'material_expense_rate' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'discount_rate' => 'decimal:2',
        'profit_margin' => 'decimal:2',
    ];

    /**
     * 取引先とのリレーション
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * プロジェクトタイプとのリレーション
     */
    public function projectType(): BelongsTo
    {
        return $this->belongsTo(ProjectType::class);
    }

    /**
     * 工事分類とのリレーション
     */
    public function constructionClassification(): BelongsTo
    {
        return $this->belongsTo(ConstructionClassification::class);
    }

    /**
     * 承認者とのリレーション
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * 承認依頼とのリレーション
     */
    public function approvalRequest(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequest::class, 'approval_request_id');
    }

    /**
     * 承認フローとのリレーション
     */
    public function approvalFlow(): BelongsTo
    {
        return $this->belongsTo(ApprovalFlow::class, 'approval_flow_id');
    }

    /**
     * 見積明細とのリレーション
     */
    public function items(): HasMany
    {
        return $this->hasMany(EstimateItem::class);
    }

    /**
     * 原価計画とのリレーション
     */
    public function costPlans(): HasMany
    {
        return $this->hasMany(CostPlan::class);
    }

    /**
     * 見積枝番とのリレーション
     */
    public function branches(): HasMany
    {
        return $this->hasMany(EstimateBranch::class, 'parent_estimate_id');
    }

    /**
     * 作成者とのリレーション
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * 作成者（Employee）とのリレーション
     */
    public function creatorEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'created_by', 'id');
    }

    /**
     * 更新者とのリレーション
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * ステータスの表示名を取得
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'draft' => '下書き',
            'sent' => '送信済み',
            'approved' => '承認済み',
            'rejected' => '却下',
            default => '不明',
        };
    }

    /**
     * ステータスの色を取得
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'draft' => 'gray',
            'sent' => 'blue',
            'approved' => 'green',
            'rejected' => 'red',
            default => 'gray',
        };
    }

    /**
     * 有効期限が切れているかチェック
     */
    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    /**
     * 有効期限まであと何日か取得
     */
    public function getDaysUntilExpiry(): int
    {
        return $this->expiry_date ? now()->diffInDays($this->expiry_date, false) : 0;
    }

    /**
     * ステータスが変更可能かチェック
     */
    public function canChangeStatus(): bool
    {
        return in_array($this->status, ['draft', 'sent']);
    }

    /**
     * 編集可能かチェック
     */
    public function canEdit(): bool
    {
        return in_array($this->status, ['draft']);
    }

    /**
     * 削除可能かチェック
     */
    public function canDelete(): bool
    {
        return in_array($this->status, ['draft']);
    }

    /**
     * 承認依頼可能かチェック
     */
    public function canRequestApproval(): bool
    {
        return in_array($this->status, ['draft']) && !$this->approvalRequest;
    }

    /**
     * 承認中かチェック
     */
    public function isUnderApproval(): bool
    {
        return $this->approvalRequest && in_array($this->approvalRequest->status, ['pending']);
    }

    /**
     * 承認済みかチェック
     */
    public function isApproved(): bool
    {
        return $this->approvalRequest && $this->approvalRequest->status === 'approved';
    }

    /**
     * 却下済みかチェック
     */
    public function isRejected(): bool
    {
        return $this->approvalRequest && $this->approvalRequest->status === 'rejected';
    }

    /**
     * 差し戻し済みかチェック
     */
    public function isReturned(): bool
    {
        return $this->approvalRequest && $this->approvalRequest->status === 'returned';
    }

    /**
     * 承認依頼キャンセル済みかチェック
     */
    public function isCancelled(): bool
    {
        return $this->approvalRequest && $this->approvalRequest->status === 'cancelled';
    }

    /**
     * 現在の承認ステップを取得
     */
    public function getCurrentApprovalStep()
    {
        if (!$this->approvalRequest || !$this->approvalFlow) {
            return null;
        }

        $currentStepNumber = $this->approvalRequest->current_step;
        
        foreach ($this->approvalFlow->approval_steps as $step) {
            if ($step['step'] === $currentStepNumber) {
                return $step;
            }
        }

        return null;
    }

    /**
     * 承認フロー情報を取得
     */
    public function getApprovalFlowInfo()
    {
        if (!$this->approvalFlow) {
            return null;
        }

        return [
            'id' => $this->approvalFlow->id,
            'name' => $this->approvalFlow->name,
            'flow_type' => $this->approvalFlow->flow_type,
            'total_steps' => count($this->approvalFlow->approval_steps ?? []),
            'current_step' => $this->approvalRequest?->current_step ?? 0,
            'status' => $this->approvalRequest?->status ?? 'none',
        ];
    }

    // ===== Laravel機能的に必要な項目 =====

    /**
     * 主キーの設定
     */
    protected $keyType = 'string';
    public $incrementing = false;
    protected $primaryKey = 'id';
    protected $keyName = 'id';
    protected $connection = 'pgsql';
    protected $table = 'estimates';

    /**
     * 日付として扱う属性
     */
    protected $dates = [
        'project_period_start',
        'project_period_end',
        'issue_date',
        'expiry_date',
        'approved_at',
    ];

    /**
     * 隠す属性
     */
    protected $hidden = [
        'deleted_at',
    ];

    /**
     * アクセサ
     */
    protected $appends = [
        'status_label',
        'status_color',
        'is_expired',
        'days_until_expiry',
        'can_change_status',
        'can_edit',
        'can_delete',
        'can_request_approval',
        'is_under_approval',
        'is_approved',
        'is_rejected',
        'is_returned',
        'is_cancelled',
        'formatted_total_amount',
        'formatted_subtotal',
        'formatted_tax_amount',
    ];

    // ===== スコープ =====

    /**
     * 下書き状態の見積
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    /**
     * 送信済みの見積
     */
    public function scopeSent(Builder $query): Builder
    {
        return $query->where('status', 'sent');
    }



    /**
     * 有効期限内の見積
     */
    public function scopeValid(Builder $query): Builder
    {
        return $query->where('expiry_date', '>', now());
    }

    /**
     * 期限切れの見積
     */
    public function scopeExpired(Builder $query): Builder
    {
        return $query->where('expiry_date', '<=', now());
    }

    /**
     * 特定の取引先の見積
     */
    public function scopeByPartner(Builder $query, int $partnerId): Builder
    {
        return $query->where('partner_id', $partnerId);
    }

    /**
     * 特定の工事種別の見積
     */
    public function scopeByProjectType(Builder $query, int $projectTypeId): Builder
    {
        return $query->where('project_type_id', $projectTypeId);
    }

    /**
     * 承認依頼可能な見積
     */
    public function scopeCanRequestApproval(Builder $query): Builder
    {
        return $query->where('status', 'draft')
                    ->whereNull('approval_request_id');
    }

    /**
     * 承認中の見積
     */
    public function scopeUnderApproval(Builder $query): Builder
    {
        return $query->whereHas('approvalRequest', function ($q) {
            $q->where('status', 'pending');
        });
    }

    /**
     * 承認済みの見積
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->whereHas('approvalRequest', function ($q) {
            $q->where('status', 'approved');
        });
    }

    /**
     * 却下された見積
     */
    public function scopeRejected(Builder $query): Builder
    {
        return $query->whereHas('approvalRequest', function ($q) {
            $q->where('status', 'rejected');
        });
    }

    /**
     * 差し戻しされた見積
     */
    public function scopeReturned(Builder $query): Builder
    {
        return $query->whereHas('approvalRequest', function ($q) {
            $q->where('status', 'returned');
        });
    }

    /**
     * 承認依頼キャンセルされた見積
     */
    public function scopeCancelled(Builder $query): Builder
    {
        return $query->whereHas('approvalRequest', function ($q) {
            $q->where('status', 'cancelled');
        });
    }

    // ===== ミューテータ =====

    /**
     * 見積番号の自動生成
     */
    public function setEstimateNumberAttribute($value)
    {
        if (empty($value)) {
            $this->attributes['estimate_number'] = $this->generateEstimateNumber();
        } else {
            $this->attributes['estimate_number'] = $value;
        }
    }

    /**
     * 通貨のデフォルト値設定
     */
    public function setCurrencyAttribute($value)
    {
        $this->attributes['currency'] = $value ?: 'JPY';
    }

    /**
     * ステータスのデフォルト値設定
     */
    public function setStatusAttribute($value)
    {
        $this->attributes['status'] = $value ?: 'draft';
    }

    /**
     * 消費税率のデフォルト値設定
     */
    public function setTaxRateAttribute($value)
    {
        $this->attributes['tax_rate'] = $value ?: 0.10;
    }

    // ===== アクセサ =====

    /**
     * フォーマットされた合計金額
     */
    public function getFormattedTotalAmountAttribute(): string
    {
        return '¥' . number_format($this->total_amount, 0);
    }

    /**
     * フォーマットされた小計
     */
    public function getFormattedSubtotalAttribute(): string
    {
        return '¥' . number_format($this->subtotal, 0);
    }

    /**
     * フォーマットされた消費税額
     */
    public function getFormattedTaxAmountAttribute(): string
    {
        return '¥' . number_format($this->tax_amount, 0);
    }

    /**
     * 工事期間の表示
     */
    public function getProjectPeriodDisplayAttribute(): string
    {
        if ($this->project_period_start && $this->project_period_end) {
            return $this->project_period_start->format('Y/m/d') . ' ～ ' . $this->project_period_end->format('Y/m/d');
        }
        return '未設定';
    }

    /**
     * 工事期間の日数
     */
    public function getProjectPeriodDaysAttribute(): int
    {
        if ($this->project_period_start && $this->project_period_end) {
            return $this->project_period_start->diffInDays($this->project_period_end) + 1;
        }
        return 0;
    }

    // ===== appends 用アクセサ =====

    /**
     * appends: is_expired
     */
    public function getIsExpiredAttribute(): bool
    {
        return $this->isExpired();
    }

    /**
     * appends: days_until_expiry
     */
    public function getDaysUntilExpiryAttribute(): int
    {
        return $this->getDaysUntilExpiry();
    }

    /**
     * appends: can_change_status
     */
    public function getCanChangeStatusAttribute(): bool
    {
        return $this->canChangeStatus();
    }

    /**
     * appends: can_edit
     */
    public function getCanEditAttribute(): bool
    {
        return $this->canEdit();
    }

    /**
     * appends: can_delete
     */
    public function getCanDeleteAttribute(): bool
    {
        return $this->canDelete();
    }

    /**
     * appends: can_request_approval
     */
    public function getCanRequestApprovalAttribute(): bool
    {
        return $this->canRequestApproval();
    }

    /**
     * appends: is_under_approval
     */
    public function getIsUnderApprovalAttribute(): bool
    {
        return $this->isUnderApproval();
    }

    /**
     * appends: is_approved
     */
    public function getIsApprovedAttribute(): bool
    {
        return $this->isApproved();
    }

    /**
     * appends: is_rejected
     */
    public function getIsRejectedAttribute(): bool
    {
        return $this->isRejected();
    }

    /**
     * appends: is_returned
     */
    public function getIsReturnedAttribute(): bool
    {
        return $this->isReturned();
    }

    /**
     * appends: is_cancelled
     */
    public function getIsCancelledAttribute(): bool
    {
        return $this->isCancelled();
    }

    // ===== イベント =====

    /**
     * モデル作成時の処理
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($estimate) {
            if (!$estimate->id) {
                $estimate->id = \Illuminate\Support\Str::uuid();
            }
            if (!$estimate->issue_date) {
                $estimate->issue_date = now();
            }
            if (!$estimate->expiry_date) {
                $estimate->expiry_date = now()->addMonths(3);
            }
        });

        static::updating(function ($estimate) {
            if ($estimate->isDirty('status') && $estimate->status === 'approved') {
                $estimate->approved_at = now();
            }
        });
    }

    // ===== 金額計算メソッド =====

    /**
     * 小計を計算
     */
    public function calculateSubtotal(): void
    {
        $this->subtotal = $this->items()->sum('amount');
        $this->save();
    }

    /**
     * 一般管理費を計算
     */
    public function calculateOverheadAmount(): void
    {
        $this->overhead_amount = $this->subtotal * ($this->overhead_rate / 100);
        $this->save();
    }

    /**
     * 原価経費を計算
     */
    public function calculateCostExpenseAmount(): void
    {
        $this->cost_expense_amount = $this->subtotal * ($this->cost_expense_rate / 100);
        $this->save();
    }

    /**
     * 材料経費を計算
     */
    public function calculateMaterialExpenseAmount(): void
    {
        $this->material_expense_amount = $this->subtotal * ($this->material_expense_rate / 100);
        $this->save();
    }

    /**
     * 消費税を計算
     */
    public function calculateTaxAmount(): void
    {
        $this->tax_amount = ($this->subtotal + $this->overhead_amount + $this->cost_expense_amount + $this->material_expense_amount) * $this->tax_rate;
        $this->save();
    }

    /**
     * 割引額を計算
     */
    public function calculateDiscountAmount(): void
    {
        $this->discount_amount = ($this->subtotal + $this->overhead_amount + $this->cost_expense_amount + $this->material_expense_amount) * ($this->discount_rate / 100);
        $this->save();
    }

    /**
     * 合計金額を計算
     */
    public function calculateTotalAmount(): void
    {
        $this->total_amount = $this->subtotal + $this->overhead_amount + $this->cost_expense_amount + $this->material_expense_amount + $this->tax_amount - $this->discount_amount;
        $this->save();
    }

    /**
     * 利益額を計算
     */
    public function calculateProfitAmount(): void
    {
        $this->profit_amount = $this->total_amount * ($this->profit_margin / 100);
        $this->save();
    }

    /**
     * 全額計算を実行
     */
    public function calculateAllAmounts(): void
    {
        $this->calculateSubtotal();
        $this->calculateOverheadAmount();
        $this->calculateCostExpenseAmount();
        $this->calculateMaterialExpenseAmount();
        $this->calculateTaxAmount();
        $this->calculateDiscountAmount();
        $this->calculateTotalAmount();
        $this->calculateProfitAmount();
    }

    /**
     * 見積番号を生成
     */
    private function generateEstimateNumber(): string
    {
        $year = date('Y');
        $lastEstimate = static::where('estimate_number', 'like', "EST-{$year}-%")
            ->orderBy('estimate_number', 'desc')
            ->first();

        if ($lastEstimate) {
            $lastNumber = (int) substr($lastEstimate->estimate_number, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return sprintf('EST-%s-%03d', $year, $newNumber);
    }
}
