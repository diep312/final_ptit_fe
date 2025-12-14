import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { User, Lock, Mail, Phone, Shield } from "lucide-react";

const Profile = () => {
  const { user, permissions } = useAuth();
  const { api, safeRequest } = useApi();

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await safeRequest(async () => {
      await api.put("/admin/auth/profile", {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      });
      toast.success("Cập nhật thông tin thành công");
      // Reload to get updated user info
      window.location.reload();
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    await safeRequest(async () => {
      await api.put("/admin/auth/change-password", {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      toast.success("Đổi mật khẩu thành công");
      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    });
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const resource = perm.resource || "OTHER";
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Thông tin cá nhân</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin tài khoản và mật khẩu của bạn
          </p>
        </div>

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Thông tin cá nhân
            </CardTitle>
            <CardDescription>
              Cập nhật thông tin cá nhân của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData({ ...profileData, phone: e.target.value })
                  }
                  placeholder="0123456789"
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto">
                Cập nhật thông tin
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Đổi mật khẩu
            </CardTitle>
            <CardDescription>
              Thay đổi mật khẩu đăng nhập của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old_password">Mật khẩu hiện tại</Label>
                <Input
                  id="old_password"
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      old_password: e.target.value,
                    })
                  }
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">Mật khẩu mới</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      new_password: e.target.value,
                    })
                  }
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirm_password: e.target.value,
                    })
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full sm:w-auto"
              >
                Đổi mật khẩu
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Roles and Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Vai trò và quyền
            </CardTitle>
            <CardDescription>
              Các vai trò và quyền hiện tại của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Roles */}
            {user?.roles && user.roles.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Vai trò
                </Label>
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <Badge
                      key={role._id}
                      variant="secondary"
                      className="text-sm"
                    >
                      {role.name}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({role.code})
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Permissions */}
            {permissions.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Quyền ({permissions.length})
                </Label>
                <div className="space-y-3">
                  {Object.entries(groupedPermissions).map(
                    ([resource, perms]) => (
                      <div key={resource} className="border rounded-lg p-3">
                        <div className="font-medium text-sm mb-2">
                          {resource}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {perms.length}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {perms.map((perm) => (
                            <Badge
                              key={perm._id}
                              variant="outline"
                              className="text-xs"
                            >
                              {perm.action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {permissions.length === 0 &&
              (!user?.roles || user.roles.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  Bạn chưa được gán vai trò hoặc quyền nào.
                </p>
              )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Profile;
