import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import AdminUserForm from "@/components/admin/AdminUserForm";
import AdminUserView from "@/components/admin/AdminUserView";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  is_active?: boolean;
  role: 'admin' | 'organizer' | 'user';
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const { safeRequest, api } = useApi();
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [viewing, setViewing] = useState<UserRow | null>(null)

  const reload = async () => {
    await safeRequest(async () => {
      // fetch admins and organizers, normalize into single list
      const [adminsRes, orgRes] = await Promise.all([api.get('/admin/users'), api.get('/admin/organizers')]);

      const adminsPayload = (adminsRes as any)?.data ?? adminsRes;
      const orgPayload = (orgRes as any)?.data ?? orgRes;

      const admins: UserRow[] = (adminsPayload?.admins || []).map((a: any) => ({
        _id: a._id || a.id,
        name: a.name || a.fullName || a.email,
        email: a.email,
        phone: a.phone,
        is_active: typeof a.is_active !== 'undefined' ? a.is_active : true,
        role: 'admin',
      }));

      const orgs: UserRow[] = (orgPayload?.organizers || []).map((o: any) => ({
        _id: o._id,
        name: o.name,
        email: o.email,
        phone: o.phone,
        is_active: typeof o.is_active !== 'undefined' ? o.is_active : true,
        role: 'organizer',
      }));

      setUsers([...admins, ...orgs]);
    })
  }

  useEffect(() => { void reload() }, [safeRequest, api])

  const getRoleBadge = (role: UserRow['role'], isActive?: boolean) => {
    if (!isActive) return <Badge className="bg-gray-100 text-gray-600">Vô hiệu</Badge>;
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary text-primary-foreground">Admin</Badge>;
      case 'organizer':
        return <Badge className="bg-blue-100 text-blue-700">Tổ chức</Badge>;
      case 'user':
      default:
        return <Badge className="bg-gray-100 text-gray-700">Người dùng</Badge>;
    }
  };

  const disableUser = async (id: string, disabled = true) => {
    await safeRequest(async () => {
      await api.patch(`/admin/organizers/${id}/disable`, { disabled });
      // update local state
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, is_active: !disabled } : u)));
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Search and Create Button */}
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Nhập tên, email hoặc SĐT để tìm kiếm"
                className="pl-10"
              />
            </div>
            <select className="px-4 py-2 border rounded-lg bg-background text-sm">
              <option>Chọn vai trò để tìm kiếm</option>
              <option>Admin</option>
              <option>Tổ chức</option>
              <option>Người dùng</option>
            </select>
          </div>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setOpenCreate(true)}>TẠO MỚI</Button>
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
                    HÀNH ĐỘNG
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user._id}
                    className={`border-b hover:bg-muted/50 ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4 text-sm">{user.phone}</td>
                    <td className="px-6 py-4">{getRoleBadge(user.role, user.is_active)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setViewing(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setEditing(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {user.role === 'organizer' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void disableUser(user._id, !!user.is_active)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : null}
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
              Hiển thị 1 - 5 trên tổng 5 bản ghi
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="w-8 h-8 p-0 rounded-full"
              >
                1
              </Button>
            </div>
          </div>
        </div>
      </div>
      <AdminUserForm
        open={openCreate}
        onOpenChange={(v) => { setOpenCreate(v); if (!v) void reload() }}
        role={'organizer'}
        onSaved={() => void reload()}
      />

      <AdminUserForm
        open={!!editing}
        onOpenChange={(v) => { if (!v) setEditing(null) }}
        initial={editing}
        role={editing?.role === 'admin' ? 'admin' : 'organizer'}
        onSaved={() => { setEditing(null); void reload() }}
      />
      <AdminUserView
        open={!!viewing}
        onOpenChange={(v) => { if (!v) setViewing(null) }}
        id={viewing?._id}
        role={viewing?.role}
      />
    </AdminLayout>
  );
};

export default AdminUsers;
