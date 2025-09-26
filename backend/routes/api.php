<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\SystemLevelController;
use App\Http\Controllers\EstimateController;
use App\Http\Controllers\EstimateItemController;
use App\Http\Controllers\EstimateBreakdownController;
use App\Http\Controllers\PartnerController;
use App\Http\Controllers\ProjectTypeController;
use App\Http\Controllers\ConstructionClassificationController;
use App\Http\Controllers\EstimateApprovalController;
// use App\Http\Controllers\SystemLevelPermissionController;
use App\Http\Controllers\ApprovalFlowController;
use App\Http\Controllers\ApprovalRequestController;
use App\Http\Controllers\ApprovalRequestTypeController;
use App\Http\Controllers\ApprovalRequestTemplateController;
use App\Http\Controllers\BusinessTypeController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// 認証不要のルート
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
});

// 認証が必要なルート
Route::middleware('auth:sanctum')->group(function () {
    // 認証関連
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
        Route::get('sessions', [AuthController::class, 'sessions']);
        Route::delete('sessions/{sessionId}', [AuthController::class, 'revokeSession']);
    });

    // 役割管理
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::get('/{role}', [RoleController::class, 'show']);
    });

    // ユーザー役割管理
    Route::prefix('users')->group(function () {
        Route::get('/{user}/roles', [RoleController::class, 'getUserRoles']);
        Route::put('/{user}/roles', [RoleController::class, 'updateUserRoles']);
    });

    // 社員管理
    Route::prefix('employees')->group(function () {
        Route::get('/', [EmployeeController::class, 'index']);
        Route::get('/options', [EmployeeController::class, 'getOptions']);
        Route::get('/system-levels', [EmployeeController::class, 'getSystemLevels']);
        Route::post('/', [EmployeeController::class, 'store']);
        Route::get('/{id}', [EmployeeController::class, 'show']);
        Route::put('/{id}', [EmployeeController::class, 'update']);
        Route::delete('/{id}', [EmployeeController::class, 'destroy']);
        
        // システム権限管理
        Route::post('/{id}/system-access', [EmployeeController::class, 'grantSystemAccess']);
        Route::delete('/{id}/system-access', [EmployeeController::class, 'revokeSystemAccess']);
    });

    // ユーザー管理（システム権限）
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/options', [UserController::class, 'getOptions']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
        Route::post('/{id}/toggle-lock', [UserController::class, 'toggleLock']);
        Route::post('/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::put('/{id}/password', [UserController::class, 'updatePassword']);
    });

    // 権限管理
    Route::prefix('permissions')->group(function () {
        Route::get('/', [PermissionController::class, 'index']);
        Route::get('/modules', [PermissionController::class, 'modules']);
        Route::get('/actions', [PermissionController::class, 'actions']);
        Route::get('/resources', [PermissionController::class, 'resources']);
        Route::post('/', [PermissionController::class, 'store']);
        Route::post('/bulk-create', [PermissionController::class, 'bulkCreate']);
        Route::get('/{id}', [PermissionController::class, 'show']);
        Route::put('/{id}', [PermissionController::class, 'update']);
        Route::delete('/{id}', [PermissionController::class, 'destroy']);
        Route::get('/{id}/usage', [PermissionController::class, 'usage']);
    });

    // 役割管理
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::get('/options', [RoleController::class, 'getOptions']);
        Route::post('/', [RoleController::class, 'store']);
        Route::get('/{id}', [RoleController::class, 'show']);
        Route::put('/{id}', [RoleController::class, 'update']);
        Route::delete('/{id}', [RoleController::class, 'destroy']);
        Route::post('/{id}/permissions', [RoleController::class, 'addPermissions']);
        Route::delete('/{id}/permissions', [RoleController::class, 'removePermissions']);
        Route::get('/{id}/usage', [RoleController::class, 'usage']);
    });

    // 部署管理
    Route::prefix('departments')->group(function () {
        Route::get('/', [DepartmentController::class, 'index']);
        Route::get('/tree', [DepartmentController::class, 'tree']);
        Route::get('/options', [DepartmentController::class, 'getOptions']);
        Route::post('/', [DepartmentController::class, 'store']);
        Route::get('/{id}', [DepartmentController::class, 'show']);
        Route::put('/{id}', [DepartmentController::class, 'update']);
        Route::delete('/{id}', [DepartmentController::class, 'destroy']);
        Route::post('/{id}/permissions', [DepartmentController::class, 'addPermissions']);
        Route::delete('/{id}/permissions', [DepartmentController::class, 'removePermissions']);
        Route::get('/{id}/usage', [DepartmentController::class, 'usage']);
    });

    // 職位管理
    Route::prefix('positions')->group(function () {
        Route::get('/', [PositionController::class, 'index']);
        Route::get('/options', [PositionController::class, 'getOptions']);
        Route::post('/', [PositionController::class, 'store']);
        Route::get('/{id}', [PositionController::class, 'show']);
        Route::put('/{id}', [PositionController::class, 'update']);
        Route::delete('/{id}', [PositionController::class, 'destroy']);
        Route::post('/{id}/permissions', [PositionController::class, 'addPermissions']);
        Route::delete('/{id}/permissions', [PositionController::class, 'removePermissions']);
        Route::get('/{id}/usage', [PositionController::class, 'usage']);
    });

    // システム権限レベル管理
    Route::prefix('system-levels')->group(function () {
        Route::get('/', [SystemLevelController::class, 'index']);
        Route::get('/options', [SystemLevelController::class, 'getOptions']);
        Route::post('/', [SystemLevelController::class, 'store']);
        Route::get('/{id}', [SystemLevelController::class, 'show']);
        Route::put('/{id}', [SystemLevelController::class, 'update']);
        Route::delete('/{id}', [SystemLevelController::class, 'destroy']);
        Route::post('/{id}/permissions', [SystemLevelController::class, 'addPermissions']);
        Route::delete('/{id}/permissions', [SystemLevelController::class, 'removePermissions']);
        Route::get('/{id}/usage', [SystemLevelController::class, 'usage']);
        Route::post('/update-priorities', [SystemLevelController::class, 'updatePriorities']);
    });

    // 見積管理
    Route::prefix('estimates')->group(function () {
        Route::get('/', [EstimateController::class, 'index']);
        Route::post('/', [EstimateController::class, 'store']);
        Route::get('/{id}', [EstimateController::class, 'show']);
        Route::put('/{id}', [EstimateController::class, 'update']);
        Route::delete('/{id}', [EstimateController::class, 'destroy']);
        Route::patch('/{id}/status', [EstimateController::class, 'updateStatus']);
        Route::post('/{id}/duplicate', [EstimateController::class, 'duplicate']);
        
        // 見積明細管理
        Route::get('/{id}/items/tree', [EstimateItemController::class, 'getTree']);
        Route::get('/{id}/items/stats', [EstimateItemController::class, 'getStats']);
        Route::put('/{id}/items/order', [EstimateItemController::class, 'updateOrder']);
        Route::delete('/{id}/items', [EstimateItemController::class, 'bulkDelete']);
        
        // 見積承認管理
        Route::post('/{id}/approval/request', [EstimateApprovalController::class, 'requestApproval']);
        Route::post('/{id}/approval/approve', [EstimateApprovalController::class, 'approve']);
        Route::post('/{id}/approval/reject', [EstimateApprovalController::class, 'reject']);
        Route::post('/{id}/approval/return', [EstimateApprovalController::class, 'return']);
        Route::post('/{id}/approval/cancel', [EstimateApprovalController::class, 'cancel']);
    });

    // 見積明細管理
    Route::prefix('estimate-items')->group(function () {
        Route::get('/', [EstimateItemController::class, 'index']);
        Route::post('/', [EstimateItemController::class, 'store']);
        Route::get('/{id}', [EstimateItemController::class, 'show']);
        Route::put('/{id}', [EstimateItemController::class, 'update']);
        Route::delete('/{id}', [EstimateItemController::class, 'destroy']);
    });

    // 取引先管理
    Route::prefix('partners')->group(function () {
        Route::get('/', [PartnerController::class, 'index']);
        Route::get('/options', [PartnerController::class, 'getOptions']);
        Route::post('/', [PartnerController::class, 'store']);
        Route::get('/{id}', [PartnerController::class, 'show']);
        Route::put('/{id}', [PartnerController::class, 'update']);
        Route::delete('/{id}', [PartnerController::class, 'destroy']);
        Route::post('/{id}/toggle-active', [PartnerController::class, 'toggleActive']);
    });

    // プロジェクトタイプ管理
    Route::prefix('project-types')->group(function () {
        Route::get('/', [ProjectTypeController::class, 'index']);
        Route::get('/options', [ProjectTypeController::class, 'getOptions']);
        Route::post('/', [ProjectTypeController::class, 'store']);
        Route::get('/{id}', [ProjectTypeController::class, 'show']);
        Route::put('/{id}', [ProjectTypeController::class, 'update']);
        Route::delete('/{id}', [ProjectTypeController::class, 'destroy']);
    });

    // 工事分類管理
    Route::prefix('construction-classifications')->group(function () {
        Route::get('/', [ConstructionClassificationController::class, 'index']);
        Route::get('/options', [ConstructionClassificationController::class, 'getOptions']);
        Route::post('/', [ConstructionClassificationController::class, 'store']);
        Route::get('/{id}', [ConstructionClassificationController::class, 'show']);
        Route::put('/{id}', [ConstructionClassificationController::class, 'update']);
        Route::delete('/{id}', [ConstructionClassificationController::class, 'destroy']);
    });

    // ビジネスタイプ管理
    Route::prefix('business-types')->group(function () {
        Route::get('/', [BusinessTypeController::class, 'index']);
        Route::get('/active', [BusinessTypeController::class, 'getActive']);
        Route::get('/category/{category}', [BusinessTypeController::class, 'getByCategory']);
        Route::get('/{id}', [BusinessTypeController::class, 'show']);
    });


            // システム権限レベル別権限管理（システム管理者のみ）
            // TODO: SystemLevelPermissionControllerを実装後に有効化
            /*
            Route::prefix('system-level-permissions')->group(function () {
                Route::get('/', [SystemLevelPermissionController::class, 'index']);
                Route::get('/{id}', [SystemLevelPermissionController::class, 'show']);
                Route::post('/{id}/attach', [SystemLevelPermissionController::class, 'attachPermission']);
                Route::post('/{id}/detach', [SystemLevelPermissionController::class, 'detachPermission']);
                Route::post('/{id}/sync', [SystemLevelPermissionController::class, 'syncPermissions']);
                Route::get('/available/permissions', [SystemLevelPermissionController::class, 'availablePermissions']);
                Route::get('/approval/permissions', [SystemLevelPermissionController::class, 'approvalPermissions']);
                Route::get('/status', [SystemLevelPermissionController::class, 'permissionStatus']);
            });
            */

            // 承認フロー管理
            Route::prefix('approval-flows')->group(function () {
                Route::get('/', [ApprovalFlowController::class, 'index']);
                Route::post('/', [ApprovalFlowController::class, 'store']);
                Route::get('/available', [ApprovalFlowController::class, 'available']);
                Route::get('/templates', [ApprovalFlowController::class, 'templates']);
                Route::post('/create-from-template', [ApprovalFlowController::class, 'createFromTemplate']);
                Route::get('/departments', [ApprovalFlowController::class, 'departments']);
                Route::get('/positions', [ApprovalFlowController::class, 'positions']);
                Route::get('/system-levels', [ApprovalFlowController::class, 'systemLevels']);
                Route::get('/users', [ApprovalFlowController::class, 'users']);
                Route::get('/{id}', [ApprovalFlowController::class, 'show']);
                Route::put('/{id}', [ApprovalFlowController::class, 'update']);
                Route::post('/{id}/duplicate', [ApprovalFlowController::class, 'duplicate']);
                Route::delete('/{id}', [ApprovalFlowController::class, 'destroy']);
            });

            // 承認依頼管理
            Route::prefix('approval-requests')->group(function () {
                Route::get('/pending-count', [ApprovalRequestController::class, 'pendingCount']);
                Route::get('/', [ApprovalRequestController::class, 'index']);
                Route::post('/', [ApprovalRequestController::class, 'store']);
                Route::get('/{id}', [ApprovalRequestController::class, 'show']);
                Route::get('/{id}/histories', [ApprovalRequestController::class, 'histories']);
                Route::post('/{id}/approve', [ApprovalRequestController::class, 'approve']);
                Route::post('/{id}/reject', [ApprovalRequestController::class, 'reject']);
                Route::post('/{id}/return', [ApprovalRequestController::class, 'return']);
                Route::post('/{id}/cancel', [ApprovalRequestController::class, 'cancel']);
            });

            // 承認依頼タイプ管理
            Route::prefix('approval-request-types')->group(function () {
                Route::get('/', [ApprovalRequestTypeController::class, 'index']);
                Route::post('/', [ApprovalRequestTypeController::class, 'store']);
                Route::get('/approval-flows', [ApprovalRequestTypeController::class, 'getApprovalFlows']);
                Route::get('/{id}', [ApprovalRequestTypeController::class, 'show']);
                Route::put('/{id}', [ApprovalRequestTypeController::class, 'update']);
                Route::delete('/{id}', [ApprovalRequestTypeController::class, 'destroy']);
            });

            // 承認依頼テンプレート管理
            Route::prefix('approval-request-templates')->group(function () {
                Route::get('/', [ApprovalRequestTemplateController::class, 'index']);
                Route::post('/', [ApprovalRequestTemplateController::class, 'store']);
                Route::get('/{id}', [ApprovalRequestTemplateController::class, 'show']);
                Route::put('/{id}', [ApprovalRequestTemplateController::class, 'update']);
                Route::delete('/{id}', [ApprovalRequestTemplateController::class, 'destroy']);
            });
        });

// GraphQL エンドポイント（承認フロー関連の複雑なクエリ用）
Route::post('/graphql', function (Request $request) {
    // GraphQL リクエストを処理
    return app(\Rebing\GraphQL\GraphQLController::class)->query($request);
})->middleware('auth:sanctum');

// テスト用GraphQLエンドポイント（認証不要）
Route::post('/graphql-test', function (Request $request) {
    // GraphQL リクエストを処理
    return app(\Rebing\GraphQL\GraphQLController::class)->query($request);
});

// 見積内訳関連のルート
Route::middleware('auth:sanctum')->group(function () {
    Route::get('estimate-breakdowns/tree', [EstimateBreakdownController::class, 'getTree']);
    Route::post('estimate-breakdowns/order', [EstimateBreakdownController::class, 'updateOrder']);
    Route::apiResource('estimate-breakdowns', EstimateBreakdownController::class);
});

// ヘルスチェック
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0',
    ]);
});
