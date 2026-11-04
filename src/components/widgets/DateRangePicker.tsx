
import { useState, useRef, useEffect } from "react";
import { DateRange } from "react-date-range";
import { CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  fullWidth?: boolean;
}

const toDate = (value: string) =>
  value ? parseISO(value) : new Date();

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  fullWidth = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectionRange, setSelectionRange] = useState(() => ({
    startDate: toDate(startDate),
    endDate: toDate(endDate),
    key: "selection",
  }));

  // Keep calendar selection in sync with parent values
  useEffect(() => {
    setSelectionRange({
      startDate: toDate(startDate),
      endDate: toDate(endDate),
      key: "selection",
    });
  }, [startDate, endDate]);

  // Close calendar when clicking outside or pressing Escape
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

  // Preserve existing date-selection functionality
  const handleSelect = (ranges: any) => {
    const { selection } = ranges;

    if (!selection.startDate || !selection.endDate) return;

    setSelectionRange(selection);

    onStartDateChange(
      format(selection.startDate, "yyyy-MM-dd")
    );
    onEndDateChange(
      format(selection.endDate, "yyyy-MM-dd")
    );
  };

  const getDisplayText = () => {
    if (!startDate && !endDate) {
      return "Select Date Range";
    }

    if (startDate && endDate) {
      return `${format(parseISO(startDate), "dd/MM/yyyy")} - ${format(
        parseISO(endDate),
        "dd/MM/yyyy"
      )}`;
    }

    if (startDate) {
      return `${format(parseISO(startDate), "dd/MM/yyyy")} - ...`;
    }

    return "Select Date Range";
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${
        fullWidth ? "w-full" : "w-full sm:w-[240px]"
      }`}
    >
      {/* Date Range Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Select date range"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`
          flex h-11 w-full min-w-0 items-center
          justify-between gap-3
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
          {getDisplayText()}
        </span>

        <CalendarDays className="h-4 w-4 shrink-0 text-brand" />
      </button>

      {/* Calendar Popup */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Choose date range"
          className="
            ocean-date-picker
            absolute left-0 top-full z-[60] mt-2
            w-[350px] max-w-[calc(100vw-2rem)]
            overflow-hidden rounded-xl
            border border-line bg-white
            shadow-xl shadow-slate-900/10
            sm:left-auto sm:right-0
          "
        >
          {/* Ocean Blue Calendar Theme */}
          <style>{`
            .ocean-date-picker .rdrCalendarWrapper,
            .ocean-date-picker .rdrMonths,
            .ocean-date-picker .rdrMonth {
              width: 100%;
              box-sizing: border-box;
            }

            .ocean-date-picker .rdrCalendarWrapper {
              background: #ffffff;
              color: #0F2942;
              font-size: 12px;
            }

            .ocean-date-picker .rdrMonth {
              padding: 0 0.75em 1em;
            }

            .ocean-date-picker .rdrDateDisplayWrapper {
              background: #F6FAFD;
            }

            .ocean-date-picker .rdrDateDisplayItem {
              background: white;
              border: 1px solid #D1E5F2;
              box-shadow: none;
              border-radius: 8px;
            }

            .ocean-date-picker .rdrDateDisplayItem input {
              color: #0F2942;
            }

            .ocean-date-picker .rdrDateDisplayItemActive {
              border-color: #0369A1;
            }

            .ocean-date-picker .rdrMonthAndYearWrapper {
              background: #ffffff;
            }

            .ocean-date-picker .rdrMonthPicker select,
            .ocean-date-picker .rdrYearPicker select {
              background: #EFF8FF;
              color: #0F2942;
              border-radius: 6px;
            }

            .ocean-date-picker .rdrWeekDay {
              color: #63839A;
            }

            .ocean-date-picker .rdrDayNumber span {
              color: #0F2942;
            }

            .ocean-date-picker .rdrDayPassive .rdrDayNumber span {
              color: #B0C4D2;
            }

            .ocean-date-picker .rdrDayToday
              .rdrDayNumber span::after {
              background: #0369A1;
            }

            .ocean-date-picker .rdrInRange {
              background: rgba(3,105,161,0.18) !important;
            }

            .ocean-date-picker .rdrStartEdge,
            .ocean-date-picker .rdrEndEdge {
              background: #0369A1 !important;
            }

            .ocean-date-picker .rdrDay:not(.rdrDayPassive)
              .rdrInRange ~ .rdrDayNumber span,
            .ocean-date-picker .rdrDay:not(.rdrDayPassive)
              .rdrStartEdge ~ .rdrDayNumber span,
            .ocean-date-picker .rdrDay:not(.rdrDayPassive)
              .rdrEndEdge ~ .rdrDayNumber span {
              color: #FFFFFF;
            }

            .ocean-date-picker .rdrDayStartPreview,
            .ocean-date-picker .rdrDayInPreview,
            .ocean-date-picker .rdrDayEndPreview {
              border-color: rgba(3,105,161,0.3) !important;
            }

            .ocean-date-picker .rdrNextPrevButton {
              background: #EFF8FF;
            }

            .ocean-date-picker .rdrNextPrevButton:hover {
              background: #D9EEFC;
            }
          `}</style>

          <DateRange
            ranges={[selectionRange]}
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
            months={1}
            direction="horizontal"
            rangeColors={["#0369A1"]}
            dateDisplayFormat="dd/MM/yyyy"
          />

          {/* Footer */}
          <div className="flex justify-end border-t border-line bg-[#F8FBFE] px-3 py-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-brand px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-hover"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
