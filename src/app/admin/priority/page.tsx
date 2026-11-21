"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/shared/AdminSidebar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DepartmentBadge } from "@/components/ui/DepartmentBadge";
import { Issue, IssuePriority } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  MapPin,
  Clock,
  Loader2,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPriorityQueuePage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<IssuePriority>("Critical");

  useEffect(() => {
    let mounted = true;
    async function loadPriorityIssues() {
      try {
        const res = await fetch("/api/admin/issues");
        if (!res.ok) throw new Error("Failed to load priority queue.");
        const data = await res.json();
        if (mounted) {
          setIssues(data.issues || []);
        }
      } catch (e) {
        console.error("Priority queue load error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPriorityIssues();
    return () => {
      mounted = false;
    };
  }, []);

  const criticalIssues = issues.filter((i) => i.priority === "Critical");
  const highIssues = issues.filter((i) => i.priority === "High");
  const mediumIssues = issues.filter((i) => i.priority === "Medium");
  const lowIssues = issues.filter((i) => i.priority === "Low");

  const priorities: {
    key: IssuePriority;
    label: string;
    count: number;
    color: string;
    border: string;
    bg: string;
    badgeBg: string;
    list: Issue[];
  }[] = [
    {
      key: "Critical",
      label: "Critical Priority",
      count: criticalIssues.length,
      color: "text-red-700",
      border: "border-red-200",
      bg: "bg-[#FDEDED]/80",
      badgeBg: "bg-red-600 text-white",
      list: criticalIssues,
    },
    {
      key: "High",
      label: "High Priority",
      count: highIssues.length,
      color: "text-[#D65B52]",
      border: "border-[#F8B4AF]",
      bg: "bg-[#FEF7EC]/80",
      badgeBg: "bg-[#D65B52] text-white",
      list: highIssues,
    },
    {
      key: "Medium",
      label: "Medium Priority",
      count: mediumIssues.length,
      color: "text-[#E7A23B]",
      border: "border-[#FBD69F]",
      bg: "bg-amber-50/50",
      badgeBg: "bg-[#E7A23B] text-white",
      list: mediumIssues,
    },
    {
      key: "Low",
      label: "Low Priority",
      count: lowIssues.length,
      color: "text-gray-700",
      border: "border-gray-200",
      bg: "bg-gray-50",
      badgeBg: "bg-gray-600 text-white",
      list: lowIssues,
    },
  ];

  const currentGroup = priorities.find((p) => p.key === activeTab) || priorities[0];

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex font-body">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold font-heading text-[#102C35]">
              Priority Queue
            </h1>
            <p className="text-xs text-brand-muted">
              Municipal triage order based on severity and public safety risk
            </p>
          </div>
        </header>

        <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
          {/* Priority Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {priorities.map((p) => (
              <button
                key={p.key}
                onClick={() => setActiveTab(p.key)}
                className={cn(
                  "p-4 rounded-card border text-left transition-all",
                  activeTab === p.key
                    ? `${p.bg} ${p.border} shadow-md ring-2 ring-[#102C35]/10`
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-bold font-heading", p.color)}>
                    {p.label}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-mono font-bold px-2 py-0.5 rounded-full",
                      p.badgeBg
                    )}
                  >
                    {loading ? "..." : p.count}
                  </span>
                </div>
                <p className="text-2xl font-extrabold font-heading text-gray-900 mt-2">
                  {loading ? "..." : p.count}
                </p>
              </button>
            ))}
          </div>

          {/* Issue Cards */}
          <div className="bg-white rounded-card border border-gray-200 shadow-card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold font-heading text-[#102C35] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>{currentGroup.label} Work Orders</span>
              </h2>
              <span className="text-xs font-mono text-gray-500">
                {currentGroup.list.length} Records
              </span>
            </div>

            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#102C35]" />
                <p className="text-xs text-gray-500">Loading priority complaints...</p>
              </div>
            ) : currentGroup.list.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <Inbox className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-semibold text-gray-700">No {activeTab} priority issues</p>
                <p className="text-xs text-gray-400">All complaints in this priority tier have been cleared.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {currentGroup.list.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/admin/complaints/${issue.id}`}
                    className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group block"
                  >
                    <div className="space-y-1.5 min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#102C35] bg-gray-100 px-2 py-0.5 rounded">
                          {issue.id}
                        </span>
                        <DepartmentBadge department={issue.department} />
                        <StatusBadge status={issue.status} size="sm" />
                        <span className="text-[11px] text-gray-400 font-mono">
                          {formatDate(issue.created_at)}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#102C35] truncate">
                        {issue.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{issue.location_text}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center text-xs font-semibold text-blue-600 group-hover:underline">
                      <span>Dispatch →</span>
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
