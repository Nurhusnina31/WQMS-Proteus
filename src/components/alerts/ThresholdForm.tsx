import { useState } from "react";
import { X, ChevronDown, BellRing, Info } from "lucide-react";
import * as thresholdService from "../../services/alert-threshold.service";

interface ThresholdFormProps {
  threshold?: any; // Existing threshold for editing (null for new)
  onClose: () => void;
  onSuccess: () => void;
}

const parameters = [
  { value: "ph",          label: "pH" },
  { value: "do",          label: "Dissolved Oxygen (DO)" },
  { value: "nh3n",        label: "NH₃-N" },
  { value: "cod",         label: "COD" },
  { value: "bod",         label: "BOD" },
  { value: "tss",         label: "TSS" },
  { value: "temperature", label: "Temperature" },
  { value: "depth",       label: "Depth" },
];

const operators = [
  { value: ">", label: "> Greater than" },
  { value: ">=", label: ">= Greater or equal" },
  { value: "<", label: "< Less than" },
  { value: "<=", label: "<= Less or equal" },
  { value: "==", label: "== Equal to" },
];

const severities = [
  { value: "warning", label: "Warning", color: "text-yellow-600" },
  { value: "critical", label: "Critical", color: "text-orange-600" },
  { value: "emergency", label: "Emergency", color: "text-red-600" },
];

