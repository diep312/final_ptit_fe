import { Home, Calendar, FileText, Users, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Trang chủ", path: "/admin", icon: Home },
  { label: "Quản lý hội nghị", path: "/admin/conferences", icon: Calendar },
  { label: "Quản lý yêu cầu", path: "/admin/requests", icon: FileText },
  { label: "Quản lý người dùng", path: "/admin/users", icon: Users },
];

export const AdminSidebar = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };
  return (
    <aside className="w-64 bg-card border-r h-screen sticky top-0 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold">Conferdent</h1>
        <p className="text-sm text-muted-foreground">Admin Console</p>
      </div>

      <nav className="px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-accent"
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent w-full"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};
