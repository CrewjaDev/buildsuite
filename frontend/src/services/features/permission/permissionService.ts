import api from '@/lib/api';

// 権限管理の型定義
export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  module: string;
  action: string;
  resource?: string;
  is_system: boolean;
  is_active: boolean;
  usage_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SystemLevel {
  id: number;
  code: string;
  name: string;
  display_name: string;
  description?: string;
  priority: number;
  is_system: boolean;
  is_active: boolean;
  permissions?: Permission[];
  users_count?: number;
  permissions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  priority: number;
  is_active: boolean;
  permissions?: Permission[];
  users_count?: number;
  permissions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  parent_id?: number;
  level: number;
  path?: string;
  sort_order: number;
  manager_id?: number;
  is_active: boolean;
  permissions?: Permission[];
  children_count?: number;
  users_count?: number;
  permissions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: number;
  code: string;
  name: string;
  display_name: string;
  description?: string;
  level: number;
  is_active: boolean;
  permissions?: Permission[];
  users_count?: number;
  permissions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  login_id: string;
  employee_id: string;
  name: string;
  name_kana?: string;
  email?: string;
  system_level: string;
  is_active: boolean;
  is_admin: boolean;
  permissions?: Permission[];
  roles?: Role[];
  departments?: Department[];
  position?: Position;
  created_at: string;
  updated_at: string;
}

// 権限マスタ管理
export const permissionService = {
  // 権限一覧取得
  getPermissions: async (params?: {
    search?: string;
    module?: string;
    action?: string;
    resource?: string;
    is_active?: boolean;
    is_system?: boolean;
    sort_by?: string;
    sort_direction?: string;
    per_page?: number;
    page?: number;
  }) => {
    const response = await api.get('/permissions', { params });
    return response.data;
  },

  // 権限詳細取得
  getPermission: async (id: number) => {
    const response = await api.get(`/permissions/${id}`);
    return response.data;
  },

  // 権限作成
  createPermission: async (data: {
    name: string;
    display_name: string;
    description?: string;
    module: string;
    action: string;
    resource?: string;
    is_system?: boolean;
    is_active?: boolean;
  }) => {
    const response = await api.post('/permissions', data);
    return response.data;
  },

  // 権限更新
  updatePermission: async (id: number, data: {
    name: string;
    display_name: string;
    description?: string;
    module: string;
    action: string;
    resource?: string;
    is_active?: boolean;
  }) => {
    const response = await api.put(`/permissions/${id}`, data);
    return response.data;
  },

  // 権限削除
  deletePermission: async (id: number) => {
    const response = await api.delete(`/permissions/${id}`);
    return response.data;
  },

  // 権限使用状況取得
  getPermissionUsage: async (id: number) => {
    const response = await api.get(`/permissions/${id}/usage`);
    return response.data;
  },

  // モジュール一覧取得
  getModules: async () => {
    const response = await api.get('/permissions/modules');
    return response.data;
  },

  // アクション一覧取得
  getActions: async (module?: string) => {
    const response = await api.get('/permissions/actions', { 
      params: module ? { module } : {} 
    });
    return response.data;
  },

  // リソース一覧取得
  getResources: async (module?: string, action?: string) => {
    const response = await api.get('/permissions/resources', { 
      params: { module, action } 
    });
    return response.data;
  },
};

// システム権限レベル管理
export const systemLevelService = {
  // システム権限レベル一覧取得
  getSystemLevels: async (params?: {
    search?: string;
    is_active?: boolean;
    is_system?: boolean;
    priority?: number;
    sort_by?: string;
    sort_direction?: string;
    per_page?: number;
    page?: number;
  }) => {
    const response = await api.get('/system-levels', { params });
    return response.data;
  },

  // システム権限レベル詳細取得
  getSystemLevel: async (id: number) => {
    const response = await api.get(`/system-levels/${id}`);
    return response.data;
  },

  // システム権限レベル作成
  createSystemLevel: async (data: {
    code: string;
    name: string;
    display_name: string;
    description?: string;
    priority: number;
    is_system?: boolean;
    is_active?: boolean;
    permission_ids?: number[];
  }) => {
    const response = await api.post('/system-levels', data);
    return response.data;
  },

  // システム権限レベル更新
  updateSystemLevel: async (id: number, data: {
    code: string;
    name: string;
    display_name: string;
    description?: string;
    priority: number;
    is_active?: boolean;
    permission_ids?: number[];
  }) => {
    const response = await api.put(`/system-levels/${id}`, data);
    return response.data;
  },

  // システム権限レベル削除
  deleteSystemLevel: async (id: number) => {
    const response = await api.delete(`/system-levels/${id}`);
    return response.data;
  },

  // 権限追加
  addPermissions: async (id: number, permissionIds: number[]) => {
    const response = await api.post(`/system-levels/${id}/permissions`, {
      permission_ids: permissionIds
    });
    return response.data;
  },

  // 権限削除
  removePermissions: async (id: number, permissionIds: number[]) => {
    const response = await api.delete(`/system-levels/${id}/permissions`, {
      data: { permission_ids: permissionIds }
    });
    return response.data;
  },

  // 使用状況取得
  getUsage: async (id: number) => {
    const response = await api.get(`/system-levels/${id}/usage`);
    return response.data;
  },

  // 選択肢データ取得
  getOptions: async () => {
    const response = await api.get('/system-levels/options');
    return response.data;
  },
};

