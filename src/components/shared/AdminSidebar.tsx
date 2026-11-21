"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Building2,
  MapPin,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };

  const menuItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Complaints", href: "/admin/complaints", icon: FileText },
    { label: "Priority Queue", href: "/admin/priority", icon: AlertTriangle },
    { label: "Departments", href: "/admin/departments", icon: Building2 },
    { label: "Map View", href: "/admin/map", icon: MapPin },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  return (
    <aside
      className={cn(
        "bg-[#102C35] border-r border-[#183D49] text-white flex flex-col justify-between transition-all duration-300 min-h-screen shrink-0 sticky top-0 z-30",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div>
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#183D49]">
          {!collapsed ? (
            <Logo variant="admin" href="/admin" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#D6F36A] flex items-center justify-center font-bold text-[#102C35]">
              CR
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#183D49] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Administrative Badge */}
        {!collapsed && (
          <div className="px-4 py-3 mx-3 my-3 rounded-lg bg-[#0B1E24] border border-[#183D49] flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#D6F36A]" />
            <div className="text-xs">
              <p className="font-semibold text-white">
                {profile?.full_name || "Municipal Administrator"}
              </p>
              <p className="text-[11px] text-gray-400">Operations Console</p>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav className="px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-[#D6F36A] text-[#102C35] font-semibold shadow-xs"
                    : "text-gray-300 hover:text-white hover:bg-[#183D49]"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive
                      ? "text-[#102C35]"
                      : "text-gray-400 group-hover:text-white"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom utilities */}
      <div className="p-3 border-t border-[#183D49] space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-[#183D49] transition-colors"
          title={collapsed ? "Citizen Portal" : undefined}
        >
          <span className="text-[#D6F36A] font-bold">↗</span>
          {!collapsed && <span>Go to Citizen Portal</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-300 hover:text-red-200 hover:bg-red-950/40 transition-colors text-left"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0 text-red-400" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
