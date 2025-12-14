import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/use-api";
import { systemUserApi } from "@/lib/rbacApi";
import type { Permission } from "@/types/rbac";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SystemUserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName?: string;
}

export const SystemUserPermissionsDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
}: SystemUserPermissionsDialogProps) => {
  const { safeRequest } = useApi();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      loadPermissions();
    }
  }, [open, userId]);

  const loadPermissions = async () => {
    setLoading(true);
    await safeRequest(async () => {
      if (userId) {
        const perms = await systemUserApi.getPermissions(userId);
        setPermissions(perms);
      }
    });
    setLoading(false);
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const resource = perm.resource || "OTHER";
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-green-100 text-green-700",
      READ: "bg-blue-100 text-blue-700",
      UPDATE: "bg-yellow-100 text-yellow-700",
      DELETE: "bg-red-100 text-red-700",
      MANAGE: "bg-purple-100 text-purple-700",
      VIEW: "bg-cyan-100 text-cyan-700",
      EXECUTE: "bg-orange-100 text-orange-700",
    };
    const colorClass = colors[action] || "bg-gray-100 text-gray-700";
    return <Badge className={`${colorClass} text-xs`}>{action}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quyền của: {userName || "Người dùng"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Đang tải...
          </div>
        ) : permissions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Người dùng chưa có quyền nào
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Tổng: <strong>{permissions.length}</strong> quyền
            </div>
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <AccordionItem key={resource} value={resource}>
                  <AccordionTrigger className="text-sm font-semibold">
                    {resource} ({(perms as Permission[]).length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-4">
                      {(perms as Permission[]).map((permission) => (
                        <div
                          key={permission._id}
                          className="flex items-start justify-between p-2 hover:bg-muted rounded"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {permission.name}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono mt-1">
                              {permission.code}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {permission.description}
                              </div>
                            )}
                          </div>
                          <div className="ml-2">
                            {getActionBadge(permission.action)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
