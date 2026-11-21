import React from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto w-full bg-[#102C35] text-white border-t border-[#183D49]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <Logo variant="light" showTagline={true} />
            <p className="text-sm text-slate-300 max-w-sm leading-relaxed font-body">
              Transforming neighborhood reports into structured, actionable municipal work items using AI-assisted complaint analysis and transparent resolution tracking.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#183D49]/70 border border-[#225060] text-xs text-[#D6F36A] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#D6F36A]" />
              <span>Independent Civic Platform • Powered by Gemini AI</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D6F36A]">
              Quick Portals
            </p>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/report" className="hover:text-[#D6F36A] transition-colors">
                  Report a Civic Issue
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-[#D6F36A] transition-colors">
                  Track Complaint Status
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#D6F36A] transition-colors">
                  Citizen Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-[#D6F36A] transition-colors">
                  Municipal Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div className="md:col-span-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D6F36A]">
              Governance & Policies
            </p>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/privacy" className="hover:text-[#D6F36A] transition-colors">
                  Privacy Policy & Data Rights
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#D6F36A] transition-colors">
                  Terms of Service & Acceptable Use
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#D6F36A] transition-colors">
                  Support & Operator Contact
                </Link>
              </li>
            </ul>
            <div className="mt-3 p-3 rounded-lg bg-[#183D49]/60 border border-[#234F5E] text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300 font-semibold">Emergency Notice:</strong> CivicResolve is not an emergency hotline. For life-threatening emergencies or immediate public hazards, contact local emergency services directly.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#183D49] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 CivicResolve. Better cities begin with better reporting.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