// 役割管理
export const roleService = {
  // 役割一覧取得
  getRoles: async (params?: {
    search?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_direction?: string;
    per_page?: number;
    page?: number;
  }) => {
    const response = await api.get('/roles', { params });
    return response.data;
  },

  // 役割詳細取得
  getRole: async (id: number) => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  // 役割作成
  createRole: async (data: {
    name: string;
    display_name: string;
    description?: string;
    priority: number;
    is_active?: boolean;
    permission_ids?: number[];
  }) => {
    const response = await api.post('/roles', data);
    return response.data;
  },

  // 役割更新
  updateRole: async (id: number, data: {
    name: string;
    display_name: string;
    description?: string;
    priority: number;
    is_active?: boolean;
    permission_ids?: number[];
  }) => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },

  // 役割削除
  deleteRole: async (id: number) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  },

  // 権限追加
  addPermissions: async (id: number, permissionIds: number[]) => {
    const response = await api.post(`/roles/${id}/permissions`, {
      permission_ids: permissionIds
    });
    return response.data;
  },

  // 権限削除
  removePermissions: async (id: number, permissionIds: number[]) => {
    const response = await api.delete(`/roles/${id}/permissions`, {
      data: { permission_ids: permissionIds }
    });
    return response.data;
  },

  // 使用状況取得
  getUsage: async (id: number) => {
    const response = await api.get(`/roles/${id}/usage`);
    return response.data;
  },

  // 選択肢データ取得
  getOptions: async () => {
    const response = await api.get('/roles/options');
    return response.data;
  },
};

// 部署管理
export const departmentService = {
  // 部署一覧取得
  getDepartments: async (params?: {
    search?: string;
    is_active?: boolean;
    level?: number;
    parent_id?: number;
    root_only?: boolean;
    sort_by?: string;
    sort_direction?: string;
    per_page?: number;
    page?: number;
  }) => {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  // 部署階層構造取得
  getDepartmentTree: async (activeOnly: boolean = true) => {
    const response = await api.get('/departments/tree', {
      params: { active_only: activeOnly }
    });
    return response.data;
  },

  // 部署詳細取得
  getDepartment: async (id: number) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  // 部署作成
  createDepartment: async (data: {
    name: string;
    code: string;
    description?: string;
    parent_id?: number;
    sort_order?: number;
    manager_id?: number;
    is_active?: boolean;
    permission_ids?: number[];
  }) => {
    const response = await api.post('/departments', data);
    return response.data;
  },

  // 部署更新
  updateDepartment: async (id: number, data: {
    name: string;
    code: string;
    description?: string;
    parent_id?: number;
    sort_order?: number;
    manager_id?: number;
    is_active?: boolean;
    permission_ids?: number[];
  }) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  // 部署削除
  deleteDepartment: async (id: number) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },

  // 権限追加
  addPermissions: async (id: number, permissionIds: number[]) => {
    const response = await api.post(`/departments/${id}/permissions`, {
      permission_ids: permissionIds
    });
    return response.data;
  },

  // 権限削除
  removePermissions: async (id: number, permissionIds: number[]) => {
    const response = await api.delete(`/departments/${id}/permissions`, {
      data: { permission_ids: permissionIds }
    });
    return response.data;
  },

  // 使用状況取得
  getUsage: async (id: number) => {
    const response = await api.get(`/departments/${id}/usage`);
    return response.data;
  },

  // 選択肢データ取得
  getOptions: async () => {
    const response = await api.get('/departments/options');
    return response.data;
  },
};

