import { Download, Trash2, Eye, FileBarChart } from "lucide-react";
import { useState, useEffect } from "react";
import ConfirmDialog from "../modals/ConfirmDialog";
import api from "../../services/api";

interface Report {
  id: string;
  reportType: string;
  title: string;
  description: string;
  timeFrom: string;
  timeTo: string;
  deviceIds: string[];
  parameters: string[];
  fileFormat: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  status: string;
  createdAt: string;
  creator: {
    fullName: string;
    email: string;
  };
}

interface ReportTableProps {
  /** Bumping this value triggers a refetch — used by the parent page to
   *  refresh the list after a new report is generated. */
  refreshKey?: number;
}

export default function ReportTable({ refreshKey = 0 }: ReportTableProps = {}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    reportId: string;
    reportTitle: string;
  }>({ isOpen: false, reportId: "", reportTitle: "" });
  const [errorDialog, setErrorDialog] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });

  useEffect(() => {
    fetchReports();
  }, [refreshKey]);

  const fetchReports = async () => {
    try {
      const response = await api.get("/reports");
      // API returns { success, data, pagination } since bug #26 fix
      setReports(response.data.data ?? response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    setDownloading(reportId);

    try {
      const report = reports.find((r) => r.id === reportId);
      if (!report) return;

      const response = await api.get(`/reports/${reportId}/download`, {
        responseType: "blob",
      });

      const contentType =
        response.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", report.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      setErrorDialog({
        isOpen: true,
        message: "Failed to download report. Please try again.",
      });
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = async (reportId: string) => {
    setPreviewing(reportId);

    try {
      const report = reports.find((r) => r.id === reportId);
      const response = await api.get(`/reports/${reportId}/download`, {
        responseType: "blob",
      });

      // Determine MIME type from response or file format
      const contentType =
        response.headers["content-type"] ||
        (report?.fileFormat === "PDF"
          ? "application/pdf"
          : report?.fileFormat === "CSV"
            ? "text/csv"
            : "text/plain");
      const blob = new Blob([response.data], { type: contentType });
      const previewUrl = window.URL.createObjectURL(blob);
      window.open(previewUrl, "_blank");
    } catch (error) {
      console.error("Preview error:", error);
      setErrorDialog({
        isOpen: true,
        message: "Failed to preview report. Please try again.",
      });
    } finally {
      setPreviewing(null);
    }
  };

  const handleDelete = async (reportId: string, reportTitle: string) => {
    // Show confirmation dialog
    setDeleteDialog({ isOpen: true, reportId, reportTitle });
  };

  const confirmDelete = async () => {
    const { reportId } = deleteDialog;

    try {
      await api.delete(`/reports/${reportId}`);

      // Remove from local state
      setReports(reports.filter((r) => r.id !== reportId));
      setDeleteDialog({ isOpen: false, reportId: "", reportTitle: "" });
    } catch (error) {
      console.error("Delete error:", error);
      setErrorDialog({
        isOpen: true,
        message: "Failed to delete report. Please try again.",
      });
      setDeleteDialog({ isOpen: false, reportId: "", reportTitle: "" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateRange = (from: string, to: string) => {
    const fromDate = formatDate(from);
    const toDate = formatDate(to);
    return fromDate === toDate ? fromDate : `${fromDate} - ${toDate}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      
    {/* Reports Table */}
    <div className="min-w-0 bg-white">

      {/* Table Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[#F8FBFE] px-4 py-4 sm:px-5">

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand">
            <FileBarChart className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-ink">
              Existing Reports
            </h2>

            <p className="text-xs text-muted">
              View, download and manage generated reports
            </p>
          </div>
        </div>

        <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-brand">
          {loading
            ? "Loading..."
            : `${reports.length} report${reports.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand/20 border-t-brand" />

          <p className="text-sm text-muted">
            Loading reports...
          </p>
        </div>

      ) : reports.length === 0 ? (

        /* Empty State */
        <div className="flex min-h-[260px] flex-col items-center justify-center px-4 py-10 text-center">

          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-sidebar">
            <FileBarChart className="h-8 w-8 text-brand" />
          </div>

          <h3 className="mb-2 text-lg font-semibold text-ink">
            No Reports Generated
          </h3>

          <p className="max-w-sm text-sm leading-relaxed text-muted">
            You haven't generated any reports yet.
            Click "Generate Report" above to create your first
            water quality monitoring report.
          </p>
        </div>

      ) : (

        /* Responsive Table */
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-sm text-ink">

            <thead className="border-b border-line bg-sidebar">
              <tr>
                <th className="px-4 py-3.5 font-semibold">
                  Title
                </th>

                <th className="px-4 py-3.5 font-semibold">
                  Frequency
                </th>

                <th className="px-4 py-3.5 font-semibold">
                  File Type
                </th>

                <th className="px-4 py-3.5 font-semibold">
                  Period
                </th>

                <th className="px-4 py-3.5 font-semibold">
                  Generated
                </th>

                <th className="px-4 py-3.5 font-semibold">
                  Size
                </th>

                <th className="px-4 py-3.5 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="bg-white transition-colors even:bg-[#F8FBFD] hover:bg-[#EAF4FB]"
                >
                  {/* Report Title */}
                  <td className="px-4 py-3.5 font-medium text-ink">
                    <div
                      className="max-w-[260px] truncate"
                      title={report.title}
                    >
                      {report.title}
                    </div>
                  </td>

                  {/* Frequency */}
                  <td className="px-4 py-3.5">
                    <span className="capitalize text-ink">
                      {report.reportType}
                    </span>
                  </td>

                  {/* File Format */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${
                        report.fileFormat === "PDF"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : report.fileFormat === "CSV"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-sky-200 bg-sky-50 text-sky-700"
                      }`}
                    >
                      {report.fileFormat || "PDF"}
                    </span>
                  </td>

                  {/* Reporting Period */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                    {formatDateRange(report.timeFrom, report.timeTo)}
                  </td>

                  {/* Generated Date */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                    {formatDate(report.createdAt)}
                  </td>

                  {/* File Size */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                    {formatFileSize(report.fileSize)}
                  </td>

                  {/* Report Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">

                      {/* Preview */}
                      <button
                        type="button"
                        onClick={() => handlePreview(report.id)}
                        disabled={previewing === report.id}
                        title="Preview report"
                        aria-label={`Preview ${report.title}`}
                        className="
                          flex h-9 w-9 shrink-0 items-center justify-center
                          rounded-lg border border-line
                          bg-sidebar text-brand
                          transition-colors hover:bg-brand-light
                          disabled:cursor-not-allowed disabled:opacity-50
                        "
                      >
                        <Eye size={16} />
                      </button>

                      {/* Download */}
                      <button
                        type="button"
                        onClick={() => handleDownload(report.id)}
                        disabled={downloading === report.id}
                        title="Download report"
                        aria-label={`Download ${report.title}`}
                        className="
                          flex h-9 w-9 shrink-0 items-center justify-center
                          rounded-lg bg-brand text-white
                          transition-colors hover:bg-brand-hover
                          disabled:cursor-not-allowed disabled:opacity-50
                        "
                      >
                        <Download size={16} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(report.id, report.title)
                        }
                        title="Delete report"
                        aria-label={`Delete ${report.title}`}
                        className="
                          flex h-9 w-9 shrink-0 items-center justify-center
                          rounded-lg border border-red-200
                          bg-red-50 text-red-600
                          transition-colors hover:bg-red-100
                        "
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>


      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Report"
        message={`Are you sure you want to delete "${deleteDialog.reportTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteDialog({ isOpen: false, reportId: "", reportTitle: "" })
        }
      />

      {/* Error Dialog */}
      <ConfirmDialog
        isOpen={errorDialog.isOpen}
        title="Error"
        message={errorDialog.message}
        confirmText="OK"
        type="warning"
        onConfirm={() => setErrorDialog({ isOpen: false, message: "" })}
      />
    </>
  );
}
