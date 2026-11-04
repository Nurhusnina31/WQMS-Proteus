import { useState, useEffect, useCallback, useMemo } from "react";
import { ChartNoAxesCombined } from "lucide-react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import Card from "../../components/widgets/Card";
import AnalyticsChart from "../../components/charts/AnalyticsChart";
import AnalyticsControls from "../../components/widgets/AnalyticsControl";
import EmptyState from "../../components/common/EmptyState";
import { getDevices } from "../../services/device.service";
import { getTimeSeriesData } from "../../services/telemetry.service";
import { PARAMETERS } from "../../data/constants";
import { useUnits } from "../../context/UnitContext";

const TIME_AVERAGES = [
  { value: "30m", label: "30 Minute Avg" },
  { value: "1h", label: "1 Hour Avg" },
  { value: "8h", label: "8 Hour Avg" },
  { value: "24h", label: "24 Hour Avg" },
] as const;

type TimeAverage = (typeof TIME_AVERAGES)[number]["value"];

const LOOKBACK_MS: Record<TimeAverage, number> = {
  "30m": 7 * 24 * 60 * 60 * 1000,
  "1h": 7 * 24 * 60 * 60 * 1000,
  "8h": 30 * 24 * 60 * 60 * 1000,
  "24h": 90 * 24 * 60 * 60 * 1000,
};

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { convert, getUnit } = useUnits();

  const [devices, setDevices] = useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [device, setDevice] = useState("");

  const [selectedParams, setSelectedParams] = useState<string[]>(["ph"]);
  const [timeAverage, setTimeAverage] = useState<TimeAverage>("1h");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");

  // undefined = not yet fetched, null = fetched but no timestamp
  const [latestDataTime, setLatestDataTime] = useState<Date | null | undefined>(
    undefined,
  );

  // ─── Derived state ──────────────────────────────────────────────────────────

  const chartTitle = useMemo(() => {
    if (selectedParams.length === 1) {
      const meta = PARAMETERS.find((p) => p.key === selectedParams[0]);
      return meta ? `${meta.label} (${getUnit(meta.key)})` : selectedParams[0];
    }
    return `${selectedParams.length} Parameters Selected`;
  }, [selectedParams, getUnit]);

  const avgLabel = useMemo(
    () => TIME_AVERAGES.find((t) => t.value === timeAverage)?.label ?? "",
    [timeAverage],
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const toggleParam = useCallback((key: string) => {
    setSelectedParams((prev) => {
      if (prev.includes(key))
        return prev.length === 1 ? prev : prev.filter((p) => p !== key);
      return [...prev, key];
    });
  }, []);

  const selectAllParams = useCallback(
    () => setSelectedParams(PARAMETERS.map((p) => p.key)),
    [],
  );
  const deselectAllParams = useCallback(() => setSelectedParams(["ph"]), []);

  // ─── Effects ────────────────────────────────────────────────────────────────

  // Fetch devices once on mount
  useEffect(() => {
    const run = async () => {
      try {
        setDevicesLoading(true);
        const data = await getDevices({ status: "active" });
        setDevices(data.devices);
        if (data.devices.length > 0) setDevice(data.devices[0].id);
      } catch (err) {
        console.error("Failed to fetch devices:", err);
        setChartError("Failed to load devices");
      } finally {
        setDevicesLoading(false);
      }
    };
    run();
  }, []);

  // Fetch latest timestamp whenever device changes
  useEffect(() => {
    if (!device) return;
    setLatestDataTime(undefined); // reset while fetching

    const run = async () => {
      try {
        const { getDeviceStatus } =
          await import("../../services/deviceStatus.service");
        const status = await getDeviceStatus(device);
        setLatestDataTime(
          status.latestTimestamp ? new Date(status.latestTimestamp) : null,
        );
      } catch (err) {
        console.error("Failed to fetch device status:", err);
        setLatestDataTime(null);
      }
    };
    run();
  }, [device]);

  // Fetch chart data — wait until latestDataTime is resolved
  useEffect(() => {
    if (!device || selectedParams.length === 0 || latestDataTime === undefined)
      return;

    const run = async () => {
      try {
        setChartLoading(true);
        setChartError("");

        let startTime: Date;
        let endTime: Date;

        if (startDate && endDate) {
          const now = new Date();
          startTime = new Date(startDate + "T00:00:00.000Z");
          const selectedEnd = new Date(endDate + "T23:59:59.999Z");
          endTime = selectedEnd > now ? now : selectedEnd;
        } else {
          const anchor = latestDataTime ?? new Date();
          endTime = anchor;
          startTime = new Date(anchor.getTime() - LOOKBACK_MS[timeAverage]);
        }

        const data = await getTimeSeriesData({
          deviceId: device,
          startDate: startTime.toISOString(),
          endDate: endTime.toISOString(),
          interval: timeAverage,
          parameters: selectedParams.join(","),
        });

        const transformed = data.timeSeries.map((item: any) => {
          // Per-parameter maintenance map. Always emit every parameter's
          // value — AnalyticsChart renders maintenance points on a
          // separate dashed trace so the line stays continuous while
          // still being visually distinguishable.
          const paramMaint: Record<string, boolean> =
            item.parameter_in_maintenance || {};
          const anySelectedInMaintenance = selectedParams.some(
            (p) => paramMaint[p],
          );

          const point: any = {
            t: new Date(item.bucket).getTime(),
            inMaintenance: anySelectedInMaintenance,
            paramInMaintenance: paramMaint,
          };

          selectedParams.forEach((param) => {
            const key = `${param}_avg`;
            if (item[key] != null) {
              const raw = parseFloat(item[key]);
              point[param] = convert(raw, param) ?? raw;
            }
          });
          return point;
        });

        // Drop trailing empty buckets (O(n), computed once). Maintenance
        // points count as "has data" so the band still renders.
        const lastWithData = transformed.reduce(
          (last: number, point: any, idx: number) => {
            const hasData =
              selectedParams.some((p) => point[p] != null) ||
              point.inMaintenance;
            return hasData ? idx : last;
          },
          0,
        );

        setChartData(transformed.slice(0, lastWithData + 1).reverse());
      } catch (err) {
        console.error("Failed to fetch analytics data:", err);
        setChartError("Failed to load analytics data");
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };
    run();
  }, [
    device,
    selectedParams,
    timeAverage,
    startDate,
    endDate,
    convert,
    latestDataTime,
  ]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
  <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-page text-ink">
      
<style>{`
  .custom-scrollbar::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: #EFF8FF;
    border-radius: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #A9CDE2;
    border-radius: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #0369A1;
  }

  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #A9CDE2 #EFF8FF;
  }

  /* Existing Plotly overflow rules */
  .js-plotly-plot .plotly .main-svg {
    overflow: visible !important;
  }

  .js-plotly-plot .plotly .svg-container {
    overflow: visible !important;
  }

  .js-plotly-plot .plot-container.plotly {
    overflow: visible !important;
  }
`}</style>


      <Sidebar
        active="Analytics"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title="Analytics" onMenuToggle={() => setSidebarOpen(true)} />

        <AnalyticsControls
          devices={devices}
          devicesLoading={devicesLoading}
          device={device}
          onDeviceChange={setDevice}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          timeAverage={timeAverage}
          onTimeAverageChange={setTimeAverage}
          selectedParams={selectedParams}
          onToggleParam={toggleParam}
          onSelectAll={selectAllParams}
          onDeselectAll={deselectAllParams}
          getUnit={getUnit}
        />

        
          {/* Analytics Content */}
          <div className="min-w-0 flex-1 bg-page p-4 sm:p-6">

            {/* Section Heading */}
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                Historical Monitoring
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
                Water Quality Trends
              </h2>

              <p className="mt-1 text-sm text-muted">
                Analytics of historical readings based on selected
                station, parameters and time interval.
              </p>
            </div>

            {/* Analytics Chart Card */}
            <Card
              title={`${chartTitle} | ${avgLabel}`}
              variant="ocean"
              icon={<ChartNoAxesCombined className="h-5 w-5" />}
            >

              {chartLoading ? (
                <div
                  className="flex min-h-[360px] items-center justify-center
                            md:min-h-[480px]"
                >
                  <div className="flex flex-col items-center gap-3">

                    <div
                      className="h-9 w-9 animate-spin rounded-full
                                border-[3px] border-brand/20
                                border-t-brand"
                    />

                    <span className="text-sm font-medium text-brand">
                      Loading analytics data...
                    </span>

                  </div>
                </div>

              ) : chartError ? (

                <div className="flex min-h-[360px] items-center justify-center">
                  <p className="text-sm font-medium text-red-600">
                    {chartError}
                  </p>
                </div>

              ) : chartData.length === 0 ? (

                <div
                  className="flex min-h-[340px] items-center justify-center
                            rounded-xl border border-dashed border-line
                            bg-[#F7FBFE] p-4"
                >
                  <EmptyState
                    variant="ocean"
                    compact
                    icon={<ChartNoAxesCombined className="h-8 w-8" />}
                    title="No Data Available"
                    message="No readings were found for the selected filters. Try changing the date range or parameters."
                  />
                </div>

              ) : (

                <div className="h-[500px] overflow-visible md:h-[650px]">
                  <AnalyticsChart
                    data={chartData}
                    params={selectedParams}
                  />
                </div>

              )}

            </Card>

          </div>

      </div>
    </div>
  );
}
