
import { useState } from "react";
import { FilePlus2 } from "lucide-react";

import Sidebar from "../../components/widgets/Sidebar.tsx";
import Topbar from "../../components/widgets/Topbar.tsx";
import ReportPanel from "../../components/widgets/ReportPanel.tsx";
import ReportTable from "../../components/widgets/ReportTable.tsx";

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // Refresh the table after a report is generated
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-page text-ink">

      {/* Sidebar */}
      <Sidebar
        active="Report"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">

        {/* Topbar */}
        <Topbar
          title="Reports"
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Main Page Content */}
        <main className="min-w-0 flex-1 bg-page p-4 sm:p-6">

          {/* Page Heading */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">

              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                Report Management
              </p>

              <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                Water Quality Reports
              </h1>

              <p className="mt-1 text-sm text-muted">
                Generate, view and manage water quality monitoring reports.
              </p>

            </div>

            {/* Generate Report Button */}
            <button
              type="button"
              onClick={() => setShowPanel(true)}
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-xl bg-brand px-5
                text-sm font-semibold text-white
                shadow-sm transition-all duration-200
                hover:bg-brand-hover
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-brand
              "
            >
              <FilePlus2 className="h-4 w-4" />
              Generate Report
            </button>

          </div>

          {/* Existing Reports Table */}
          <div className="min-w-0 rounded-2xl border border-line bg-white shadow-sm">

            <ReportTable refreshKey={refreshKey} />

          </div>

        </main>

        {/* Existing Report Generation Drawer */}
        {showPanel && (
          <>
            {/* Darkened Background */}
            <div
              className="fixed inset-0 z-[1060] bg-[#0F2942]/40"
              onClick={() => setShowPanel(false)}
            />

            {/* Slide-in Report Panel */}
            <div className="relative z-[1070]">
              <ReportPanel
                onClose={() => setShowPanel(false)}
                onReportGenerated={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </>
        )}

      </div>
    </div>
  );
}
