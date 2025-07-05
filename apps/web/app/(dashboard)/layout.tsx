import type React from "react";

export default function DashboardLayout({
  children,
  sidebar,
  main,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  main: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar parallel route */}
      <aside className="w-64 border-border border-r">{sidebar || children}</aside>

      {/* Main content parallel route */}
      <main className="flex-1 overflow-y-auto">{main || children}</main>
    </div>
  );
}
