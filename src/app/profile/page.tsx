"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CitizenNavbar } from "@/components/shared/CitizenNavbar";
import { Footer } from "@/components/shared/Footer";
import {
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Save,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatDate } from "@/lib/utils";

export default function CitizenProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile, signOut, isLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      await refreshProfile();
      setStatusMessage({ type: "success", text: "Profile updated successfully." });
      setIsEditing(false);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "CR";

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex flex-col font-body">
      <CitizenNavbar />

      <main className="flex-1 max-w-xl mx-auto px-4 sm:px-6 pt-10 pb-16 w-full space-y-6">
        <h1 className="text-2xl font-extrabold font-heading text-[#102C35]">
          My Profile
        </h1>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-card border border-gray-200 shadow-card p-6 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#102C35] text-[#D6F36A] font-extrabold text-2xl flex items-center justify-center font-heading mx-auto border-2 border-[#D6F36A] shadow-md">
            {initials}
          </div>

          <div>
            <h2 className="text-xl font-bold font-heading text-[#102C35]">
              {profile?.full_name || "Citizen Resident"}
            </h2>
            <p className="text-xs text-brand-muted mt-0.5">
              {profile?.email || user?.email || "No email on record"}
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold capitalize">
            {profile?.role === "admin" ? (
              <>
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Municipal Administrator</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Citizen Resident</span>
              </>
            )}
          </div>
        </div>

        {/* Account Details Box */}
        <div className="bg-white rounded-card border border-gray-200 shadow-card p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-800 text-sm">Account Overview</p>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-semibold text-[#102C35] hover:underline"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#102C35]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0100"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#102C35]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-[#102C35] hover:bg-[#183D49] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>Full Name</span>
                </span>
                <span className="font-semibold text-gray-800">
                  {profile?.full_name || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>Email Address</span>
                </span>
                <span className="font-semibold text-gray-800">
                  {profile?.email || user?.email || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>Phone</span>
                </span>
                <span className="font-semibold text-gray-800">
                  {profile?.phone || "Not provided"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Member Since</span>
                </span>
                <span className="font-mono text-gray-700">
                  {profile?.created_at ? formatDate(profile.created_at) : "Recent"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions List */}
        <div className="bg-white rounded-card border border-gray-200 shadow-card divide-y divide-gray-100 overflow-hidden">
          <Link
            href="/complaints"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500 group-hover:text-[#102C35]" />
              <span className="text-sm font-semibold text-gray-800">My Complaints</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </Link>

          <Link
            href="/track"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-500 group-hover:text-[#102C35]" />
              <span className="text-sm font-semibold text-gray-800">Track a Complaint ID</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold text-red-600">Sign Out</span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-300 group-hover:text-red-500" />
          </button>
        </div>

        {/* Data Rights & Account Erasure Notice */}
        <div className="bg-white rounded-card border border-gray-200 shadow-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold font-heading text-[#102C35]">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Citizen Privacy & Account Erasure</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            In accordance with citizen privacy guidelines, you may request permanent erasure of your account credentials and personal contact details. Historical municipal repair tickets are retained in an anonymized state for public accountability.
          </p>
          <div className="pt-1">
            <Link
              href="/contact"
              className="text-xs font-semibold text-[#102C35] hover:underline"
            >
              Request Account Deletion & Anonymization →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
