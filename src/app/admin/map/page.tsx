"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminSidebar } from "@/components/shared/AdminSidebar";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DepartmentBadge } from "@/components/ui/DepartmentBadge";
import { Issue } from "@/types";
import {
  MapPin,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Loader2,
} from "lucide-react";

export default function AdminMapViewPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssueId, setSelectedIssueId] = useState<string>("");
  const [filterDept, setFilterDept] = useState<string>("All");

  useEffect(() => {
    let mounted = true;
    async function loadIssues() {
      try {
        const res = await fetch("/api/admin/issues");
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            const list = data.issues || [];
            setIssues(list);
            if (list.length > 0) {
              setSelectedIssueId(list[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Map issues fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadIssues();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredIssues = issues.filter(
    (i) => filterDept === "All" || i.department === filterDept
  );

  const selectedIssue =
    issues.find((i) => i.id === selectedIssueId) || filteredIssues[0] || null;

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex font-body">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold font-heading text-[#102C35]">
              GIS Municipal Map View
            </h1>
            <p className="text-xs text-brand-muted">
              Spatial clustering and geolocation of reported civic hazards
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-lg border border-gray-300 bg-white"
            >
              <option value="All">All Departments</option>
              <option value="Roads">Roads</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Electricity">Electricity</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Drainage">Drainage</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </header>

        <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[640px]">
            {/* Interactive Map Viewport */}
            <div className="lg:col-span-8 bg-[#E9EBE2] rounded-card border border-gray-300 shadow-card relative overflow-hidden flex flex-col">
              {/* Map Controls */}
              <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-xs p-1.5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1">
                <button
                  aria-label="Center"
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
                <button
                  aria-label="Zoom In"
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  aria-label="Zoom Out"
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Critical / High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Low / Resolved</span>
                </div>
              </div>

              {/* Map Grid Background */}
              <div className="absolute inset-0 opacity-80 pointer-events-none">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M-50,280 C150,220 280,320 480,260 C650,210 800,280 950,230 L950,340 C800,390 650,320 480,370 C280,430 150,330 -50,390 Z"
                    fill="#C5E2EE"
                  />
                  <rect x="80" y="60" width="160" height="110" rx="20" fill="#D8E8D4" />
                  <rect x="520" y="380" width="180" height="140" rx="25" fill="#D8E8D4" />
                  <path d="M0,180 L900,180" stroke="#FFF" strokeWidth="12" />
                  <path d="M0,180 L900,180" stroke="#E2B36B" strokeWidth="4" />
                  <path d="M380,0 L380,650" stroke="#FFF" strokeWidth="14" />
                  <path d="M380,0 L380,650" stroke="#E2B36B" strokeWidth="5" />
                  <path d="M120,0 L680,650" stroke="#FFF" strokeWidth="10" />
                  <line x1="0" y1="80" x2="900" y2="80" stroke="#FFF" strokeWidth="6" />
                  <line x1="0" y1="280" x2="900" y2="280" stroke="#FFF" strokeWidth="6" />
                  <line x1="0" y1="420" x2="900" y2="420" stroke="#FFF" strokeWidth="6" />
                  <line x1="0" y1="520" x2="900" y2="520" stroke="#FFF" strokeWidth="6" />
                  <line x1="180" y1="0" x2="180" y2="650" stroke="#FFF" strokeWidth="6" />
                  <line x1="560" y1="0" x2="560" y2="650" stroke="#FFF" strokeWidth="6" />
                  <line x1="740" y1="0" x2="740" y2="650" stroke="#FFF" strokeWidth="6" />
                </svg>
              </div>

              {/* Map Pins */}
              <div className="relative w-full h-full">
                {filteredIssues.map((issue, idx) => {
                  const xPct = 20 + ((idx * 23) % 65);
                  const yPct = 15 + ((idx * 31) % 70);
                  const isSelected = issue.id === selectedIssueId;
                  const isCritical = issue.priority === "Critical" || issue.priority === "High";

                  return (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedIssueId(issue.id)}
                      style={{ left: `${xPct}%`, top: `${yPct}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-full transition-transform hover:scale-125 z-10 ${
                        isSelected ? "scale-125 ring-4 ring-white shadow-xl" : "shadow-md"
                      } ${
                        issue.status === "Resolved"
                          ? "bg-emerald-500 text-white"
                          : isCritical
                          ? "bg-red-500 text-white animate-bounce"
                          : "bg-amber-500 text-white"
                      }`}
                      title={`${issue.id}: ${issue.title}`}
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Complaint Detail Panel */}
            <div className="lg:col-span-4 bg-white rounded-card border border-gray-200 shadow-card p-6 flex flex-col justify-between overflow-y-auto">
              {selectedIssue ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="font-mono text-sm font-bold text-[#102C35] bg-gray-100 px-2.5 py-1 rounded">
                      {selectedIssue.id}
                    </span>
                    <StatusBadge status={selectedIssue.status} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold font-heading text-[#102C35]">
                      {selectedIssue.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-3">
                      {selectedIssue.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Category</span>
                      <span className="font-semibold text-gray-800">{selectedIssue.category}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Department</span>
                      <DepartmentBadge department={selectedIssue.department} />
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Priority</span>
                      <PriorityBadge priority={selectedIssue.priority} size="sm" />
                    </div>

                    <div className="flex items-center gap-2 py-1 text-gray-500">
                      <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
                      <span className="truncate">{selectedIssue.location_text}</span>
                    </div>
                  </div>

                  {selectedIssue.image_url && (
                    <div className="pt-2">
                      <p className="text-[11px] font-semibold text-gray-500 mb-1">Evidence Photo</p>
                      <div className="relative h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <Image
                          src={selectedIssue.image_url}
                          alt="Evidence thumbnail"
                          fill
                          sizes="(max-width: 768px) 100vw, 300px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-gray-400">
                  Select a marker on the map to inspect complaint details.
                </div>
              )}

              {selectedIssue && (
                <div className="pt-4 border-t border-gray-100 mt-4">
                  <Link
                    href={`/admin/complaints/${selectedIssue.id}`}
                    className="w-full py-2.5 bg-[#102C35] hover:bg-[#183D49] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Open in Dispatch Workspace</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
