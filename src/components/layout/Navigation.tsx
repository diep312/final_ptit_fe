import { Bell, Home, Settings, LogOut, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavButton } from "@/components/common/NavButton";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function toStaticUrl(maybePath?: string | null): string | undefined {
  if (!maybePath) return undefined;
  const s = String(maybePath);
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/static/")) return s;
  const cleaned = s.startsWith("/") ? s.slice(1) : s;
  return `/static/${cleaned}`;
}

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userType, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const handleOpenProfile = () => {
    if (userType === "organizer") navigate("/organizer/profile");
    else if (userType === "admin" || userType === "system_user") navigate("/profile");
  };

  const navItems = [
    { label: "Trang chủ", path: "/dashboard", icon: Home },
    { label: "Tạo hội nghị mới", path: "/create-conference", icon: Plus },
  ];

  return (
    <nav className="bg-background sticky top-0 z-50">
      <div className="mx-auto border-b border-border px-16">
        <div className="flex items-center justify-between h-16">
          <div className="flex gap-14">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="font-heading font-bold text-3xl text-foreground">
                  Conferdent
                </h1>
                <p className="font-heading text-sm">Event Organiser</p>
              </div>
            </Link>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center gap-4">
              {navItems.map((item) => (
                <NavButton
                  key={item.path}
                  label={item.label}
                  path={item.path}
                  icon={item.icon}
                  isActive={location.pathname === item.path}
                />
              ))}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </Button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 max-w-[250px]">
            <button
              type="button"
              onClick={handleOpenProfile}
              className="flex items-center gap-3 text-left"
            >
              <Avatar className="h-8 w-8">
                {user?.avatar ? (
                  <AvatarImage src={toStaticUrl(user.avatar)} alt={user?.name || "User"} />
                ) : null}
                <AvatarFallback>
                  {(user?.name?.charAt(0) || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-sm">
                <div className="font-medium text-foreground">{user?.name || "User"}</div>
                <div className="text-muted-foreground text-xs">{user?.email || ""}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
