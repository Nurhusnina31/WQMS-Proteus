import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/widgets/Sidebar";
import Topbar from "../../components/widgets/Topbar";
//import Card from "../../components/widgets/Card";
import { notificationPreferencesService } from "../../services/notificationPreferences.service";
import type { NotificationPreferences } from "../../services/notificationPreferences.service";
import { useUnits } from "../../context/UnitContext";
import { UNIT_OPTIONS } from "../../utils/unitConversion";
import { ChevronDown,
  Ruler,
  BellRing,
  RotateCcw,
  Save,
  Send, } from "lucide-react";

// Parameters that have configurable units (water quality params with >1 unit option)
const UNIT_SETTINGS = [
  { key: "temperature", label: "Temperature" },
  { key: "depth",       label: "Water Depth" },
];

export default function SettingsPage() {
  const { units, setUnit, resetUnits } = useUnits();
  //const [view, setView] = useState<"graph" | "table">("graph");

  // Notification preferences state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<
    Partial<NotificationPreferences>
  >({
    notifyInApp: true,
    notifyEmail: false,
    notifyTelegram: false,
    emailAddress: "",
    telegramChatId: "",
  });
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  // Unit save feedback
  const [unitSaveMessage, setUnitSaveMessage] = useState("");

  // Load notification preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await notificationPreferencesService.getPreferences();
        setNotificationPrefs(prefs);
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setPreferencesLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Save notification preferences
  const handleSavePreferences = async () => {
    setSaving(true);
    setSaveMessage("");

    try {
      await notificationPreferencesService.updatePreferences(notificationPrefs);
      setSaveMessage("Preferences saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      setSaveMessage("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  // Test Telegram notification
  const handleTestTelegram = async () => {
    if (!notificationPrefs.telegramChatId) return;

    setTestingTelegram(true);
    setTelegramTestResult(null);

    try {
      const result = await notificationPreferencesService.testTelegram(
        notificationPrefs.telegramChatId,
      );
      setTelegramTestResult(result);
      setTimeout(() => setTelegramTestResult(null), 5000);
    } catch (error: any) {
      setTelegramTestResult({
        success: false,
        error:
          error.response?.data?.error || "Failed to send test notification",
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleUnitChange = (parameter: string, unit: string) => {
    setUnit(parameter, unit);
    setUnitSaveMessage("Units updated and saved automatically");
    setTimeout(() => setUnitSaveMessage(""), 2000);
  };

  const formatOptionLabel = (param: string, option: string): string => {
    if (param === "temperature") {
      if (option === "°C") return "Celsius (°C)";
      if (option === "°F") return "Fahrenheit (°F)";
    }
    if (param === "depth") {
      if (option === "m") return "Meters (m)";
      if (option === "ft") return "Feet (ft)";
    }
    return option;
  };

  
return (
  <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-page text-ink">
    {/* Sidebar */}
    <Sidebar
      active="Settings"
      isOpen={sidebarOpen}
      onToggle={setSidebarOpen}
    />

    <div className="flex min-w-0 flex-1 flex-col">
      {/* Topbar */}
      <Topbar
        title="Settings"
        onMenuToggle={() => setSidebarOpen(true)}
      />

      {/* Main Content */}
      <main className="min-w-0 flex-1 bg-page p-4 sm:p-6">
        <div className="mx-auto max-w-screen-2xl space-y-6">

          {/* Page Heading */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              System Preferences
            </p>

            <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Application Settings
            </h1>

            <p className="mt-1 text-sm text-muted">
              Manage measurement units and notification preferences
              for your water quality monitoring platform.
            </p>
          </div>

          {/* Settings Cards */}
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">

            {/* Measurement Units */}
            <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">

              {/* Card Heading */}
              <div className="flex items-center gap-3 border-b border-line bg-[#F8FBFE] px-4 py-4 sm:px-5">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                  <Ruler className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-ink">
                    Measurement Units
                  </h2>

                  <p className="mt-0.5 text-xs text-muted">
                    Customise how measurements are displayed
                  </p>
                </div>
              </div>

              {/* Unit Settings */}
              <div className="space-y-5 p-4 sm:p-5">

                <p className="text-sm leading-relaxed text-muted">
                  Select your preferred measurement units.
                  Changes are saved automatically.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {UNIT_SETTINGS.map(({ key, label }) => {
                    const options = UNIT_OPTIONS[key] || [];

                    if (options.length <= 1) return null;

                    const currentValue = units[key] || options[0];

                    return (
                      <div key={key} className="min-w-0">

                        <label
                          htmlFor={`settings-unit-${key}`}
                          className="mb-2 block text-sm font-medium text-ink"
                        >
                          {label}
                        </label>

                        <div className="relative">

                          <select
                            id={`settings-unit-${key}`}
                            value={currentValue}
                            onChange={(e) =>
                              handleUnitChange(key, e.target.value)
                            }
                            className="
                              h-11 w-full min-w-0 appearance-none
                              rounded-xl border border-line bg-white
                              px-4 pr-10 text-sm text-ink
                              outline-none transition-colors
                              hover:border-brand/50
                              focus:border-brand
                              focus:ring-2 focus:ring-brand/20
                            "
                          >
                            {options.map((option) => (
                              <option key={option} value={option}>
                                {formatOptionLabel(key, option)}
                              </option>
                            ))}
                          </select>

                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Reset Units */}
                <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">

                  <button
                    type="button"
                    onClick={() => {
                      resetUnits();
                      setUnitSaveMessage("Units reset to defaults");
                      setTimeout(
                        () => setUnitSaveMessage(""),
                        2000
                      );
                    }}
                    className="
                      inline-flex h-10 items-center justify-center
                      gap-2 rounded-xl border border-line
                      bg-sidebar px-4 text-sm font-medium
                      text-brand transition-colors
                      hover:bg-brand-light
                    "
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to Defaults
                  </button>

                  {unitSaveMessage && (
                    <p
                      role="status"
                      className="text-xs font-medium text-emerald-700"
                    >
                      {unitSaveMessage}
                    </p>
                  )}
                </div>

              </div>
            </section>

            {/* Notification Preferences */}
            <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">

              {/* Card Heading */}
              <div className="flex items-center gap-3 border-b border-line bg-[#F8FBFE] px-4 py-4 sm:px-5">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                  <BellRing className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-ink">
                    Notification Preferences
                  </h2>

                  <p className="mt-0.5 text-xs text-muted">
                    Choose how you receive monitoring alerts
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5">

                {preferencesLoading && (
                  <p
                    role="status"
                    className="mb-4 text-sm text-muted"
                  >
                    Loading preferences...
                  </p>
                )}

                {/* In-App Notifications */}
                <div className="flex items-center justify-between gap-4 pb-5">

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink">
                      In-App Notifications
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      Receive notifications within the dashboard.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-label="In-App Notifications"
                    aria-checked={!!notificationPrefs.notifyInApp}
                    disabled={preferencesLoading || saving}
                    onClick={() =>
                      setNotificationPrefs((prev) => ({
                        ...prev,
                        notifyInApp: !prev.notifyInApp,
                      }))
                    }
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 ${
                      notificationPrefs.notifyInApp
                        ? "bg-brand"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        notificationPrefs.notifyInApp
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Email Notifications */}
                <div className="border-t border-line py-5">

                  <div className="flex items-center justify-between gap-4">

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink">
                        Email Notifications
                      </h3>

                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        Receive monitoring alerts through email.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-label="Email Notifications"
                      aria-checked={!!notificationPrefs.notifyEmail}
                      disabled={preferencesLoading || saving}
                      onClick={() =>
                        setNotificationPrefs((prev) => ({
                          ...prev,
                          notifyEmail: !prev.notifyEmail,
                        }))
                      }
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 ${
                        notificationPrefs.notifyEmail
                          ? "bg-brand"
                          : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                          notificationPrefs.notifyEmail
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Email Address */}
                  {notificationPrefs.notifyEmail && (
                    <div className="mt-4">

                      <label
                        htmlFor="notification-email"
                        className="mb-2 block text-xs font-medium text-muted"
                      >
                        Notification Email Address
                      </label>

                      <input
                        id="notification-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter email address"
                        value={notificationPrefs.emailAddress || ""}
                        onChange={(e) =>
                          setNotificationPrefs((prev) => ({
                            ...prev,
                            emailAddress: e.target.value,
                          }))
                        }
                        className="
                          h-11 w-full min-w-0 rounded-xl
                          border border-line bg-white px-4
                          text-sm text-ink outline-none
                          transition-colors hover:border-brand/50
                          focus:border-brand
                          focus:ring-2 focus:ring-brand/20
                        "
                      />
                    </div>
                  )}
                </div>

                {/* Telegram Notifications */}
                <div className="border-t border-line py-5">

                  <div className="flex items-center justify-between gap-4">

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink">
                        Telegram Notifications
                      </h3>

                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        Receive monitoring alerts through Telegram.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-label="Telegram Notifications"
                      aria-checked={!!notificationPrefs.notifyTelegram}
                      disabled={preferencesLoading || saving}
                      onClick={() =>
                        setNotificationPrefs((prev) => ({
                          ...prev,
                          notifyTelegram: !prev.notifyTelegram,
                        }))
                      }
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 ${
                        notificationPrefs.notifyTelegram
                          ? "bg-brand"
                          : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                          notificationPrefs.notifyTelegram
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Telegram Configuration */}
                  {notificationPrefs.notifyTelegram && (
                    <div className="mt-4 space-y-3">

                      <div>
                        <label
                          htmlFor="telegram-chat-id"
                          className="mb-2 block text-xs font-medium text-muted"
                        >
                          Telegram Chat ID
                        </label>

                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row">

                          <input
                            id="telegram-chat-id"
                            type="text"
                            placeholder="Enter Telegram Chat ID"
                            value={notificationPrefs.telegramChatId || ""}
                            onChange={(e) =>
                              setNotificationPrefs((prev) => ({
                                ...prev,
                                telegramChatId: e.target.value,
                              }))
                            }
                            className="
                              h-11 w-full min-w-0 flex-1 rounded-xl
                              border border-line bg-white px-4
                              text-sm text-ink outline-none
                              transition-colors hover:border-brand/50
                              focus:border-brand
                              focus:ring-2 focus:ring-brand/20
                            "
                          />

                          <button
                            type="button"
                            onClick={handleTestTelegram}
                            disabled={
                              !notificationPrefs.telegramChatId ||
                              testingTelegram
                            }
                            className="
                              inline-flex h-11 items-center
                              justify-center gap-2 rounded-xl
                              bg-sidebar px-4 text-sm
                              font-semibold text-brand
                              transition-colors hover:bg-brand-light
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                          >
                            <Send className="h-4 w-4" />

                            {testingTelegram
                              ? "Testing..."
                              : "Send Test"}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed text-muted">
                        Need help? Follow the{" "}
                        <Link
                          to="/telegram-setup"
                          className="font-semibold text-brand hover:underline"
                        >
                          Telegram setup guide
                        </Link>{" "}
                        to find your Chat ID.
                      </p>

                      {/* Test Result */}
                      {telegramTestResult && (
                        <div
                          role="status"
                          className={`rounded-xl border px-4 py-3 text-xs ${
                            telegramTestResult.success
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {telegramTestResult.success
                            ? "Test notification sent successfully!"
                            : `Error: ${telegramTestResult.error}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Save Preferences */}
                <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">

                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    disabled={saving || preferencesLoading}
                    className="
                      inline-flex h-11 items-center
                      justify-center gap-2 rounded-xl
                      bg-brand px-5 text-sm
                      font-semibold text-white
                      transition-colors hover:bg-brand-hover
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <Save className="h-4 w-4" />

                    {saving
                      ? "Saving..."
                      : "Save Preferences"}
                  </button>

                  {saveMessage && (
                    <p
                      role={
                        saveMessage.startsWith("Failed")
                          ? "alert"
                          : "status"
                      }
                      className={`text-xs font-medium ${
                        saveMessage.startsWith("Failed")
                          ? "text-red-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {saveMessage}
                    </p>
                  )}
                </div>

              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  </div>
);

}
