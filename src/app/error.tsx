"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error message for monitoring without exposing sensitive details to user
    console.error("[CivicResolve Application Error]:", error?.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex items-center justify-center p-4 sm:p-6 font-body text-[#102C35]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-amber-700 uppercase tracking-widest bg-amber-100/70 px-2.5 py-1 rounded-md">
            Application Error
          </span>
          <h1 className="text-2xl font-extrabold font-heading text-[#102C35] pt-2">
            Something went wrong
          </h1>
          <p className="text-xs text-brand-muted leading-relaxed">
            An unexpected error occurred while processing this request. Our municipal operations system has captured the diagnostic signature.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 bg-[#102C35] hover:bg-[#183D49] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#D6F36A]" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-gray-500" />
            <span>Return Home</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-400 font-mono">
          System State: Protected • Reference ID: {error?.digest || "CR-SYS-OK"}
        </div>
      </div>
    </div>
  );
}
