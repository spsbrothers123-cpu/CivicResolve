"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Shield, User, ChevronDown, ChevronUp, Database } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export function DemoNotice() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, profile, isConfigured } = useAuth();

  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="fixed bottom-4 right-4 z-50 font-body">
      {open ? (
        <div className="bg-[#102C35] text-white border border-[#183D49] rounded-xl shadow-2xl p-4 w-72 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#183D49]">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConfigured ? "bg-emerald-400" : "bg-amber-400"} animate-ping`} />
              <span className="text-xs font-semibold text-[#D6F36A] uppercase tracking-wider font-mono">
                CivicResolve Backend
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-gray-300 space-y-1">
            <p className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#D6F36A]" />
              <span>Database: <strong>{isConfigured ? "Supabase PostgreSQL (Live)" : "Demo Mode"}</strong></span>
            </p>
            <p className="text-[11px] text-gray-400">
              Active User: <strong>{profile?.full_name || (user ? user.email : "Not Authenticated")}</strong>
            </p>
            <p className="text-[11px] text-gray-400">
              Active Role: <strong className="capitalize">{profile?.role || (isAdmin ? "Admin Portal" : "Citizen Portal")}</strong>
            </p>
          </div>

          {/* Hackathon Jury Demo Credentials */}
          <div className="bg-[#183D49]/80 border border-[#234F5E] p-2.5 rounded-lg space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-[#D6F36A] font-semibold">
              <span>Jury Demo Credentials</span>
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#102C35] text-amber-300 border border-amber-300/30 font-mono">
                Admin
              </span>
            </div>
            <p className="text-gray-300 font-mono text-[10px]">
              Email: <span className="text-white font-bold select-all">lumenstackdevs@gmail.com</span>
            </p>
            <p className="text-gray-300 font-mono text-[10px]">
              Pass: <span className="text-white font-bold select-all">hack2skill123</span>
            </p>
          </div>

          <div className="pt-1 flex flex-col gap-1.5 text-xs">
            {isAdmin ? (
              <Link
                href="/dashboard"
                className="w-full py-1.5 px-3 bg-[#183D49] hover:bg-[#183D49]/80 text-[#D6F36A] font-medium rounded-lg text-center flex items-center justify-center gap-1.5 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Switch to Citizen View</span>
              </Link>
            ) : (
              <Link
                href={profile?.role === "admin" ? "/admin" : "/admin/login"}
                className="w-full py-1.5 px-3 bg-[#D6F36A] hover:bg-[#C4E654] text-[#102C35] font-semibold rounded-lg text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{profile?.role === "admin" ? "Switch to Admin Portal" : "Admin Login Portal"}</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#102C35] hover:bg-[#183D49] text-white border border-[#183D49] rounded-full shadow-lg text-xs font-medium transition-all hover:scale-105"
        >
          <span className={`w-2 h-2 rounded-full ${isConfigured ? "bg-emerald-400" : "bg-amber-400"}`} />
          <span>{isConfigured ? "Live Backend" : "Demo Mode"}</span>
          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
        </button>
      )}
    </div>
  );
}
