import { useState, useEffect, useMemo } from "react";
import { Plus, Wrench, X, StopCircle, Trash2 } from "lucide-react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import ConfirmDialog from "../../components/modals/ConfirmDialog";
import * as maintenanceService from "../../services/maintenance.service";
import type { MaintenanceLog } from "../../services/maintenance.service";
import { getDevices } from "../../services/device.service";

interface DeviceLite {
  id: string;
  deviceCode: string;
  name: string;
  location: string;
}

const REASONS = [
  "Calibration",
  "Sensor Replacement",
  "Software Update",
  "Routine Inspection",
  "Repair",
  "Other",
];

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const isActive = (log: MaintenanceLog) => {
  const now = Date.now();
  return (
    new Date(log.startTime).getTime() <= now &&
    new Date(log.endTime).getTime() >= now
  );
};

const isUpcoming = (log: MaintenanceLog) =>
  new Date(log.startTime).getTime() > Date.now();

const isPast = (log: MaintenanceLog) =>
  new Date(log.endTime).getTime() < Date.now();

export default function MaintenancePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [devices, setDevices] = useState<DeviceLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formDeviceId, setFormDeviceId] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formReason, setFormReason] = useState(REASONS[0]);
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Confirm dialogs
  const [endDialog, setEndDialog] = useState<{
    open: boolean;
    log: MaintenanceLog | null;
  }>({ open: false, log: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    log: MaintenanceLog | null;
  }>({ open: false, log: null });

  const loadAll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [logsData, devicesResp] = await Promise.all([
        maintenanceService.getAllMaintenance(),
        getDevices({}),
      ]);
      setLogs(logsData);
      setDevices(devicesResp.devices ?? []);
    } catch (err: any) {
      console.error("Failed to load maintenance:", err);
      setError(err?.response?.data?.error ?? "Failed to load maintenance logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const grouped = useMemo(() => {
    return {
      active: logs.filter(isActive),
      upcoming: logs.filter(isUpcoming),
      past: logs.filter(isPast),
    };
  }, [logs]);

  const resetForm = () => {
    setFormDeviceId(devices[0]?.id ?? "");
    setFormStart("");
    setFormEnd("");
    setFormReason(REASONS[0]);
    setFormDescription("");
    setFormError(null);
  };

  const openForm = () => {
    resetForm();
    setShowForm(true);
  };

  const submitForm = async () => {
    setFormError(null);

    if (!formDeviceId) {
      setFormError("Select a device");
      return;
    }
    if (!formStart || !formEnd) {
      setFormError("Both start and end times are required");
      return;
    }
    const startMs = new Date(formStart).getTime();
    const endMs = new Date(formEnd).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      setFormError("Invalid date/time");
      return;
    }
    if (endMs <= startMs) {
      setFormError("End time must be after start time");
      return;
    }

    
    const overlappingWindow = logs.find((log) => {
      if (log.deviceId !== formDeviceId) {
        return false;
      }

      const existingStart = new Date(log.startTime).getTime();
      const existingEnd = new Date(log.endTime).getTime();

      return startMs < existingEnd && endMs > existingStart;
    });

    if (overlappingWindow) {
      setFormError(
        `The selected maintenance period overlaps an existing window
        (${formatDateTime(overlappingWindow.startTime)} –
        ${formatDateTime(overlappingWindow.endTime)}).
        Please choose another time.`
      );
      return;
    }


    try {
      setFormSubmitting(true);
      await maintenanceService.createMaintenance(formDeviceId, {
        startTime: new Date(formStart).toISOString(),
        endTime: new Date(formEnd).toISOString(),
        reason: formReason,
        description: formDescription || undefined,
      });
      setShowForm(false);
      await loadAll();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        err?.message ??
        "Failed to create maintenance window";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmEnd = async () => {
    const log = endDialog.log;
    if (!log) return;
    try {
      await maintenanceService.endMaintenanceEarly(log.id);
      setEndDialog({ open: false, log: null });
      await loadAll();
    } catch (err) {
      console.error("Failed to end maintenance:", err);
      setEndDialog({ open: false, log: null });
    }
  };

  const confirmDelete = async () => {
    const log = deleteDialog.log;
    if (!log) return;
    try {
      await maintenanceService.deleteMaintenance(log.id);
      setDeleteDialog({ open: false, log: null });
      await loadAll();
    } catch (err) {
      console.error("Failed to delete maintenance:", err);
      setDeleteDialog({ open: false, log: null });
    }
  };

  const maintenanceInputClass = `mt-2 h-11 w-full min-w-0 rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none transition-colors
  hover:border-brand/50 focus:border-brand focus:ring-2 focus:ring-brand/20`;

  const renderRow = (log: MaintenanceLog) => {
    const active = isActive(log);
    const upcoming = isUpcoming(log);
    const deviceLabel =
      log.device?.name ||
      log.device?.deviceCode ||
      devices.find((d) => d.id === log.deviceId)?.name ||
      log.deviceId.slice(0, 8);

    
    return (
      <article
        key={log.id}
        className="
          min-w-0 rounded-2xl border border-line
          bg-white p-4 shadow-sm
          transition-all duration-200
          hover:border-brand/40 hover:shadow-md
          sm:p-5
        "
      >
        {/* Card Header */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">

          <div className="min-w-0">
            <h3 className="break-words text-base font-semibold text-ink">
              {deviceLabel}
            </h3>

            {log.device?.location && (
              <p className="mt-1 text-xs text-muted">
                {log.device.location}
              </p>
            )}
          </div>

          {/* Maintenance Status */}
          <span
            className={`
              inline-flex rounded-full border
              px-3 py-1 text-xs font-semibold
              ${
                active
                  ? "border-sky-200 bg-sky-50 text-brand"
                  : upcoming
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-100 text-slate-600"
              }
            `}
          >
            {active ? "ACTIVE" : upcoming ? "UPCOMING" : "PAST"}
          </span>
        </div>

        {/* Maintenance Information */}
        <div className="mb-4 space-y-3 rounded-xl border border-line bg-[#F7FBFE] p-4">

          {/* Start Time */}
          <div>
            <p className="text-xs font-medium text-muted">
              Start Time
            </p>

            <p className="mt-1 break-words text-sm font-medium text-ink">
              {formatDateTime(log.startTime)}
            </p>
          </div>

          {/* End Time */}
          <div>
            <p className="text-xs font-medium text-muted">
              End Time
            </p>

            <p className="mt-1 break-words text-sm font-medium text-ink">
              {formatDateTime(log.endTime)}
            </p>
          </div>

          {/* Reason */}
          {log.reason && (
            <div className="border-t border-line pt-3">
              <p className="text-xs font-medium text-muted">
                Maintenance Reason
              </p>

              <p className="mt-1 text-sm font-medium text-ink">
                {log.reason}
              </p>
            </div>
          )}

          {/* Description */}
          {log.description && (
            <div className="border-t border-line pt-3">
              <p className="text-xs font-medium text-muted">
                Description
              </p>

              <p className="mt-1 break-words text-sm text-ink">
                {log.description}
              </p>
            </div>
          )}
        </div>

        {/* Performed By */}
        {log.performedBy && (
          <p className="mb-4 break-words text-xs text-muted">
            Scheduled by{" "}
            <span className="font-medium text-ink">
              {log.performedBy}
            </span>
          </p>
        )}

        {/* Card Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">

          {/* End Maintenance */}
          {active && (
            <button
              type="button"
              onClick={() =>
                setEndDialog({
                  open: true,
                  log,
                })
              }
              className="
                inline-flex h-10 min-w-0 flex-1
                items-center justify-center gap-2
                rounded-lg border border-amber-200
                bg-amber-50 px-3 text-sm
                font-medium text-amber-700
                transition-colors hover:bg-amber-100
              "
            >
              <StopCircle className="h-4 w-4 shrink-0" />
              End Now
            </button>
          )}

          {/* Delete Maintenance */}
          <button
            type="button"
            onClick={() =>
              setDeleteDialog({
                open: true,
                log,
              })
            }
            aria-label={`Delete maintenance for ${deviceLabel}`}
            className="
              inline-flex h-10 items-center
              justify-center gap-2
              rounded-lg border border-red-200
              bg-red-50 px-3 text-sm
              font-medium text-red-600
              transition-colors hover:bg-red-100
            "
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>

        </div>
      </article>
    );

  };

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-page text-ink">
      <Sidebar
        active="Maintenance"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title="Maintenance Management"
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="min-w-0 flex-1 bg-page p-4 sm:p-6">
          <div className="max-w-screen-2xl mx-auto space-y-6">
            
            {/* Maintenance Page Heading */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Device Maintenance
                </p>

                <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  Maintenance Windows
                </h1>

                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                  Schedule and manage device maintenance periods.
                  Maintenance windows help identify readings excluded
                  from normal analytics, reports and alert evaluation.
                </p>
              </div>

              <button
                type="button"
                onClick={openForm}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors
                  hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand
                "
              >
                <Plus className="h-4 w-4" />
                Schedule Maintenance
              </button>

            </div>


            {error && (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-600">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12 text-slate-500">
                Loading maintenance logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-line bg-white px-5 py-10 text-center shadow-sm">

                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-sidebar">
                  <Wrench className="h-8 w-8 text-brand" />
                </div>

                <h3 className="mb-2 text-lg font-semibold text-ink">
                  No Maintenance Windows
                </h3>

                <p className="max-w-md text-sm leading-relaxed text-muted">
                  No maintenance windows have been scheduled yet.
                  Schedule a maintenance period to identify monitoring
                  data collected during device downtime.
                </p>

                <button
                  type="button"
                  onClick={openForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-line bg-sidebar px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-light"
                >
                  <Plus className="h-4 w-4" />
                  Schedule First Maintenance
                </button>

              </div>
            ) : (
              <div className="space-y-8">
                {grouped.active.length > 0 && (
                  <section>
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand">
                      <span className="h-2 w-2 rounded-full bg-brand" />
                      ACTIVE 
                      <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs">
                        {grouped.active.length}
                      </span>
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3 2xl:gap-5">
                      {grouped.active.map(renderRow)}
                    </div>
                  </section>
                )}

                {grouped.upcoming.length > 0 && (
                  <section>
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand">
                      <span className="h-2 w-2 rounded-full bg-brand" />
                      UPCOMING
                      <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs">
                        {grouped.upcoming.length}
                      </span>
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3 2xl:gap-5">
                      {grouped.upcoming.map(renderRow)}
                    </div>
                  </section>
                )}

                {grouped.past.length > 0 && (
                  <section>
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand">
                      <span className="h-2 w-2 rounded-full bg-brand" />
                      PAST
                      <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs">
                        {grouped.past.length}
                      </span>
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3 2xl:gap-5">
                      {grouped.past.map(renderRow)}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Form modal */}
      {showForm && (
  <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#0F2942]/50 p-3 sm:p-6">

    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-form-title"
      className="
        flex max-h-[calc(100dvh-1.5rem)]
        w-full max-w-lg flex-col overflow-hidden
        rounded-2xl border border-line
        bg-white text-ink shadow-2xl
      "
    >
      {/* Modal Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-[#F8FBFE] px-5 py-4">

        <div className="flex min-w-0 items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Wrench className="h-5 w-5" />
          </div>

          <div>
            <h2
              id="maintenance-form-title"
              className="text-base font-semibold text-ink"
            >
              Schedule Maintenance
            </h2>

            <p className="mt-1 text-xs text-muted">
              Plan a monitoring device maintenance window
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(false)}
          disabled={formSubmitting}
          aria-label="Close maintenance form"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-sidebar hover:text-brand disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Maintenance Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submitForm();
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        {/* Scrollable Form Body */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">

          {/* Device Selector */}
          <div>
            <label
              htmlFor="maintenance-device"
              className="block text-sm font-medium text-ink"
            >
              Monitoring Station
              <span className="text-red-500"> *</span>
            </label>

            <select
              id="maintenance-device"
              value={formDeviceId}
              onChange={(e) => setFormDeviceId(e.target.value)}
              className={maintenanceInputClass}
              required
            >
              <option value="">Select Monitoring Station</option>

              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name || d.deviceCode}
                  {d.location ? ` (${d.location})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label
              htmlFor="maintenance-start"
              className="block text-sm font-medium text-ink"
            >
              Start Time
              <span className="text-red-500"> *</span>
            </label>

            <input
              id="maintenance-start"
              type="datetime-local"
              value={formStart}
              onChange={(e) => setFormStart(e.target.value)}
              className={maintenanceInputClass}
              required
            />
          </div>

          {/* End Time */}
          <div>
            <label
              htmlFor="maintenance-end"
              className="block text-sm font-medium text-ink"
            >
              End Time
              <span className="text-red-500"> *</span>
            </label>

            <input
              id="maintenance-end"
              type="datetime-local"
              value={formEnd}
              onChange={(e) => setFormEnd(e.target.value)}
              className={maintenanceInputClass}
              required
            />

            <p className="mt-2 text-xs text-muted">
              End time must be later than start time.
            </p>
          </div>

          {/* Maintenance Reason */}
          <div>
            <label
              htmlFor="maintenance-reason"
              className="block text-sm font-medium text-ink"
            >
              Maintenance Reason
              <span className="text-red-500"> *</span>
            </label>

            <select
              id="maintenance-reason"
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              className={maintenanceInputClass}
              required
            >
              {REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="maintenance-description"
              className="block text-sm font-medium text-ink"
            >
              Description
              <span className="ml-1 text-xs font-normal text-muted">
                (Optional)
              </span>
            </label>

            <textarea
              id="maintenance-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              placeholder="Add maintenance details or notes..."
              className="mt-2 w-full min-w-0 resize-y rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400
                outline-none transition-colors hover:border-brand/50 focus:border-brand focus:ring-2 focus:ring-brand/20
              "
            />
          </div>

          {/* Error Message */}
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}

        </div>

        {/* Fixed Modal Footer */}
        <div className="shrink-0 border-t border-line bg-white px-5 py-4">

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={formSubmitting}
              className="
                h-11 rounded-xl border border-line
                bg-white px-5 text-sm font-medium text-ink
                transition-colors hover:bg-sidebar
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={formSubmitting}
              className="
                h-11 rounded-xl bg-brand px-5
                text-sm font-semibold text-white
                transition-colors hover:bg-brand-hover
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {formSubmitting
                ? "Saving..."
                : "Schedule Maintenance"}
            </button>

          </div>
        </div>
      </form>
    </section>
  </div>
)}

      <ConfirmDialog
        isOpen={endDialog.open}
        title="End maintenance now?"
        message="This will set the maintenance end time to now. Telemetry collected after this point will be treated as normal data."
        confirmText="End Now"
        onConfirm={confirmEnd}
        onCancel={() => setEndDialog({ open: false, log: null })}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete maintenance log?"
        message="The record will be hidden from all queries but kept for audit. Telemetry from this window will be re-included in analytics and reports."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, log: null })}
      />
    </div>
  );
}
