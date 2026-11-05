import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Power, PowerOff, BellOff } from "lucide-react";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
import { PARAMETERS } from "../../data/constants";
import ThresholdForm from "../../components/alerts/ThresholdForm";
import ConfirmDialog from "../../components/modals/ConfirmDialog";
import * as thresholdService from "../../services/alert-threshold.service";
import type { AlertThreshold } from "../../services/alert-threshold.service";

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
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-orange-50 text-orange-700 border-orange-200",
  emergency: "bg-red-50 text-red-700 border-red-200",
};

export default function ThresholdManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingThreshold, setEditingThreshold] =
    useState<AlertThreshold | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    thresholdId: string;
    thresholdName: string;
  }>({ isOpen: false, thresholdId: "", thresholdName: "" });

  useEffect(() => {
    loadThresholds();
  }, []);

  const loadThresholds = async () => {
    try {
      setIsLoading(true);
      const data = await thresholdService.getThresholds();
      setThresholds(data);
    } catch (error) {
      console.error("Failed to load thresholds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      await thresholdService.toggleThreshold(id, !currentState);
      await loadThresholds();
    } catch (error) {
      console.error("Failed to toggle threshold:", error);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({ isOpen: true, thresholdId: id, thresholdName: name });
  };

  const confirmDelete = async () => {
    const { thresholdId } = deleteDialog;

    try {
      await thresholdService.deleteThreshold(thresholdId);
      setDeleteDialog({ isOpen: false, thresholdId: "", thresholdName: "" });
      await loadThresholds();
    } catch (error) {
      console.error("Failed to delete threshold:", error);
      setDeleteDialog({ isOpen: false, thresholdId: "", thresholdName: "" });
    }
  };

  
return (
  <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-page text-ink">

    {/* Sidebar */}
    <Sidebar
      active="Alert Thresholds"
      isOpen={sidebarOpen}
      onToggle={setSidebarOpen}
    />

    <div className="flex min-w-0 flex-1 flex-col">

      {/* Topbar */}
      <Topbar
        title="Alert Threshold Management"
        onMenuToggle={() => setSidebarOpen(true)}
      />

      {/* Page Content */}
      <main className="min-w-0 flex-1 bg-page p-4 sm:p-6">
        <div className="mx-auto max-w-screen-2xl space-y-6">

          {/* Page Heading */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                Alert Configuration
              </p>

              <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                Threshold Rules
              </h1>

              <p className="mt-1 text-sm text-muted">
                Configure and manage alert conditions for
                water quality monitoring parameters.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingThreshold(null);
                setShowForm(true);
              }}
              className="
                inline-flex h-11 shrink-0 items-center
                justify-center gap-2 rounded-xl
                bg-brand px-5 text-sm font-semibold
                text-white shadow-sm transition-colors
                hover:bg-brand-hover
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-brand
              "
            >
              <Plus className="h-4 w-4" />
              Add Threshold
            </button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-white">
              <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand/20 border-t-brand" />

              <p className="text-sm text-muted">
                Loading thresholds...
              </p>
            </div>

          ) : thresholds.length === 0 ? (

            /* Empty State */
            <section className="flex min-h-[290px] flex-col items-center justify-center rounded-2xl border border-line bg-white px-5 py-10 text-center shadow-sm">

              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-sidebar">
                <BellOff className="h-8 w-8 text-brand" />
              </div>

              <h2 className="mb-2 text-lg font-semibold text-ink">
                No Thresholds Configured
              </h2>

              <p className="max-w-md text-sm leading-relaxed text-muted">
                There are no alert threshold rules yet.
                Create your first rule to monitor parameter
                values against configured limits.
              </p>

              <button
                type="button"
                onClick={() => {
                  setEditingThreshold(null);
                  setShowForm(true);
                }}
                className="
                  mt-5 inline-flex items-center gap-2
                  rounded-xl border border-line
                  bg-sidebar px-4 py-2.5
                  text-sm font-semibold text-brand
                  transition-colors hover:bg-brand-light
                "
              >
                <Plus className="h-4 w-4" />
                Create First Threshold
              </button>
            </section>

          ) : (

            /* Existing Thresholds */
            <section className="space-y-4">

              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-ink">
                  Configured Thresholds
                </h2>

                <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-brand">
                  {thresholds.length} rule
                  {thresholds.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div
                className={`grid gap-5 ${
                  thresholds.length === 1
                    ? "w-full max-w-[580px] grid-cols-1"
                    : "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3"
                }`}
              >

                {thresholds.map((threshold) => (
                  <article
                    key={threshold.id}
                    className="
                      min-w-0 rounded-2xl   
                      border border-line bg-white
                      p-4 shadow-sm
                      transition-all duration-200
                      hover:border-brand/40
                      hover:shadow-md
                      sm:p-5
                    "
                  >

                    {/* Card Header */}
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">

                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-ink">
                          {getParameterLabel(threshold.parameter)}
                        </h3>

                        <p className="mt-1 text-xs text-muted">
                          {threshold.device?.name || "All Devices"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          severityColors[threshold.thresholdType]
                        }`}
                      >
                        {threshold.thresholdType.toUpperCase()}
                      </span>
                    </div>

                    {/* Threshold Value */}
                    <div className="mb-4 rounded-xl border border-line bg-[#F7FBFE] p-4">

                      <p className="text-xs font-medium text-muted">
                        Trigger Condition
                      </p>

                      <p className="mt-2 break-words text-xl font-bold tracking-tight text-ink sm:text-2xl">
                        {threshold.operator} {threshold.value}
                      </p>

                      <p className="mt-2 text-xs text-muted">
                        Cooldown: {threshold.cooldownMinutes} minutes
                      </p>
                    </div>

                    {/* Status */}
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted">
                        Rule Status
                      </span>

                      <span
                        className={`inline-flex items-center gap-2 text-xs font-semibold ${
                          threshold.enabled
                            ? "text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            threshold.enabled
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />

                        {threshold.enabled ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">

                      {/* Enable / Disable */}
                      <button
                        type="button"
                        onClick={() =>
                          handleToggle(
                            threshold.id,
                            threshold.enabled
                          )                         
                        }

                          aria-label={
                            threshold.enabled
                              ? "Disable threshold rule"
                              : "Enable threshold rule"
                          }
                          aria-pressed={threshold.enabled}

                        title={
                          threshold.enabled
                            ? "Disable threshold"
                            : "Enable threshold"
                        }
                        className={`
                          flex h-10 min-w-0 flex-1 items-center
                          justify-center gap-2 rounded-lg
                          px-3 text-xs font-semibold
                          transition-colors
                          ${
                            threshold.enabled
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-sidebar text-brand hover:bg-brand-light"
                          }
                        `}
                      >
                        {threshold.enabled ? (
                          <Power className="h-4 w-4 shrink-0" />
                        ) : (
                          <PowerOff className="h-4 w-4 shrink-0" />
                        )}

                        {threshold.enabled ? "Enabled" : "Disabled"}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingThreshold(threshold);
                          setShowForm(true);
                        }}
                        title="Edit threshold"
                        aria-label={`Edit ${getParameterLabel(threshold.parameter)} threshold`}
                        className="
                          flex h-10 w-10 shrink-0 items-center
                          justify-center rounded-lg
                          border border-line bg-sidebar
                          text-brand transition-colors
                          hover:bg-brand-light
                        "
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            threshold.id,
                            `${getParameterLabel(threshold.parameter)} (${threshold.thresholdType})`
                          )
                        }
                        title="Delete threshold"
                        aria-label={`Delete ${getParameterLabel(threshold.parameter)} threshold`}
                        className="
                          flex h-10 w-10 shrink-0 items-center
                          justify-center rounded-lg
                          border border-red-200 bg-red-50
                          text-red-600 transition-colors
                          hover:bg-red-100
                        "
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Creator Information */}
                    <div className="mt-4 border-t border-line pt-3">
                      <p className="text-xs text-muted">
                        Created by{" "}
                        <span className="font-medium text-ink">
                          {threshold.creator?.fullName || "Unknown"}
                        </span>
                      </p>
                    </div>

                  </article>
                ))}

              </div>
            </section>
          )}

        </div>
      </main>
    </div>

    {/* Threshold Form Drawer */}
    {showForm && (
      <ThresholdForm
        threshold={editingThreshold}
        onClose={() => {
          setShowForm(false);
          setEditingThreshold(null);
        }}
        onSuccess={loadThresholds}
      />
    )}

    {/* Delete Confirmation Dialog */}
    <ConfirmDialog
      isOpen={deleteDialog.isOpen}
      title="Delete Threshold"
      message={`Are you sure you want to delete the threshold "${deleteDialog.thresholdName}"? This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      type="danger"
      onConfirm={confirmDelete}
      onCancel={() =>
        setDeleteDialog({
          isOpen: false,
          thresholdId: "",
          thresholdName: "",
        })
      }
    />
  </div>
);

}
