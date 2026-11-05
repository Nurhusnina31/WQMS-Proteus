import { useState, useEffect } from "react";
import { CheckCircle, ChevronDown, BellOff } from "lucide-react";
import { PARAMETERS } from "../../data/constants";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import Pagination from "../../components/widgets/Pagination";
import * as alertService from "../../services/alert-history.service";
import type { AlertHistory } from "../../services/alert-history.service";

const parameterLabels: Record<string, string> = {
  so2: "SO₂",
  h2s: "H₂S",
  no2: "NO₂",
  btex: "BTEX",
  temp: "Temperature",
  humidity: "Humidity",
  ws: "Wind Speed",
  wd: "Wind Direction",
  solar: "Solar Radiation",
  rain: "Rain",
};

const getParameterLabel = (key: string) => {
  return (
    PARAMETERS.find((p) => p.key === key)?.label ??
    parameterLabels[key] ??
    key
  );
};

const severityColors = {
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-orange-200 bg-orange-50 text-orange-700",
  emergency: "border-red-200 bg-red-50 text-red-700",
};

/*severity and status dropdown consistent with Analytics Page*/
const filterSelectClass = `
  h-11 w-full min-w-0 appearance-none
  rounded-xl border border-line bg-white
  px-4 pr-10 text-sm font-medium text-ink
  outline-none transition-colors duration-200
  cursor-pointer hover:border-brand/50
  focus:border-brand focus:ring-2 focus:ring-brand/20
`;

