<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Estimate;
use App\Models\ApprovalRequest;
use App\Services\PermissionService;
use App\Services\BusinessCodeService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * ユーザーダッシュボード用の統計データを取得
     */
    public function getUserStats(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['error' => '認証が必要です'], 401);
        }

        try {
            $stats = [
                'business_codes' => $this->getBusinessCodeStats($user),
                'approvals' => $this->getApprovalStats($user),
                'recent_activities' => $this->getRecentActivities($user),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '統計データの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * マネージャーダッシュボード用の統計データを取得
     */
    public function getManagerStats(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['error' => '認証が必要です'], 401);
        }

        try {
            $stats = [
                'department_estimates' => $this->getDepartmentEstimateStats($user),
                'team_approvals' => $this->getTeamApprovalStats($user),
                'team_activities' => $this->getTeamActivities($user),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'マネージャー統計データの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 管理者ダッシュボード用の統計データを取得
     */
    public function getAdminStats(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['error' => '認証が必要です'], 401);
        }

        try {
            $stats = [
                'system_overview' => $this->getSystemOverviewStats($user),
                'user_management' => $this->getUserManagementStats($user),
                'approval_system' => $this->getApprovalSystemStats($user),
                'recent_system_activities' => $this->getRecentSystemActivities($user),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '管理者統計データの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ビジネスコード別の統計データを取得
     */
    private function getBusinessCodeStats(User $user): array
    {
        $businessCodeStats = [];
        
        // ビジネスロジックコードを取得
        $businessLogicCodes = BusinessCodeService::getBusinessLogicCodes();
        
        foreach ($businessLogicCodes as $code => $config) {
            // ユーザーがこのビジネスコードの権限を持っているかチェック
            if (PermissionService::hasAnyBusinessCodePermission($user, $code, $config['default_permissions'])) {
                $businessCodeStats[$code] = $this->getStatsForBusinessCode($user, $code, $config);
            }
        }
        
        return $businessCodeStats;
    }

    /**
     * 特定のビジネスコードの統計データを取得
     */
    private function getStatsForBusinessCode(User $user, string $code, array $config): array
    {
        $currentMonth = now()->startOfMonth();
        
        switch ($code) {
            case 'estimate':
                return $this->getEstimateStats($user);
            case 'budget':
                return $this->getBudgetStats($user);
            case 'purchase':
                return $this->getPurchaseStats($user);
            case 'construction':
                return $this->getConstructionStats($user);
            case 'general':
                return $this->getGeneralStats($user);
            default:
                return [
                    'draft_count' => 0,
                    'pending_approval_count' => 0,
                    'approved_count' => 0,
                    'total_amount' => 0,
                    'has_permission' => true
                ];
        }
    }

    /**
     * 見積関連の統計データを取得
     */
    private function getEstimateStats(User $user): array
    {
        $currentMonth = now()->startOfMonth();
        
        // 見積作成権限がある場合のみ統計を取得
        if (!PermissionService::hasPermission($user, 'estimate.view')) {
            return [
                'draft_count' => 0,
                'pending_approval_count' => 0,
                'approved_count' => 0,
                'total_amount' => 0,
                'has_permission' => false
            ];
        }

        $allEstimates = Estimate::where('created_by', $user->id);
        $monthlyEstimates = (clone $allEstimates)->where('created_at', '>=', $currentMonth);

        // 今月の統計
        $monthlyDraftCount = (clone $monthlyEstimates)->where('status', 'draft')->count();
        $monthlyPendingApprovalCount = (clone $monthlyEstimates)->whereHas('approvalRequest', function ($q) {
            $q->where('status', 'pending');
        })->count();
        $monthlyApprovedCount = (clone $monthlyEstimates)->whereHas('approvalRequest', function ($q) {
            $q->where('status', 'approved');
        })->count();
        $monthlyTotalAmount = (clone $monthlyEstimates)->sum('total_amount');

        // 総計の統計
        $totalDraftCount = (clone $allEstimates)->where('status', 'draft')->count();
        $totalPendingApprovalCount = (clone $allEstimates)->whereHas('approvalRequest', function ($q) {
            $q->where('status', 'pending');
        })->count();
        $totalApprovedCount = (clone $allEstimates)->whereHas('approvalRequest', function ($q) {
            $q->where('status', 'approved');
        })->count();
        $totalAmount = (clone $allEstimates)->sum('total_amount');

        return [
            'monthly' => [
                'draft_count' => $monthlyDraftCount,
                'pending_approval_count' => $monthlyPendingApprovalCount,
                'approved_count' => $monthlyApprovedCount,
                'total_amount' => $monthlyTotalAmount,
            ],
            'total' => [
                'draft_count' => $totalDraftCount,
                'pending_approval_count' => $totalPendingApprovalCount,
                'approved_count' => $totalApprovedCount,
                'total_amount' => $totalAmount,
            ],
            'has_permission' => true
        ];
    }

    /**
     * 承認関連の統計データを取得
     */
    private function getApprovalStats(User $user): array
    {
        // 承認関連権限がある場合のみ統計を取得
        $hasApprovalViewPermission = PermissionService::hasPermission($user, 'estimate.approval.view');
        $hasApprovalRequestPermission = PermissionService::hasPermission($user, 'estimate.approval.request');

        if (!$hasApprovalViewPermission && !$hasApprovalRequestPermission) {
            return [
                'my_pending_requests' => 0,
                'my_approved_requests' => 0,
                'has_permission' => false
            ];
        }

        $currentMonth = now()->startOfMonth();

        // 自分が作成した承認依頼の統計
        $myRequests = ApprovalRequest::where('requested_by', $user->id)
            ->where('created_at', '>=', $currentMonth);

        $myPendingRequests = (clone $myRequests)->where('status', 'pending')->count();
        $myApprovedRequests = (clone $myRequests)->where('status', 'approved')->count();

        return [
            'my_pending_requests' => $myPendingRequests,
            'my_approved_requests' => $myApprovedRequests,
            'has_permission' => true
        ];
    }

    /**
     * 最近の活動データを取得
     */
    private function getRecentActivities(User $user): array
    {
        $activities = [];

        // 見積作成履歴
        if (PermissionService::hasPermission($user, 'estimate.view')) {
            $recentEstimates = Estimate::where('created_by', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            foreach ($recentEstimates as $estimate) {
                $activities[] = [
                    'type' => 'estimate_created',
                    'title' => "見積書「{$estimate->project_name}」を作成",
                    'description' => "見積番号: {$estimate->estimate_number}",
                    'timestamp' => $estimate->created_at,
                    'status' => $estimate->status,
                    'estimate_id' => $estimate->id
                ];
            }
        }

        // 承認依頼履歴
        if (PermissionService::hasPermission($user, 'estimate.approval.view')) {
            $recentApprovalRequests = ApprovalRequest::where('requested_by', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            foreach ($recentApprovalRequests as $request) {
                $activities[] = [
                    'type' => 'approval_request_created',
                    'title' => "承認依頼「{$request->title}」を作成",
                    'description' => "ステータス: {$request->status}",
                    'timestamp' => $request->created_at,
                    'status' => $request->status,
                    'request_id' => $request->id
                ];
            }
        }

        // タイムスタンプでソートして最新5件を返す
        usort($activities, function ($a, $b) {
            return $b['timestamp'] <=> $a['timestamp'];
        });

        return array_slice($activities, 0, 5);
    }

    /**
     * 部署内見積統計データを取得
     */
    private function getDepartmentEstimateStats(User $user): array
    {
        if (!PermissionService::hasPermission($user, 'estimate.view')) {
            return [
                'department_estimate_count' => 0,
                'department_pending_count' => 0,
                'department_approved_count' => 0,
                'department_total_amount' => 0,
                'has_permission' => false
            ];
        }

        $currentMonth = now()->startOfMonth();
        $departmentId = $user->employee?->department_id;

        if (!$departmentId) {
            return [
                'department_estimate_count' => 0,
                'department_pending_count' => 0,
                'department_approved_count' => 0,
                'department_total_amount' => 0,
                'has_permission' => true
            ];
        }

        $departmentEstimates = Estimate::whereHas('creator.employee', function ($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })->where('created_at', '>=', $currentMonth);

        $estimateCount = (clone $departmentEstimates)->count();
        $pendingCount = (clone $departmentEstimates)->where('status', 'submitted')->count();
        $approvedCount = (clone $departmentEstimates)->where('status', 'approved')->count();
        $totalAmount = (clone $departmentEstimates)->sum('total_amount');

        return [
            'department_estimate_count' => $estimateCount,
            'department_pending_count' => $pendingCount,
            'department_approved_count' => $approvedCount,
            'department_total_amount' => $totalAmount,
            'has_permission' => true
        ];
    }

    /**
     * チーム承認統計データを取得
     */
    private function getTeamApprovalStats(User $user): array
    {
        $hasApprovalViewPermission = PermissionService::hasPermission($user, 'estimate.approval.view');
        
        if (!$hasApprovalViewPermission) {
            return [
                'team_pending_requests' => 0,
                'team_approved_requests' => 0,
                'has_permission' => false
            ];
        }

        $currentMonth = now()->startOfMonth();
        $departmentId = $user->employee?->department_id;

        if (!$departmentId) {
            return [
                'team_pending_requests' => 0,
                'team_approved_requests' => 0,
                'has_permission' => true
            ];
        }

        $teamRequests = ApprovalRequest::whereHas('requester.employee', function ($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })->where('created_at', '>=', $currentMonth);

        $pendingRequests = (clone $teamRequests)->where('status', 'pending')->count();
        $approvedRequests = (clone $teamRequests)->where('status', 'approved')->count();

        return [
            'team_pending_requests' => $pendingRequests,
            'team_approved_requests' => $approvedRequests,
            'has_permission' => true
        ];
    }

    /**
     * チーム活動データを取得
     */
    private function getTeamActivities(User $user): array
    {
        $activities = [];
        $departmentId = $user->employee?->department_id;

        if (!$departmentId) {
            return $activities;
        }

        // 部署内の見積作成履歴
        if (PermissionService::hasPermission($user, 'estimate.view')) {
            $teamEstimates = Estimate::whereHas('creator.employee', function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })->orderBy('created_at', 'desc')->limit(5)->get();

            foreach ($teamEstimates as $estimate) {
                $activities[] = [
                    'type' => 'team_estimate_created',
                    'title' => "チームメンバーが見積書「{$estimate->project_name}」を作成",
                    'description' => "作成者: {$estimate->creator->employee->name}",
                    'timestamp' => $estimate->created_at,
                    'status' => $estimate->status,
                    'estimate_id' => $estimate->id
                ];
            }
        }

        // 部署内の承認依頼履歴
        if (PermissionService::hasPermission($user, 'estimate.approval.view')) {
            $teamApprovalRequests = ApprovalRequest::whereHas('requester.employee', function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })->orderBy('created_at', 'desc')->limit(5)->get();

            foreach ($teamApprovalRequests as $request) {
                $activities[] = [
                    'type' => 'team_approval_request_created',
                    'title' => "チームメンバーが承認依頼「{$request->title}」を作成",
                    'description' => "依頼者: {$request->requester->employee->name}",
                    'timestamp' => $request->created_at,
                    'status' => $request->status,
                    'request_id' => $request->id
                ];
            }
        }

        // タイムスタンプでソートして最新5件を返す
        usort($activities, function ($a, $b) {
            return $b['timestamp'] <=> $a['timestamp'];
        });

        return array_slice($activities, 0, 5);
    }

    /**
     * システム概要統計データを取得
     */
    private function getSystemOverviewStats(User $user): array
    {
        $currentMonth = now()->startOfMonth();

        $totalUsers = User::where('is_active', true)->count();
        $totalEstimates = Estimate::where('created_at', '>=', $currentMonth)->count();
        $totalApprovalRequests = ApprovalRequest::where('created_at', '>=', $currentMonth)->count();
        $totalAmount = Estimate::where('created_at', '>=', $currentMonth)->sum('total_amount');

        return [
            'total_users' => $totalUsers,
            'total_estimates' => $totalEstimates,
            'total_approval_requests' => $totalApprovalRequests,
            'total_amount' => $totalAmount
        ];
    }

    /**
     * ユーザー管理統計データを取得
     */
    private function getUserManagementStats(User $user): array
    {
        $activeUsers = User::where('is_active', true)->count();
        $inactiveUsers = User::where('is_active', false)->count();
        $adminUsers = User::where('is_admin', true)->count();
        $recentLogins = User::where('last_login_at', '>=', now()->subDays(7))->count();

        return [
            'active_users' => $activeUsers,
            'inactive_users' => $inactiveUsers,
            'admin_users' => $adminUsers,
            'recent_logins' => $recentLogins
        ];
    }

    /**
     * 承認システム統計データを取得
     */
    private function getApprovalSystemStats(User $user): array
    {
        $currentMonth = now()->startOfMonth();

        $pendingApprovals = ApprovalRequest::where('status', 'pending')->count();
        $approvedThisMonth = ApprovalRequest::where('status', 'approved')
            ->where('approved_at', '>=', $currentMonth)->count();
        $rejectedThisMonth = ApprovalRequest::where('status', 'rejected')
            ->where('rejected_at', '>=', $currentMonth)->count();

        return [
            'pending_approvals' => $pendingApprovals,
            'approved_this_month' => $approvedThisMonth,
            'rejected_this_month' => $rejectedThisMonth
        ];
    }

    /**
     * 最近のシステム活動データを取得
     */
    private function getRecentSystemActivities(User $user): array
    {
        $activities = [];

        // 最近の見積作成
        $recentEstimates = Estimate::orderBy('created_at', 'desc')->limit(3)->get();
        foreach ($recentEstimates as $estimate) {
            $activities[] = [
                'type' => 'system_estimate_created',
                'title' => "見積書「{$estimate->project_name}」が作成されました",
                'description' => "作成者: {$estimate->creator->employee->name}",
                'timestamp' => $estimate->created_at,
                'status' => $estimate->status,
                'estimate_id' => $estimate->id
            ];
        }

        // 最近の承認依頼
        $recentApprovalRequests = ApprovalRequest::orderBy('created_at', 'desc')->limit(3)->get();
        foreach ($recentApprovalRequests as $request) {
            $activities[] = [
                'type' => 'system_approval_request_created',
                'title' => "承認依頼「{$request->title}」が作成されました",
                'description' => "依頼者: {$request->requester->employee->name}",
                'timestamp' => $request->created_at,
                'status' => $request->status,
                'request_id' => $request->id
            ];
        }

        // タイムスタンプでソートして最新5件を返す
        usort($activities, function ($a, $b) {
            return $b['timestamp'] <=> $a['timestamp'];
        });

        return array_slice($activities, 0, 5);
    }

    /**
     * 予算関連の統計データを取得
     */
    private function getBudgetStats(User $user): array
    {
        // 予算機能が実装されていない場合は仮のデータを返す
        return [
            'draft_count' => 0,
            'pending_approval_count' => 0,
            'approved_count' => 0,
            'total_amount' => 0,
            'has_permission' => true
        ];
    }

    /**
     * 発注関連の統計データを取得
     */
    private function getPurchaseStats(User $user): array
    {
        // 発注機能が実装されていない場合は仮のデータを返す
        return [
            'draft_count' => 0,
            'pending_approval_count' => 0,
            'approved_count' => 0,
            'total_amount' => 0,
            'has_permission' => true
        ];
    }

    /**
     * 工事関連の統計データを取得
     */
    private function getConstructionStats(User $user): array
    {
        // 工事機能が実装されていない場合は仮のデータを返す
        return [
            'draft_count' => 0,
            'pending_approval_count' => 0,
            'approved_count' => 0,
            'total_amount' => 0,
            'has_permission' => true
        ];
    }

    /**
     * 一般関連の統計データを取得
     */
    private function getGeneralStats(User $user): array
    {
        // 一般機能が実装されていない場合は仮のデータを返す
        return [
            'draft_count' => 0,
            'pending_approval_count' => 0,
            'approved_count' => 0,
            'total_amount' => 0,
            'has_permission' => true
        ];
    }
}
