import { LayoutDashboard, Calendar, FileText, Edit, ClipboardCheck, FormInput } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  openInNewWindow?: boolean;
}

interface ConferenceSidebarProps {
  title?: string;
}

export const ConferenceSidebar: React.FC<ConferenceSidebarProps> = ({ title }) => {
  const { id } = useParams();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      to: `/conference/${id}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      label: "Lịch trình",
      to: `/conference/${id}/schedule`,
      icon: Calendar,
    },
    {
      label: "Danh sách đăng ký",
      to: `/conference/${id}/registrations`,
      icon: FileText,
    },
    {
      label: "Form đăng ký",
      to: `/conference/${id}/form`,
      icon: FormInput,
    },
    {
      label: "Chỉnh sửa",
      to: `/conference/${id}/edit`,
      icon: Edit,
    },
    {
      label: "Check-in",
      to: `/conference/${id}/check-in`,
      icon: ClipboardCheck,
      openInNewWindow: true,
    },
  ];

  const isActive = (path: string) => {
    if (path.startsWith('#')) {
      return location.hash === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="w-20 border-r border-border h-fit sticky top-16 z-40 flex flex-col items-center py-4 overflow-hidden">
      
      <div className="flex flex-col items-center space-y-6 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          
          const handleClick = (e: React.MouseEvent) => {
            if (item.openInNewWindow) {
              e.preventDefault();
              const checkInUrl = `${window.location.origin}${item.to}`;
              const newWindow = window.open(
                checkInUrl,
                "check-in",
                "fullscreen=yes,width=1920,height=1080"
              );
              
              if (newWindow) {
                // Try to enter fullscreen after window opens
                setTimeout(() => {
                  newWindow.document.documentElement.requestFullscreen?.() ||
                    (newWindow.document.documentElement as any).webkitRequestFullscreen?.() ||
                    (newWindow.document.documentElement as any).msRequestFullscreen?.();
                }, 500);
              }
            }
          };
          
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={handleClick}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 group",
                "transition-colors"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  "transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-xs text-center leading-tight max-w-[60px]",
                  active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ConferenceSidebar;

