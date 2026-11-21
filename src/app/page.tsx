import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/shared/Footer";
import {
  FileSpreadsheet,
  Cpu,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Camera,
  Layers,
  Building,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5EF] flex flex-col font-body">
      {/* Top Banner Navigation */}
      <header className="bg-[#102C35] text-white border-b border-[#183D49]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo variant="light" showTagline={true} />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <Link href="/" className="text-white hover:text-[#D6F36A] transition-colors">
              Home
            </Link>
            <a href="#features" className="hover:text-[#D6F36A] transition-colors">
              About
            </a>
            <a href="#stats" className="hover:text-[#D6F36A] transition-colors">
              Impact
            </a>
            <Link href="/track" className="hover:text-[#D6F36A] transition-colors">
              Track Status
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Citizen Login
            </Link>
            <Link
              href="/report"
              className="px-4 py-2 bg-[#D6F36A] hover:bg-[#C4E654] text-[#102C35] font-semibold text-sm rounded-lg shadow-sm transition-all hover:scale-102 active:scale-98"
            >
              Report an Issue
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#102C35] text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D6F36A]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#24876B]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#183D49] border border-[#235363] text-xs font-medium text-[#D6F36A]">
              <span className="w-2 h-2 rounded-full bg-[#D6F36A] animate-pulse" />
              Powered by Google Gemini Municipal Intelligence
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-white tracking-tight leading-[1.12]">
              Your city. <br />
              Your voice. <br />
              <span className="text-[#D6F36A]">Real progress.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 max-w-xl font-body leading-relaxed">
              AI-powered civic issue reporting for a cleaner, safer, and smarter city. Report problems in seconds, track repairs in real time.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/report"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#D6F36A] hover:bg-[#C4E654] text-[#102C35] font-bold text-base rounded-xl shadow-lg transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
              >
                <span>Report an Issue</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/track"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-transparent hover:bg-[#183D49] text-white border border-[#255261] font-semibold text-base rounded-xl transition-all"
              >
                <span>Track a Complaint</span>
              </Link>
            </div>

            {/* Quick Micro-Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#183D49]/80 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#D6F36A]" />
                <span>Snap & Upload</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#D6F36A]" />
                <span>Gemini Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D6F36A]" />
                <span>Live Audit Trail</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card / City Illustration */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-[#183D49] shadow-2xl bg-[#0B1E24]/60 backdrop-blur-md p-6">
              {/* Civic preview card */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#183D49]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs font-mono text-[#D6F36A]">CIV-004 • LIVE DISPATCH</span>
                </div>

                <div className="relative h-48 rounded-xl overflow-hidden bg-gray-900 border border-[#183D49]">
                  <Image
                    src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"
                    alt="Roadside Pothole Infrastructure Issue"
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <div>
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#D65B52] text-white rounded">
                        High Severity Cavity
                      </span>
                      <p className="text-sm font-semibold text-white mt-1">Roadside Pothole - Indiranagar</p>
                    </div>
                  </div>
                </div>

                {/* AI Triage Card overlay */}
                <div className="p-3.5 bg-[#102C35] rounded-xl border border-[#235363] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">Gemini Municipal Assessment</span>
                    <span className="text-[#D6F36A] font-mono font-semibold">94% Confidence</span>
                  </div>
                  <p className="text-xs text-gray-200">
                    Assigned to <strong>Roads Department</strong> • Action: Emergency rapid cold-mix patching within 24h.
                  </p>
                  <div className="w-full bg-[#183D49] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#D6F36A] h-full w-[94%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section (3 Core Pillars from Design Board) */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-mono font-bold text-[#24876B] tracking-wider uppercase">
            Transforming Municipal Governance
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold font-heading text-[#102C35]">
            From citizen friction to structured resolution
          </h3>
          <p className="text-brand-muted text-base">
            CivicResolve replaces unorganized complaints with automated triage, transparent accountability, and measurable civic repair.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-card border border-gray-200 shadow-card hover:shadow-floating transition-all hover:translate-y-[-2px] space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#F3FBD9] text-[#102C35] flex items-center justify-center">
              <Camera className="w-6 h-6 text-[#102C35]" />
            </div>
            <h4 className="text-xl font-bold font-heading text-[#102C35]">
              1. Report Civic Issues with Ease
            </h4>
            <p className="text-sm text-brand-muted leading-relaxed">
              Capture damaged roads, overflowing garbage, unlit streets, or broken water mains with automatic geo-tagging and image evidence.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-card border border-gray-200 shadow-card hover:shadow-floating transition-all hover:translate-y-[-2px] space-y-4 relative">
            <div className="absolute top-4 right-4 px-2 py-0.5 bg-[#D6F36A] text-[#102C35] text-[10px] font-mono font-bold uppercase rounded">
              Gemini Powered
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#102C35] text-[#D6F36A] flex items-center justify-center">
              <Cpu className="w-6 h-6 text-[#D6F36A]" />
            </div>
            <h4 className="text-xl font-bold font-heading text-[#102C35]">
              2. AI-Powered Classification
            </h4>
            <p className="text-sm text-brand-muted leading-relaxed">
              Google Gemini evaluates the threat severity, calculates public safety risks, and routes work orders directly to the responsible municipal department.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-card border border-gray-200 shadow-card hover:shadow-floating transition-all hover:translate-y-[-2px] space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#24876B] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#24876B]" />
            </div>
            <h4 className="text-xl font-bold font-heading text-[#102C35]">
              3. Transparent Resolution Tracking
            </h4>
            <p className="text-sm text-brand-muted leading-relaxed">
              Citizens receive step-by-step audit timelines from Reported to In Progress to Resolved, complete with administrative notes and resolution photos.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section (matching board: 10K+ Issues Reported, 95% Resolution Rate, 24h Avg Resolution) */}
      <section id="stats" className="bg-[#102C35] text-white py-16 border-y border-[#183D49]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#183D49]">
            <div className="space-y-2 py-4">
              <p className="text-4xl sm:text-5xl font-black font-heading text-[#D6F36A]">
                10K+
              </p>
              <p className="text-sm font-medium text-gray-300">Issues Successfully Reported</p>
            </div>
            <div className="space-y-2 py-4">
              <p className="text-4xl sm:text-5xl font-black font-heading text-white">
                95%
              </p>
              <p className="text-sm font-medium text-gray-300">Municipal Resolution Rate</p>
            </div>
            <div className="space-y-2 py-4">
              <p className="text-4xl sm:text-5xl font-black font-heading text-[#D6F36A]">
                24h
              </p>
              <p className="text-sm font-medium text-gray-300">Average Emergency Response</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Launch CTA */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 shadow-card max-w-4xl mx-auto space-y-6">
          <h3 className="text-2xl sm:text-3xl font-bold font-heading text-[#102C35]">
            Ready to improve your neighborhood?
          </h3>
          <p className="text-brand-muted max-w-xl mx-auto text-sm sm:text-base">
            Take a picture of any civic problem right now. Our AI assistant will analyze it and submit it to city dispatchers in less than two minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/report"
              className="px-6 py-3 bg-[#D6F36A] hover:bg-[#C4E654] text-[#102C35] font-bold text-sm rounded-xl shadow-sm transition-all"
            >
              Report an Issue Now
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-[#102C35] hover:bg-[#183D49] text-white font-semibold text-sm rounded-xl transition-all"
            >
              Open Citizen Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Shared Platform Footer */}
      <Footer />
    </div>
  );
}