export default function ThresholdForm({
  threshold,
  onClose,
  onSuccess,
}: ThresholdFormProps) {
  const [formData, setFormData] = useState({
    parameter: threshold?.parameter || "ph",
    thresholdType: threshold?.thresholdType || "warning",
    operator: threshold?.operator || ">",
    value: threshold?.value?.toString() || "",
    cooldownMinutes: threshold?.cooldownMinutes?.toString() || "60",
    deviceId: threshold?.deviceId || "", // Empty = global (all devices)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.value || parseFloat(formData.value) < 0) {
      setError("Please enter a valid threshold value");
      return;
    }

    if (!formData.cooldownMinutes || parseInt(formData.cooldownMinutes) < 5) {
      setError("Cooldown must be at least 5 minutes");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: any = {
        parameter: formData.parameter,
        thresholdType: formData.thresholdType,
        operator: formData.operator,
        value: parseFloat(formData.value),
        cooldownMinutes: parseInt(formData.cooldownMinutes),
      };

      // Only include deviceId if it's not empty
      if (formData.deviceId) {
        payload.deviceId = formData.deviceId;
      }

      if (threshold) {
        // Update existing
        await thresholdService.updateThreshold(threshold.id, payload);
      } else {
        // Create new
        await thresholdService.createThreshold(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to save threshold",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Parameter, Severity, Operator, Value, Cooldown inputs -dropdown*/
  const inputClass = `h-11 w-full min-w-0 rounded-xl border border-line bg-white px-4 text-sm text-ink
  outline-none transition-colors duration-200 hover:border-brand/50 focus:border-brand focus:ring-2 focus:ring-brand/20
`;

  
  return (
    <>
      {/* Background Overlay */}
      <div
        className="fixed inset-0 z-[1060] bg-[#0F2942]/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Threshold Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="threshold-form-title"
        className="
          fixed inset-y-0 right-0 z-[1070]
          flex h-[100dvh] w-full max-w-full
          flex-col border-l border-line
          bg-white text-ink shadow-2xl
          sm:w-[440px] lg:w-[500px]
        "
      >
        {/* Drawer Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-[#F8FBFE] px-4 py-4 sm:px-6">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
              <BellRing className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2
                id="threshold-form-title"
                className="text-base font-semibold text-ink"
              >
                {threshold
                  ? "Edit Threshold"
                  : "Create New Threshold"}
              </h2>

              <p className="mt-0.5 text-xs text-muted">
                Configure a water quality alert rule
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close threshold form"
            className="
              rounded-lg p-2 text-muted
              transition-colors
              hover:bg-sidebar hover:text-brand
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Scrollable Form Body */}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Parameter */}
            <div>
              <label
                htmlFor="threshold-parameter"
                className="mb-2 block text-sm font-medium text-ink"
              >
                Parameter
                <span className="text-red-500"> *</span>
              </label>

              <div className="relative">
                <select
                  id="threshold-parameter"
                  value={formData.parameter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parameter: e.target.value,
                    })
                  }
                  className={`${inputClass} appearance-none pr-10`}
                  required
                >
                  {parameters.map((param) => (
                    <option
                      key={param.value}
                      value={param.value}
                    >
                      {param.label}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
              </div>
            </div>

            {/* Severity Level */}
            <div className="border-t border-line pt-5">
              <p className="mb-3 text-sm font-medium text-ink">
                Severity Level
                <span className="text-red-500"> *</span>
              </p>

              <div className="grid grid-cols-3 gap-2">
                {severities.map((severity) => {
                  const selected =
                    formData.thresholdType === severity.value;

                  const activeStyle =
                    severity.value === "warning"
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : severity.value === "critical"
                        ? "border-orange-400 bg-orange-50 text-orange-800"
                        : "border-red-400 bg-red-50 text-red-800";

                  return (
                    <button
                      key={severity.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          thresholdType: severity.value,
                        })
                      }
                      className={`
                        min-h-11 rounded-xl border px-2
                        text-xs font-semibold
                        transition-colors duration-200
                        ${
                          selected
                            ? activeStyle
                            : "border-line bg-white text-muted hover:border-brand/40 hover:bg-sidebar"
                        }
                      `}
                    >
                      {severity.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Threshold Condition */}
            <div className="border-t border-line pt-5">
              <label
                htmlFor="threshold-operator"
                className="mb-3 block text-sm font-medium text-ink"
              >
                Threshold Condition
                <span className="text-red-500"> *</span>
              </label>

              <div className="space-y-3">

                {/* Operator */}
                <div className="relative">
                  <select
                    id="threshold-operator"
                    value={formData.operator}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operator: e.target.value,
                      })
                    }
                    className={`${inputClass} appearance-none pr-10`}
                    required
                  >
                    {operators.map((op) => (
                      <option
                        key={op.value}
                        value={op.value}
                      >
                        {op.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
                </div>

                {/* Threshold Value */}
                <input
                  type="number"
                  aria-label="Threshold value"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      value: e.target.value,
                    })
                  }
                  placeholder="Enter threshold value"
                  className={inputClass}
                  required
                />
              </div>

              {/* Condition Description */}
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Alert triggers when the value{" "}
                <span className="font-semibold text-ink">
                  {formData.operator} {formData.value || "___"}
                </span>
              </p>
            </div>

            {/* Cooldown Period */}
            <div className="border-t border-line pt-5">
              <label
                htmlFor="threshold-cooldown"
                className="mb-2 block text-sm font-medium text-ink"
              >
                Cooldown Period (minutes)
                <span className="text-red-500"> *</span>
              </label>

              <input
                id="threshold-cooldown"
                type="number"
                min="5"
                value={formData.cooldownMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cooldownMinutes: e.target.value,
                  })
                }
                className={inputClass}
                required
              />

              <p className="mt-2 text-xs leading-relaxed text-muted">
                Minimum 5 minutes, maximum 24 hours
                (1440 minutes).
              </p>
            </div>

            {/* Scope Information */}
            <div className="rounded-xl border border-line bg-sidebar p-4">

              <div className="flex items-start gap-3">

                <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />

                <div>
                  <p className="text-sm font-semibold text-brand">
                    Threshold Scope
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-[#466982]">
                    {formData.deviceId
                      ? "This threshold applies to a specific monitoring device."
                      : "This threshold applies to all monitoring devices (global threshold)."}
                  </p>
                </div>

              </div>
            </div>

          </div>

          {/* Fixed Drawer Footer */}
          <div className="shrink-0 border-t border-line bg-white px-4 py-4 sm:px-6">

            <div className="flex flex-col-reverse gap-3 sm:flex-row">

              {/* Cancel */}
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="
                  h-11 flex-1 rounded-xl
                  border border-line bg-white
                  px-4 text-sm font-medium text-ink
                  transition-colors
                  hover:bg-sidebar
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              {/* Create / Update */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  h-11 flex-1 rounded-xl
                  bg-brand px-4
                  text-sm font-semibold text-white
                  transition-colors
                  hover:bg-brand-hover
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {isSubmitting
                  ? "Saving..."
                  : threshold
                    ? "Update Threshold"
                    : "Create Threshold"}
              </button>

            </div>
          </div>
        </form>
      </aside>
    </>
  );

}
