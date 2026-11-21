"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CitizenNavbar } from "@/components/shared/CitizenNavbar";
import { Footer } from "@/components/shared/Footer";
import { IssueCategory } from "@/types";
import {
  Upload,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  FileText,
  Sparkles,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES: IssueCategory[] = [
  "Pothole",
  "Road Damage",
  "Garbage",
  "Streetlight",
  "Water Leakage",
  "Drainage",
  "Other",
];

export default function ReportIssuePage() {
  const router = useRouter();

  // Form State
  const [step, setStep] = useState<"form" | "success">("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>("Pothole");
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  // File Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<
    "idle" | "uploading" | "registering"
  >("idle");
  const [createdIssueId, setCreatedIssueId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Geolocation
  const handleUseLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocationText(
            `${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° E • Current Location`
          );
        },
        () => {
          setLocationText("Municipal Ward Central");
        }
      );
    } else {
      setLocationText("Municipal Ward Central");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size must be under 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (title.trim().length < 3) {
      setErrorMessage("Complaint title must be at least 3 characters.");
      return;
    }
    if (description.trim().length < 10) {
      setErrorMessage("Complaint description must be at least 10 characters.");
      return;
    }
    if (!locationText.trim()) {
      setErrorMessage("Complaint location is required.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionStage(imageFile ? "uploading" : "registering");

    try {
      let uploadedStoragePath: string | undefined = undefined;

      // 1. Upload evidence image if provided
      if (imageFile) {
        setSubmissionStage("uploading");
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadRes = await fetch("/api/issues/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Failed to upload evidence image.");
        }

        const uploadData = await uploadRes.json();
        uploadedStoragePath = uploadData.path;
      }

      // 2. Submit complaint record and trigger best-effort AI triage
      setSubmissionStage("registering");
      const issueRes = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          location_text: locationText.trim(),
          latitude,
          longitude,
          image_path: uploadedStoragePath,
        }),
      });

      const issueData = await issueRes.json();
      if (!issueRes.ok) {
        throw new Error(issueData.error || "Failed to submit complaint.");
      }

      const reference = issueData.reference_number || issueData.issue?.id || "CIV-1001";
      setCreatedIssueId(reference);
      setStep("success");
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage(err.message || "Failed to submit complaint. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
      setSubmissionStage("idle");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex flex-col font-body">
      <CitizenNavbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16 w-full">
        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === "form" && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-card border border-gray-200 shadow-card p-6 sm:p-8 space-y-6"
          >
            <div>
              <h1 className="text-2xl font-extrabold font-heading text-[#102C35]">
                Report a Civic Issue
              </h1>
              <p className="text-xs text-brand-muted mt-1">
                Provide details and evidence. Your report will be logged and dispatched to municipal authorities.
              </p>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Problem Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border",
                      category === cat
                        ? "bg-[#102C35] text-[#D6F36A] border-[#102C35] shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Issue Summary / Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hazardous pothole causing vehicle damage"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#102C35]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the condition, location landmarks, hazards to motorists or pedestrians, and duration..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#102C35] resize-none"
              />
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Location / Address <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  className="text-xs text-[#102C35] hover:underline font-semibold flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#102C35]" />
                  <span>Use My GPS</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="e.g. 5th Main & 12th Cross, Near Metro Station Pillar 120"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#102C35]"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Supporting Photo Evidence (Optional)
              </label>
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-52">
                  <Image
                    src={imagePreview}
                    alt="Uploaded evidence preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 hover:border-[#102C35] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-gray-50">
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-xs font-semibold text-gray-700">
                    Click to upload photo evidence
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5">
                    JPEG, PNG, or WebP up to 5 MB
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* AI Intake & Privacy Disclosure */}
            <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200/80 text-xs text-blue-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>AI Intake & Governance Disclosure</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-900/90">
                Your complaint description and optional evidence photo will be analyzed by Google Gemini AI to assist municipal dispatchers in assessing hazard severity and assigning responsible departments. Municipal administrators retain 100% decision authority over all work orders. By submitting, you agree to our{" "}
                <Link href="/privacy" className="underline font-bold hover:text-blue-950">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="underline font-bold hover:text-blue-950">
                  Terms of Service
                </Link>.
              </p>
            </div>

            {/* Stage Progress Indicator if Submitting */}
            {isSubmitting && (
              <div
                role="status"
                aria-live="polite"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3 text-xs text-gray-700"
              >
                <Loader2 className="w-4 h-4 animate-spin text-[#102C35] shrink-0" />
                <span>
                  {submissionStage === "uploading"
                    ? "Phase 1/2: Encrypting and uploading photographic evidence..."
                    : "Phase 2/2: Registering ticket & running Gemini AI triage..."}
                </span>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#102C35] hover:bg-[#183D49] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {submissionStage === "uploading"
                        ? "Uploading Evidence..."
                        : "Submitting..."}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Submit Complaint</span>
                    <ArrowRight className="w-4 h-4 text-[#D6F36A]" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === "success" && (
          <div className="bg-white rounded-card border border-gray-200 shadow-card p-8 sm:p-12 text-center space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold font-heading text-[#102C35]">
                Complaint Logged Successfully!
              </h1>
              <p className="text-xs text-brand-muted">
                Your report has been entered into the municipal dispatch registry and routed to department dispatch.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 inline-block">
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                Complaint Reference ID
              </p>
              <p className="text-2xl font-extrabold font-mono text-[#102C35] mt-1">
                {createdIssueId}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href={`/complaints/${createdIssueId}`}
                className="flex-1 py-3 bg-[#102C35] hover:bg-[#183D49] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Track Complaint</span>
              </Link>

              <Link
                href="/dashboard"
                className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
