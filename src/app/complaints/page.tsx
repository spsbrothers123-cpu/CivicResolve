"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CitizenNavbar } from "@/components/shared/CitizenNavbar";
import { Footer } from "@/components/shared/Footer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { formatDate } from "@/lib/utils";
import { Issue, IssueStatus } from "@/types";
import { Search, PlusCircle, ChevronRight, FileText, Loader2, AlertCircle, Inbox, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyComplaintsPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    let mounted = true;
    async function loadIssues() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "All") params.set("status", statusFilter);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/issues?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to load complaints.");
        }
        const data = await res.json();
        if (mounted) {
          setIssues(data.issues || []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load complaints.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      loadIssues();
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [statusFilter, search]);

  const statuses: ("All" | IssueStatus)[] = [
    "All",
    "Reported",
    "In Progress",
    "Resolved",
  ];

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex flex-col font-body">
      <CitizenNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#102C35]">
              My Complaints
            </h1>
            <p className="text-xs text-brand-muted mt-0.5">
              Review all civic issues submitted under your citizen profile.
            </p>
          </div>

          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D6F36A] hover:bg-[#C4E654] text-[#102C35] font-bold text-xs rounded-xl shadow-xs transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Report</span>
          </Link>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Search & Status Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by complaint reference (e.g. CIV-1001), title, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#102C35] bg-white shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                  statusFilter === s
                    ? "bg-[#102C35] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-card border border-gray-200 p-12 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#102C35]" />
              <p className="text-xs text-gray-500">Loading complaints...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="bg-white rounded-card border border-gray-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No complaints found</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {search || statusFilter !== "All"
                  ? "Try adjusting your search query or filters."
                  : "You have not submitted any complaints yet."}
              </p>
              {search || statusFilter !== "All" ? (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#102C35] text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Report an Issue</span>
                </Link>
              )}
            </div>
          ) : (
            issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/complaints/${issue.id}`}
                className="block bg-white rounded-card border border-gray-200/90 shadow-card p-5 hover:border-gray-300 transition-all hover:shadow-md group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#102C35] bg-gray-100 px-2 py-0.5 rounded">
                        {issue.id}
                      </span>
                      <StatusBadge status={issue.status} />
                      <PriorityBadge priority={issue.priority} />
                      <span className="text-[11px] text-gray-400 font-mono">
                        {formatDate(issue.created_at)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#102C35] transition-colors truncate">
                      {issue.title}
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-2">
                      {issue.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1 text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[280px] sm:max-w-md">{issue.location_text}</span>
                      </span>
                      <span className="hidden sm:inline-block text-gray-300">•</span>
                      <span className="hidden sm:inline-block font-medium text-gray-600">
                        Dept: {issue.department}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center text-gray-400 group-hover:text-gray-700 pt-1">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
