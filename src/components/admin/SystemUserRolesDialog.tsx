import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/use-api";
import { systemUserApi, roleApi } from "@/lib/rbacApi";
import type { Role, SystemUser } from "@/types/rbac";
import { toast } from "sonner";

interface SystemUserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName?: string;
  onSaved?: () => void;
}

export const SystemUserRolesDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
  onSaved,
}: SystemUserRolesDialogProps) => {
  const { safeRequest } = useApi();
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Set<string>>(new Set());
  const [originalRoles, setOriginalRoles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      loadData();
    }
  }, [open, userId]);

  const loadData = async () => {
    setLoading(true);
    await safeRequest(async () => {
      if (userId) {
        // Load all roles with has_role field for this user
        const rolesResponse = await roleApi.list({
          limit: 1000,
          user_id: userId,
        });
        setAllRoles(rolesResponse.items || []);

        // Extract roles that user already has
        const roleIds = new Set(
          rolesResponse.items?.filter((r) => r.has_role).map((r) => r._id) || []
        );
        setUserRoles(roleIds);
        setOriginalRoles(roleIds);
      }
    });
    setLoading(false);
  };

  const toggleRole = (roleId: string) => {
    setUserRoles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!userId) return;

    await safeRequest(async () => {
      const toAdd = Array.from(userRoles).filter(
        (id) => !originalRoles.has(id)
      ) as string[];
      const toRemove = Array.from(originalRoles).filter(
        (id) => !userRoles.has(id)
      ) as string[];

      if (toAdd.length > 0) {
        await systemUserApi.assignRoles(userId, toAdd);
      }
      if (toRemove.length > 0) {
        await systemUserApi.removeRoles(userId, toRemove);
      }

      toast.success("Cập nhật vai trò thành công");
      onSaved?.();
      onOpenChange(false);
    });
  };

  const getScopeBadge = (scope: string) => {
    return scope === "GLOBAL" ? (
      <Badge className="bg-purple-100 text-purple-700 text-xs">GLOBAL</Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-700 text-xs">ORGANIZER</Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản lý vai trò: {userName || "Người dùng"}</DialogTitle>
          <DialogDescription>
            Chọn các vai trò để gán cho người dùng này
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Đang tải...
          </div>
        ) : (
          <div className="space-y-2">
            {allRoles.map((role) => (
              <div
                key={role._id}
                className="flex items-start space-x-3 p-3 hover:bg-muted rounded border"
              >
                <Checkbox
                  id={role._id}
                  checked={userRoles.has(role._id)}
                  onCheckedChange={() => toggleRole(role._id)}
                />
                <div className="flex-1">
                  <Label htmlFor={role._id} className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.name}</span>
                      {getScopeBadge(role.scope)}
                      {role.is_system_role && (
                        <Badge variant="secondary" className="text-xs">
                          Hệ thống
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">
                      {role.code}
                    </div>
                    {role.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {role.description}
                      </div>
                    )}
                    {role.permissions && role.permissions.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {role.permissions.length} quyền
                      </div>
                    )}
                  </Label>
                </div>
              </div>
            ))}

            {allRoles.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                Không có vai trò nào
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Lưu ({userRoles.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
