// Permission-based UI rendering component
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface CanProps {
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally render children based on user permissions
 *
 * @example
 * <Can permission="USER:CREATE">
 *   <Button>Create User</Button>
 * </Can>
 *
 * @example
 * <Can anyPermission={["USER:CREATE", "USER:EDIT"]}>
 *   <Button>Manage Users</Button>
 * </Can>
 */
export const Can = ({
  permission,
  anyPermission,
  allPermissions,
  children,
  fallback = null,
}: CanProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let allowed = false;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (anyPermission) {
    allowed = hasAnyPermission(anyPermission);
  } else if (allPermissions) {
    allowed = hasAllPermissions(allPermissions);
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
};
