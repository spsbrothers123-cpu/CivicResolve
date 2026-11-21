import React from "react";
import { IssuePriority } from "@/types";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: IssuePriority;
  className?: string;
  size?: "sm" | "md";
}

export function PriorityBadge({ priority, className, size = "md" }: PriorityBadgeProps) {
  const styles: Record<IssuePriority, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200/90 font-semibold",
    High: "bg-[#FDEDED] text-[#D65B52] border-[#F8B4AF] font-medium",
    Medium: "bg-[#FEF7EC] text-[#E7A23B] border-[#FBD69F] font-medium",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border",
        styles[priority] || "bg-gray-100 text-gray-700 border-gray-200",
        sizeClasses[size],
        className
      )}
    >
      {priority}
    </span>
  );
}
