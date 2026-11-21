"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/shared/AdminSidebar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { DepartmentBadge } from "@/components/ui/DepartmentBadge";
import { formatDate } from "@/lib/utils";
import { Issue, DashboardMetrics } from "@/types";
import {
  FileText,
  Clock,
  Settings,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  Loader2,
  AlertCircle,
  Inbox,
} from "lucide-react";

export default function AdminOverviewDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadAdminData() {
      try {
        const [dashRes, issuesRes] = await Promise.all([
          fetch("/api/admin/dashboard"),
          fetch("/api/admin/issues?limit=20"),
        ]);

        if (!dashRes.ok || !issuesRes.ok) {
          throw new Error("Failed to load municipal administrative metrics.");
        }

        const dashData = await dashRes.json();
        const issuesData = await issuesRes.json();

        if (mounted) {
          setMetrics(dashData.metrics);
          setIssues(issuesData.issues || []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAdminData();
    return () => {
      mounted = false;
    };
  }, []);

  const totalReports = metrics?.total ?? 0;
  const pendingCount = metrics?.reported ?? 0;
  const inProgressCount = metrics?.in_progress ?? 0;
  const resolvedCount = metrics?.resolved ?? 0;

  const criticalIssues = issues.filter(
    (i) => i.priority === "Critical" || i.priority === "High"
  );

  const departmentsList = [
    { name: "Roads", count: metrics?.by_department?.["Roads"] || 0 },
    { name: "Sanitation", count: metrics?.by_department?.["Sanitation"] || 0 },
    { name: "Electricity", count: metrics?.by_department?.["Electricity"] || 0 },
    { name: "Water Supply", count: metrics?.by_department?.["Water Supply"] || 0 },
    { name: "Drainage", count: metrics?.by_department?.["Drainage"] || 0 },
    { name: "Other", count: metrics?.by_department?.["Other"] || 0 },
  ];

  const totalDeptTasks = departmentsList.reduce((acc, d) => acc + d.count, 0) || 1;

  const categoriesList = [
    { name: "Pothole", count: metrics?.by_category?.["Pothole"] || 0, color: "bg-blue-500" },
    { name: "Road Damage", count: metrics?.by_category?.["Road Damage"] || 0, color: "bg-indigo-500" },
    { name: "Garbage", count: metrics?.by_category?.["Garbage"] || 0, color: "bg-emerald-500" },
    { name: "Streetlight", count: metrics?.by_category?.["Streetlight"] || 0, color: "bg-amber-500" },
    { name: "Water Leakage", count: metrics?.by_category?.["Water Leakage"] || 0, color: "bg-cyan-500" },
    { name: "Drainage", count: metrics?.by_category?.["Drainage"] || 0, color: "bg-teal-500" },
    { name: "Other", count: metrics?.by_category?.["Other"] || 0, color: "bg-gray-400" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex font-body">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold font-heading text-[#102C35]">
              Dashboard
            </h1>
            <p className="text-xs text-brand-muted">
              Central Municipal Operations Overview
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/complaints"
              className="px-3.5 py-1.5 bg-[#102C35] hover:bg-[#183D49] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Complaints Console</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total */}
            <div className="bg-white p-5 rounded-card border border-gray-200 shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-brand-muted uppercase font-mono">
                  Total
                </p>
                <p className="text-3xl font-extrabold font-heading text-[#102C35] mt-1">
                  {loading ? (
                    <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded-md mt-1" />
                  ) : (
                    totalReports
                  )}
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-1">
                  Recorded in database
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-[#102C35]">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white p-5 rounded-card border border-gray-200 shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-brand-muted uppercase font-mono">
                  Pending / Reported
                </p>
                <p className="text-3xl font-extrabold font-heading text-blue-600 mt-1">
                  {loading ? (
                    <span className="inline-block w-12 h-8 bg-blue-100 animate-pulse rounded-md mt-1" />
                  ) : (
                    pendingCount
                  )}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Awaiting review
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-white p-5 rounded-card border border-gray-200 shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-brand-muted uppercase font-mono">
                  In Progress
                </p>
                <p className="text-3xl font-extrabold font-heading text-amber-600 mt-1">
                  {loading ? (
                    <span className="inline-block w-12 h-8 bg-amber-100 animate-pulse rounded-md mt-1" />
                  ) : (
                    inProgressCount
                  )}
                </p>
                <p className="text-[11px] text-amber-600 font-medium mt-1">
                  Field crews active
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Settings className="w-6 h-6" />
              </div>
            </div>

            {/* Resolved */}
            <div className="bg-white p-5 rounded-card border border-gray-200 shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-brand-muted uppercase font-mono">
                  Resolved
                </p>
                <p className="text-3xl font-extrabold font-heading text-emerald-600 mt-1">
                  {loading ? (
                    <span className="inline-block w-12 h-8 bg-emerald-100 animate-pulse rounded-md mt-1" />
                  ) : (
                    resolvedCount
                  )}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  {totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0}% resolution rate
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Middle Row: Complaints Trend & Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* By Category Breakdown */}
            <div className="lg:col-span-6 bg-white p-6 rounded-card border border-gray-200 shadow-card space-y-4">
              <div>
                <h2 className="text-base font-bold font-heading text-[#102C35]">
                  Complaints by Category
                </h2>
                <p className="text-xs text-brand-muted">
                  Distribution of civic problems across infrastructure domains
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {categoriesList.map((cat) => {
                  const pct = totalReports > 0 ? Math.round((cat.count / totalReports) * 100) : 0;
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700">{cat.name}</span>
                        <span className="text-gray-500 font-mono">{cat.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${cat.color} rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Workload */}
            <div className="lg:col-span-6 bg-white p-6 rounded-card border border-gray-200 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-heading text-[#102C35] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span>Department Assignment</span>
                  </h2>
                  <p className="text-xs text-brand-muted">
                    Workload distribution across municipal teams
                  </p>
                </div>
                <Link
                  href="/admin/departments"
                  className="text-xs text-[#102C35] font-semibold hover:underline"
                >
                  View All →
                </Link>
              </div>

              <div className="space-y-3 pt-2">
                {departmentsList.map((dept) => {
                  const pct = totalDeptTasks > 0 ? Math.round((dept.count / totalDeptTasks) * 100) : 0;
                  return (
                    <div key={dept.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700">{dept.name}</span>
                        <span className="text-gray-500 font-mono">{dept.count} tasks</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#102C35] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Row: Critical Priority Queue */}
          <div className="bg-white rounded-card border border-gray-200 shadow-card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-heading text-[#102C35] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Critical & High Priority Queue</span>
                </h3>
                <p className="text-xs text-brand-muted">
                  Urgent complaints flagged for expedited response
                </p>
              </div>
              <Link
                href="/admin/priority"
                className="text-xs font-semibold text-[#102C35] hover:underline flex items-center gap-1"
              >
                <span>View All Priority</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {criticalIssues.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No active critical or high-priority complaints in the queue.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {criticalIssues.slice(0, 5).map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/admin/complaints/${issue.id}`}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#102C35] bg-gray-100 px-2 py-0.5 rounded">
                          {issue.id}
                        </span>
                        <span className="text-xs font-semibold text-gray-900 truncate">
                          {issue.title}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {issue.location_text}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <PriorityBadge priority={issue.priority} size="sm" />
                      <StatusBadge status={issue.status} size="sm" />
                      <span className="text-xs font-semibold text-blue-600 group-hover:underline">
                        Review →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
