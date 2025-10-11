<?php

namespace App\Services\Approval;

use App\Models\User;
use App\Models\Estimate;
use App\Models\ApprovalRequest;
use App\Contracts\ApprovableData;
use App\Services\Approval\CommonApprovalService;

/**
 * 汎用承認サービス
 * 業務データの種類に関係なく、統一された承認処理を提供
 */
class UniversalApprovalService
{
    protected $commonApprovalService;

    public function __construct(CommonApprovalService $commonApprovalService)
    {
        $this->commonApprovalService = $commonApprovalService;
    }

    /**
     * 汎用承認処理
     * 
     * @param string $requestType 業務データタイプ（estimate, purchase, contract等）
     * @param string|int $requestId 業務データID
     * @param User $user 実行ユーザー
     * @param string $action 承認アクション（approve, reject, return, cancel）
     * @param string|null $comment コメント
     * @return ApprovalResult 承認結果
     */
    public function processApproval(
        string $requestType,
        string|int $requestId,
        User $user,
        string $action,
        ?string $comment = null
    ): ApprovalResult {
        // 業務データの取得
        $data = $this->getBusinessData($requestType, $requestId);
        
        if (!$data) {
            throw new ApprovalException("業務データが見つかりません: {$requestType}#{$requestId}");
        }

        // 承認依頼の取得
        $approvalRequest = $data->getApprovalRequest();
        
        if (!$approvalRequest) {
            throw new ApprovalException('承認依頼が見つかりません');
        }

        // 現在の承認ステップを取得
        $currentStep = $this->commonApprovalService->getCurrentApprovalStep($approvalRequest);
        if (!$currentStep) {
            throw new ApprovalException('承認ステップが見つかりません');
        }

        // 承認者権限チェック
        if (!$this->commonApprovalService->canApproveStep($currentStep, $user)) {
            throw new ApprovalPermissionException('承認権限がありません');
        }

        // アクション固有の権限チェック
        $this->validateActionPermission($user, $action, $requestType);

        // 承認処理実行
        $this->commonApprovalService->processApproval($approvalRequest, $user, $comment, $action);

        // 業務データの状態更新
        $data->updateApprovalStatus($action, $user);

        return new ApprovalResult(
            success: true,
            message: $this->getActionMessage($action),
            approvalRequest: $approvalRequest->fresh(),
            businessData: $data->fresh()
        );
    }

    /**
     * 承認依頼の作成
     * 
     * @param string $requestType 業務データタイプ
     * @param string|int $requestId 業務データID
     * @param User $user ユーザー
     * @param int|null $flowId 承認フローID（指定しない場合は自動選択）
     * @return \App\Models\ApprovalRequest 作成された承認依頼
     */
    public function createApprovalRequest(
        string $requestType,
        string|int $requestId,
        User $user,
        ?int $flowId = null
    ): \App\Models\ApprovalRequest {
        \Log::info('UniversalApprovalService::createApprovalRequest 開始', [
            'requestType' => $requestType,
            'requestId' => $requestId,
            'userId' => $user->id,
            'flowId' => $flowId
        ]);
        
        // 業務データの取得
        $data = $this->getBusinessData($requestType, $requestId);
        
        \Log::info('業務データ取得結果', [
            'data_exists' => $data ? true : false,
            'data_type' => $data ? get_class($data) : null
        ]);
        
        if (!$data) {
            \Log::error('業務データが見つかりません', [
                'requestType' => $requestType,
                'requestId' => $requestId
            ]);
            throw new ApprovalException("業務データが見つかりません: {$requestType}#{$requestId}");
        }

        // 承認依頼可能かチェック
        $canRequest = $data->canRequestApproval($user);
        \Log::info('承認依頼可能チェック結果', [
            'canRequest' => $canRequest
        ]);
        
        if (!$canRequest) {
            \Log::error('承認依頼を作成できません', [
                'requestType' => $requestType,
                'requestId' => $requestId,
                'userId' => $user->id
            ]);
            throw new ApprovalException('承認依頼を作成できません');
        }

        // 承認依頼の作成
        \Log::info('承認依頼作成処理開始');
        $result = $data->createApprovalRequest($user, $flowId);
        \Log::info('承認依頼作成完了', [
            'approval_request_id' => $result->id ?? 'unknown'
        ]);
        
        return $result;
    }

