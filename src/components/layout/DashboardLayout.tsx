import { ReactNode } from "react";
import { Navigation } from "./Navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto py-6 px-20">{children}</main>
    </div>
  );
};
