import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "@/lib/apiClient";
import type { Permission } from "@/types/rbac";

export type UserType = "admin" | "organizer" | "system_user" | null;

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  roles?: Array<{
    _id: string;
    name: string;
    code: string;
    scope: string;
  }>;
}

interface AuthContextType {
  user: UserProfile | null;
  userType: UserType;
  token: string | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    token: string,
    user: UserProfile,
    userType: "admin" | "organizer" | "system_user"
  ) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  hasAllPermissions: (permissionCodes: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUserType = localStorage.getItem("user_type") as UserType;

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      setToken(storedToken);

      // Try to get user profile based on stored user type
      if (storedUserType === "admin" || storedUserType === "system_user") {
        const response = await api.get<{
          status: number;
          success: boolean;
          message: string;
          data: UserProfile;
        }>("/admin/auth/me");
        const profile = response?.data || response;
        if (profile) {
          setUser(profile);
          setUserType(storedUserType);
          // Fetch permissions for admin/system user
          await fetchPermissions(profile._id);
        } else {
          throw new Error("Failed to get admin profile");
        }
      } else if (storedUserType === "organizer") {
        const response = await api.get<{
          status: number;
          success: boolean;
          message: string;
          data: UserProfile;
        }>("/organizer/auth/me");
        const profile = response?.data || response;
        if (profile) {
          setUser(profile);
          setUserType("organizer");
        } else {
          throw new Error("Failed to get organizer profile");
        }
      } else {
        // Try both if user type is not stored
        try {
          const response = await api.get<{
            status: number;
            success: boolean;
            message: string;
            data: UserProfile;
          }>("/admin/auth/me");
          const profile = response?.data || response;
          if (profile) {
            setUser(profile);
            await fetchPermissions(profile._id);
            setUserType("admin");
            localStorage.setItem("user_type", "admin");
          }
        } catch {
          try {
            const response = await api.get<{
              status: number;
              success: boolean;
              message: string;
              data: UserProfile;
            }>("/organizer/auth/me");
            const profile = response?.data || response;
            if (profile) {
              setUser(profile);
              setUserType("organizer");
              localStorage.setItem("user_type", "organizer");
            }
          } catch {
            throw new Error("Not authenticated");
          }
        }
      }
    } catch (error) {
      // Token is invalid, clear everything
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_type");
      setToken(null);
      setUser(null);
      setUserType(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async (userId: string) => {
    try {
      const response = await api.get<{
        status: number;
        success: boolean;
        message: string;
        data: { permissions: Permission[] };
      }>(`/admin/system-users/${userId}/permissions`);
      const data = response?.data || response;
      const perms = data?.permissions || [];
      setPermissions(perms);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      setPermissions([]);
    }
  };

  const login = (
    newToken: string,
    userProfile: UserProfile,
    type: "admin" | "organizer" | "system_user"
  ) => {
    setToken(newToken);
    setUser(userProfile);
    setUserType(type);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("user_type", type);
    // Fetch permissions after login for admin/system users
    if ((type === "admin" || type === "system_user") && userProfile._id) {
      fetchPermissions(userProfile._id).catch(console.error);
    }
  };

  const logout = async () => {
    try {
      const currentToken = localStorage.getItem("auth_token");
      const currentUserType = localStorage.getItem("user_type") as UserType;
      if (currentToken) {
        // Try to logout from backend
        try {
          if (
            currentUserType === "admin" ||
            currentUserType === "system_user"
          ) {
            await api.post("/admin/auth/logout");
          } else if (currentUserType === "organizer") {
            await api.post("/organizer/auth/logout");
          }
        } catch (error) {
          // Ignore logout errors, still clear local state
          console.error("Logout error:", error);
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state regardless
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_type");
      setToken(null);
      setUser(null);
      setUserType(null);
      setPermissions([]);
      // Redirect will be handled by ProtectedRoute or components
      window.location.href = "/login";
    }
  };

  const hasPermission = (permissionCode: string): boolean => {
    return permissions.some((p) => p.code === permissionCode);
  };

  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    return permissionCodes.some((code) =>
      permissions.some((p) => p.code === code)
    );
  };

  const hasAllPermissions = (permissionCodes: string[]): boolean => {
    return permissionCodes.every((code) =>
      permissions.some((p) => p.code === code)
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        token,
        permissions,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        checkAuth,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