export default function AlertHistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [filter, setFilter] = useState({
    thresholdType: "",
    acknowledged: "",
  });

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await alertService.getAlertHistory({
        thresholdType: filter.thresholdType || undefined,
        acknowledged:
          filter.acknowledged === "true"
            ? true
            : filter.acknowledged === "false"
              ? false
              : undefined,
        limit: 100,
      });
      setAlerts(data);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await alertService.acknowledgeAlert(id);
      await loadAlerts();
    } catch (error: any) {
      alert(
        `Failed to acknowledge alert: ${error.response?.data?.message || error.message}`,
      );
    }
  };

  // Pagination
  const totalPages = Math.ceil(alerts.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedAlerts = alerts.slice(startIdx, startIdx + itemsPerPage);

  
return (
  <>
    {/* Ocean Blue Scrollbar */}
    <style>{`
      .alert-table-scroll::-webkit-scrollbar {
        height: 8px;
        width: 8px;
      }

      .alert-table-scroll::-webkit-scrollbar-track {
        background: #EFF8FF;
        border-radius: 6px;
      }

      .alert-table-scroll::-webkit-scrollbar-thumb {
        background: #A9CDE2;
        border-radius: 6px;
      }

      .alert-table-scroll::-webkit-scrollbar-thumb:hover {
        background: #0369A1;
      }

      .alert-table-scroll {
        scrollbar-width: thin;
        scrollbar-color: #A9CDE2 #EFF8FF;
      }
    `}</style>

    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-page text-ink">

      {/* Sidebar */}
      <Sidebar
        active="Alert History"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">

        {/* Topbar */}
        <Topbar
          title="Alert History"
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="min-w-0 flex-1 bg-page p-4 sm:p-6">

          <div className="mx-auto max-w-screen-2xl space-y-6">

            {/* Heading and Filters */}
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

              {/* Page Heading */}
              <div className="min-w-0">

                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Alert Monitoring
                </p>

                <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  Triggered Alert History
                </h1>

                <p className="mt-1 text-sm text-muted">
                  View, filter and acknowledge triggered water
                  quality monitoring alerts.
                </p>

              </div>

              {/* Filters */}
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto">

                {/* Severity Filter */}
                <div className="min-w-0 xl:w-[190px]">

                  <label
                    htmlFor="history-severity"
                    className="mb-2 block text-xs font-semibold text-muted"
                  >
                    Severity
                  </label>

                  <div className="relative">

                    <select
                      id="history-severity"
                      value={filter.thresholdType}
                      onChange={(e) => {
                        setFilter({
                          ...filter,
                          thresholdType: e.target.value,
                        });
                        setCurrentPage(1);
                      }}
                      className={filterSelectClass}
                    >
                      <option value="">All Severities</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                      <option value="emergency">Emergency</option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />

                  </div>
                </div>

                {/* Status Filter */}
                <div className="min-w-0 xl:w-[190px]">

                  <label
                    htmlFor="history-status"
                    className="mb-2 block text-xs font-semibold text-muted"
                  >
                    Acknowledgement Status
                  </label>

                  <div className="relative">

                    <select
                      id="history-status"
                      value={filter.acknowledged}
                      onChange={(e) => {
                        setFilter({
                          ...filter,
                          acknowledged: e.target.value,
                        });
                        setCurrentPage(1);
                      }}
                      className={filterSelectClass}
                    >
                      <option value="">All Status</option>
                      <option value="false">Unacknowledged</option>
                      <option value="true">Acknowledged</option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />

                  </div>
                </div>

              </div>
            </div>

            {/* Alert Statistics */}
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">

              {/* Matching Alerts */}
              <div className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-medium text-muted sm:text-sm">
                  Total Alerts
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-ink sm:text-3xl">
                  {alerts.length}
                </p>
              </div>

              {/* Warning */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                <p className="text-xs font-medium text-amber-700 sm:text-sm">
                  Warning
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-amber-700 sm:text-3xl">
                  {
                    alerts.filter(
                      (a) => a.thresholdType === "warning"
                    ).length
                  }
                </p>
              </div>

              {/* Critical */}
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:p-5">
                <p className="text-xs font-medium text-orange-700 sm:text-sm">
                  Critical
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-orange-700 sm:text-3xl">
                  {
                    alerts.filter(
                      (a) => a.thresholdType === "critical"
                    ).length
                  }
                </p>
              </div>

              {/* Emergency */}
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
                <p className="text-xs font-medium text-red-700 sm:text-sm">
                  Emergency
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-red-700 sm:text-3xl">
                  {
                    alerts.filter(
                      (a) => a.thresholdType === "emergency"
                    ).length
                  }
                </p>
              </div>

            </section>

            {/* Alert Records Container */}
            <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">

              {/* Section Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[#F8FBFE] px-4 py-4 sm:px-5">

                <div>
                  <h2 className="text-base font-semibold text-ink">
                    Alert Records
                  </h2>

                  <p className="mt-1 text-xs text-muted">
                    Recorded alerts for the selected filters
                  </p>
                </div>

                <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-brand">
                  {alerts.length} record
                  {alerts.length !== 1 ? "s" : ""}
                </span>

              </div>

              {/* Loading */}
              {isLoading ? (

                <div className="flex min-h-[220px] flex-col items-center justify-center gap-3">

                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand/20 border-t-brand" />

                  <p className="text-sm text-muted">
                    Loading alert history...
                  </p>

                </div>

              ) : alerts.length === 0 ? (

                /* Empty State */
                <div className="flex min-h-[290px] flex-col items-center justify-center px-5 py-10 text-center">

                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-sidebar">
                    <BellOff className="h-8 w-8 text-brand" />
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-ink">
                    {filter.thresholdType || filter.acknowledged
                      ? "No Matching Alerts"
                      : "No Alert History Yet"}
                  </h3>

                  <p className="max-w-md text-sm leading-relaxed text-muted">
                    {filter.thresholdType || filter.acknowledged
                      ? "No alerts match the selected filters. Try changing the severity or acknowledgement status."
                      : "Triggered alerts will appear here when monitoring readings meet a configured alert condition."}
                  </p>

                </div>

              ) : (

                /* Alert History Table */
                <>
                  <div className="alert-table-scroll w-full overflow-x-auto">

                    <table className="w-full min-w-[1050px] text-left text-sm text-ink">

                      {/* Table Header */}
                      <thead className="border-b border-line bg-sidebar">

                        <tr>
                          {[
                            "Time",
                            "Device",
                            "Parameter",
                            "Value",
                            "Threshold",
                            "Severity",
                            "Status",
                            "Action",
                          ].map((heading) => (
                            <th
                              key={heading}
                              scope="col"
                              className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#466982]"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>

                      </thead>

                      {/* Table Body */}
                      <tbody className="divide-y divide-line">

                        {paginatedAlerts.map((alert) => (

                          <tr
                            key={alert.id}
                            className="bg-white transition-colors even:bg-[#F8FBFD] hover:bg-[#EAF4FB]"
                          >

                            {/* Time */}
                            <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                              {new Date(alert.observedAt).toLocaleString(
                                "en-MY",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "short",
                                  hour12: false,
                                }
                              )}
                            </td>

                            {/* Device */}
                            <td className="whitespace-nowrap px-4 py-3.5 font-medium text-ink">
                              {alert.device.name}
                            </td>

                            {/* Parameter */}
                            <td className="whitespace-nowrap px-4 py-3.5 font-medium text-ink">
                              {getParameterLabel(alert.parameter)}
                            </td>

                            {/* Actual Value */}
                            <td className="whitespace-nowrap px-4 py-3.5 font-semibold tabular-nums text-brand">
                              {Number(alert.actualValue).toFixed(2)}
                            </td>

                            {/* Threshold Condition */}
                            <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                              {alert.threshold.operator}{" "}
                              {Number(alert.thresholdValue).toFixed(2)}
                            </td>

                            {/* Severity */}
                            <td className="whitespace-nowrap px-4 py-3.5">

                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                  severityColors[alert.thresholdType] ??
                                  "border-line bg-sidebar text-ink"
                                }`}
                              >
                                {alert.thresholdType.toUpperCase()}
                              </span>

                            </td>

                            {/* Status */}
                            <td className="whitespace-nowrap px-4 py-3.5">

                              {alert.acknowledged ? (

                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                  <CheckCircle className="h-4 w-4" />
                                  Acknowledged
                                </span>

                              ) : (

                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                                  Pending
                                </span>

                              )}

                            </td>

                            {/* Action */}
                            <td className="whitespace-nowrap px-4 py-3.5">

                              {!alert.acknowledged ? (

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAcknowledge(alert.id)
                                  }
                                  className="inline-flex h-9 items-center justify-center rounded-lg bg-brand px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
                                >
                                  Acknowledge
                                </button>

                              ) : (

                                <span className="text-xs text-muted">
                                  —
                                </span>

                              )}

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="border-t border-line bg-white p-4">

                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        startIndex={startIdx}
                        endIndex={Math.min(
                          startIdx + itemsPerPage,
                          alerts.length
                        )}
                        totalItems={alerts.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                      />

                    </div>
                  )}

                </>
              )}

            </section>

          </div>
        </main>

      </div>
    </div>
  </>
);

}
