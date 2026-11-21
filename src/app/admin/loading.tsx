import React from "react";
import { Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#F5F5EF] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#102C35] text-[#D6F36A] flex items-center justify-center shadow-md">
          <Loader2 className="w-6 h-6 animate-spin text-[#D6F36A]" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-mono font-bold text-[#102C35] uppercase tracking-wider">
            Municipal Console
          </p>
          <p className="text-[11px] text-brand-muted">
            Synchronizing operational records...
          </p>
        </div>
      </div>
    </div>
  );
}
