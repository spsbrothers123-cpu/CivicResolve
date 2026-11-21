"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CitizenNavbar } from "@/components/shared/CitizenNavbar";
import { Footer } from "@/components/shared/Footer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Issue } from "@/types";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  FileText,
  Clock,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  ChevronRight,
  MapPin,
  Loader2,
  AlertCircle,
  ShieldAlert,
  X,
  Inbox,
} from "lucide-react";

function CitizenDashboardContent() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const isUnauthorizedAdmin = searchParams?.get("error") === "unauthorized_admin";
  const [dismissUnauthorized, setDismissUnauthorized] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/issues");
        if (!res.ok) {
          throw new Error("Failed to load your complaints.");
        }
        const data = await res.json();
        if (mounted) {
          setIssues(data.issues || []);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  const total = issues.length;
  const reportedCount = issues.filter((i) => i.status === "Reported").length;
  const inProgressCount = issues.filter((i) => i.status === "In Progress").length;
  const resolvedCount = issues.filter((i) => i.status === "Resolved").length;
  const recentIssues = issues.slice(0, 5);

  const greetingName = profile?.full_name ? profile.full_name.split(" ")[0] : "Resident";

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex flex-col font-body">
      <CitizenNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 w-full space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-card border border-gray-200/90 shadow-card">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#102C35]">
              Good day, {greetingName}!
            </h1>
            <p className="text-sm text-brand-muted mt-1">
              Here&apos;s your civic activity overview and repair status in your area.
            </p>
          </div>

          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#D6F36A] hover:bg-[#C4E654] text-[#102C35] font-bold text-sm rounded-xl shadow-sm transition-all hover:scale-102 active:scale-98 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Issue</span>
          </Link>
        </div>

        {/* Unauthorized Admin Access Banner */}
        {isUnauthorizedAdmin && !dismissUnauthorized && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-950">Municipal Admin Access Restricted</p>
                <p className="text-amber-800 text-xs">
                  Your active account (<strong>{profile?.full_name || profile?.email || "Citizen Resident"}</strong>) has citizen permissions. To access the Municipal Operations Center, please sign in with an Administrator account or promote this account in your database.
                </p>
                <div className="pt-1.5 flex items-center gap-3">
                  <Link
                    href="/admin/login"
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-950 hover:underline"
                  >
                    <span>Sign In to Admin Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
            <button
              onClick={() => setDismissUnauthorized(true)}
              className="text-amber-600 hover:text-amber-900 p-1 rounded"
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Card */}
          <div className="bg-white p-5 rounded-card border border-gray-200 shadow-card flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-brand-muted uppercase font-mono">
                Total
              </p>
              <p className="text-3xl font-extrabold font-heading text-[#102C35] mt-1">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded-md mt-1" />
                ) : (
                  total
                )}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
              <FileText className="w-5 h-5 text-[#102C35]" />
            </div>
          </div>

          {/* Reported Card */}
          <div className="bg-white p-5 rounded-card border border-gray-200 shadow-card flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-brand-muted uppercase font-mono">
                Reported
              </p>
              <p className="text-3xl font-extrabold font-heading text-blue-600 mt-1">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-blue-100 animate-pulse rounded-md mt-1" />
                ) : (
                  reportedCount
                )}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* In Progress Card */}
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
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Resolved Card */}
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
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recent Complaints Section */}
        <div className="bg-white rounded-card border border-gray-200 shadow-card overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-heading text-[#102C35]">
                Recent Submissions
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Your recently logged civic infrastructure reports
              </p>
            </div>

            <Link
              href="/complaints"
              className="text-xs font-semibold text-[#102C35] hover:text-[#183D49] flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#102C35]" />
              <p className="text-xs">Loading complaints...</p>
            </div>
          ) : recentIssues.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No complaints reported yet</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Notice a civic problem like a pothole, broken streetlight, or garbage dump? Report it and municipal teams will be notified.
              </p>
              <Link
                href="/report"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#102C35] text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Your First Report</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/complaints/${issue.id}`}
                  className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors group block"
                >
                  <div className="space-y-1.5 min-w-0 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#102C35] bg-gray-100 px-2 py-0.5 rounded">
                        {issue.id}
                      </span>
                      <StatusBadge status={issue.status} />
                      <span className="text-[11px] text-gray-400 font-mono">
                        {formatDate(issue.created_at)}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-gray-900 group-hover:text-[#102C35] truncate">
                      {issue.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span className="truncate">{issue.location_text}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center text-gray-400 group-hover:text-gray-700">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CitizenDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5EF]" />}>
      <CitizenDashboardContent />
    </Suspense>
  );
}