    /**
     * 承認依頼のキャンセル
     * 
     * @param string $requestType 業務データタイプ
     * @param string|int $requestId 業務データID
     * @param User $user ユーザー
     * @param string|null $comment コメント
     * @return ApprovalResult 承認結果
     */
    public function cancelApprovalRequest(
        string $requestType,
        string|int $requestId,
        User $user,
        ?string $comment = null
    ): ApprovalResult {
        // 業務データの取得
        $data = $this->getBusinessData($requestType, $requestId);
        
        if (!$data) {
            throw new ApprovalException("業務データが見つかりません: {$requestType}#{$requestId}");
        }

        // 承認依頼の取得
        $approvalRequest = $data->getApprovalRequest();
        
        if (!$approvalRequest) {
            throw new ApprovalException('承認依頼が見つかりません');
        }

        // キャンセル権限チェック
        if (!$this->canCancelApprovalRequest($approvalRequest, $user)) {
            throw new ApprovalPermissionException('承認依頼をキャンセルする権限がありません');
        }

        // 承認依頼をキャンセル
        $approvalRequest->update([
            'status' => 'cancelled',
            'cancelled_by' => $user->id,
            'cancelled_at' => now(),
        ]);

        // 業務データの状態更新
        $data->updateApprovalStatus('cancel', $user);

        return new ApprovalResult(
            success: true,
            message: '承認依頼をキャンセルしました',
            approvalRequest: $approvalRequest->fresh(),
            businessData: $data->fresh()
        );
    }

    /**
     * 業務データの取得
     */
    private function getBusinessData(string $type, string|int $id): ?ApprovableData
    {
        return match($type) {
            'estimate' => Estimate::find($id),
            // 将来の実装
            // 'purchase' => Purchase::find($id),
            // 'contract' => Contract::find($id),
            // 'budget' => Budget::find($id),
            default => throw new ApprovalException("Unknown request type: {$type}")
        };
    }

    /**
     * アクション固有の権限チェック
     */
    private function validateActionPermission(User $user, string $action, string $requestType): void
    {
        $actionPermissions = [
            'approve' => "{$requestType}.approval.approve",
            'reject' => "{$requestType}.approval.reject",
            'return' => "{$requestType}.approval.return"
        ];

        $requiredPermission = $actionPermissions[$action] ?? null;
        if ($requiredPermission && !\App\Services\PermissionService::hasPermission($user, $requiredPermission)) {
            throw new ApprovalPermissionException("{$action}権限がありません");
        }
    }

    /**
     * 承認依頼キャンセル権限チェック
     */
    private function canCancelApprovalRequest($approvalRequest, User $user): bool
    {
        // 承認依頼作成者または管理者のみキャンセル可能
        return $approvalRequest->requested_by === $user->id || 
               $user->system_level >= 3; // 管理者レベル
    }

    /**
     * アクションメッセージの取得
     */
    private function getActionMessage(string $action): string
    {
        return match($action) {
            'approve' => '承認しました',
            'reject' => '却下しました',
            'return' => '差し戻しました',
            'cancel' => 'キャンセルしました',
            default => '処理しました'
        };
    }
}

/**
 * 承認結果クラス
 */
class ApprovalResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $message,
        public readonly ?object $approvalRequest = null,
        public readonly ?object $businessData = null,
        public readonly ?array $errors = null
    ) {}
}

/**
 * 承認例外クラス
 */
class ApprovalException extends \Exception
{
    public function __construct(
        string $message,
        public readonly string $errorCode = 'APPROVAL_ERROR',
        public readonly array $context = [],
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, 0, $previous);
    }
}

/**
 * 承認権限例外クラス
 */
class ApprovalPermissionException extends ApprovalException
{
    public function __construct(string $message, array $context = [])
    {
        parent::__construct($message, 'PERMISSION_DENIED', $context);
    }
}
