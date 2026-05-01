
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/authService";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace("/login");
    } else {
      const { role } = authService.getSession();
      router.replace(authService.getDashboardRoute(role || ""));
    }
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
        Redirecting…
      </div>
    </div>
  );
}