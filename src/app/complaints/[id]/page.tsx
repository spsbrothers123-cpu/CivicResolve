"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CitizenNavbar } from "@/components/shared/CitizenNavbar";
import { Footer } from "@/components/shared/Footer";
import { Issue } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { DepartmentBadge } from "@/components/ui/DepartmentBadge";
import { formatDateTime, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  AlertCircle,
  Loader2,
  FileCheck,
  History,
  Building2,
} from "lucide-react";
import Image from "next/image";

export default function ComplaintTrackingPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchIssue() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/issues/${id.toUpperCase()}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Complaint reference "${id}" was not found.`);
          }
          if (res.status === 403) {
            throw new Error("You do not have permission to view this complaint.");
          }
          throw new Error("Failed to load complaint details.");
        }
        const data = await res.json();
        if (mounted) {
          setIssue(data.issue);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load complaint.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchIssue();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5EF] flex flex-col font-body">
        <CitizenNavbar />
        <main className="max-w-2xl mx-auto px-4 py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#102C35] mx-auto" />
          <p className="text-sm text-gray-600">Retrieving complaint #{id} from municipal registry...</p>
        </main>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-[#F5F5EF] flex flex-col font-body">
        <CitizenNavbar />
        <main className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-heading text-gray-900">Complaint Not Found</h1>
          <p className="text-xs text-gray-600">
            {error || `We couldn't locate a complaint with identifier "${id}".`}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/complaints"
              className="px-4 py-2 bg-[#102C35] text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Back to My Complaints
            </Link>
            <Link
              href="/track"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg"
            >
              Try Another ID
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const updates = issue.updates || issue.issue_updates || [];

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex flex-col font-body">
      <CitizenNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16 w-full space-y-6">
        {/* Back navigation */}
        <Link
          href="/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#102C35] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Complaints</span>
        </Link>

        {/* Header Summary Card */}
        <div className="bg-white rounded-card border border-gray-200/90 shadow-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-extrabold bg-[#102C35] text-white px-2.5 py-1 rounded-md shadow-xs">
                {issue.id}
              </span>
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <DepartmentBadge department={issue.department} />
            </div>

            <span className="text-xs text-gray-400 font-mono">
              Logged {formatDateTime(issue.created_at)}
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold font-heading text-[#102C35]">
              {issue.title}
            </h1>
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-line leading-relaxed">
              {issue.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate"><strong>Location:</strong> {issue.location_text}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <span><strong>Category:</strong> {issue.category}</span>
            </div>
          </div>
        </div>

        {/* Evidence Photos Section */}
        {(issue.image_url || issue.resolution_image_url) && (
          <div className="bg-white rounded-card border border-gray-200/90 shadow-card p-6 space-y-4">
            <h2 className="text-base font-bold font-heading text-[#102C35] flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#102C35]" />
              <span>Evidence Documentation</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {issue.image_url && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600">Citizen Submission Photo</p>
                  <div className="relative h-64 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <Image
                      src={issue.image_url}
                      alt="Complaint evidence photo"
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {issue.resolution_image_url && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Municipal Field Resolution Photo</span>
                  </p>
                  <div className="relative h-64 rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50">
                    <Image
                      src={issue.resolution_image_url}
                      alt="Resolution verification photo"
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resolution Note if resolved */}
        {issue.resolution_note && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-card p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Municipal Resolution Remarks</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed whitespace-pre-line">
              {issue.resolution_note}
            </p>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="bg-white rounded-card border border-gray-200/90 shadow-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-base font-bold font-heading text-[#102C35] flex items-center gap-2">
              <History className="w-4 h-4 text-[#102C35]" />
              <span>Complaint Progress Timeline</span>
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              {updates.length} {updates.length === 1 ? "Event" : "Events"} Logged
            </span>
          </div>

          {updates.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No timeline updates recorded yet.</p>
          ) : (
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 my-2">
              {updates.map((update, idx) => (
                <div key={update.id || idx} className="relative pl-6">
                  {/* Dot */}
                  <div
                    className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 bg-white ${
                      update.new_status === "Resolved"
                        ? "border-emerald-500 bg-emerald-50"
                        : update.new_status === "In Progress"
                        ? "border-amber-500 bg-amber-50"
                        : "border-blue-500 bg-blue-50"
                    }`}
                  />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-900">
                        Status: {update.new_status}
                      </span>
                      {update.old_status && (
                        <span className="text-[11px] text-gray-400 font-mono">
                          (from {update.old_status})
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400 font-mono">
                        {formatDateTime(update.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600">
                      {update.note || "Status updated in municipal dispatch registry."}
                    </p>

                    {update.updated_by_name && (
                      <p className="text-[11px] text-gray-400">
                        By: <span className="font-semibold">{update.updated_by_name}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
