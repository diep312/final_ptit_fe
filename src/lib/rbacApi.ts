// RBAC API Service Layer
import { api } from "./apiClient";
import type {
  ApiResponse,
  PaginatedResponse,
  SystemUser,
  SystemUserWithPermissions,
  Role,
  Permission,
  CreateSystemUserRequest,
  UpdateSystemUserRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  AssignRolesRequest,
  AssignPermissionsRequest,
  AssignUsersRequest,
  BulkCreatePermissionsRequest,
  SystemUserQueryParams,
  RoleQueryParams,
  PermissionQueryParams,
  GroupedPermissions,
} from "@/types/rbac";

// Helper to unwrap API responses
function unwrap<T>(response: any): T {
  const data = response?.data ?? response;

  // Handle paginated responses where backend returns { data: [...], pagination: {...} }
  // or { permissions: [...], pagination: {...} } or { system_users: [...], pagination: {...} }
  // but our types expect { items: [...], total, page, limit, total_pages }
  if (data?.pagination) {
    // Try different array field names that backend might use
    const itemsArray =
      data.data || data.permissions || data.system_users || data.roles;

    if (itemsArray && Array.isArray(itemsArray)) {
      return {
        items: itemsArray,
        total: data.pagination.total,
        page: data.pagination.page,
        limit: data.pagination.limit,
        total_pages: data.pagination.totalPages || data.pagination.total_pages,
      } as T;
    }
  }

  return data;
}

// ==================== System User API ====================

export const systemUserApi = {
  // List system users
  async list(
    params?: SystemUserQueryParams
  ): Promise<PaginatedResponse<SystemUser>> {
    const response = await api.get<ApiResponse<PaginatedResponse<SystemUser>>>(
      "/admin/system-users",
      {
        query: params as any,
      }
    );
    return unwrap(response);
  },

  // Get system user by ID
  async getById(id: string, includeRoles = true): Promise<SystemUser> {
    const response = await api.get<ApiResponse<SystemUser>>(
      `/admin/system-users/${id}`,
      {
        query: { include_roles: includeRoles },
      }
    );
    return unwrap(response);
  },

  // Create system user
  async create(data: CreateSystemUserRequest): Promise<SystemUser> {
    const response = await api.post<ApiResponse<SystemUser>>(
      "/admin/system-users",
      data
    );
    return unwrap(response);
  },

  // Update system user
  async update(id: string, data: UpdateSystemUserRequest): Promise<SystemUser> {
    const response = await api.put<ApiResponse<SystemUser>>(
      `/admin/system-users/${id}`,
      data
    );
    return unwrap(response);
  },

  // Delete system user
  async delete(id: string): Promise<void> {
    await api.delete(`/admin/system-users/${id}`);
  },

  // Activate system user
  async activate(id: string): Promise<SystemUser> {
    const response = await api.put<ApiResponse<SystemUser>>(
      `/admin/system-users/${id}/activate`
    );
    return unwrap(response);
  },

  // Deactivate system user
  async deactivate(id: string): Promise<SystemUser> {
    const response = await api.put<ApiResponse<SystemUser>>(
      `/admin/system-users/${id}/deactivate`
    );
    return unwrap(response);
  },

  // Assign roles to system user
  async assignRoles(id: string, roleIds: string[]): Promise<void> {
    await api.post(`/admin/system-users/${id}/roles`, {
      role_ids: roleIds,
    } as AssignRolesRequest);
  },

  // Remove roles from system user
  async removeRoles(id: string, roleIds: string[]): Promise<void> {
    await api.delete(`/admin/system-users/${id}/roles`, {
      role_ids: roleIds,
    } as AssignRolesRequest);
  },

  // Get user's aggregated permissions
  async getPermissions(id: string): Promise<Permission[]> {
    const response = await api.get<ApiResponse<string[]>>(
      `/admin/system-users/${id}/permissions`
    );
    const data = unwrap(response);

    // Backend returns array of permission codes, need to fetch full permission details
    if (Array.isArray(data)) {
      // Get all permissions to map codes to full objects
      const allPermissionsResponse = await permissionApi.list({ limit: 1000 });
      const allPermissions = allPermissionsResponse.items || [];

      // Filter permissions that match the returned codes
      return allPermissions.filter((p) => data.includes(p.code));
    }

    return [];
  },
};

// ==================== Role API ====================

