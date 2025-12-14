import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, Users, Shield, Plus } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useApi } from "@/hooks/use-api";
import { roleApi, permissionApi, systemUserApi } from "@/lib/rbacApi";
import type { Role, Permission, SystemUser, RoleScope } from "@/types/rbac";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RoleFormData {
  name: string;
  code: string;
  description: string;
  scope: RoleScope;
  is_system_role: boolean;
}

const AdminRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const { safeRequest } = useApi();

  // Modals
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [assigningPermissions, setAssigningPermissions] = useState<Role | null>(
    null
  );
  const [assigningUsers, setAssigningUsers] = useState<Role | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);

  // Form state
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    code: "",
    description: "",
    scope: "ORGANIZER",
    is_system_role: false,
  });

  // Selected items for assignment
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<RoleScope | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const loadRoles = async () => {
    await safeRequest(async () => {
      const params: any = { page, limit, include_permissions: true };
      if (scopeFilter !== "ALL") {
        params.scope = scopeFilter;
      }
      const response = await roleApi.list(params);
      setRoles(response.items || []);
      setTotal(response.total || 0);
    });
  };

  const loadPermissions = async () => {
    await safeRequest(async () => {
      const response = await permissionApi.list({ limit: 1000 });
      setAllPermissions(response.items || []);
    });
  };

  const loadUsers = async () => {
    await safeRequest(async () => {
      const response = await systemUserApi.list({ limit: 1000 });
      setAllUsers(response.items || []);
    });
  };

  useEffect(() => {
    void loadRoles();
  }, [page, scopeFilter]);

  useEffect(() => {
    void loadPermissions();
    void loadUsers();
  }, []);

  const filteredRoles = useMemo(() => {
    if (!searchTerm) return roles;
    const lower = searchTerm.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(lower) ||
        r.code.toLowerCase().includes(lower) ||
        r.description?.toLowerCase().includes(lower)
    );
  }, [roles, searchTerm]);

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      scope: "ORGANIZER",
      is_system_role: false,
    });
  };

  const handleCreate = () => {
    resetForm();
    setOpenCreate(true);
  };

  const handleEdit = (role: Role) => {
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || "",
      scope: role.scope,
      is_system_role: role.is_system_role,
    });
    setEditing(role);
  };

  const handleSave = async () => {
    await safeRequest(async () => {
      if (editing) {
        await roleApi.update(editing._id, {
          name: formData.name,
          description: formData.description,
          scope: formData.scope,
        });
        toast.success("Cập nhật vai trò thành công");
      } else {
        await roleApi.create(formData);
        toast.success("Tạo vai trò thành công");
      }
      setOpenCreate(false);
      setEditing(null);
      resetForm();
      await loadRoles();
    });
  };

  const handleDelete = async (role: Role) => {
    if (role.is_system_role) {
      toast.error("Không thể xóa vai trò hệ thống");
      return;
    }
    setDeleteConfirm(role);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await safeRequest(async () => {
      await roleApi.delete(deleteConfirm._id);
      toast.success("Xóa vai trò thành công");
      setDeleteConfirm(null);
      await loadRoles();
    });
  };

  const handleAssignPermissions = (role: Role) => {
    setAssigningPermissions(role);
    const permIds = new Set(role.permissions?.map((p) => p._id) || []);
    setSelectedPermissions(permIds);
  };

  const savePermissions = async () => {
    if (!assigningPermissions) return;
    await safeRequest(async () => {
      const currentIds = new Set(
        assigningPermissions.permissions?.map((p) => p._id) || []
      );
      const toAdd = Array.from(selectedPermissions).filter(
        (id) => !currentIds.has(id)
      ) as string[];
      const toRemove = Array.from(currentIds).filter(
        (id) => !selectedPermissions.has(id)
      ) as string[];

      if (toAdd.length > 0) {
        await roleApi.assignPermissions(assigningPermissions._id, toAdd);
      }
      if (toRemove.length > 0) {
        await roleApi.removePermissions(assigningPermissions._id, toRemove);
      }

      toast.success("Cập nhật quyền thành công");
      setAssigningPermissions(null);
      await loadRoles();
    });
  };

  const handleAssignUsers = (role: Role) => {
    setAssigningUsers(role);
    setSelectedUsers(new Set());
  };

  const saveUsers = async () => {
    if (!assigningUsers || selectedUsers.size === 0) return;
    await safeRequest(async () => {
      await roleApi.assignUsers(assigningUsers._id, Array.from(selectedUsers));
      toast.success("Gán người dùng thành công");
      setAssigningUsers(null);
      setSelectedUsers(new Set());
      await loadRoles();
    });
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Group permissions by resource with search filter
  const groupedPermissions = useMemo(() => {
    const searchLower = permissionSearch.toLowerCase();
    const filtered = permissionSearch
      ? allPermissions.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.code.toLowerCase().includes(searchLower) ||
            p.description?.toLowerCase().includes(searchLower) ||
            p.resource.toLowerCase().includes(searchLower)
        )
      : allPermissions;

    const groups: Record<string, Permission[]> = {};
    filtered.forEach((p) => {
      const resource = p.resource || "OTHER";
      if (!groups[resource]) groups[resource] = [];
      groups[resource].push(p);
    });
    return groups;
  }, [allPermissions, permissionSearch]);

  const getScopeBadge = (scope: RoleScope) => {
    return scope === "GLOBAL" ? (
      <Badge className="bg-purple-100 text-purple-700">GLOBAL</Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-700">ORGANIZER</Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm vai trò..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={scopeFilter}
              onValueChange={(value) =>
                setScopeFilter(value as RoleScope | "ALL")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Phạm vi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="GLOBAL">Global</SelectItem>
                <SelectItem value="ORGANIZER">Organizer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            TẠO VAI TRÒ
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-foreground text-background">
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    TÊN VAI TRÒ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    MÃ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    PHẠM VI
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    QUYỀN
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    TRẠNG THÁI
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    HÀNH ĐỘNG
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role, index) => (
                  <tr
                    key={role._id}
                    className={`border-b hover:bg-muted/50 ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      {role.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                      {role.code}
                    </td>
                    <td className="px-6 py-4">{getScopeBadge(role.scope)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {role.permissions?.length || 0} quyền
                    </td>
                    <td className="px-6 py-4">
                      {role.is_system_role && (
                        <Badge className="bg-gray-100 text-gray-700">
                          Hệ thống
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Quản lý quyền"
                          onClick={() => handleAssignPermissions(role)}
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Gán người dùng"
                          onClick={() => handleAssignUsers(role)}
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(role)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!role.is_system_role && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(role)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Hiển thị {(page - 1) * limit + 1} -{" "}
              {Math.min(page * limit, total)} trên tổng {total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span className="text-sm">
                Trang {page} / {Math.ceil(total / limit) || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openCreate || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setOpenCreate(false);
            setEditing(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Chỉnh sửa vai trò" : "Tạo vai trò mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tên vai trò *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="VD: Quản lý sự kiện"
              />
            </div>
            <div>
              <Label htmlFor="code">Mã vai trò *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="VD: EVENT_MANAGER"
                disabled={!!editing}
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả vai trò"
              />
            </div>
            <div>
              <Label htmlFor="scope">Phạm vi</Label>
              <Select
                value={formData.scope}
                onValueChange={(value) =>
                  setFormData({ ...formData, scope: value as RoleScope })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORGANIZER">Organizer (Scoped)</SelectItem>
                  <SelectItem value="GLOBAL">
                    Global (All Organizers)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editing && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_system_role"
                  checked={formData.is_system_role}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_system_role: !!checked })
                  }
                />
                <Label
                  htmlFor="is_system_role"
                  className="text-sm font-normal cursor-pointer"
                >
                  Vai trò hệ thống (không thể xóa)
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreate(false);
                setEditing(null);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Permissions Dialog */}
      <Dialog
        open={!!assigningPermissions}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningPermissions(null);
            setPermissionSearch("");
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Quản lý quyền: {assigningPermissions?.name}
            </DialogTitle>
            <DialogDescription>
              Chọn các quyền để gán cho vai trò này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Permission Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm quyền theo tên, mã, mô tả hoặc tài nguyên..."
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {allPermissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Không có quyền nào trong hệ thống</p>
              </div>
            ) : Object.keys(groupedPermissions).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Không tìm thấy quyền nào phù hợp</p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedPermissions).map(
                  ([resource, permissions]) => (
                    <AccordionItem key={resource} value={resource}>
                      <AccordionTrigger className="text-sm font-semibold">
                        {resource} ({(permissions as Permission[]).length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-4">
                          {(permissions as Permission[]).map((permission) => (
                            <div
                              key={permission._id}
                              className="flex items-start space-x-2"
                            >
                              <Checkbox
                                id={permission._id}
                                checked={selectedPermissions.has(
                                  permission._id
                                )}
                                onCheckedChange={() =>
                                  togglePermission(permission._id)
                                }
                              />
                              <div className="flex-1">
                                <Label
                                  htmlFor={permission._id}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {permission.name}
                                  <span className="ml-2 text-xs text-muted-foreground font-mono">
                                    ({permission.code})
                                  </span>
                                </Label>
                                {permission.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                )}
              </Accordion>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssigningPermissions(null)}
            >
              Hủy
            </Button>
            <Button onClick={savePermissions}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog
        open={!!assigningUsers}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningUsers(null);
            setSelectedUsers(new Set());
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gán người dùng: {assigningUsers?.name}</DialogTitle>
            <DialogDescription>
              Chọn người dùng để gán vai trò này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {allUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
              >
                <Checkbox
                  id={user._id}
                  checked={selectedUsers.has(user._id)}
                  onCheckedChange={() => toggleUser(user._id)}
                />
                <Label htmlFor={user._id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </Label>
                {!user.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Vô hiệu
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssigningUsers(null);
                setSelectedUsers(new Set());
              }}
            >
              Hủy
            </Button>
            <Button onClick={saveUsers} disabled={selectedUsers.size === 0}>
              Gán ({selectedUsers.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa vai trò</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa vai trò{" "}
              <strong>{deleteConfirm?.name}</strong>? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminRoles;
