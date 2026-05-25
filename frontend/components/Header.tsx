"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, Sun, Moon, X } from "lucide-react";
import { authService } from "@/lib/authService";
import { userService } from "@/lib/userService";
import {
  notificationService,
  type NotificationItem,
} from "@/lib/notificationService";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();

  const [session, setSession] = useState<{
    fullName: string;
    role: string;
    profileImageUrl: string | null;
  } | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      const s = authService.getSession();
      if (!s) return;

      setSession({
        fullName: s.fullName,
        role: s.role,
        profileImageUrl: s.profileImageUrl ?? null,
      });
      setImgError(false);

      if (!s.profileImageUrl) {
        try {
          const user = await userService.getUser(s.userId);
          if (user.profileImageUrl) {
            authService.updateSessionImage(user.profileImageUrl);
            setSession((prev) =>
              prev ? { ...prev, profileImageUrl: user.profileImageUrl } : prev
            );
          }
        } catch {}
      }
    };
    load();

    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      setDarkMode(true);
    }

    const handleImageUpdate = (e: Event) => {
      const url = (e as CustomEvent<string>).detail ?? null;
      setSession((prev) => (prev ? { ...prev, profileImageUrl: url } : prev));
      setImgError(false);
    };

    window.addEventListener("profileImageUpdated", handleImageUpdate);
    return () => window.removeEventListener("profileImageUpdated", handleImageUpdate);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 15_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openDropdown = async () => {
    setDropdownOpen((prev) => !prev);
    if (!dropdownOpen) {
      setLoadingNotifs(true);
      try {
        const list = await notificationService.getMyNotifications();
        setNotifications(list);
      } catch {}
      finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleNotifClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await notificationService.markRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    const link = notificationService.getLinkForNotification(notif);
    setDropdownOpen(false);
    if (link !== "#") router.push(link);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case "PROVIDER":      return "Project Provider";
      case "WORKER":        return "Worker";
      case "EVALUATOR":     return "Evaluator";
      case "REFUND_OFFICE": return "Refund Office";
      case "ADMIN":         return "Administrator";
      default:              return role;
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return d.toLocaleDateString();
  };

  const initial = session?.fullName?.charAt(0).toUpperCase() || "U";

  return (
    <header
      className="flex items-center justify-between px-4 py-3 md:px-6 flex-shrink-0"
      style={{
        backgroundColor: "var(--color-card)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <button
        className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg transition"
        style={{ color: "var(--color-foreground)" }}
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={toggleDarkMode}
          className="h-9 w-9 flex items-center justify-center rounded-lg transition"
          style={{ color: "var(--color-foreground)" }}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div
          className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--color-neutral-200)" }}
        >
          {session?.profileImageUrl && !imgError ? (
            <img
              src={session.profileImageUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span
              className="text-sm font-bold select-none"
              style={{ color: "var(--color-neutral-600)" }}
            >
              {initial}
            </span>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={openDropdown}
            className="h-9 w-9 flex items-center justify-center rounded-lg transition"
            style={{ color: "var(--color-foreground)" }}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-4 px-[3px] rounded-full
                           flex items-center justify-center text-[10px] font-bold text-white bg-red-500"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-xl shadow-xl z-50 overflow-hidden"
              style={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                top: "100%",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                  Notifications
                </span>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium"
                      style={{ color: "var(--color-primary-600)" }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setDropdownOpen(false)}
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: "360px" }}>
                {loadingNotifs ? (
                  <div className="py-8 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                    Loading…
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className="w-full text-left px-4 py-3 flex flex-col gap-1 transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: notif.read
                          ? "transparent"
                          : "color-mix(in srgb, var(--color-primary-100) 40%, transparent)",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="text-xs font-semibold leading-snug"
                          style={{ color: "var(--color-foreground)" }}
                        >
                          {notif.title}
                          {!notif.read && (
                            <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />
                          )}
                        </span>
                        <span className="text-[10px] flex-shrink-0" style={{ color: "var(--color-muted-foreground)" }}>
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
                        {notif.message}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-foreground)" }}
          >
            {session?.fullName || "User"}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            {session ? formatRole(session.role) : ""}
          </span>
        </div>
      </div>
    </header>
  );
}
