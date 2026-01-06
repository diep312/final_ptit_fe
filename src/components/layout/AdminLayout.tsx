import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarImage } from "@radix-ui/react-avatar";
import { NavLink } from "react-router-dom";

interface AdminLayoutProps {
  children: ReactNode;
}

function toStaticUrl(maybePath?: string | null): string | undefined {
  if (!maybePath) return undefined;
  const s = String(maybePath);
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/static/")) return s;
  const cleaned = s.startsWith("/") ? s.slice(1) : s;
  return `/static/${cleaned}`;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user } = useAuth();
  
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-background sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 border-b border-border">
            <div className="flex items-center justify-end">
              {/* <div className="flex-1 max-w-md">
                <Input
                  type="search"`
                  placeholder="Tìm kiếm..."
                  className="bg-background"
                />
              </div> */}

              <div className="flex items-center gap-4">
                {/* <Button variant="secondary" size="icon" className="relative flex w-fit px-4">
                  <Bell className="w-5 h-5"/>
                  <p className="font-medium font-heading transition-colors text-base">Thông báo</p>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
                </Button> */}

                <div className="flex items-center gap-3">
                    <NavLink
                      to="/profile"
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
                    </NavLink>
                  </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
