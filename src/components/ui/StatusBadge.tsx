import React from "react";
import { IssueStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: IssueStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const styles: Record<IssueStatus, string> = {
    Reported: "bg-blue-50 text-blue-700 border-blue-200/80",
    "In Progress": "bg-amber-50 text-amber-700 border-amber-200/80",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  };

  const dots: Record<IssueStatus, string> = {
    Reported: "bg-blue-500",
    "In Progress": "bg-amber-500 animate-pulse",
    Resolved: "bg-emerald-500",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-medium",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border shadow-2xs font-body transition-colors",
        styles[status] || "bg-gray-100 text-gray-700 border-gray-200",
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dots[status] || "bg-gray-400")} />
      {status}
    </span>
  );
}
