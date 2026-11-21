import React from "react";
import Link from "next/link";
import { CitizenNavbar } from "@/components/shared/CitizenNavbar";
import { Footer } from "@/components/shared/Footer";
import { AlertTriangle, CheckCircle, ShieldAlert, Scale, ArrowLeft, Bell } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
  description: "CivicResolve Terms of Service — Acceptable use, civic reporting responsibilities, and service disclaimers.",
};

export default function TermsOfServicePage() {
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
            Terms of Service & Acceptable Use
          </h1>
          <p className="text-xs font-mono text-brand-muted">
            Last Updated: November 2026 • Status: Production Demonstration Draft
          </p>
        </div>

        {/* Emergency Callout Card */}
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold text-red-900 uppercase tracking-wide">
              Critical Life-Safety & Emergency Notice
            </p>
            <p>
              CivicResolve is an administrative municipal maintenance portal, NOT an emergency response system. Do not use CivicResolve to report gas leaks, active fires, live downed electrical wires, building collapses, or violent emergencies. For all urgent threats to life and safety, dial your local emergency telephone number (e.g., 911, 112, or 999) immediately.
            </p>
          </div>
        </div>

        <section className="space-y-8 text-sm leading-relaxed text-gray-700 bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-sm">
          {/* Term 1 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-[#102C35] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#102C35]" />
              <span>1. Agreement to Terms</span>
            </h2>
            <p>
              By accessing CivicResolve, creating an account, or submitting a complaint, you agree to comply with these Terms of Service. If you do not agree with these terms, do not use the application.
            </p>
          </div>

          {/* Term 2 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-[#102C35] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#102C35]" />
              <span>2. Acceptable Use & Citizen Responsibility</span>
            </h2>
            <p>CivicResolve exists to empower communities to maintain clean, safe, and accessible infrastructure. You agree that:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
              <li><strong>Accuracy:</strong> All submitted reports must reflect genuine civic issues observed in your community.</li>
              <li><strong>Prohibited Content:</strong> You will not submit defamatory, harassing, sexually explicit, fraudulent, or knowingly fabricated complaints.</li>
              <li><strong>Image Evidence:</strong> Uploaded photographs must depict only the infrastructure defect. Do not photograph private individuals without consent or private residential interiors.</li>
              <li><strong>No Automated Abuse:</strong> Scripted submissions, automated scraping, denial-of-service attempts, or bypassing rate limits are strictly prohibited.</li>
            </ul>
          </div>

          {/* Term 3 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-[#102C35] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#102C35]" />
              <span>3. AI Recommendations Are Strictly Advisory</span>
            </h2>
            <p>
              CivicResolve utilizes Google Gemini AI to analyze complaint descriptions and photos. AI-generated category, severity, priority, and department recommendations are advisory triage suggestions intended solely to assist human administrators. CivicResolve makes no guarantee of AI infallibility, and authorized municipal personnel retain sole decision-making authority over all work orders and dispatches.
            </p>
          </div>

          {/* Term 4 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-[#102C35] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#102C35]" />
              <span>4. Municipal Response & Resolution Disclaimers</span>
            </h2>
            <p>
              CivicResolve provides a digital communication bridge between citizens and municipal maintenance departments. However, CivicResolve itself does not perform physical repairs or guarantee resolution timelines. Actual response schedules, budget allocations, and contractor assignments depend entirely upon municipal resource availability and operational priorities.
            </p>
          </div>

          {/* Term 5 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-[#102C35]">
              5. Service Availability & Modifications
            </h2>
            <p className="text-xs text-gray-600">
              CivicResolve is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We reserve the right to modify, suspend, or terminate services, or restrict access to any user violating these terms, without prior liability.
            </p>
          </div>

          {/* Term 6 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-[#102C35]">
              6. Governance & Legal Review Notice
            </h2>
            <p className="text-xs text-gray-600">
              These terms represent the operational standards of the CivicResolve software platform. Formal legal terms and conditions applicable to specific municipal jurisdictions are subject to local governance review.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
