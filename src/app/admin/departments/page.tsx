"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/shared/AdminSidebar";
import { MunicipalDepartment, DashboardMetrics } from "@/types";
import {
  Car,
  Trash2,
  Zap,
  Droplets,
  Waves,
  Building2,
  ArrowRight,
  Loader2,
  LucideIcon,
} from "lucide-react";

interface DeptInfo {
  name: MunicipalDepartment;
  head: string;
  phone: string;
  crews: number;
  icon: LucideIcon;
  color: string;
}

const DEPARTMENTS_DATA: DeptInfo[] = [
  {
    name: "Roads",
    head: "Chief Engineer Roy Adams",
    phone: "+1 (555) 492-7801",
    crews: 6,
    icon: Car,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    name: "Sanitation",
    head: "Superintendent Priya Patel",
    phone: "+1 (555) 492-7802",
    crews: 8,
    icon: Trash2,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    name: "Electricity",
    head: "Grid Director Marcus Wayne",
    phone: "+1 (555) 492-7803",
    crews: 4,
    icon: Zap,
    color: "text-amber-500 bg-amber-50 border-amber-200",
  },
  {
    name: "Water Supply",
    head: "Commissioner Alan Rivera",
    phone: "+1 (555) 492-7804",
    crews: 5,
    icon: Droplets,
    color: "text-sky-500 bg-sky-50 border-sky-200",
  },
  {
    name: "Drainage",
    head: "Stormwater Lead Sarah Chen",
    phone: "+1 (555) 492-7805",
    crews: 4,
    icon: Waves,
    color: "text-cyan-600 bg-cyan-50 border-cyan-200",
  },
  {
    name: "Other",
    head: "General Services Supervisor",
    phone: "+1 (555) 492-7806",
    crews: 2,
    icon: Building2,
    color: "text-gray-600 bg-gray-50 border-gray-200",
  },
];

export default function AdminDepartmentsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadMetrics() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (!res.ok) throw new Error("Failed to load department metrics.");
        const data = await res.json();
        if (mounted) {
          setMetrics(data.metrics);
        }
      } catch (e) {
        console.error("Department metrics error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMetrics();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex font-body">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold font-heading text-[#102C35]">
              Department Management
            </h1>
            <p className="text-xs text-brand-muted">
              Municipal agency allocation and crew dispatch coordination
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
            6 Municipal Directorates
          </span>
        </header>

        <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
          <div className="space-y-4">
            {DEPARTMENTS_DATA.map((dept) => {
              const Icon = dept.icon;
              const activeCount = metrics?.by_department?.[dept.name] || 0;

              return (
                <div
                  key={dept.name}
                  className="bg-white p-5 rounded-card border border-gray-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-floating transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${dept.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold font-heading text-[#102C35]">
                          {dept.name}
                        </h2>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 font-mono">
                          {dept.crews} Active Crews
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Officer: <strong>{dept.head}</strong> • {dept.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <div className="text-right">
                      <p className="text-xl font-extrabold font-mono text-[#102C35]">
                        {loading ? "..." : activeCount}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Active Complaints
                      </p>
                    </div>

                    <Link
                      href={`/admin/complaints?department=${encodeURIComponent(dept.name)}`}
                      className="px-4 py-2 bg-[#D6F36A] hover:bg-[#C4E654] text-[#102C35] font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <span>Assign & View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
