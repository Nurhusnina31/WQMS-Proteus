import { Bell, LogOut, ChevronDown, Menu } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import NotificationDropdown from "./NotificationDropdown";
import * as notificationService from "../../services/notification.service";
import { logout } from "../../services/auth.service";
import { getStorageItem, STORAGE_KEYS } from "../../utils/storage";

export default function Topbar({
  title = "",
  onMenuToggle,
}: {
  title?: string;
  view?: "graph" | "table";
  setView?: (v: "graph" | "table") => void;
  onMenuToggle?: () => void;
} = {}) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get user info from storage (supports both localStorage and sessionStorage)
  const storedUser = getStorageItem<Record<string, any>>(STORAGE_KEYS.USER);

  const userName = storedUser?.fullName || storedUser?.name || "User";
  const userRole = storedUser?.roleName || storedUser?.userRole?.role?.roleName || storedUser?.role || "Admin";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Fetch real unread count from API on mount
  useEffect(() => {
    notificationService
      .getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUnreadCountChange = (count: number) => {
    setUnreadCount(count);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="relative z-[1000] flex h-16 items-center justify-between border-b border-[#D1E5F2] bg-white px-4 shadow-sm xl:px-6">
    {/* LEFT SECTION - Page Title */}
    <div className="flex min-w-0 items-center gap-3">
        {/* Burger menu button - inline, scrolls with page, visible on mobile only */}
        {onMenuToggle && (
          <button
              type="button"
              aria-label="Open navigation menu"
              onClick={onMenuToggle}
              className="rounded-lg bg-[#0369A1] p-2 text-white shadow-sm transition hover:bg-[#075985] xl:hidden"
            >
              <Menu className="h-5 w-5" />
          </button>
        )}

          <div className="min-w-0">
            <p className="hidden text-[10px] font-semibold uppercase tracking-wider text-[#63839A] sm:block">
              Water Quality Monitoring
            </p>

            <h1 className="truncate text-lg font-semibold tracking-tight text-[#0F2942]">
              {title}
            </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={isNotificationOpen}
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-[#D1E5F2] bg-[#EFF8FF] transition-all duration-200 hover:border-[#7DD3FC] hover:bg-[#D9EEFC] focus-visible:outline-2 focus-visible:outline-[#0369A1]"
          >
            <Bell className="h-5 w-5 origin-top text-[#0369A1] transition-colors group-hover:text-[#075985] group-hover:animate-[bell-ring_0.7s_ease-in-out]" />
              {/* Badge count */}
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

          {/* Notification Dropdown */}
          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            onUnreadCountChange={handleUnreadCountChange}
          />
        </div>

        {/* Vertical Divider */}
          <div
            className="hidden h-7 w-px bg-[#D1E5F2] sm:block"
            aria-hidden="true"
          />

          {/* User Profile */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              aria-label="User account menu"
              aria-expanded={isUserMenuOpen}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 transition-all duration-200 hover:border-[#D1E5F2] hover:bg-[#EFF8FF] focus-visible:outline-2 focus-visible:outline-[#0369A1]"
            >
              {/* Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0369A1] to-[#0C4A6E] text-xs font-bold text-white shadow-sm">
                {userInitials}
              </div>

              {/* Username and Role */}
              <div className="hidden max-w-40 text-left leading-tight sm:block">
                <p className="truncate text-sm font-semibold text-[#0F2942] transition-colors group-hover:text-[#0369A1]">
                  {userName}
                </p>

                <p className="truncate text-[11px] text-[#63839A]">
                  {userRole}
                </p>
              </div>

              <ChevronDown
                className={`hidden h-4 w-4 text-[#63839A] transition-transform duration-200 sm:block ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-[#D1E5F2] bg-white shadow-lg shadow-slate-900/10">

                {/* User Info Header */}
                <div className="border-b border-[#E2EDF5] bg-[#F6FAFD] px-4 py-4">
                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0369A1] to-[#0C4A6E] text-sm font-bold text-white">
                      {userInitials}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0F2942]">
                        {userName}
                      </p>

                      <p className="truncate text-xs text-[#63839A]">
                        {userRole}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <div className="p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors duration-150 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
