import { Bell, Home, Settings, LogOut, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavButton } from "@/components/common/NavButton";
import { useAuth } from "@/contexts/AuthContext";

export const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { label: "Trang chủ", path: "/dashboard", icon: Home },
    { label: "Thông báo", path: "/notifications", icon: Bell },
    { label: "Tạo hội nghị mới", path: "/create-conference", icon: Plus },
  ];

  return (
    <nav className="bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto border-b border-border">
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
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="icon"
              className="relative flex w-fit px-4"
            >
              <Bell className="w-5 h-5" />
              <p className="font-medium font-heading transition-colors text-base">
                Thông báo
              </p>
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="hidden lg:block text-sm">
                <div className="font-medium text-foreground">
                  {user?.name || "User"}
                </div>
                <div className="text-muted-foreground text-xs">
                  {user?.email || ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
