"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/shared/AdminSidebar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { DepartmentBadge } from "@/components/ui/DepartmentBadge";
import { formatDate } from "@/lib/utils";
import { Issue, IssueCategory, IssuePriority, IssueStatus, MunicipalDepartment } from "@/types";
import { Search, Eye, Loader2, AlertCircle, Inbox } from "lucide-react";

export default function AdminComplaintManagementPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  useEffect(() => {
    let mounted = true;
    async function fetchComplaints() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "All") params.set("status", statusFilter);
        if (categoryFilter !== "All") params.set("category", categoryFilter);
        if (priorityFilter !== "All") params.set("priority", priorityFilter);
        if (departmentFilter !== "All") params.set("department", departmentFilter);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/admin/issues?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to load complaints from municipal registry.");
        }
        const data = await res.json();
        if (mounted) {
          setIssues(data.issues || []);
          setTotal(data.total || 0);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load complaints.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      fetchComplaints();
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [statusFilter, categoryFilter, priorityFilter, departmentFilter, search]);

  return (
    <div className="min-h-screen bg-[#F5F5EF] flex font-body">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold font-heading text-[#102C35]">
              Complaints Management
            </h1>
            <p className="text-xs text-brand-muted">
              Central triage, department assignment, and status updates
            </p>
          </div>

          <div className="text-xs font-mono text-gray-500">
            Total Active Records: <strong>{total}</strong>
          </div>
        </header>

        <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-card border border-gray-200 shadow-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#102C35]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#102C35]"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#102C35]"
            >
              <option value="All">All Categories</option>
              <option value="Pothole">Pothole</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Garbage">Garbage</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Drainage">Drainage</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#102C35]"
            >
              <option value="All">All Departments</option>
              <option value="Roads">Roads</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Electricity">Electricity</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Drainage">Drainage</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#102C35]"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-card border border-gray-200 shadow-card overflow-hidden">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#102C35]" />
                <p className="text-xs text-gray-500">Querying municipal complaints database...</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <Inbox className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-semibold text-gray-700">No complaints match your filters</p>
                <p className="text-xs text-gray-400">
                  Try clearing or adjusting search and department filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider font-mono">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Title / Location</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-body">
                    {issues.map((issue) => (
                      <tr
                        key={issue.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[#102C35]">
                          {issue.id}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-semibold text-gray-900 truncate">
                            {issue.title}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {issue.location_text}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-gray-700">
                          {issue.category}
                        </td>
                        <td className="py-3.5 px-4">
                          <DepartmentBadge department={issue.department} />
                        </td>
                        <td className="py-3.5 px-4">
                          <PriorityBadge priority={issue.priority} size="sm" />
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={issue.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                          {formatDate(issue.created_at)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/admin/complaints/${issue.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-[#102C35] hover:text-white text-gray-700 transition-colors font-semibold text-[11px]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
