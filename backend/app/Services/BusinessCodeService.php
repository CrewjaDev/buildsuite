<?php

namespace App\Services;

class BusinessCodeService
{
    /**
     * 全業務コード定数（システム固定 + ビジネスロジック）
     * データ削除リスクを回避するため、すべてハードコーディング
     */
    private const ALL_BUSINESS_CODES = [
        // システム固定コード
        'role' => [
            'name' => '役割管理',
            'description' => '役割の作成・編集・削除・閲覧業務',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'role.use',
                'role.view',
                'role.create',
                'role.edit',
                'role.delete'
            ]
        ],
        'department' => [
            'name' => '部署管理',
            'description' => '部署の作成・編集・削除・閲覧業務',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'department.use',
                'department.view',
                'department.create',
                'department.edit',
                'department.delete'
            ]
        ],
        'system' => [
            'name' => 'システム管理',
            'description' => 'システム設定・管理業務',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'system.use',
                'system.view',
                'system.edit'
            ]
        ],
        'approval' => [
            'name' => '承認管理',
            'description' => '承認フロー・承認依頼の管理業務',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'approval.use',
                'approval.flow.view',
                'approval.flow.create',
                'approval.flow.edit',
                'approval.flow.delete',
                'approval.usage'
            ]
        ],
        'employee' => [
            'name' => '社員管理',
            'description' => '社員情報の作成・編集・削除・閲覧業務',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'employee.use',
                'employee.view',
                'employee.create',
                'employee.edit',
                'employee.delete'
            ]
        ],
        'partner' => [
            'name' => '取引先管理',
            'description' => '取引先情報の作成・編集・削除・閲覧業務',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'partner.use',
                'partner.view',
                'partner.create',
                'partner.edit',
                'partner.delete'
            ]
        ],
        'permission' => [
            'name' => '権限管理',
            'description' => '権限設定・権限管理業務',
            'category' => 'system',
            'is_system' => true,
            'is_core' => true,
            'default_permissions' => [
                'permission.use',
                'permission.view',
                'permission.create',
                'permission.edit',
                'permission.delete'
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
                'estimate.use',
                'estimate.create',
                'estimate.view',
                'estimate.edit',
                'estimate.delete',
                'estimate.approval.request',
                'estimate.approval.view',
                'estimate.approval.approve',
                'estimate.approval.reject',
                'estimate.approval.return',
                'estimate.approval.cancel'
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
                'budget.use',
                'budget.create',
                'budget.view',
                'budget.edit',
                'budget.delete',
                'budget.approval.request',
                'budget.approval.view',
                'budget.approval.approve',
                'budget.approval.reject',
                'budget.approval.return',
                'budget.approval.cancel'
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
                'purchase.use',
                'purchase.create',
                'purchase.view',
                'purchase.edit',
                'purchase.delete',
                'purchase.approval.request',
                'purchase.approval.view',
                'purchase.approval.approve',
                'purchase.approval.reject',
                'purchase.approval.return',
                'purchase.approval.cancel'
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
                'construction.use',
                'construction.create',
                'construction.view',
                'construction.edit',
                'construction.delete',
                'construction.approval.request',
                'construction.approval.view',
                'construction.approval.approve',
                'construction.approval.reject',
                'construction.approval.return',
                'construction.approval.cancel'
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
                'general.use',
                'general.create',
                'general.view',
                'general.edit',
                'general.delete',
                'general.approval.request',
                'general.approval.view',
                'general.approval.approve',
                'general.approval.reject',
                'general.approval.return',
                'general.approval.cancel'
            ],
            'settings' => []
        ]
    ];

    /**
     * 全業務コードを取得（完全ハードコーディング）
     * データ削除リスクを回避するため、データベースに依存しない
     * 
     * @return array
     */
    public static function getAllBusinessCodes(): array
    {
        return self::ALL_BUSINESS_CODES;
    }

    /**
     * システム固定の業務コードを取得
     * 
     * @return array
     */
    public static function getSystemBusinessCodes(): array
    {
        return array_filter(self::ALL_BUSINESS_CODES, function ($config) {
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
        return array_filter(self::ALL_BUSINESS_CODES, function ($config) {
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
        return array_filter(self::ALL_BUSINESS_CODES, function ($config) {
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
        return array_filter(self::ALL_BUSINESS_CODES, function ($config) {
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
        return isset(self::ALL_BUSINESS_CODES[$code]) && 
               self::ALL_BUSINESS_CODES[$code]['is_system'] === true;
    }

    /**
     * 業務コードの種類を判定
     * 
     * @param string $code
     * @return bool
     */
    public static function isBusinessLogicCode(string $code): bool
    {
        return isset(self::ALL_BUSINESS_CODES[$code]) && 
               self::ALL_BUSINESS_CODES[$code]['is_system'] === false;
    }

    /**
     * 基盤業務コードかどうかを判定
     * 
     * @param string $code
     * @return bool
     */
    public static function isCoreCode(string $code): bool
    {
        return isset(self::ALL_BUSINESS_CODES[$code]) && 
               self::ALL_BUSINESS_CODES[$code]['is_core'] === true;
    }

    /**
     * 拡張業務コードかどうかを判定
     * 
     * @param string $code
     * @return bool
     */
    public static function isExtensibleCode(string $code): bool
    {
        return isset(self::ALL_BUSINESS_CODES[$code]) && 
               self::ALL_BUSINESS_CODES[$code]['is_core'] === false;
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
        return self::ALL_BUSINESS_CODES[$code] ?? null;
    }

    /**
     * 業務コードのデフォルト権限を取得
     * 
     * @param string $code
     * @return array
     */
    public static function getDefaultPermissions(string $code): array
    {
        $info = self::getBusinessCodeInfo($code);
        return $info['default_permissions'] ?? [];
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
        $allCodes = self::getAllBusinessCodes();
        
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