export const roleApi = {
  // List roles
  async list(params?: RoleQueryParams): Promise<PaginatedResponse<Role>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Role>>>(
      "/admin/roles",
      {
        query: params as any,
      }
    );
    return unwrap(response);
  },

  // Get role by ID
  async getById(
    id: string,
    includePermissions = true,
    includeAdmins = false
  ): Promise<Role> {
    const response = await api.get<ApiResponse<Role>>(`/admin/roles/${id}`, {
      query: {
        include_permissions: includePermissions,
        include_admins: includeAdmins,
      },
    });
    return unwrap(response);
  },

  // Create role
  async create(data: CreateRoleRequest): Promise<Role> {
    const response = await api.post<ApiResponse<Role>>("/admin/roles", data);
    return unwrap(response);
  },

  // Update role
  async update(id: string, data: UpdateRoleRequest): Promise<Role> {
    const response = await api.put<ApiResponse<Role>>(
      `/admin/roles/${id}`,
      data
    );
    return unwrap(response);
  },

  // Delete role
  async delete(id: string): Promise<void> {
    await api.delete(`/admin/roles/${id}`);
  },

  // Assign permissions to role
  async assignPermissions(id: string, permissionIds: string[]): Promise<void> {
    await api.post(`/admin/roles/${id}/permissions`, {
      permission_ids: permissionIds,
    } as AssignPermissionsRequest);
  },

  // Remove permissions from role
  async removePermissions(id: string, permissionIds: string[]): Promise<void> {
    await api.delete(`/admin/roles/${id}/permissions`, {
      permission_ids: permissionIds,
    } as AssignPermissionsRequest);
  },

  // Get role permissions
  async getPermissions(id: string): Promise<Permission[]> {
    const response = await api.get<ApiResponse<{ permissions: Permission[] }>>(
      `/admin/roles/${id}/permissions`
    );
    const data = unwrap(response) as { permissions: Permission[] };
    return data.permissions ?? [];
  },

  // Assign users to role
  async assignUsers(id: string, userIds: string[]): Promise<void> {
    await api.post(`/admin/roles/${id}/users`, {
      system_user_ids: userIds,
    } as AssignUsersRequest);
  },

  // Remove users from role
  async removeUsers(id: string, userIds: string[]): Promise<void> {
    await api.delete(`/admin/roles/${id}/users`, {
      system_user_ids: userIds,
    } as AssignUsersRequest);
  },
};

// ==================== Permission API ====================

export const permissionApi = {
  // List permissions
  async list(
    params?: PermissionQueryParams
  ): Promise<PaginatedResponse<Permission>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Permission>>>(
      "/admin/permissions",
      {
        query: params as any,
      }
    );
    return unwrap(response);
  },

  // Get permission by ID
  async getById(id: string): Promise<Permission> {
    const response = await api.get<ApiResponse<Permission>>(
      `/admin/permissions/${id}`
    );
    return unwrap(response);
  },

  // Get permission by code
  async getByCode(code: string): Promise<Permission> {
    const response = await api.get<ApiResponse<Permission>>(
      `/admin/permissions/code/${code}`
    );
    return unwrap(response);
  },

  // Create permission
  async create(data: CreatePermissionRequest): Promise<Permission> {
    const response = await api.post<ApiResponse<Permission>>(
      "/admin/permissions",
      data
    );
    return unwrap(response);
  },

  // Update permission
  async update(id: string, data: UpdatePermissionRequest): Promise<Permission> {
    const response = await api.put<ApiResponse<Permission>>(
      `/admin/permissions/${id}`,
      data
    );
    return unwrap(response);
  },

  // Delete permission
  async delete(id: string): Promise<void> {
    await api.delete(`/admin/permissions/${id}`);
  },

  // Get permissions grouped by resource
  async getGrouped(): Promise<GroupedPermissions> {
    const response = await api.get<ApiResponse<GroupedPermissions>>(
      "/admin/permissions/grouped"
    );
    return unwrap(response);
  },

  // Get unique resource types
  async getResources(): Promise<string[]> {
    const response = await api.get<ApiResponse<{ resources: string[] }>>(
      "/admin/permissions/resources"
    );
    const data = unwrap(response) as { resources: string[] };
    return data.resources ?? [];
  },

  // Get unique action types
  async getActions(): Promise<string[]> {
    const response = await api.get<ApiResponse<{ actions: string[] }>>(
      "/admin/permissions/actions"
    );
    const data = unwrap(response) as { actions: string[] };
    return data.actions ?? [];
  },

  // Bulk create permissions
  async bulkCreate(
    permissions: CreatePermissionRequest[]
  ): Promise<Permission[]> {
    const response = await api.post<ApiResponse<{ permissions: Permission[] }>>(
      "/admin/permissions/bulk",
      { permissions } as BulkCreatePermissionsRequest
    );
    const data = unwrap(response) as { permissions: Permission[] };
    return data.permissions ?? [];
  },
};

// ==================== Helper Functions ====================

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: string
): boolean {
  return userPermissions.some((p) => p.code === requiredPermission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((required) =>
    userPermissions.some((p) => p.code === required)
  );
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((required) =>
    userPermissions.some((p) => p.code === required)
  );
}

/**
 * Group permissions by resource
 */
export function groupPermissionsByResource(
  permissions: Permission[]
): GroupedPermissions {
  return permissions.reduce((acc, permission) => {
    const resource = permission.resource || "OTHER";
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {} as GroupedPermissions);
}
