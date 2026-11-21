import React from "react";
import Link from "next/link";
import { CitizenNavbar } from "@/components/shared/CitizenNavbar";
import { Footer } from "@/components/shared/Footer";
import { Mail, MessageSquare, HelpCircle, ArrowLeft, Clock, ShieldAlert, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Support & Contact",
  description: "Contact the CivicResolve platform operators, review frequently asked questions, or request assistance.",
};

export default function ContactSupportPage() {
  return (
    <div className="min-h-screen bg-[#F5F5EF] flex flex-col font-body text-[#102C35]">
      <CitizenNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10">
        <div className="space-y-3">
          <Link
            href="/"
            className="text-xs font-semibold text-brand-muted hover:text-[#102C35] inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-[#102C35]">
            Contact & Platform Support
          </h1>
          <p className="text-sm text-brand-muted max-w-xl">
            Have questions regarding complaint status, platform operations, or technical assistance? Here is how to get help.
          </p>
        </div>

        {/* Emergency Notice */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Life-Threatening Emergency Notice</p>
            <p>
              CivicResolve is designed for non-emergency public infrastructure maintenance. In case of active hazards or immediate physical danger, dial your jurisdiction&apos;s emergency hotline (e.g. 911 or 112) immediately.
            </p>
          </div>
        </div>

        {/* Support Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Citizen Help */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#102C35] text-[#D6F36A] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold font-heading text-[#102C35]">
                Track Existing Complaint
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                If you have already submitted a complaint, you do not need to contact support to receive status updates. You can track real-time resolution progress and view municipal supervisor remarks directly.
              </p>
            </div>
            <Link
              href="/track"
              className="py-2.5 px-4 bg-[#102C35] hover:bg-[#183D49] text-white text-xs font-semibold rounded-xl text-center shadow-xs transition-colors"
            >
              Enter Reference ID →
            </Link>
          </div>

          {/* Card 2: Operator Directory */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold font-heading text-[#102C35]">
                Platform Operator Inquiries
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                For platform technical feedback, partnership inquiries, or developer bug reports:
              </p>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono space-y-1">
                <p className="text-gray-500 text-[11px]">Primary Operator Dispatch:</p>
                <p className="font-bold text-[#102C35]">support@civicresolve.internal</p>
                <p className="text-[11px] text-amber-700 font-sans pt-1">
                  *(Official municipal helpline pending municipal deployment onboarding)*
                </p>
              </div>
            </div>
            <div className="text-[11px] text-gray-400">
              Response Window: Standard operational hours (09:00 - 18:00 UTC)
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <HelpCircle className="w-5 h-5 text-[#102C35]" />
            <h3 className="text-base font-bold font-heading text-[#102C35]">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-4 divide-y divide-gray-100 text-xs text-gray-600">
            <div className="pt-3 space-y-1">
              <p className="font-bold text-[#102C35]">How long does it take for a complaint to be reviewed?</p>
              <p className="leading-relaxed">
                Gemini AI performs initial triage within seconds of submission. Municipal administrators review the advisory recommendations and assign work orders according to severity and safety risk.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <p className="font-bold text-[#102C35]">Can I report an issue without uploading a photograph?</p>
              <p className="leading-relaxed">
                Yes. While evidence images help the AI and municipal crews accurately assess damage dimensions, text-only complaints with a descriptive location are fully accepted.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <p className="font-bold text-[#102C35]">How do I request deletion of my citizen account or data?</p>
              <p className="leading-relaxed">
                Submit an email request from your registered email address to <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">support@civicresolve.internal</code> with the subject &quot;Data Erasure Request&quot;. Your profile and credentials will be deleted within 30 days while preserving required anonymous municipal repair audits.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
