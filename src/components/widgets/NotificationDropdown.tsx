import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Bell, BellOff, CheckCheck  } from "lucide-react";
import * as notificationService from "../../services/notification.service";
import NotificationItem from "./NotificationItem";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

type FilterType = "all" | "warning" | "critical" | "emergency" | "approvals";

export default function NotificationDropdown({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Fetch notifications from API
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const alerts = await notificationService.getNotifications(false);
      setNotifications(alerts);

      // Count unread notifications
      const unread = alerts.filter((a) => !a.isRead).length;
      setUnreadCount(unread);
      onUnreadCountChange(unread);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  // Filter notifications by severity or type
  const filteredNotifications =
    activeFilter === "all"
      ? notifications
      : activeFilter === "approvals"
        ? notifications.filter(
            (n) =>
              n.type === "approval_request" || n.type === "approval_decision",
          )
        : notifications.filter(
            (n) => n.severity === activeFilter || n.type === activeFilter,
          );

  // Sort by timestamp (newest first)
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const timeA = new Date(a.createdAt);
    const timeB = new Date(b.createdAt);
    return timeB.getTime() - timeA.getTime();
  });

  const handleNotificationClick = async (notification: any) => {
    try {
      await notificationService.markAsRead(notification.id);
      await loadNotifications(); // Reload to update count
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    // Navigate based on notification type
    if (notification.type === "approval_request") {
      // Admin received approval request → go to Data Approval page
      navigate("/data-approval");
    } else if (notification.type === "approval_decision") {
      // QC user received approval decision → go to Data Validation page
      navigate("/data-validation");
    } else if (notification.alertHistoryId) {
      // Alert notification → go to Alert History page
      navigate("/alert-history");
    }

    onClose();
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Approvals", value: "approvals" },
    { label: "Warning", value: "warning" },
    { label: "Critical", value: "critical" },
    { label: "Emergency", value: "emergency" },
  ];

  if (!isOpen) return null;

  
return (
  <>
    {/* Ocean Blue Notification Scrollbar */}
    <style>{`
      .notification-scroll::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      .notification-scroll::-webkit-scrollbar-track {
        background: #EFF8FF;
        border-radius: 6px;
      }

      .notification-scroll::-webkit-scrollbar-thumb {
        background: #A9CDE2;
        border-radius: 6px;
      }

      .notification-scroll::-webkit-scrollbar-thumb:hover {
        background: #0369A1;
      }

      .notification-scroll {
        scrollbar-width: thin;
        scrollbar-color: #A9CDE2 #EFF8FF;
      }
    `}</style>

    {/* Backdrop */}
    <div
      className="fixed inset-0 z-40 bg-[#0F2942]/20 sm:bg-transparent"
      onClick={onClose}
      aria-hidden="true"
    />

    {/* Notification Dropdown */}
    <div
      role="dialog"
      aria-label="Notifications"
      className="
        fixed inset-x-3 top-20 z-50
        flex w-auto max-h-[calc(100dvh-6rem)]
        min-w-0 flex-col overflow-hidden
        rounded-2xl border border-line
        bg-white text-ink
        shadow-[0_16px_45px_rgba(15,41,66,0.15)]

        sm:absolute sm:inset-x-auto
        sm:right-0 sm:top-full sm:mt-2
        sm:w-[420px]
        sm:max-w-[calc(100vw-2rem)]
        sm:max-h-[560px]
      "
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-[#F8FBFE] px-4 py-4">

        {/* Title and Icon */}
        <div className="flex min-w-0 items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Bell className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-semibold text-ink">
              Notifications
            </h3>

            <p className="mt-0.5 text-xs text-muted">
              {unreadCount} unread notification
              {unreadCount !== 1 ? "s" : ""}
            </p>
          </div>

        </div>

        {/* Header Actions */}
        <div className="flex shrink-0 items-center gap-2">

          {/* Mark All As Read */}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              title="Mark all notifications as read"
              className="
                inline-flex items-center gap-1.5
                rounded-lg px-2 py-2
                text-xs font-medium text-brand
                transition-colors hover:bg-brand-light
              "
            >
              <CheckCheck className="h-4 w-4" />

              <span className="hidden min-[380px]:inline">
                Mark all read
              </span>
            </button>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="
              flex h-8 w-8 shrink-0 items-center
              justify-center rounded-lg
              text-muted transition-colors
              hover:bg-brand-light hover:text-brand
            "
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      </div>

      {/* Notification Filters */}
      <div className="shrink-0 border-b border-line bg-white px-4 py-3">

        <div className="flex flex-wrap items-center gap-2">

          {filters.map((filter) => (

            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              aria-pressed={activeFilter === filter.value}
              className={`
                inline-flex min-h-9 items-center
                justify-center gap-1.5
                rounded-lg px-3 py-2
                text-xs font-medium
                transition-colors duration-200
                ${
                  activeFilter === filter.value
                    ? "bg-brand text-white shadow-sm"
                    : "border border-line bg-white text-muted hover:bg-sidebar hover:text-brand"
                }
              `}
            >
              <span>{filter.label}</span>

              {/* Unread Count for Each Filter */}
              {filter.value !== "all" && (
                <span
                  className={`
                    rounded-full px-1.5 py-0.5
                    text-[10px] font-semibold
                    ${
                      activeFilter === filter.value
                        ? "bg-white/20 text-white"
                        : "bg-sidebar text-brand"
                    }
                  `}
                >
                  {filter.value === "approvals"
                    ? notifications.filter(
                        (n) =>
                          (n.type === "approval_request" ||
                            n.type === "approval_decision") &&
                          !n.isRead,
                      ).length
                    : notifications.filter(
                        (n) =>
                          n.severity === filter.value &&
                          !n.isRead,
                      ).length}
                </span>
              )}

            </button>
          ))}

        </div>
      </div>

      {/* Notifications List */}
      <div className="notification-scroll min-h-0 flex-1 overflow-y-auto bg-white">

        {sortedNotifications.length === 0 ? (

          /* Empty State */
          <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-8 text-center">

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-sidebar">
              <BellOff className="h-8 w-8 text-brand" />
            </div>

            <h4 className="text-sm font-semibold text-ink">
              {activeFilter === "all"
                ? "No Notifications Yet"
                : "No Matching Notifications"}
            </h4>

            <p className="mt-2 max-w-[290px] text-xs leading-relaxed text-muted">
              {activeFilter === "all"
                ? "Your notifications will appear here when new updates or alerts are available."
                : "There are no notifications in this category."}
            </p>

          </div>

        ) : (

          /* Existing Notification Items */
          <div className="divide-y divide-line">

            {sortedNotifications.map((notification, index) => (

              <NotificationItem
                key={notification.id}
                notification={{
                  id: notification.id,
                  type:
                    notification.type ||
                    notification.severity,

                  title: notification.title,
                  message: notification.message,
                  timestamp: notification.createdAt,
                  isRead: notification.isRead,

                  priority:
                    notification.severity === "emergency"
                      ? "high"
                      : notification.severity === "critical"
                        ? "medium"
                        : ("low" as any),

                  actionUrl: notification.alertHistoryId
                    ? "/alert-history"
                    : undefined,
                }}
                onClick={handleNotificationClick}
                isLast={
                  index === sortedNotifications.length - 1
                }
              />

            ))}

          </div>
        )}
      </div>

    </div>
  </>
);

}
