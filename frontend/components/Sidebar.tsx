"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Briefcase,
  FileText,
  ClipboardList,
  AlertCircle,
  Video,
  Clock,
  MessageSquare,
  FileSignature,
  GraduationCap,
  Award,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  ClipboardCheck,
  RefreshCw,
  ScrollText,
  Scale,
  Landmark,
  Globe,
  LayoutDashboard,
} from "lucide-react";
import { authService } from "@/lib/authService";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "PROVIDER":
      return [
        { label: "Dashboard", href: "/dashboard/provider", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Profile", href: "/dashboard/provider/profile", icon: <User className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Projects", href: "/dashboard/provider/projects", icon: <Briefcase className="h-5 w-5 flex-shrink-0" /> },
        { label: "View Alumni", href: "/dashboard/provider/alumni", icon: <GraduationCap className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Claims", href: "/dashboard/provider/claims", icon: <FileText className="h-5 w-5 flex-shrink-0" /> },
        { label: "Messages", href: "/dashboard/provider/messages", icon: <MessageSquare className="h-5 w-5 flex-shrink-0" /> },
        { label: "Contract", href: "/dashboard/provider/contract", icon: <FileSignature className="h-5 w-5 flex-shrink-0" /> },
        { label: "Account", href: "/dashboard/provider/account", icon: <Wallet className="h-5 w-5 flex-shrink-0" /> },
        { label: "Public Home", href: "/", icon: <Globe className="h-5 w-5 flex-shrink-0" /> },
      ];
    case "WORKER":
      return [
        { label: "Dashboard", href: "/dashboard/worker", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Profile", href: "/dashboard/worker/profile", icon: <User className="h-5 w-5 flex-shrink-0" /> },
        { label: "My CV", href: "/dashboard/worker/cv", icon: <ClipboardList className="h-5 w-5 flex-shrink-0" /> },
        { label: "Interview", href: "/dashboard/worker/interview", icon: <Video className="h-5 w-5 flex-shrink-0" /> },
        { label: "Pending Projects", href: "/dashboard/worker/pending-projects", icon: <Clock className="h-5 w-5 flex-shrink-0" /> },
        { label: "Assigned Projects", href: "/dashboard/worker/projects", icon: <Briefcase className="h-5 w-5 flex-shrink-0" /> },
        { label: "Claims Against Me", href: "/dashboard/worker/claims", icon: <AlertCircle className="h-5 w-5 flex-shrink-0" /> },
        { label: "Messages", href: "/dashboard/worker/messages", icon: <MessageSquare className="h-5 w-5 flex-shrink-0" /> },
        { label: "Contract", href: "/dashboard/worker/contract", icon: <FileSignature className="h-5 w-5 flex-shrink-0" /> },
        { label: "Account", href: "/dashboard/worker/account", icon: <Wallet className="h-5 w-5 flex-shrink-0" /> },
        { label: "Public Home", href: "/", icon: <Globe className="h-5 w-5 flex-shrink-0" /> },
      ];
    case "EVALUATOR":
      return [
        { label: "Dashboard", href: "/dashboard/evaluator", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Profile", href: "/dashboard/evaluator/profile", icon: <User className="h-5 w-5 flex-shrink-0" /> },
        { label: "Submitted Claims", href: "/dashboard/evaluator/claims", icon: <ClipboardCheck className="h-5 w-5 flex-shrink-0" /> },
        { label: "Justifications", href: "/dashboard/evaluator/justifications", icon: <Scale className="h-5 w-5 flex-shrink-0" /> },
        { label: "Claim Monitor", href: "/dashboard/evaluator/claim-monitor", icon: <ShieldCheck className="h-5 w-5 flex-shrink-0" /> },
        { label: "Messaging", href: "/dashboard/evaluator/messaging", icon: <MessageSquare className="h-5 w-5 flex-shrink-0" /> },
        { label: "Public Home", href: "/", icon: <Globe className="h-5 w-5 flex-shrink-0" /> },
      ];
    case "REFUND_OFFICE":
      return [
        { label: "Dashboard", href: "/dashboard/refund-office", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Profile", href: "/dashboard/refund-office/profile", icon: <User className="h-5 w-5 flex-shrink-0" /> },
        { label: "Refund Claims", href: "/dashboard/refund-office/claims", icon: <RefreshCw className="h-5 w-5 flex-shrink-0" /> },
        { label: "Refund Action", href: "/dashboard/refund-office/refund-action", icon: <ClipboardCheck className="h-5 w-5 flex-shrink-0" /> },
        { label: "System Account", href: "/dashboard/refund-office/system-account", icon: <Landmark className="h-5 w-5 flex-shrink-0" /> },
        { label: "Messaging", href: "/dashboard/refund-office/messaging", icon: <MessageSquare className="h-5 w-5 flex-shrink-0" /> },
        { label: "Public Home", href: "/", icon: <Globe className="h-5 w-5 flex-shrink-0" /> },
      ];
    case "ADMIN":
      return [
        { label: "Dashboard", href: "/dashboard/admin", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
        { label: "Home Controller", href: "/dashboard/admin/home-controller", icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0" /> },
        { label: "User Management", href: "/dashboard/admin/users", icon: <Users className="h-5 w-5 flex-shrink-0" /> },
        { label: "Projects", href: "/dashboard/admin/projects", icon: <Briefcase className="h-5 w-5 flex-shrink-0" /> },
        { label: "System Alumni", href: "/dashboard/admin/alumni", icon: <Award className="h-5 w-5 flex-shrink-0" /> },
        { label: "Workers Monitor", href: "/dashboard/admin/workers-monitor", icon: <ShieldAlert className="h-5 w-5 flex-shrink-0" /> },
        { label: "Contract Validation", href: "/dashboard/admin/contracts", icon: <ShieldCheck className="h-5 w-5 flex-shrink-0" /> },
        { label: "Audit Log", href: "/dashboard/admin/audit-log", icon: <ScrollText className="h-5 w-5 flex-shrink-0" /> },
        { label: "Messaging", href: "/dashboard/admin/messaging", icon: <MessageSquare className="h-5 w-5 flex-shrink-0" /> },
        { label: "Public Home", href: "/", icon: <Globe className="h-5 w-5 flex-shrink-0" /> },
      ];
    default:
      return [];
  }
}

const ROOT_HREFS = [
  "/",
  "/dashboard/worker",
  "/dashboard/provider",
  "/dashboard/admin",
  "/dashboard/evaluator",
  "/dashboard/refund-office",
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState<{
    fullName: string;
    role: string;
    profileImageUrl: string | null;
  } | null>(null);
  const [sidebarImgError, setSidebarImgError] = useState(false);

  useEffect(() => {
    const load = () => {
      const s = authService.getSession();
      if (s) {
        setSession({ fullName: s.fullName, role: s.role, profileImageUrl: s.profileImageUrl ?? null });
        setSidebarImgError(false);
      }
    };
    load();

    const handleImageUpdate = (e: Event) => {
      const url = (e as CustomEvent<string>).detail ?? null;
      setSession((prev) => prev ? { ...prev, profileImageUrl: url } : prev);
      setSidebarImgError(false);
    };

    window.addEventListener("profileImageUpdated", handleImageUpdate);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("profileImageUpdated", handleImageUpdate);
      window.removeEventListener("resize", check);
    };
  }, []);

  const accentColor = useMemo(() => {
    switch (session?.role) {
      case "PROVIDER":     return "#3B82F6";
      case "WORKER":       return "#8B5CF6";
      case "ADMIN":        return "#F59E0B";
      case "EVALUATOR":    return "#14B8A6";
      case "REFUND_OFFICE":return "#10B981";
      default:             return "#6B7280";
    }
  }, [session?.role]);

  const roleLabel = useMemo(() => {
    switch (session?.role) {
      case "PROVIDER":     return "Project Provider";
      case "WORKER":       return "Worker";
      case "ADMIN":        return "Administrator";
      case "EVALUATOR":    return "Evaluator";
      case "REFUND_OFFICE":return "Refund Office";
      default:             return session?.role || "";
    }
  }, [session?.role]);

  const navItems = getNavItems(session?.role || "");
  const initial = session?.fullName?.charAt(0).toUpperCase() || "U";
  const handleLogout = () => { authService.logout(); router.push("/login"); };

  return (
    <>
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          style={{ backdropFilter: "blur(2px)" }}
          onClick={() => setCollapsed(true)}
        />
      )}

      <motion.aside
        animate={{ width: collapsed ? 64 : 256, x: isMobile && collapsed ? -256 : 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="fixed md:relative z-40 flex flex-col h-screen overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #111827 0%, #0C1220 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          minWidth: collapsed ? 64 : 256,
        }}
      >
        {/* ── Logo ── */}
        <div
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "0.875rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            flexShrink: 0,
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ minWidth: 0 }}
              >
                <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.875rem", lineHeight: 1.2, letterSpacing: "-0.01em" }}>SSFRS</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, lineHeight: 1.2, marginTop: 2 }}>
                  Refund System
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              height: 26,
              width: 26,
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#ffffff";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
            }}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: "1rem 0.5rem 0.5rem" }}>
          {!collapsed && (
            <p
              style={{
                paddingLeft: "0.75rem",
                marginBottom: "0.5rem",
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.2)",
              }}
            >
              Menu
            </p>
          )}
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (!ROOT_HREFS.includes(item.href) && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      borderRadius: 10,
                      padding: "0.5625rem 0.75rem",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      textDecoration: "none",
                      position: "relative",
                      transition: "background-color 0.12s, color 0.12s",
                      backgroundColor: isActive ? "rgba(255,255,255,0.09)" : "transparent",
                      color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                      }
                    }}
                  >
                    {/* Active left indicator */}
                    {isActive && (
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          height: "60%",
                          width: 3,
                          borderRadius: "0 3px 3px 0",
                          backgroundColor: accentColor,
                        }}
                      />
                    )}
                    <span
                      style={{
                        color: isActive ? accentColor : "inherit",
                        marginRight: collapsed ? 0 : "0.75rem",
                        marginLeft: collapsed ? "auto" : 0,
                        marginRight: collapsed ? "auto" : "0.75rem",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {item.icon}
                    </span>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── User ── */}
        <div
          style={{
            flexShrink: 0,
            padding: "0.75rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {collapsed ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1.5px solid ${accentColor}60`,
                  backgroundColor: `${accentColor}20`,
                  flexShrink: 0,
                }}
              >
                {session?.profileImageUrl && !sidebarImgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.profileImageUrl}
                    alt=""
                    style={{ height: "100%", width: "100%", objectFit: "cover" }}
                    onError={() => setSidebarImgError(true)}
                  />
                ) : (
                  <span style={{ color: accentColor, fontWeight: 700, fontSize: 12, userSelect: "none" }}>{initial}</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  height: 24,
                  width: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.25)",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.5rem 0.625rem",
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.04)",
              }}
            >
              <div
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1.5px solid ${accentColor}55`,
                  backgroundColor: `${accentColor}18`,
                  flexShrink: 0,
                }}
              >
                {session?.profileImageUrl && !sidebarImgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.profileImageUrl}
                    alt=""
                    style={{ height: "100%", width: "100%", objectFit: "cover" }}
                    onError={() => setSidebarImgError(true)}
                  />
                ) : (
                  <span style={{ color: accentColor, fontWeight: 700, fontSize: 12, userSelect: "none" }}>{initial}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#ffffff", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session?.fullName || "User"}
                </p>
                <p style={{ fontSize: 10, fontWeight: 500, color: accentColor, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {roleLabel}
                </p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  height: 28,
                  width: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  flexShrink: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.25)",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
