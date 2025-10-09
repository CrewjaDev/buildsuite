<?php

namespace App\Contracts;

use App\Models\User;
use App\Models\ApprovalRequest;

/**
 * 承認可能な業務データの共通インターフェース
 */
interface ApprovableData
{
    /**
     * 承認用データの取得
     * 
     * @return array 承認フロー選択に必要なデータ
     */
    public function getApprovalData(): array;
    
    /**
     * 承認状態の更新
     * 
     * @param string $action 承認アクション（approve, reject, return, cancel）
     * @param User $user 実行ユーザー
     * @return void
     */
    public function updateApprovalStatus(string $action, User $user): void;
    
    /**
     * 承認依頼可能かチェック
     * 
     * @param User $user ユーザー
     * @return bool 承認依頼可能かどうか
     */
    public function canRequestApproval(User $user): bool;
    
    /**
     * 承認依頼の取得
     * 
     * @return ApprovalRequest|null 承認依頼
     */
    public function getApprovalRequest(): ?ApprovalRequest;
    
    /**
     * 承認依頼の作成
     * 
     * @param User $user ユーザー
     * @param int|null $flowId 承認フローID（指定しない場合は自動選択）
     * @return ApprovalRequest 作成された承認依頼
     */
    public function createApprovalRequest(User $user, ?int $flowId = null): ApprovalRequest;
}
