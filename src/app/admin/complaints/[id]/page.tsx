"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AdminSidebar } from "@/components/shared/AdminSidebar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { DepartmentBadge } from "@/components/ui/DepartmentBadge";
import { Issue, IssueStatus, MunicipalDepartment, IssuePriority } from "@/types";
import { formatDateTime, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Save,
  ShieldCheck,
  User,
  History,
  Loader2,
  AlertCircle,
  X,
  FileCheck,
  Sparkles,
  Bot,
  Info,
} from "lucide-react";

export default function AdminComplaintWorkspacePage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for status update
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>("Reported");
  const [selectedDept, setSelectedDept] = useState<MunicipalDepartment>("Roads");
  const [selectedPriority, setSelectedPriority] = useState<IssuePriority>("Medium");
  const [adminNote, setAdminNote] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // AI Advisory State
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [appliedAiNotice, setAppliedAiNotice] = useState<string | null>(null);

  const fetchIssue = React.useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/issues/${id.toUpperCase()}`);
      if (!res.ok) {
        throw new Error(`Complaint reference "${id}" was not found.`);
      }
      const data = await res.json();
      const currentIssue: Issue = data.issue;
      setIssue(currentIssue);
      setSelectedStatus(currentIssue.status);
      setSelectedDept(currentIssue.department);
      setSelectedPriority(currentIssue.priority);
      if (currentIssue.resolution_note) {
        setAdminNote(currentIssue.resolution_note);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load complaint details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  const handleEvidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Resolution evidence image must be under 5MB.");
      return;
    }

    setEvidenceFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setEvidencePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyAi = () => {
    if (!issue?.ai_analysis) return;
    const ai = issue.ai_analysis;
    if (ai.department) setSelectedDept(ai.department);
    if (ai.priority) setSelectedPriority(ai.priority);
    // Note: Do NOT automatically change status - administrator retains full authority
    if (ai.recommended_action) {
      setAdminNote((prev) => {
        const notePrefix = `[AI Recommended Action: ${ai.recommended_action}]`;
        if (!prev) return notePrefix;
        if (prev.includes(notePrefix)) return prev;
        return `${prev}\n\n${notePrefix}`;
      });
    }
    setAppliedAiNotice("AI recommendations populated into form. Review and click 'Commit Work Order Update' to persist.");
    setTimeout(() => setAppliedAiNotice(null), 6000);
  };

  const handleTriggerAi = async () => {
    if (!issue) return;
    setAnalyzingAi(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: issue.title,
          description: issue.description,
          category: issue.category,
          image_path: issue.image_path,
          issue_id: issue.id,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to trigger AI triage.");
      }
      const data = await res.json();
      if (data.analysis) {
        setIssue((prev) => (prev ? { ...prev, ai_analysis: data.analysis } : null));
        setAppliedAiNotice("AI analysis completed successfully. Recommendations are ready for review.");
        setTimeout(() => setAppliedAiNotice(null), 5000);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to trigger AI triage.");
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      let uploadedEvidencePath: string | undefined = undefined;

      // 1. Upload resolution evidence if present
      if (evidenceFile) {
        const formData = new FormData();
        formData.append("file", evidenceFile);

        const uploadRes = await fetch("/api/issues/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Failed to upload resolution evidence.");
        }

        const uploadData = await uploadRes.json();
        uploadedEvidencePath = uploadData.path;
      }

      // 2. Patch complaint administrative details
      const patchRes = await fetch(`/api/admin/issues/${id.toUpperCase()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          department: selectedDept,
          priority: selectedPriority,
          resolution_note: adminNote.trim() || undefined,
          resolution_image_path: uploadedEvidencePath,
        }),
      });

      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        throw new Error(patchData.error || "Failed to update complaint.");
      }

      setSaveSuccess(true);
      await fetchIssue();
    } catch (err: unknown) {
      console.error("Admin save error:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save administrative update.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5EF] flex font-body">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#102C35]" />
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-[#F5F5EF] flex font-body">
        <AdminSidebar />
        <div className="flex-1 p-12 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold font-heading text-gray-900">Complaint Not Found</h2>
          <p className="text-xs text-gray-500">{error || `Identifier "${id}" not found in database.`}</p>
          <Link
            href="/admin/complaints"
            className="inline-block px-4 py-2 bg-[#102C35] text-white text-xs font-semibold rounded-lg"
          >
            Back to Complaints Console
          </Link>
        </div>
      </div>
    );
  }

  const updates = issue.updates || issue.issue_updates || [];

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex font-body">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-16">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/complaints"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-heading text-[#102C35]">
                  Dispatch Workspace
                </h1>
                <span className="font-mono text-xs font-bold bg-[#102C35] text-white px-2 py-0.5 rounded">
                  {issue.id}
                </span>
              </div>
              <p className="text-xs text-brand-muted">
                Municipal work order triage & status transition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>
        </header>

        {/* Content Container */}
        <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
          {saveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Complaint record updated and audit update committed successfully.</span>
            </div>
          )}

          {saveError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {appliedAiNotice && (
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{appliedAiNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Complaint Details & Timeline */}
            <div className="lg:col-span-7 space-y-6">
              {/* Primary Information */}
              <div className="bg-white rounded-card border border-gray-200 shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
                    Category: {issue.category}
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    Logged {formatDateTime(issue.created_at)}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold font-heading text-[#102C35]">
                    {issue.title}
                  </h2>
                  <p className="text-xs text-gray-700 mt-2 whitespace-pre-line leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate"><strong>Location:</strong> {issue.location_text}</span>
                </div>
              </div>

              {/* Gemini AI Advisory Recommendation Card */}
              {issue.ai_analysis ? (
                <div className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 rounded-card border-2 border-indigo-200/80 shadow-card p-6 space-y-4">
                  {/* Critical Safety / Advisory Banner */}
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>AI ADVISORY ONLY — Final decisions remain with the administrator.</span>
                    </div>
                    {issue.ai_analysis.provider === "deterministic_fallback" ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-800 border border-gray-300">
                        FALLBACK MODE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                        GEMINI LIVE ({issue.ai_analysis.model || "gemini"})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold font-heading text-indigo-950 flex items-center gap-2">
                          <span>
                            {issue.ai_analysis.provider === "deterministic_fallback"
                              ? "Rule-Based Civic Fallback Triage"
                              : "Gemini AI Complaint Intelligence"}
                          </span>
                        </h3>
                        <p className="text-[11px] text-indigo-700/80">
                          Automated municipal triage recommendations • Administrator retains final authority
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-mono font-semibold px-2.5 py-1 bg-white border rounded-lg shadow-2xs ${
                        issue.ai_analysis.confidence < 0.7
                          ? "border-amber-300 text-amber-800 bg-amber-50/50"
                          : "border-indigo-200 text-indigo-800"
                      }`}>
                        Confidence: {Math.round(issue.ai_analysis.confidence * 100)}%
                        {issue.ai_analysis.confidence < 0.7 && " (LOW)"}
                      </span>
                      {(issue.ai_analysis.needs_human_review || issue.ai_analysis.requires_human_review) && (
                        <span className="text-[10px] font-bold font-mono px-2 py-1 bg-red-100 text-red-800 border border-red-200 rounded-lg">
                          HUMAN REVIEW RECOMMENDED
                        </span>
                      )}
                      {(issue.ai_analysis.severity === "Critical" || issue.ai_analysis.priority === "Critical") && (
                        <span className="text-[10px] font-bold font-mono px-2 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-lg animate-pulse">
                          CRITICAL RISK
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Summary */}
                  {issue.ai_analysis.summary && (
                    <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs text-indigo-900 font-medium">
                      <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-1">AI Executive Summary</p>
                      <p>{issue.ai_analysis.summary}</p>
                    </div>
                  )}

                  {/* Recommendation Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-gray-400 font-mono">Recommended Category</p>
                      <p className="text-xs font-bold text-gray-900">{issue.ai_analysis.category}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-gray-400 font-mono">Assigned Department</p>
                      <p className="text-xs font-bold text-gray-900">{issue.ai_analysis.department}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-gray-400 font-mono">Assessed Severity</p>
                      <p className="text-xs font-bold text-gray-900">{issue.ai_analysis.severity}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-gray-400 font-mono">Suggested Priority</p>
                      <p className="text-xs font-bold text-gray-900">{issue.ai_analysis.priority}</p>
                    </div>
                  </div>

                  {/* Operational Action Directive */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Recommended Municipal Action</span>
                    </div>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                      {issue.ai_analysis.recommended_action}
                    </p>
                  </div>

                  {/* Public Safety Risk Callout */}
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Public Safety Assessment</span>
                    </div>
                    <p className="text-xs text-amber-950 leading-relaxed">
                      {typeof issue.ai_analysis.public_safety_risk === "string"
                        ? issue.ai_analysis.public_safety_risk
                        : issue.ai_analysis.public_safety_risk
                        ? "Imminent public safety hazard identified requiring rapid intervention."
                        : "Standard civic issue; no imminent threat to life or safety detected."}
                    </p>
                  </div>

                  {/* Technical Reasoning */}
                  <div className="text-xs text-gray-600 space-y-1 bg-white p-3 rounded-xl border border-indigo-50">
                    <span className="font-bold text-gray-700">Municipal Assessment Justification: </span>
                    <span className="text-gray-600">{issue.ai_analysis.reasoning}</span>
                  </div>

                  {/* Apply Recommendation Action */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-indigo-100/80">
                    <div className="text-[11px] text-gray-500">
                      Review before applying. Pre-fills form fields without automatic database commit.
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyAi}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply AI Recommendation</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-card border border-gray-200 shadow-card p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">No AI Triage Record on File</h4>
                      <p className="text-[11px] text-gray-500">Analyze complaint text and evidence with Gemini AI.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTriggerAi}
                    disabled={analyzingAi}
                    className="px-3.5 py-1.5 bg-[#102C35] hover:bg-[#102C35]/90 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {analyzingAi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run AI Triage</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Evidence Photos */}
              {(issue.image_url || issue.resolution_image_url) && (
                <div className="bg-white rounded-card border border-gray-200 shadow-card p-6 space-y-4">
                  <h3 className="text-sm font-bold font-heading text-[#102C35] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#102C35]" />
                    <span>Evidence Verification Photos</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {issue.image_url && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-gray-600">Citizen Submission</p>
                        <div className="relative h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                          <Image
                            src={issue.image_url}
                            alt="Citizen evidence photo"
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {issue.resolution_image_url && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Field Resolution Evidence</span>
                        </p>
                        <div className="relative h-48 rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50">
                          <Image
                            src={issue.resolution_image_url}
                            alt="Resolution evidence photo"
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

              {/* Audit Timeline */}
              <div className="bg-white rounded-card border border-gray-200 shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-sm font-bold font-heading text-[#102C35] flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-600" />
                    <span>Status History & Audit Trail</span>
                  </h3>
                  <span className="text-xs font-mono text-gray-400">
                    {updates.length} {updates.length === 1 ? "Record" : "Records"}
                  </span>
                </div>

                {updates.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">No update logs recorded.</p>
                ) : (
                  <div className="relative border-l-2 border-gray-200 ml-2 space-y-5 my-2">
                    {updates.map((update, idx) => (
                      <div key={update.id || idx} className="relative pl-5">
                        <div
                          className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 bg-white ${
                            update.new_status === "Resolved"
                              ? "border-emerald-500 bg-emerald-50"
                              : update.new_status === "In Progress"
                              ? "border-amber-500 bg-amber-50"
                              : "border-blue-500 bg-blue-50"
                          }`}
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              {update.new_status}
                            </span>
                            {update.old_status && (
                              <span className="text-[11px] text-gray-400 font-mono">
                                (was {update.old_status})
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 font-mono">
                              {formatDateTime(update.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {update.note || "Status updated"}
                          </p>
                          {update.updated_by_name && (
                            <p className="text-[10px] text-gray-400">
                              Updated by: <span className="font-semibold">{update.updated_by_name}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Administrative Actions Form */}
            <div className="lg:col-span-5 space-y-6">
              <form
                onSubmit={handleUpdate}
                className="bg-white rounded-card border border-gray-200 shadow-card p-6 space-y-5"
              >
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold font-heading text-[#102C35] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#102C35]" />
                    <span>Municipal Actions</span>
                  </h3>
                  <p className="text-xs text-brand-muted">
                    Update work order status, department assignment, and notes
                  </p>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Complaint Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as IssueStatus)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#102C35] bg-white font-semibold"
                  >
                    <option value="Reported">Reported (Intake Queue)</option>
                    <option value="In Progress">In Progress (Field Work Order)</option>
                    <option value="Resolved">Resolved (Complete & Verified)</option>
                  </select>
                </div>

                {/* Department Assignment */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Assigned Municipal Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value as MunicipalDepartment)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#102C35] bg-white font-semibold"
                  >
                    <option value="Roads">Roads Department</option>
                    <option value="Sanitation">Sanitation Department</option>
                    <option value="Electricity">Electricity Department</option>
                    <option value="Water Supply">Water Supply Department</option>
                    <option value="Drainage">Drainage & Stormwater</option>
                    <option value="Other">Other Municipal Agency</option>
                  </select>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Priority Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as IssuePriority)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#102C35] bg-white font-semibold"
                  >
                    <option value="Critical">Critical (Immediate Dispatch)</option>
                    <option value="High">High (24-48 Hours)</option>
                    <option value="Medium">Medium (Standard Routine)</option>
                    <option value="Low">Low (Scheduled Maintenance)</option>
                  </select>
                </div>

                {/* Administrative Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Administrative Remarks / Resolution Note
                  </label>
                  <textarea
                    rows={4}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Enter dispatch notes, contractor assignment details, or resolution summary..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#102C35] resize-none"
                  />
                </div>

                {/* Resolution Photo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Resolution Proof Photo (Optional)
                  </label>
                  {evidencePreview ? (
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 h-36">
                      <Image
                        src={evidencePreview}
                        alt="Evidence preview"
                        fill
                        sizes="(max-width: 768px) 100vw, 300px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEvidenceFile(null);
                          setEvidencePreview(null);
                        }}
                        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 hover:border-[#102C35] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50">
                      <Upload className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-[11px] font-semibold text-gray-700">
                        Upload repair verification photo
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleEvidenceChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-[#102C35] hover:bg-[#183D49] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Dispatch Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-[#D6F36A]" />
                      <span>Save & Commit Status Update</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
