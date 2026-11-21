import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark" | "admin";
  showTagline?: boolean;
  href?: string;
}

export function Logo({
  className,
  variant = "light",
  showTagline = false,
  href = "/",
}: LogoProps) {
  const isLight = variant === "light";
  const isAdmin = variant === "admin";

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Stylized Seedling + Civic Building Icon */}
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Base building blocks */}
          <rect x="7" y="18" width="6" height="16" rx="1.5" fill="#102C35" />
          <rect x="15" y="13" width="7" height="21" rx="1.5" fill="#183D49" />
          <rect x="24" y="20" width="6" height="14" rx="1.5" fill="#102C35" />
          
          {/* Overlapping vibrant leaf sprout */}
          <path
            d="M8 29C8 29 13 25 21 16C23.5 13.2 27.5 7.5 32 6C31 11.5 28 17 24 21C20 25 15 28.5 8 29Z"
            fill="#D6F36A"
          />
          <path
            d="M17 20C17 20 21 17 26 13C28 11.4 31 8 32 6C30 9.5 28 13.5 24 16C20 18.5 18 19.5 17 20Z"
            fill="#89A71B"
            opacity="0.4"
          />
          {/* Ground curve */}
          <path
            d="M5 33C12 33 28 33 35 33"
            stroke="#D6F36A"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center tracking-tight font-heading">
          <span
            className={cn(
              "text-xl font-bold tracking-tight",
              isLight || isAdmin ? "text-white" : "text-brand-teal"
            )}
          >
            Civic
          </span>
          <span
            className={cn(
              "text-xl font-medium tracking-tight",
              isLight || isAdmin ? "text-[#D6F36A]" : "text-[#24876B]"
            )}
          >
            Resolve
          </span>
          {isAdmin && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold bg-[#D6F36A] text-brand-teal rounded">
              Admin
            </span>
          )}
        </div>
        {showTagline && (
          <span
            className={cn(
              "text-[11px] leading-tight font-body",
              isLight || isAdmin ? "text-gray-300" : "text-brand-muted"
            )}
          >
            {isAdmin ? "Municipal Administration" : "Better cities begin with better reporting"}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="hover:opacity-95 transition-opacity">{content}</Link>;
  }

  return content;
}
