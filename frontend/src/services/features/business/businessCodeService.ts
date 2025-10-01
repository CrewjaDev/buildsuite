import api from '@/lib/api';

export interface BusinessCode {
  code: string;
  name: string;
  description: string;
  category: string;
  is_system: boolean;
  is_core: boolean;
  permissions_count: number;
  assigned_levels: AssignedEntity[];
  assigned_roles: AssignedEntity[];
  assigned_departments: AssignedEntity[];
  assigned_positions: AssignedEntity[];
}

export interface AssignedEntity {
  id: number;
  name: string;
  display_name: string;
}

export interface BusinessCodeDetail {
  code: string;
  name: string;
  description: string;
  category: string;
  is_system: boolean;
  is_core: boolean;
  settings: Record<string, unknown>;
}

export interface Permission {
  name: string;
  display_name: string;
  description: string;
}

export interface AssignmentStatus {
  system_levels: AssignmentStatusDetail[];
  roles: AssignmentStatusDetail[];
  departments: AssignmentStatusDetail[];
  positions: AssignmentStatusDetail[];
}

export interface AssignmentStatusDetail {
  id: number;
  name: string;
  display_name: string;
  has_permission: boolean;
  assigned_permissions: string[];
  assigned_count: number;
  total_count: number;
}

export interface BusinessCodeListResponse {
  success: boolean;
  data: {
    business_codes: BusinessCode[];
    total_count: number;
  };
}

export interface BusinessCodeDetailResponse {
  success: boolean;
  data: {
    business_code: BusinessCodeDetail;
    permissions: Permission[];
    assignment_status: AssignmentStatus;
  };
}

export interface BusinessCodePermissionsResponse {
  success: boolean;
  data: {
    permissions: Permission[];
  };
}

export interface BusinessCodeAssignmentStatusResponse {
  success: boolean;
  data: {
    assignment_status: AssignmentStatus;
  };
}

export interface BusinessCodePermissionStatusResponse {
  success: boolean;
  data: {
    business_code: string;
    business_code_info: {
      name: string;
      description: string;
      category: string;
      is_system: boolean;
      is_core: boolean;
    };
    permission_status: Array<{
      id: number;
      name: string;
      display_name: string;
      description: string;
      module: string;
      action: string;
      category: string | null;
      subcategory: string | null;
      is_assigned: boolean;
      assigned_at: string | null;
      granted_by: number | null;
    }>;
  };
}

export interface BusinessCodePermissionsByCategoryResponse {
  success: boolean;
  data: {
    business_code: string;
    category: string;
    permissions: Array<{
      id: number;
      name: string;
      display_name: string;
      category: string | null;
      subcategory: string | null;
    }>;
  };
}

export interface SetBusinessCodePermissionsRequest {
  permission_overrides: Array<{
    permission_id: number;
    is_enabled: boolean;
  }>;
}

export interface SetBusinessCodePermissionsResponse {
  success: boolean;
  message: string;
  data: {
    business_code: string;
    permissions_added: number;
    permissions_removed: number;
  };
}

export interface UseBusinessCodesParams {
  category?: string;
}

class BusinessCodeService {
  /**
   * 全ビジネスコードを取得（APIから取得）
   * バックエンドのBusinessCodeService::getAllBusinessCodes()から取得
   */
  async getAllBusinessCodes(): Promise<Record<string, {
    name: string;
    description: string;
    category: string;
    is_system: boolean;
    is_core: boolean;
    default_permissions: string[];
  }>> {
    try {
      const response = await api.get('/business-codes');
      if (response.data.success && response.data.data.business_codes) {
        // APIレスポンスを期待される形式に変換
        const businessCodes: Record<string, {
          name: string;
          description: string;
          category: string;
          is_system: boolean;
          is_core: boolean;
          default_permissions: string[];
        }> = {};
        response.data.data.business_codes.forEach((item: {
          code: string;
          name: string;
          description: string;
          category: string;
          is_system: boolean;
          is_core: boolean;
        }) => {
          businessCodes[item.code] = {
            name: item.name,
            description: item.description,
            category: item.category,
            is_system: item.is_system,
            is_core: item.is_core,
            default_permissions: [] // デフォルト権限は別途取得が必要
          };
        });
        return businessCodes;
      }
      throw new Error('ビジネスコードの取得に失敗しました');
    } catch (error) {
      console.error('getAllBusinessCodes error:', error);
      throw error;
    }
  }

  /**
   * ビジネスコード一覧を取得
   */
  async getBusinessCodes(params?: {
    category?: string;
  }): Promise<BusinessCodeListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.category) {
      queryParams.append('category', params.category);
    }

    const response = await api.get(`/business-codes?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * ビジネスコード詳細を取得
   */
  async getBusinessCodeDetail(code: string): Promise<BusinessCodeDetailResponse> {
    const response = await api.get(`/business-codes/${code}`);
    return response.data;
  }

  /**
   * ビジネスコードの権限一覧を取得
   */
  async getBusinessCodePermissions(code: string): Promise<BusinessCodePermissionsResponse> {
    const response = await api.get(`/business-codes/${code}/permissions`);
    return response.data;
  }

  /**
   * ビジネスコードの権限付与状況を取得
   */
  async getBusinessCodeAssignmentStatus(code: string): Promise<BusinessCodeAssignmentStatusResponse> {
    const response = await api.get(`/business-codes/${code}/assignment-status`);
    return response.data;
  }

  /**
   * ビジネスコード別の権限照会
   */
  async getBusinessCodePermissionStatus(
    entityType: string,
    entityId: number,
    businessCode: string
  ): Promise<BusinessCodePermissionStatusResponse> {
    const response = await api.get(`/business-codes/${entityType}/${entityId}/${businessCode}/permission-status`);
    return response.data;
  }

  /**
   * ビジネスコードベースの権限一括設定
   */
  async setBusinessCodePermissions(
    entityType: string,
    entityId: number,
    businessCode: string,
    data: SetBusinessCodePermissionsRequest
  ): Promise<SetBusinessCodePermissionsResponse> {
    const response = await api.post(`/business-codes/${entityType}/${entityId}/${businessCode}/permissions`, data);
    return response.data;
  }

  /**
   * カテゴリ別の権限を取得
   */
  async getPermissionsByCategory(
    businessCode: string,
    category: string
  ): Promise<BusinessCodePermissionsByCategoryResponse> {
    const response = await api.get(`/business-codes/${businessCode}/permissions/${category}`);
    return response.data;
  }
}

export const businessCodeService = new BusinessCodeService();