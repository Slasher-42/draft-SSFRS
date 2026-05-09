"use client";

import { useEffect, useState } from "react";
import { Menu, Bell, Sun, Moon } from "lucide-react";
import { authService } from "@/lib/authService";
import { userService } from "@/lib/userService";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [session, setSession] = useState<{
    fullName: string;
    role: string;
    profileImageUrl: string | null;
  } | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [imgError, setImgError] = useState(false);

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
        } catch {
          // ignore — header still shows initials
        }
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
      setSession((prev) => prev ? { ...prev, profileImageUrl: url } : prev);
      setImgError(false);
    };

    window.addEventListener("profileImageUpdated", handleImageUpdate);
    return () => window.removeEventListener("profileImageUpdated", handleImageUpdate);
  }, []);

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
      case "PROVIDER":     return "Project Provider";
      case "WORKER":       return "Worker";
      case "EVALUATOR":    return "Evaluator";
      case "REFUND_OFFICE": return "Refund Office";
      case "ADMIN":        return "Administrator";
      default:             return role;
    }
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

        {/* Avatar — left of bell */}
        <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--color-neutral-200)" }}
        >
          {session?.profileImageUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
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

        <div className="relative">
          <button
            className="h-9 w-9 flex items-center justify-center rounded-lg transition"
            style={{ color: "var(--color-foreground)" }}
          >
            <Bell className="h-5 w-5" />
          </button>
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
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
