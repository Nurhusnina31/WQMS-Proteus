// src/components/Card.tsx

import type { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "ocean";
}

export default function Card({
  title,
  children,
  right,
  icon,
  variant = "default",
}: CardProps) {
  const isOcean = variant === "ocean";

  return (
    <div
      className={
        isOcean
          ? "min-w-0 rounded-2xl border border-line bg-surface shadow-sm transition-shadow duration-200 hover:shadow-md"
          : "rounded-2xl border border-slate-200 bg-white"
      }
    >
      {/* Card Header */}
      <div
        className={
          isOcean
            ? "flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-line bg-[#F3FAFE] px-4 py-3 sm:px-5"
            : "flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5"
        }
      >
        <div className="flex min-w-0 items-center gap-3">
          {/* Optional Header Icon */}
          {isOcean && icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E1F2FB] text-brand">
              {icon}
            </div>
          )}

          {/* Card Title */}
          <h2
            className={
              isOcean
                ? "text-sm font-semibold tracking-tight text-ink sm:text-base"
                : "font-medium text-slate-700"
            }
          >
            {title}
          </h2>
        </div>

        {/* Optional Right Content */}
        {right && <div className="min-w-0">{right}</div>}
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
}

