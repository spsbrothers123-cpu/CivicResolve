import React from "react";
import { MunicipalDepartment } from "@/types";
import { cn } from "@/lib/utils";
import {
  Car,
  Trash2,
  Zap,
  Droplets,
  Waves,
  Building2,
} from "lucide-react";

interface DepartmentBadgeProps {
  department: MunicipalDepartment;
  className?: string;
  showIcon?: boolean;
}

export function DepartmentBadge({
  department,
  className,
  showIcon = true,
}: DepartmentBadgeProps) {
  const getIcon = () => {
    switch (department) {
      case "Roads":
        return <Car className="w-3.5 h-3.5 text-blue-600" />;
      case "Sanitation":
        return <Trash2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "Electricity":
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case "Water Supply":
        return <Droplets className="w-3.5 h-3.5 text-sky-500" />;
      case "Drainage":
        return <Waves className="w-3.5 h-3.5 text-cyan-600" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gray-50 border border-gray-200/80 text-xs font-medium text-gray-700",
        className
      )}
    >
      {showIcon && getIcon()}
      <span>{department}</span>
    </span>
  );
}
