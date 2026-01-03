import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { Lock, User } from "lucide-react";

type OrganizerDetails = {
  organizer_id?: string;
  organization_name?: string;
  address?: string | null;
  website?: string | null;
  description?: string | null;
  logo_url?: string | null;
};

function toStaticUrl(maybePath?: string | null): string | null {
  if (!maybePath) return null;
  const s = String(maybePath);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/static/")) return s;
  const cleaned = s.startsWith("/") ? s.slice(1) : s;
  return `/static/${cleaned}`;
}

const OrganizerProfile = () => {
  const { api, safeRequest } = useApi();
  const { checkAuth } = useAuth();

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "" as string | undefined,
  });

  const [details, setDetails] = useState<OrganizerDetails | null>(null);
  const [description, setDescription] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    let revokedUrl: string | null = null;

    safeRequest(async () => {
      const me = await api.get<any>("/organizer/auth/me");
      const meData = me?.data ?? me;
      setProfileData({
        name: meData?.name ?? "",
        email: meData?.email ?? "",
        phone: meData?.phone ?? "",
        avatar: meData?.avatar,
      });

      try {
        const d = await api.get<any>("/organizer/details/me");
        const dData = d?.data ?? d;
        setDetails(dData);
        setDescription(dData?.description ?? "");
      } catch (e) {
        // If details do not exist yet, keep it empty and allow upsert on save.
        setDetails(null);
        setDescription("");
      }

      // If the backend returns an absolute avatar URL (or /static/... in prod), show it.
      const staticUrl = toStaticUrl(meData?.avatar);
      if (staticUrl) {
        setAvatarPreviewUrl(staticUrl);
        revokedUrl = null;
      }
    });

    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const derivedOrganizationName = useMemo(() => {
    return (
      details?.organization_name?.trim() || profileData.name?.trim() || "Organizer"
    );
  }, [details?.organization_name, profileData.name]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    await safeRequest(async () => {
      const form = new FormData();
      form.set("name", profileData.name);
      // Backend validation currently requires email + phone, so we submit existing values.
      form.set("email", profileData.email);
      form.set("phone", profileData.phone);
      if (avatarFile) form.set("avatar", avatarFile);

      await api.put("/organizer/auth/me", form);

      // Save description (organizer details) via upsert to handle first-time creation.
      await api.post("/organizer/details/upsert", {
        organization_name: derivedOrganizationName,
        description,
      });

      toast.success("Cập nhật thông tin thành công");
      setAvatarFile(null);
      await checkAuth();
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
      await api.patch("/organizer/auth/change-password", {
        password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success("Đổi mật khẩu thành công");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Thông tin cá nhân</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin tài khoản và mật khẩu của bạn
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Thông tin cá nhân
            </CardTitle>
            <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
          </CardHeader>
          <CardContent>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-6 items-start">
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

                  <Label htmlFor="email" className="mt-4">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    readOnly
                    disabled
                  />

                  <Label htmlFor="phone" className="mt-4">Số điện thoại</Label>
                  <Input id="phone" value={profileData.phone} readOnly disabled />
                </div>

                {/* Avatar Upload - Right side */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Ảnh đại diện</Label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-primary transition-colors aspect-square w-full max-w-[160px] mx-auto"
                    onClick={() => document.getElementById('avatar-input')?.click()}
                  >
                    <input
                      id="avatar-input"
                      type="file"
                      accept="image/jpeg,image/png,image/svg+xml,image/webp"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    {avatarPreviewUrl ? (
                      <div className="space-y-1 w-full">
                        <img
                          src={avatarPreviewUrl}
                          alt="Avatar preview"
                          className="w-full h-auto rounded-lg"
                        />
                        <p className="text-xs text-muted-foreground">Nhấn để thay đổi</p>
                      </div>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-muted-foreground mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        <p className="text-xs text-muted-foreground">Tải ảnh đại diện</p>
                        <p className="text-xs text-muted-foreground mt-1">(1:1)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả"
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto">
                Cập nhật thông tin
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Đổi mật khẩu
            </CardTitle>
            <CardDescription>Thay đổi mật khẩu đăng nhập của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Mật khẩu hiện tại</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      current_password: e.target.value,
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
      </div>
    </DashboardLayout>
  );
};

export default OrganizerProfile;
