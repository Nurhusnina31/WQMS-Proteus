import { memo } from "react";
import { SlidersHorizontal } from "lucide-react";
import DateRangePicker from "../widgets/DateRangePicker";
import ParamDropdown from "./ParamDropdown";
import { PARAMETERS } from "../../data/constants";

const TIME_AVERAGES = [
  { value: "30m", label: "30 Minute Avg" },
  { value: "1h", label: "1 Hour Avg" },
  { value: "8h", label: "8 Hour Avg" },
  { value: "24h", label: "24 Hour Avg" },
] as const;

type TimeAverage = (typeof TIME_AVERAGES)[number]["value"];

type Props = {
  // Devices
  devices: any[];
  devicesLoading: boolean;
  device: string;
  onDeviceChange: (id: string) => void;
  // Date range
  startDate: string;
  endDate: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  // Time average
  timeAverage: TimeAverage;
  onTimeAverageChange: (v: TimeAverage) => void;
  // Params
  selectedParams: string[];
  onToggleParam: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  getUnit: (key: string) => string;
};

/* both dropdown share same styling */
const selectClass = `
   h-11 w-full min-w-0
  appearance-none
  rounded-xl border border-line
  bg-white px-4 pr-10
  text-sm font-medium text-ink
  transition-all duration-200
  cursor-pointer
  hover:border-brand/50
  focus:border-brand
  focus:outline-none
  focus:ring-2 focus:ring-brand/20
  disabled:cursor-not-allowed
  disabled:opacity-50
`;

const AnalyticsControls = memo(function AnalyticsControls({
  devices,
  devicesLoading,
  device,
  onDeviceChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  timeAverage,
  onTimeAverageChange,
  selectedParams,
  onToggleParam,
  onSelectAll,
  onDeselectAll,
  getUnit,
}: Props) {
  
  return (
  <section className="border-b border-line bg-white px-4 py-4 sm:px-6">

    <div className="w-full">

      {/* Filter Heading */}
      <div className="mb-4 flex items-center justify-between gap-3">

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand" />

          <h2 className="text-sm font-semibold text-ink">
            Filters
          </h2>
        </div>

        <span className="text-xs font-medium text-muted">
          {selectedParams.length} parameter
          {selectedParams.length !== 1 ? "s" : ""} selected
        </span>

      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Device Selector */}
        <div className="min-w-0">
          <label
            htmlFor="analytics-device"
            className="mb-2 block text-xs font-semibold text-muted"
          >
            Monitoring Station
          </label>

          <div className="relative">
            <select
              id="analytics-device"
              value={device}
              onChange={(e) => onDeviceChange(e.target.value)}
              disabled={devicesLoading}
              className={selectClass}
            >
              {devicesLoading ? (
                <option>Loading devices...</option>
              ) : devices.length > 0 ? (
                devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))
              ) : (
                <option>No devices found</option>
              )}
            </select>

            <ChevronIcon className="absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Date Range */}
        <div className="min-w-0">
          <span className="mb-2 block text-xs font-semibold text-muted">
            Date Range
          </span>

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            fullWidth
          />
        </div>

        {/* Time Average */}
        <div className="min-w-0">
          <label
            htmlFor="analytics-average"
            className="mb-2 block text-xs font-semibold text-muted"
          >
            Averaging Interval
          </label>

          <div className="relative">
            <select
              id="analytics-average"
              value={timeAverage}
              onChange={(e) =>
                onTimeAverageChange(e.target.value as TimeAverage)
              }
              className={selectClass}
            >
              {TIME_AVERAGES.map((avg) => (
                <option key={avg.value} value={avg.value}>
                  {avg.label}
                </option>
              ))}
            </select>

            <ChevronIcon className="absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Parameter Multi-Select */}
        <div className="min-w-0">
          <span className="mb-2 block text-xs font-semibold text-muted">
            Water Quality Parameters
          </span>

          <ParamDropdown
            selectedParams={selectedParams}
            onToggle={onToggleParam}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            getUnit={getUnit}
          />
        </div>
      </div>

      {/* Selected Parameters */}
      {selectedParams.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">

          <span className="text-xs font-medium text-muted">
            Selected:
          </span>

          <div className="flex flex-wrap gap-2">
            {selectedParams.map((key) => {
              const param = PARAMETERS.find((p) => p.key === key);

              if (!param) return null;

              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-2 rounded-full border border-[#B8DCF0] bg-[#E3F2FB] px-3 py-1.5 text-xs font-medium text-brand"
                >
                  {param.label}

                  {selectedParams.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove ${param.label}`}
                      onClick={() => onToggleParam(key)}
                      className="rounded-full p-0.5 transition-colors hover:bg-[#C5E5F7]"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  </section>
  );
});

export default AnalyticsControls;

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none h-4 w-4 text-brand transition-colors ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}
