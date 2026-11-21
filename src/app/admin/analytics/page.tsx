"use client";

import React, { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/shared/AdminSidebar";
import { DashboardMetrics } from "@/types";
import {
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("Last 30 Days");

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const data = await res.json();
          if (mounted) setMetrics(data.metrics);
        }
      } catch (err) {
        console.error("Failed to load analytics metrics:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const total = metrics?.total || 0;
  const resolved = metrics?.resolved || 0;
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex font-body">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold font-heading text-[#102C35]">
              Municipal Analytics
            </h1>
            <p className="text-xs text-brand-muted">
              Resolution throughput, department performance, and SLA compliance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-lg border border-gray-300 bg-white font-medium"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Quarter to Date">Quarter to Date</option>
              <option value="Year to Date">Year to Date</option>
            </select>
          </div>
        </header>

        <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
          {/* Top 3 High-Impact Analytics Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Resolution Rate Callout */}
            <div className="bg-white p-6 rounded-card border border-gray-200 shadow-card flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-brand-muted uppercase font-mono">
                  Municipal Resolution Rate
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-5xl font-black font-heading text-[#24876B]">
                    {loading ? "..." : `${rate}%`}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {resolved} of {total} civic complaints resolved and verified.
                </p>
              </div>

              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mt-4">
                <div
                  className="bg-[#24876B] h-full rounded-full transition-all duration-500"
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>

            {/* Average Emergency Response Time */}
            <div className="bg-white p-6 rounded-card border border-gray-200 shadow-card flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-brand-muted uppercase font-mono">
                  Avg Time to Dispatch
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-5xl font-black font-heading text-[#102C35]">
                    2.4h
                  </p>
                  <span className="text-xs font-semibold text-emerald-600">
                    SLA on Track
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Municipal intake and routing to responsible agency.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mt-4 pt-2 border-t border-gray-100">
                <Clock className="w-4 h-4 text-[#24876B]" />
                <span>Target SLA: Under 4.0h</span>
              </div>
            </div>

            {/* Active Complaints */}
            <div className="bg-white p-6 rounded-card border border-gray-200 shadow-card flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-brand-muted uppercase font-mono">
                  Active Dispatch Workload
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-5xl font-black font-heading text-blue-600">
                    {loading ? "..." : (metrics?.reported || 0) + (metrics?.in_progress || 0)}
                  </p>
                  <span className="text-xs font-semibold text-blue-600 font-mono">
                    active
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {metrics?.reported || 0} awaiting triage, {metrics?.in_progress || 0} active with field crews.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mt-4 pt-2 border-t border-gray-100">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Critical / High: {metrics?.critical_high || 0}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
