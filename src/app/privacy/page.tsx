import React from "react";
import Link from "next/link";
import { CitizenNavbar } from "@/components/shared/CitizenNavbar";
import { Footer } from "@/components/shared/Footer";
import { Shield, Lock, Eye, Bot, Database, ArrowLeft, Mail, FileText } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "CivicResolve Privacy Policy — How we protect citizen data, image evidence, and handle AI processing.",
};

export default function PrivacyPolicyPage() {
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
            Privacy Policy & Data Rights
          </h1>
          <p className="text-xs font-mono text-brand-muted">
            Last Updated: November 2026 • Legal Review Status: Pending Final Operator Customization
          </p>
        </div>

        {/* Notice Card */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold">Summary of Citizen Privacy Guarantees</p>
            <p>
              CivicResolve operates under a strict principle of minimal data collection. We do not sell your personal data, track your browsing across external websites, or expose your email or phone number in public complaint feeds.
            </p>
          </div>
        </div>

        <section className="space-y-8 text-sm leading-relaxed text-gray-700 bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-sm">
          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-[#102C35] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#102C35]" />
              <span>1. Information We Collect</span>
            </h2>
            <p>When you register for or interact with CivicResolve, we collect:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
              <li><strong>Account Identity:</strong> Your full name, email address, optional contact phone number, and encrypted password credentials managed via Supabase Authentication.</li>
              <li><strong>Complaint Content:</strong> Titles, descriptions, municipal problem categories, and timestamps of civic infrastructure reports.</li>
              <li><strong>Photographic Evidence:</strong> User-uploaded images of infrastructure issues (e.g. road damage, garbage accumulation).</li>
              <li><strong>Location Data:</strong> Voluntary geographic coordinates (latitude and longitude) or street addresses supplied via device geolocation or manual text input.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-[#102C35] flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#102C35]" />
              <span>2. AI Analysis & Processing (Google Gemini)</span>
            </h2>
            <p>
              To assist municipal dispatchers in rapidly identifying severe hazards and routing tickets to appropriate departments, CivicResolve utilizes the official Google Gemini AI API:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
              <li><strong>Scope of AI Processing:</strong> Only the complaint title, description, category, and evidence photo are transmitted to Google Gemini for advisory classification.</li>
              <li><strong>Non-Exposed Data:</strong> Citizen account names, email addresses, phone numbers, and user UUIDs are <em>never</em> sent to AI models.</li>
              <li><strong>Advisory Nature:</strong> AI-generated categories, urgency ratings, and operational recommendations are purely advisory. Certified municipal administrators retain ultimate decision authority over work order execution.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-[#102C35] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#102C35]" />
              <span>3. Data Storage & Evidence Security</span>
            </h2>
            <p>
              CivicResolve utilizes Supabase PostgreSQL and Supabase Private Object Storage:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
              <li><strong>Row-Level Security (RLS):</strong> Database-level access rules enforce that citizens can only query and view complaints linked to their own account identifier.</li>
              <li><strong>Private Buckets:</strong> Photographic evidence is stored in a private bucket (<code className="font-mono bg-gray-100 px-1 py-0.5 rounded">civic-evidence</code>) with unauthenticated public access revoked.</li>
              <li><strong>Short-Lived Signed URLs:</strong> Images are served strictly through cryptographic HMAC-signed URLs expiring automatically after one hour (3600 seconds).</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-[#102C35] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#102C35]" />
              <span>4. Public Tracking & Transparency Boundaries</span>
            </h2>
            <p>
              Citizens can look up municipal resolution progress using their unique reference number (e.g., <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">CIV-1001</code>). The tracking view displays problem description, status timeline, and department assignment. Citizen personal identifiers (email, phone number, account ID) are permanently excluded from tracking payloads to preserve complete anonymity.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-[#102C35] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#102C35]" />
              <span>5. Data Retention & Account Deletion Requests</span>
            </h2>
            <p>
              Citizens have the right to request deletion of their account profile and erasure of associated personal contact data. However, municipal repair audit history (timestamps, department notes, work orders) must be preserved in compliance with municipal accountability standards.
            </p>
            <p className="text-xs text-gray-600">
              To request profile anonymization or account removal, submit a formal request through our <Link href="/contact" className="text-[#102C35] font-semibold underline">Contact & Support Page</Link> specifying your registered email address.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-[#102C35] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#102C35]" />
              <span>6. Contact the Operator</span>
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              CivicResolve is operated by its designated software development team. For privacy inquiries, please consult the <Link href="/contact" className="font-semibold text-[#102C35] underline">Operator Directory</Link>. Formal jurisdiction-specific regulatory clauses are subject to final municipal onboarding confirmation.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
