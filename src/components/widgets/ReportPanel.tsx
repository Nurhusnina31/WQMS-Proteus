import { useState, useEffect } from "react";
import { X, ChevronDown, FilePlus2 } from "lucide-react";
import DateRangePicker from "./DateRangePicker";
import api from "../../services/api";
import { useUnits } from "../../context/UnitContext";

interface Device {
  id: string;
  deviceCode: string;
  name: string;
  location: string;
}

const INTERVAL_OPTIONS = [
  { label: "1 Minute", value: "1m" },
  { label: "1 Hour", value: "1h" },
];

export default function ReportPanel({
  onClose,
  onReportGenerated,
}: {
  onClose: () => void;
  /** Fired after a successful report generation, before the panel closes. */
  onReportGenerated?: () => void;
}) {
  const { units } = useUnits();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [frequency, setFrequency] = useState<string>("");
  const [dataInterval, setDataInterval] = useState<string>("1h");
  const [exportType, setExportType] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Fetch devices on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await api.get("/devices");
        console.log("Device API Response:", response.data);

        // API returns: { success: true, data: { devices: [...], pagination: {...} } }
        const deviceList = response.data.data?.devices || [];
        console.log("Devices loaded:", deviceList);
        setDevices(deviceList);
      } catch (error) {
        console.error("Failed to fetch devices:", error);
        setError("Failed to load devices");
      }
    };

    fetchDevices();
  }, []);

  const downloadFile = async (
    path: string,
    body: any,
    filename: string,
  ) => {
    const response = await api.post(path, body, { responseType: "blob" });
    const contentType =
      response.headers["content-type"] || "application/octet-stream";
    const blob = new Blob([response.data], { type: contentType });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const generateReport = async () => {
    // Validate inputs
    if (!selectedDevice) {
      setError("Please select a device");
      return;
    }
    if (!frequency) {
      setError("Please select a report frequency");
      return;
    }
    if (!dataInterval) {
      setError("Please select a data interval");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select a date range");
      return;
    }
    if (!exportType) {
      setError("Please select one export format");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const requestBody = {
        deviceId: selectedDevice,
        startDate,
        endDate,
        frequency: frequency.toLowerCase(),
        interval: dataInterval,
        // Send the user's per-parameter unit preferences so the report
        // matches what they see on the dashboard.
        units,
      };

      const ext = exportType.toLowerCase();
      await downloadFile(
        `/reports/export/${ext}`,
        requestBody,
        `report_${selectedDevice}_${frequency}_${dataInterval}_${startDate}_to_${endDate}.${ext}`,
      );

      // Success - notify parent so the report list can refresh, then close.
      onReportGenerated?.();
      onClose();
    } catch (err: any) {
      console.error("Report generation error:", err);
      setError(err.response?.data?.error || err.message || "Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  
return (
  <aside
    role="dialog"
    aria-modal="true"
    aria-labelledby="report-panel-title"
    className="
      fixed inset-y-0 right-0 z-[1080]
      flex h-[100dvh] w-full max-w-full flex-col
      border-l border-line bg-white
      text-ink shadow-2xl
      sm:w-[440px]
    "
  >
    {/* Drawer Header */}
    <div className="flex shrink-0 items-center justify-between border-b border-line bg-[#F8FBFE] px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
          <FilePlus2 className="h-5 w-5" />
        </div>

        <div>
          <h2
            id="report-panel-title"
            className="text-base font-semibold text-ink"
          >
            Generate Report
          </h2>

          <p className="text-xs text-muted">
            Configure your monitoring report
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={isGenerating}
        aria-label="Close report panel"
        className="rounded-lg p-2 text-muted transition-colors hover:bg-sidebar hover:text-brand disabled:opacity-50"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    {/* Scrollable Form Section */}
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">

      {/* Monitoring Station */}
      <div>
        <label
          htmlFor="report-device"
          className="mb-2 block text-sm font-medium text-ink"
        >
          Monitoring Station
          <span className="text-red-500"> *</span>
        </label>

        <div className="relative">
          <select
            id="report-device"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="
              h-11 w-full min-w-0 appearance-none
              rounded-xl border border-line bg-white
              px-4 pr-10 text-sm text-ink
              transition-colors
              hover:border-brand/50
              focus:border-brand focus:outline-none
              focus:ring-2 focus:ring-brand/20
            "
          >
            <option value="">Select Device</option>

            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
        </div>
      </div>

      {/* Report Frequency */}
      <div className="border-t border-line pt-5">
        <p className="mb-3 text-sm font-medium text-ink">
          Report Frequency
          <span className="text-red-500"> *</span>
        </p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {["Daily", "Weekly", "Monthly"].map((item) => (
            <label
              key={item}
              className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink"
            >
              <input
                type="checkbox"
                checked={frequency === item}
                onChange={() =>
                  setFrequency(frequency === item ? "" : item)
                }
                className="h-4 w-4 cursor-pointer accent-[#0369A1]"
              />

              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Data Interval */}
      <div className="border-t border-line pt-5">
        <p className="mb-3 text-sm font-medium text-ink">
          Data Interval
          <span className="text-red-500"> *</span>
        </p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {INTERVAL_OPTIONS.map((item) => (
            <label
              key={item.value}
              className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink"
            >
              <input
                type="checkbox"
                checked={dataInterval === item.value}
                onChange={() =>
                  setDataInterval(
                    dataInterval === item.value ? "" : item.value
                  )
                }
                className="h-4 w-4 cursor-pointer accent-[#0369A1]"
              />

              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="border-t border-line pt-5">
        <p className="mb-3 text-sm font-medium text-ink">
          Date Range
          <span className="text-red-500"> *</span>
        </p>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          fullWidth
        />
      </div>

      {/* Export Format */}
      <div className="border-t border-line pt-5">
        <p className="mb-3 text-sm font-medium text-ink">
          Export Format
          <span className="text-red-500"> *</span>
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {["CSV", "PDF", "TXT"].map((item) => (
            <label
              key={item}
              className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink"
            >
              <input
                type="checkbox"
                checked={exportType === item}
                onChange={() =>
                  setExportType(exportType === item ? "" : item)
                }
                className="h-4 w-4 cursor-pointer accent-[#0369A1]"
              />

              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>

    {/* Validation or API Error */}
    {error && (
      <div
        role="alert"
        className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6"
      >
        {error}
      </div>
    )}

    {/* Drawer Footer */}
    <div className="shrink-0 border-t border-line bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isGenerating}
          className="
            h-11 rounded-xl border border-line
            bg-white px-5 text-sm font-medium text-ink
            transition-colors hover:bg-sidebar
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={generateReport}
          disabled={isGenerating}
          className="
            h-11 rounded-xl bg-brand px-5
            text-sm font-semibold text-white
            transition-colors hover:bg-brand-hover
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {isGenerating ? "Generating..." : "Generate Report"}
        </button>
      </div>
    </div>
  </aside>
);

}
