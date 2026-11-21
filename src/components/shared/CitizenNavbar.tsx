"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import {
  PlusCircle,
  Bell,
  Menu,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

export function CitizenNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile } = useAuth();

  const navLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Complaints", href: "/complaints" },
    { label: "Track Status", href: "/track" },
  ];

  const displayName = profile?.full_name || (user?.email ? user.email.split("@")[0] : null);
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "CR";

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#102C35] border-b border-[#183D49] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Logo variant="light" href="/dashboard" />
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#183D49] text-[#D6F36A]"
                        : "text-gray-300 hover:text-white hover:bg-[#183D49]/50"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/report"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D6F36A] hover:bg-[#C4E654] text-[#102C35] text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report New Issue</span>
            </Link>

            {/* Profile Avatar / Login Link */}
            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-2 border-l border-[#183D49] hover:opacity-90 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-[#D6F36A] text-[#102C35] font-semibold text-xs flex items-center justify-center font-heading border border-[#C4E654]">
                  {initials}
                </div>
                <span className="hidden lg:inline text-xs text-gray-200 font-medium">
                  {displayName}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-xs text-gray-300 hover:text-[#D6F36A] font-semibold pl-2 border-l border-[#183D49]"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white rounded-lg hover:bg-[#183D49]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 bg-[#102C35] border-b border-[#183D49] space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm text-gray-200 hover:bg-[#183D49] hover:text-[#D6F36A]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-gray-200 hover:bg-[#183D49] hover:text-[#D6F36A]"
            >
              My Profile
            </Link>
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white"
            >
              Switch to Municipal Admin Portal →
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
