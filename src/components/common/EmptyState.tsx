import { Triangle } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  lastDataTimestamp?: string | null;
  compact?: boolean;
  variant?: "default" | "ocean";
}

export default function EmptyState({
  title = "No Data Found",
  message,
  icon,
  lastDataTimestamp = null,
  compact = false,
  variant = "default",
}: EmptyStateProps) {

  
if (variant === "ocean") {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center px-4 text-center ${
        compact ? "py-8" : "min-h-[280px] py-10"
      }`}
    >
      {/* Icon */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-sidebar text-brand">
        {icon || <Triangle className="h-8 w-8" />}
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-ink">
        {title}
      </h3>

      {/* Description */}
      {message && (
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          {message}
        </p>
      )}

      {/* Last Available Reading */}
      {lastDataTimestamp && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-medium text-amber-800">
            Last data received:{" "}
            {new Date(lastDataTimestamp).toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}
    </div>
  );
}


  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "h-full py-8" : "min-h-[600px]"
      }`}
    >
      {/* Icon */}
      <div className={compact ? "mb-3" : "mb-2"}>
        {icon || (
          <div className="relative">
            {/* Triangle outline */}
            <div
              className={`flex items-center justify-center ${
                compact ? "w-16 h-16" : "w-24 h-24"
              }`}
            >
              <Triangle
                className={`text-gray-600 ${compact ? "w-18 h-18" : "w-50 h-50"}`}
                strokeWidth={1.5}
              />
              {/* Teal exclamation mark */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`text-blue-600 font-bold ${
                    compact ? "text-3xl mt-2" : "text-5xl mt-3"
                  }`}
                >
                  !
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className={`font-semibold text-slate-800 ${
          compact ? "text-base mb-1" : "text-xl mb-2"
        }`}
      >
        {title}
      </h3>

      {/* Message */}
      {message && <p className="text-sm text-slate-500 max-w-xs">{message}</p>}

      {/* Device status - show last data timestamp if available */}
      {lastDataTimestamp && (
        <div className="mt-2 p-4 bg-orange-900/20 border border-orange-600/30 rounded-lg max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 text-orange-600 text-sm mb-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="font-medium">Device Currently Offline</span>
          </div>
          <p className="text-slate-500 text-xs">
            Last data received:{" "}
            {new Date(lastDataTimestamp).toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
