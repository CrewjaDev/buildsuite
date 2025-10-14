<?php

namespace App\Services;

class BusinessCodeService
{
    /**
     * シーダー用のデフォルト業務コード定義
     * 初期データベース設定用のみ。実行時はデータベースから取得
     */
    private const SEEDER_DEFAULT_BUSINESS_CODES = [
        // システム固定コード
        'role' => [
            'name' => '役割設定',
            'description' => '役割の設定',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'use',
                'view',
                'create',
                'edit',
                'delete'
            ]
        ],
        'department' => [
            'name' => '部署設定',
            'description' => '部署の設定',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'use',
                'view',
                'create',
                'edit',
                'delete'
            ]
        ],
        'system' => [
            'name' => 'シス権設定',
            'description' => 'システム権限の設定',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'use',
                'view',
                'edit'
            ]
        ],
        'approval' => [
            'name' => '承認設定',
            'description' => '承認フロー設定・承認依頼の管理',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'use',
                'flow.list',
                'flow.view',
                'flow.create',
                'flow.edit',
                'flow.delete',
                'approval.request',
                'approval.list',
                'approval.view',
                'approval.approve',
                'approval.reject',
                'approval.return',
                'approval.cancel',
                'approval.authority'
                ]
        ],
        'employee' => [
            'name' => '社員設定',
            'description' => '社員情報の設定',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'use',
                'view',
                'create',
                'edit',
                'delete'
            ]
        ],
        'partner' => [
            'name' => '取引先設定',
            'description' => '取引先情報の設定',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'use',
                'view',
                'create',
                'edit',
                'delete'
            ]
        ],
        'permission' => [
            'name' => '権限設定',
            'description' => '権限の設定',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'use',
                'view',
                'create',
                'edit',
                'delete'
            ]
        ],
        
        // ビジネスロジックコード（基盤業務）
        'estimate' => [
            'name' => '見積',
            'description' => '見積書の作成・承認業務',
            'category' => 'financial',
            'is_system' => false,
            'is_core' => true,
            'default_permissions' => [
                'use',
                'list',
                'create',
                'view',
                'edit',
                'delete',
                'approval.request',
                'approval.list',
                'approval.view',
                'approval.approve',
                'approval.reject',
                'approval.return',
                'approval.cancel',
                'responsible_user.change',
                'responsible_user.set_self'
            ],
            'settings' => [
                'max_amount' => 10000000,
                'currency' => 'JPY',
                'validity_days' => 30
            ]
        ],
        'budget' => [
            'name' => '予算',
            'description' => '予算の申請・承認業務',
            'category' => 'financial',
            'is_system' => false,
            'is_core' => true,
            'default_permissions' => [
                'use',
                'list',
                'create',
                'view',
                'edit',
                'delete',
                'approval.request',
                'approval.list',
                'approval.view',
                'approval.approve',
                'approval.reject',
                'approval.return',
                'approval.cancel'
            ],
            'settings' => [
                'fiscal_year' => true,
                'currency' => 'JPY'
            ]
        ],
        'purchase' => [
            'name' => '発注',
            'description' => '発注の申請・承認業務',
            'category' => 'financial',
            'is_system' => false,
            'is_core' => true,
            'default_permissions' => [
                'use',
                'list',
                'create',
                'view',
                'edit',
                'delete',
                'approval.request',
                'approval.list',
                'approval.view',
                'approval.approve',
                'approval.reject',
                'approval.return',
                'approval.cancel'
            ],
            'settings' => [
                'max_amount' => 5000000,
                'currency' => 'JPY',
                'vendor_required' => true
            ]
        ],
        
        // ビジネスロジックコード（拡張業務）
        'construction' => [
            'name' => '工事',
            'description' => '工事関連の承認業務',
            'category' => 'construction',
            'is_system' => false,
            'is_core' => false,
            'default_permissions' => [
                'use',
                'list',
                'create',
                'view',
                'edit',
                'delete',
                'approval.request',
                'approval.list',
                'approval.view',
                'approval.approve',
                'approval.reject',
                'approval.return',
                'approval.cancel'
            ],
            'settings' => [
                'max_amount' => 50000000,
                'currency' => 'JPY',
                'validity_days' => 60
            ]
        ],
        'general' => [
            'name' => '一般',
            'description' => '一般的な承認業務',
            'category' => 'general',
            'is_system' => false,
            'is_core' => false,
            'default_permissions' => [
                'use',
                'list',
                'create',
                'view',
                'edit',
                'delete',
                'approval.request',
                'approval.list',
                'approval.view',
                'approval.approve',
                'approval.reject',
                'approval.return',
                'approval.cancel'
            ],
            'settings' => []
        ]
    ];

    /**
     * シーダー用のデフォルト業務コード定義を取得
     * 初期データベース設定用のみ
     * 
     * @return array
     */
    public static function getSeederDefaultBusinessCodes(): array
    {
        return self::SEEDER_DEFAULT_BUSINESS_CODES;
    }

    /**
     * 全業務コードを取得（データベースから取得）
     * 実行時はデータベースから動的に取得
     * 
     * @return array
     */
    public static function getAllBusinessCodes(): array
    {
        try {
            $businessCodes = \App\Models\BusinessCode::with('permissions')->get();
            
            return $businessCodes->mapWithKeys(function ($businessCode) {
                return [
                    $businessCode->code => [
                        'name' => $businessCode->name,
                        'description' => $businessCode->description,
                        'category' => $businessCode->category,
                        'is_system' => $businessCode->is_system,
                        'is_core' => $businessCode->is_core,
                        'default_permissions' => $businessCode->permissions->pluck('name')->toArray(),
                        'settings' => $businessCode->settings ?? []
                    ]
                ];
            })->toArray();
        } catch (\Exception $e) {
            // データベースエラーの場合はフォールバック
            \Log::warning('ビジネスコードのデータベース取得に失敗、フォールバックを使用: ' . $e->getMessage());
            return self::SEEDER_DEFAULT_BUSINESS_CODES;
        }
    }

    /**
     * システム固定の業務コードを取得
     * 
     * @return array
     */
    public static function getSystemBusinessCodes(): array
    {
        return array_filter(self::SEEDER_DEFAULT_BUSINESS_CODES, function ($config) {
            return $config['is_system'] === true;
        });
    }

    /**
     * ビジネスロジックの業務コードを取得
     * 
     * @return array
     */
    public static function getBusinessLogicCodes(): array
    {
        return array_filter(self::SEEDER_DEFAULT_BUSINESS_CODES, function ($config) {
            return $config['is_system'] === false;
        });
    }

    /**
     * 基盤業務コードを取得
     * 
     * @return array
     */
    public static function getCoreBusinessCodes(): array
    {
        return array_filter(self::SEEDER_DEFAULT_BUSINESS_CODES, function ($config) {
            return $config['is_core'] === true;
        });
    }

    /**
     * 拡張業務コードを取得
     * 
     * @return array
     */
    public static function getExtensibleBusinessCodes(): array
    {
        return array_filter(self::SEEDER_DEFAULT_BUSINESS_CODES, function ($config) {
            return $config['is_core'] === false;
        });
    }

    /**
     * システム固定の業務コード名一覧を取得
     * 
     * @return array
     */
    public static function getSystemBusinessCodeNames(): array
    {
        return array_keys(self::getSystemBusinessCodes());
    }

    /**
     * ビジネスロジックの業務コード名一覧を取得
     * 
     * @return array
     */
    public static function getBusinessLogicCodeNames(): array
    {
        return array_keys(self::getBusinessLogicCodes());
    }

    /**
     * 業務コードの種類を判定
     * 
     * @param string $code
     * @return bool
     */
    public static function isSystemCode(string $code): bool
    {
        return isset(self::SEEDER_DEFAULT_BUSINESS_CODES[$code]) && 
               self::SEEDER_DEFAULT_BUSINESS_CODES[$code]['is_system'] === true;
    }

    /**
     * 業務コードの種類を判定
     * 
     * @param string $code
     * @return bool
     */
    public static function isBusinessLogicCode(string $code): bool
    {
        return isset(self::SEEDER_DEFAULT_BUSINESS_CODES[$code]) && 
               self::SEEDER_DEFAULT_BUSINESS_CODES[$code]['is_system'] === false;
    }

    /**
     * 基盤業務コードかどうかを判定
     * 
     * @param string $code
     * @return bool
     */
    public static function isCoreCode(string $code): bool
    {
        return isset(self::SEEDER_DEFAULT_BUSINESS_CODES[$code]) && 
               self::SEEDER_DEFAULT_BUSINESS_CODES[$code]['is_core'] === true;
    }

    /**
     * 拡張業務コードかどうかを判定
     * 
     * @param string $code
     * @return bool
     */
    public static function isExtensibleCode(string $code): bool
    {
        return isset(self::SEEDER_DEFAULT_BUSINESS_CODES[$code]) && 
               self::SEEDER_DEFAULT_BUSINESS_CODES[$code]['is_core'] === false;
    }

    /**
     * 業務コードの詳細情報を取得
     * データ削除リスクを回避するため、ハードコーディングされた定数から取得
     * 
     * @param string $code
     * @return array|null
     */
    public static function getBusinessCodeInfo(string $code): ?array
    {
        return self::SEEDER_DEFAULT_BUSINESS_CODES[$code] ?? null;
    }

    /**
     * 業務コードのデフォルト権限を取得（データベースから取得）
     * 
     * @param string $code
     * @return array
     */
    public static function getDefaultPermissions(string $code): array
    {
        try {
            $businessCode = \App\Models\BusinessCode::where('code', $code)
                ->with('permissions')
                ->first();
            
            if ($businessCode) {
                return $businessCode->permissions->pluck('name')->toArray();
            }
            
            // データベースに見つからない場合はフォールバック
            $info = self::getBusinessCodeInfo($code);
            return $info['default_permissions'] ?? [];
        } catch (\Exception $e) {
            // データベースエラーの場合はフォールバック
            \Log::warning("ビジネスコード '{$code}' の権限取得に失敗、フォールバックを使用: " . $e->getMessage());
            $info = self::getBusinessCodeInfo($code);
            return $info['default_permissions'] ?? [];
        }
    }

    /**
     * 業務コードの設定を取得
     * 
     * @param string $code
     * @return array
     */
    public static function getSettings(string $code): array
    {
        $info = self::getBusinessCodeInfo($code);
        return $info['settings'] ?? [];
    }

    /**
     * カテゴリ別の業務コードを取得
     * 
     * @param string $category
     * @return array
     */
    public static function getBusinessCodesByCategory(string $category): array
    {
        $allCodes = self::SEEDER_DEFAULT_BUSINESS_CODES;
        
        return array_filter($allCodes, function ($config) use ($category) {
            return $config['category'] === $category;
        });
    }

    /**
     * システム権限レベルの業務コードを取得
     * 
     * @return array
     */
    public static function getSystemCategoryCodes(): array
    {
        return self::getBusinessCodesByCategory('system');
    }

    /**
     * 財務関連の業務コードを取得
     * 
     * @return array
     */
    public static function getFinancialCategoryCodes(): array
    {
        return self::getBusinessCodesByCategory('financial');
    }

    /**
     * 工事関連の業務コードを取得
     * 
     * @return array
     */
    public static function getConstructionCategoryCodes(): array
    {
        return self::getBusinessCodesByCategory('construction');
    }
}