// 職位管理
export const positionService = {
  // 職位一覧取得
  getPositions: async (params?: {
    search?: string;
    is_active?: boolean;
    level?: number;
    sort_by?: string;
    sort_direction?: string;
    per_page?: number;
    page?: number;
  }) => {
    const response = await api.get('/positions', { params });
    return response.data;
  },

  // 職位詳細取得
  getPosition: async (id: number) => {
    const response = await api.get(`/positions/${id}`);
    return response.data;
  },

  // 職位作成
  createPosition: async (data: {
    code: string;
    name: string;
    display_name: string;
    description?: string;
    level: number;
    is_active?: boolean;
    permission_ids?: number[];
  }) => {
    const response = await api.post('/positions', data);
    return response.data;
  },

  // 職位更新
  updatePosition: async (id: number, data: {
    code: string;
    name: string;
    display_name: string;
    description?: string;
    level: number;
    is_active?: boolean;
    permission_ids?: number[];
  }) => {
    const response = await api.put(`/positions/${id}`, data);
    return response.data;
  },

  // 職位削除
  deletePosition: async (id: number) => {
    const response = await api.delete(`/positions/${id}`);
    return response.data;
  },

  // 権限追加
  addPermissions: async (id: number, permissionIds: number[]) => {
    const response = await api.post(`/positions/${id}/permissions`, {
      permission_ids: permissionIds
    });
    return response.data;
  },

  // 権限削除
  removePermissions: async (id: number, permissionIds: number[]) => {
    const response = await api.delete(`/positions/${id}/permissions`, {
      data: { permission_ids: permissionIds }
    });
    return response.data;
  },

  // 使用状況取得
  getUsage: async (id: number) => {
    const response = await api.get(`/positions/${id}/usage`);
    return response.data;
  },

  // 選択肢データ取得
  getOptions: async () => {
    const response = await api.get('/positions/options');
    return response.data;
  },
};

// ユーザー管理
export const userService = {
  // ユーザー一覧取得
  getUsers: async (params?: {
    search?: string;
    is_active?: boolean;
    system_level?: string;
    department_id?: number;
    role_id?: number;
    is_locked?: boolean;
    sort_by?: string;
    sort_order?: string;
    pageSize?: number;
    page?: number;
  }) => {
    console.log('userService.getUsers - params:', params);
    const response = await api.get('/users', { params });
    console.log('userService.getUsers - response:', response);
    return response.data;
  },

  // ユーザー詳細取得
  getUser: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // ユーザー作成
  createUser: async (data: {
    login_id: string;
    employee_id: string;
    name: string;
    name_kana?: string;
    email?: string;
    password: string;
    birth_date?: string;
    gender?: string;
    phone?: string;
    mobile_phone?: string;
    postal_code?: string;
    prefecture?: string;
    address?: string;
    job_title?: string;
    hire_date?: string;
    is_active?: boolean;
    is_admin?: boolean;
    system_level?: string;
    role?: string;
    department_id?: number;
    position_id?: number;
  }) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  // ユーザー更新
  updateUser: async (id: number, data: {
    employee_id?: string;
    name?: string;
    name_kana?: string;
    email?: string;
    birth_date?: string;
    gender?: string;
    phone?: string;
    mobile_phone?: string;
    postal_code?: string;
    prefecture?: string;
    address?: string;
    job_title?: string;
    hire_date?: string;
    is_active?: boolean;
    is_admin?: boolean;
    system_level?: string;
    position_id?: number;
    role_ids?: number[];
    department_ids?: number[];
  }) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  // ユーザー削除
  deleteUser: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // 権限追加
  addPermissions: async (id: number, permissionIds: number[]) => {
    const response = await api.post(`/users/${id}/permissions`, {
      permission_ids: permissionIds
    });
    return response.data;
  },

  // 権限削除
  removePermissions: async (id: number, permissionIds: number[]) => {
    const response = await api.delete(`/users/${id}/permissions`, {
      data: { permission_ids: permissionIds }
    });
    return response.data;
  },

  // 権限使用状況取得
  getPermissionUsage: async (id: number) => {
    const response = await api.get(`/users/${id}/permission-usage`);
    return response.data;
  },

  // 選択肢データ取得
  getOptions: async () => {
    const response = await api.get('/users/options');
    return response.data;
  },
};
