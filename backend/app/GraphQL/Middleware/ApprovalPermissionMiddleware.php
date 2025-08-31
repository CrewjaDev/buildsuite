<?php

namespace App\GraphQL\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApprovalPermissionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // 認証チェック
        if (!Auth::check()) {
            return response()->json([
                'errors' => [
                    [
                        'message' => '認証が必要です',
                        'extensions' => [
                            'category' => 'authentication'
                        ]
                    ]
                ]
            ], 401);
        }

        $user = Auth::user();
        $operationName = $request->input('operationName');
        $variables = $request->input('variables', []);

        // 承認関連の操作に対する権限チェック
        if ($this->isApprovalOperation($operationName)) {
            if (!$this->hasApprovalPermission($user, $operationName, $variables)) {
                return response()->json([
                    'errors' => [
                        [
                            'message' => '承認操作の権限がありません',
                            'extensions' => [
                                'category' => 'authorization',
                                'operation' => $operationName
                            ]
                        ]
                    ]
                ], 403);
            }
        }

        return $next($request);
    }

    /**
     * 承認関連の操作かチェック
     */
    private function isApprovalOperation(string $operationName): bool
    {
        $approvalOperations = [
            'createApprovalFlow',
            'updateApprovalFlow',
            'deleteApprovalFlow',
            'createApprovalRequest',
            'updateApprovalRequest',
            'deleteApprovalRequest',
            'approveRequest',
            'rejectRequest',
            'returnRequest',
            'cancelRequest',
        ];

        return in_array($operationName, $approvalOperations);
    }

    /**
     * 承認操作の権限があるかチェック
     */
    private function hasApprovalPermission($user, string $operationName, array $variables): bool
    {
        // 管理者は全ての操作を実行可能
        if ($user->is_admin) {
            return true;
        }

        // 操作別の権限チェック
        switch ($operationName) {
            case 'createApprovalFlow':
            case 'updateApprovalFlow':
            case 'deleteApprovalFlow':
                return $user->hasPermission('approval.flow.manage');

            case 'createApprovalRequest':
                return $user->hasPermission('approval.request.create');

            case 'updateApprovalRequest':
            case 'deleteApprovalRequest':
                // 作成者または管理者のみ更新・削除可能
                if (isset($variables['id'])) {
                    $approvalRequest = \App\Models\ApprovalRequest::find($variables['id']);
                    if ($approvalRequest && $approvalRequest->requested_by === $user->id) {
                        return true;
                    }
                }
                return $user->hasPermission('approval.request.manage');

            case 'approveRequest':
                return $user->hasPermission('approval.request.approve');

            case 'rejectRequest':
                return $user->hasPermission('approval.request.reject');

            case 'returnRequest':
                return $user->hasPermission('approval.request.return');

            case 'cancelRequest':
                // 作成者または管理者のみキャンセル可能
                if (isset($variables['id'])) {
                    $approvalRequest = \App\Models\ApprovalRequest::find($variables['id']);
                    if ($approvalRequest && $approvalRequest->requested_by === $user->id) {
                        return true;
                    }
                }
                return $user->hasPermission('approval.request.cancel');

            default:
                return false;
        }
    }
}
