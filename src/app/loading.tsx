import React from "react";
import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#F5F5EF] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#102C35] text-[#D6F36A] flex items-center justify-center shadow-md animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-[#D6F36A]" />
        </div>
        <p className="text-xs font-mono font-bold tracking-wider text-[#102C35] uppercase">
          Loading CivicResolve...
        </p>
      </div>
    </div>
  );
}
