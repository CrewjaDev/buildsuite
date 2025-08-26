<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\SystemLevelController;

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

    // ユーザー管理
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/options', [UserController::class, 'getOptions']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
        Route::post('/{id}/toggle-lock', [UserController::class, 'toggleLock']);
        Route::post('/{id}/reset-password', [UserController::class, 'resetPassword']);
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
});

// ヘルスチェック
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0',
    ]);
});
