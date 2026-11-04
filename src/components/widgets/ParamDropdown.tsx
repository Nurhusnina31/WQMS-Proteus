
import { useEffect, useRef, useState } from "react";
import { PARAMETERS } from "../../data/constants";
import { ChevronDown, Check, X } from "lucide-react";

type Props = {
  selectedParams: string[];
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  getUnit: (key: string) => string;
};

export default function ParamDropdown({
  selectedParams,
  onToggle,
  onSelectAll,
  onDeselectAll,
  getUnit,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const label =
    selectedParams.length === PARAMETERS.length
      ? "All Parameters"
      : selectedParams.length === 1
        ? PARAMETERS.find((p) => p.key === selectedParams[0])?.label
        : `${selectedParams.length} Parameters`;

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className="relative min-w-0 w-full"
    >
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Select water quality parameters"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`
          flex h-11 w-full min-w-0
          items-center justify-between gap-3
          rounded-xl border bg-white
          px-4 text-sm font-medium text-ink
          transition-all duration-200
          hover:border-brand/50
          focus:outline-none
          focus:ring-2 focus:ring-brand/20
          ${isOpen ? "border-brand" : "border-line"}
        `}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {label || "Select Parameters"}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-brand transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute right-0 top-full z-[60] mt-2
            w-[300px] max-w-[calc(100vw-2rem)]
            overflow-hidden rounded-xl
            border border-line bg-white
            shadow-xl shadow-slate-900/10
          "
        >
          {/* Dropdown Header */}
          <div className="flex items-center justify-between gap-2 border-b border-line bg-[#F8FBFE] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">
                Select Parameters
              </p>
              <p className="text-xs text-muted">
                {selectedParams.length} selected
              </p>
            </div>

            <button
              type="button"
              aria-label="Close parameter selector"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-muted hover:bg-sidebar hover:text-brand"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-xs font-medium text-brand transition-colors hover:text-brand-hover"
            >
              Select All
            </button>

            <button
              type="button"
              onClick={onDeselectAll}
              className="text-xs font-medium text-muted transition-colors hover:text-brand"
            >
              Reset
            </button>
          </div>

          {/* Parameter Options */}
          <div className="custom-scrollbar max-h-72 overflow-y-auto py-1">
            {PARAMETERS.map((param) => {
              const isSelected = selectedParams.includes(
                param.key
              );

              return (
                <label
                  key={param.key}
                  className={`
                    flex cursor-pointer items-center
                    gap-3 px-4 py-3
                    transition-colors duration-150
                    hover:bg-sidebar
                    ${isSelected ? "bg-[#F4FAFE]" : ""}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(param.key)}
                    className="
                      h-4 w-4 shrink-0
                      cursor-pointer rounded
                      border-line accent-[#0369A1]
                      focus:ring-brand/20
                    "
                  />

                  <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                    {param.label}
                  </span>

                  <span className="text-xs text-muted">
                    {getUnit(param.key)}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Dropdown Footer */}
          <div className="border-t border-line bg-[#F8FBFE] p-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="
                flex w-full items-center justify-center
                gap-2 rounded-lg bg-brand
                px-4 py-2.5
                text-sm font-medium text-white
                transition-colors duration-200
                hover:bg-brand-hover
              "
            >
              <Check className="h-4 w-4" />
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
