import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Shield,
  UserCog,
  Plus,
  Power,
  PowerOff,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useApi } from "@/hooks/use-api";
import { systemUserApi } from "@/lib/rbacApi";
import type { SystemUser } from "@/types/rbac";
import { SystemUserRolesDialog } from "@/components/admin/SystemUserRolesDialog";
import { SystemUserPermissionsDialog } from "@/components/admin/SystemUserPermissionsDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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

interface SystemUserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  organizer_id?: string;
}

const AdminSystemUsers = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const { safeRequest } = useApi();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Modals
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [viewingPermissions, setViewingPermissions] =
    useState<SystemUser | null>(null);
  const [assigningRoles, setAssigningRoles] = useState<SystemUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<SystemUser | null>(null);
  const [toggleActiveConfirm, setToggleActiveConfirm] =
    useState<SystemUser | null>(null);

  // Form state
  const [formData, setFormData] = useState<SystemUserFormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    organizer_id: undefined,
  });

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  const loadUsers = async () => {
    await safeRequest(async () => {
      const response = await systemUserApi.list({
        page,
        limit,
        include_roles: true,
        search: searchTerm || undefined,
      });
      setUsers(response.items || []);
      setTotal(response.total || 0);
    });
  };

  useEffect(() => {
    void loadUsers();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    void loadUsers();
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lower = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        u.phone?.toLowerCase().includes(lower)
    );
  }, [users, searchTerm]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      organizer_id: undefined,
    });
  };

  const handleCreate = () => {
    resetForm();
    setOpenCreate(true);
  };

  const handleEdit = (user: SystemUser) => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      organizer_id: user.organizer_id,
    });
    setEditing(user);
  };

  const handleSave = async () => {
    await safeRequest(async () => {
      if (editing) {
        await systemUserApi.update(editing._id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          organizer_id: formData.organizer_id,
        });
        toast.success("Cập nhật người dùng thành công");
      } else {
        await systemUserApi.create(formData);
        toast.success("Tạo người dùng thành công");
      }
      setOpenCreate(false);
      setEditing(null);
      resetForm();
      await loadUsers();
    });
  };

  const handleToggleActive = (user: SystemUser) => {
    setToggleActiveConfirm(user);
  };

  const confirmToggleActive = async () => {
    if (!toggleActiveConfirm) return;
    await safeRequest(async () => {
      if (toggleActiveConfirm.is_active) {
        await systemUserApi.deactivate(toggleActiveConfirm._id);
        toast.success("Vô hiệu hóa người dùng thành công");
      } else {
        await systemUserApi.activate(toggleActiveConfirm._id);
        toast.success("Kích hoạt người dùng thành công");
      }
      setToggleActiveConfirm(null);
      await loadUsers();
    });
  };

  const handleDelete = (user: SystemUser) => {
    setDeleteConfirm(user);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await safeRequest(async () => {
      await systemUserApi.delete(deleteConfirm._id);
      toast.success("Xóa người dùng thành công");
      setDeleteConfirm(null);
      await loadUsers();
    });
  };

  const getStatusBadge = (user: SystemUser) => {
    return user.is_active ? (
      <Badge className="bg-green-100 text-green-700">Hoạt động</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-600">Vô hiệu</Badge>
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
                placeholder="Nhập tên, email hoặc SĐT để tìm kiếm"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              Tìm kiếm
            </Button>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo người dùng
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-foreground text-background">
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    HỌ VÀ TÊN
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    EMAIL
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    SỐ ĐIỆN THOẠI
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    VAI TRÒ
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
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user._id}
                    className={`border-b hover:bg-muted/50 ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm">{user.phone || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge
                              key={role._id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {role.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Chưa có vai trò
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(user)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Xem quyền"
                          onClick={() => setViewingPermissions(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Quản lý vai trò"
                          onClick={() => setAssigningRoles(user)}
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Chỉnh sửa"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={user.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.is_active ? (
                            <PowerOff className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Power className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Xóa"
                          onClick={() => handleDelete(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
              {editing ? "Chỉnh sửa người dùng" : "Tạo người dùng mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Họ và tên *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nhập họ và tên"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="0123456789"
              />
            </div>
            {!editing && (
              <div>
                <Label htmlFor="password">Mật khẩu *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Nhập mật khẩu"
                />
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

      {/* Role Assignment Dialog */}
      <SystemUserRolesDialog
        open={!!assigningRoles}
        onOpenChange={(open) => !open && setAssigningRoles(null)}
        userId={assigningRoles?._id || null}
        userName={assigningRoles?.name}
        onSaved={() => {
          setAssigningRoles(null);
          void loadUsers();
        }}
      />

      {/* Permissions View Dialog */}
      <SystemUserPermissionsDialog
        open={!!viewingPermissions}
        onOpenChange={(open) => !open && setViewingPermissions(null)}
        userId={viewingPermissions?._id || null}
        userName={viewingPermissions?.name}
      />

      {/* Toggle Active Confirmation */}
      <AlertDialog
        open={!!toggleActiveConfirm}
        onOpenChange={(open) => !open && setToggleActiveConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleActiveConfirm?.is_active ? "Vô hiệu hóa" : "Kích hoạt"}{" "}
              người dùng
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn{" "}
              {toggleActiveConfirm?.is_active ? "vô hiệu hóa" : "kích hoạt"}{" "}
              <strong>{toggleActiveConfirm?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleActive}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng{" "}
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

export default AdminSystemUsers;
