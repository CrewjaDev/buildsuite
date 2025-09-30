/**
 * 権限判定のユーティリティ関数
 */

/**
 * ユーザーが指定されたビジネスコードの機能を利用できるかチェック
 * 統合権限リストを使用して効率的に判定
 * 
 * @param effectivePermissions 統合権限リスト
 * @param businessCode ビジネスコード
 * @returns 利用可能かどうか
 */
export const canUseBusinessCode = (effectivePermissions: string[], businessCode: string): boolean => {
  // システム管理者は全権限を持つ
  if (effectivePermissions.includes('*')) {
    return true;
  }
  
  // 統合権限リストから直接チェック
  return effectivePermissions.includes(`${businessCode}.use`);
};

/**
 * ユーザーが指定された権限を持っているかチェック
 * 統合権限リストを使用して効率的に判定
 * 
 * @param effectivePermissions 統合権限リスト
 * @param permissionName 権限名
 * @returns 権限を持っているかどうか
 */
export const hasPermission = (effectivePermissions: string[], permissionName: string): boolean => {
  // システム管理者は全権限を持つ
  if (effectivePermissions.includes('*')) {
    return true;
  }
  
  return effectivePermissions.includes(permissionName);
};

/**
 * ユーザーが利用可能なシステム機能一覧を取得
 * 
 * @param effectivePermissions 統合権限リスト
 * @returns 利用可能なシステム機能一覧
 */
export const getAvailableSystemFeatures = (effectivePermissions: string[]) => {
  const systemFeatures = [
    {
      code: 'employee',
      name: '社員管理',
      route: '/employees',
      icon: 'UserCheck'
    },
    {
      code: 'partner',
      name: '取引先管理',
      route: '/partners',
      icon: 'Building2'
    },
    {
      code: 'approval',
      name: '承認管理',
      route: '/approvals',
      icon: 'CheckCircle'
    },
    {
      code: 'permission',
      name: '権限管理',
      route: '/permissions',
      icon: 'Shield'
    },
    {
      code: 'role',
      name: '役割管理',
      route: '/roles',
      icon: 'UserCog'
    },
    {
      code: 'department',
      name: '部署管理',
      route: '/departments',
      icon: 'Building'
    },
    {
      code: 'system',
      name: 'システム管理',
      route: '/system',
      icon: 'Settings'
    }
  ];

  return systemFeatures.filter(feature => 
    canUseBusinessCode(effectivePermissions, feature.code)
  );
};

/**
 * ユーザーが利用可能なビジネス機能一覧を取得
 * 
 * @param effectivePermissions 統合権限リスト
 * @returns 利用可能なビジネス機能一覧
 */
export const getAvailableBusinessFeatures = (effectivePermissions: string[]) => {
  const businessFeatures = [
    {
      code: 'estimate',
      name: '見積管理',
      route: '/estimates',
      icon: 'FileText'
    },
    {
      code: 'budget',
      name: '予算管理',
      route: '/budgets',
      icon: 'Calculator'
    },
    {
      code: 'purchase',
      name: '発注管理',
      route: '/purchases',
      icon: 'ShoppingCart'
    },
    {
      code: 'construction',
      name: '工事管理',
      route: '/constructions',
      icon: 'Hammer'
    },
    {
      code: 'general',
      name: '一般業務',
      route: '/general',
      icon: 'Briefcase'
    }
  ];

  return businessFeatures.filter(feature => 
    canUseBusinessCode(effectivePermissions, feature.code)
  );
};

/**
 * 権限に基づくナビゲーションアイテムのフィルタリング
 * 
 * @param effectivePermissions 統合権限リスト
 * @param navigationItems ナビゲーションアイテム一覧
 * @returns フィルタリングされたナビゲーションアイテム
 */
export const filterNavigationByPermission = (effectivePermissions: string[], navigationItems: Array<{href: string; label: string; businessCode?: string}>) => {
  return navigationItems.filter(item => {
    // ビジネスコードが指定されている場合は権限チェック
    if (item.businessCode) {
      return canUseBusinessCode(effectivePermissions, item.businessCode);
    }
    
    // ビジネスコードが指定されていない場合は表示
    return true;
  });
};
