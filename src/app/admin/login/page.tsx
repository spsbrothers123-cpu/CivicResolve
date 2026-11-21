"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { Eye, EyeOff, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      setTimeout(() => {
        setLoading(false);
        router.push("/admin");
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        setErrorMessage(error?.message || "Invalid administrator credentials.");
        setLoading(false);
        return;
      }

      // Check role strictly in public.profiles table
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const profile = profileData as { role?: string } | null;
      if (profileErr || !profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        setErrorMessage(
          "Forbidden: This account does not possess municipal administrative privileges."
        );
        setLoading(false);
        return;
      }

      await refreshProfile();
      router.push("/admin");
    } catch (err: unknown) {
      console.error("Admin login error:", err);
      setErrorMessage(err instanceof Error ? err.message : "An error occurred during administrative login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-body">
      <div className="max-w-4xl w-full bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
        {/* Left Administrative Panel */}
        <div className="md:col-span-5 bg-[#102C35] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D6F36A]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <Logo variant="admin" href="/admin" />
            <p className="text-[#D6F36A] font-heading font-semibold text-sm">
              Municipal Operations Center
            </p>
          </div>

          <div className="space-y-3 my-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#183D49] border border-[#235363] rounded-lg text-xs font-mono text-[#D6F36A]">
              <Lock className="w-3.5 h-3.5" />
              <span>Restricted Access Portal</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-white">
              Municipal Work Order Dispatch & Resolution
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Authorized municipal administrators, department chiefs, and field superintendents only.
            </p>
          </div>

          <div className="text-[11px] text-gray-400 relative z-10 pt-4 border-t border-[#183D49]">
            Resident citizen?{" "}
            <Link href="/login" className="text-[#D6F36A] hover:underline font-semibold">
              Go to Citizen Portal →
            </Link>
          </div>
        </div>

        {/* Right Admin Form */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[#102C35]">
                Admin Login
              </h1>
              <p className="text-xs text-brand-muted mt-0.5">
                Access municipal dispatch dashboard and complaint triage
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@civicresolve.gov"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#102C35]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#102C35]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#102C35] hover:bg-[#183D49] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Municipal Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
