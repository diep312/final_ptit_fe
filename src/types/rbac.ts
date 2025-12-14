// RBAC Type Definitions for System Users, Roles, and Permissions

export type RoleScope = "GLOBAL" | "ORGANIZER";

export interface Permission {
  _id: string;
  code: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  _id: string;
  name: string;
  code: string;
  description?: string;
  scope: RoleScope;
  is_system_role: boolean;
  created_at?: string;
  updated_at?: string;
  permissions?: Permission[];
  user_count?: number;
  has_role?: boolean; // Whether the user has this role (used in user role assignment)
}

export interface SystemUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  organizer_id?: string;
  organizer?: {
    _id: string;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
  roles?: Role[];
}

export interface SystemUserWithPermissions extends SystemUser {
  permissions: Permission[];
}

// API Response Types
export interface ApiResponse<T> {
  status: number;
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Request Types
export interface CreateSystemUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar_url?: string;
  organizer_id?: string;
}

export interface UpdateSystemUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  organizer_id?: string;
}

export interface CreateRoleRequest {
  name: string;
  code: string;
  description?: string;
  scope: RoleScope;
  is_system_role?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  scope?: RoleScope;
}

export interface CreatePermissionRequest {
  code: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
}

export interface AssignRolesRequest {
  role_ids: string[];
}

export interface AssignPermissionsRequest {
  permission_ids: string[];
}

export interface AssignUsersRequest {
  system_user_ids: string[];
}

export interface BulkCreatePermissionsRequest {
  permissions: CreatePermissionRequest[];
}

// Query Parameters
export interface SystemUserQueryParams {
  page?: number;
  limit?: number;
  include_roles?: boolean;
  search?: string;
}

export interface RoleQueryParams {
  page?: number;
  limit?: number;
  include_permissions?: boolean;
  include_admins?: boolean;
  scope?: RoleScope;
  user_id?: string; // Filter roles for specific user (includes has_role field)
}

export interface PermissionQueryParams {
  page?: number;
  limit?: number;
  resource?: string;
  action?: string;
  search?: string;
}

// Grouped Permissions (for UI display)
export interface GroupedPermissions {
  [resource: string]: Permission[];
}
