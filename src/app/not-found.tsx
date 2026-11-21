import React from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { ArrowLeft, Home, Search, AlertCircle, FileText } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5EF] flex flex-col justify-between font-body text-[#102C35]">
      {/* Header */}
      <header className="bg-[#102C35] text-white border-b border-[#183D49]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo variant="light" href="/" />
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-gray-300 hover:text-[#D6F36A] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main 404 Content */}
      <main className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 my-auto">
        <div className="w-20 h-20 rounded-2xl bg-[#102C35] text-[#D6F36A] flex items-center justify-center mx-auto shadow-lg border border-[#183D49]">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-brand-muted">
            Error 404 • Page Not Found
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-[#102C35]">
            The route you requested does not exist.
          </h1>
          <p className="text-sm text-brand-muted max-w-md mx-auto leading-relaxed">
            The civic page or complaint link may have been moved, renamed, or is temporarily unavailable in the municipal directory.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-3 bg-[#102C35] hover:bg-[#183D49] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-[#D6F36A]" />
            <span>Return to Homepage</span>
          </Link>

          <Link
            href="/track"
            className="w-full sm:w-auto px-5 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 text-gray-500" />
            <span>Track a Complaint ID</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-gray-200/80 text-xs text-gray-500">
          Need to report a new problem?{" "}
          <Link href="/report" className="font-semibold text-[#102C35] hover:underline">
            Submit a Civic Report →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-500 border-t border-gray-200">
        © 2025 CivicResolve. Better cities begin with better reporting.
      </footer>
    </div>
  );
}
