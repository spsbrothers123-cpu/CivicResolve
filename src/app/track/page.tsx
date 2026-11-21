"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CitizenNavbar } from "@/components/shared/CitizenNavbar";
import { Footer } from "@/components/shared/Footer";
import { Search, ArrowRight } from "lucide-react";

export default function TrackPage() {
  const router = useRouter();
  const [complaintId, setComplaintId] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId.trim()) return;
    router.push(`/complaints/${complaintId.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex flex-col font-body">
      <CitizenNavbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16 w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold font-heading text-[#102C35]">
            Track Complaint Status
          </h1>
          <p className="text-sm text-brand-muted max-w-md mx-auto">
            Enter your unique Complaint Reference Number (e.g. CIV-1001) to view real-time municipal resolution progress.
          </p>
        </div>

        {/* Lookup Box */}
        <form
          onSubmit={handleSearch}
          className="bg-white p-6 rounded-card border border-gray-200 shadow-card space-y-4"
        >
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="e.g. CIV-1001"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-base rounded-xl border border-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#102C35]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#D6F36A] hover:bg-[#C4E654] text-[#102C35] font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Track Progress</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
