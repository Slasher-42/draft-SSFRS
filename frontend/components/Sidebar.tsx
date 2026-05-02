"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  PlusCircle,
  FolderOpen,
  AlertCircle,
  ClipboardList,
  User,
  Upload,
  Briefcase,
  MessageSquare,
  CheckSquare,
  CreditCard,
  Receipt,
  Users,
  ClipboardCheck,
  ScrollText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  LogOut,
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
        { label: "Post Project", href: "/dashboard/provider/post-project", icon: <PlusCircle className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Projects", href: "/dashboard/provider/projects", icon: <FolderOpen className="h-5 w-5 flex-shrink-0" /> },
        { label: "File a Claim", href: "/dashboard/provider/file-claim", icon: <AlertCircle className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Claims", href: "/dashboard/provider/claims", icon: <ClipboardList className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Profile", href: "/dashboard/provider/profile", icon: <User className="h-5 w-5 flex-shrink-0" /> },
      ];
    case "WORKER":
      return [
        { label: "Dashboard", href: "/dashboard/worker", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
        { label: "Submit CV", href: "/dashboard/worker/submit-cv", icon: <Upload className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Assignments", href: "/dashboard/worker/assignments", icon: <Briefcase className="h-5 w-5 flex-shrink-0" /> },
        { label: "Claim Responses", href: "/dashboard/worker/claim-responses", icon: <MessageSquare className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Profile", href: "/dashboard/worker/profile", icon: <User className="h-5 w-5 flex-shrink-0" /> },
      ];
    case "EVALUATOR":
      return [
        { label: "Dashboard", href: "/dashboard/evaluator", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
        { label: "Assigned Claims", href: "/dashboard/evaluator/claims", icon: <ClipboardList className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Decisions", href: "/dashboard/evaluator/decisions", icon: <CheckSquare className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Profile", href: "/dashboard/evaluator/profile", icon: <User className="h-5 w-5 flex-shrink-0" /> },
      ];
    case "REFUND_OFFICE":
      return [
        { label: "Dashboard", href: "/dashboard/refund-office", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
        { label: "Refund Orders", href: "/dashboard/refund-office/orders", icon: <CreditCard className="h-5 w-5 flex-shrink-0" /> },
        { label: "Refund Records", href: "/dashboard/refund-office/records", icon: <Receipt className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Profile", href: "/dashboard/refund-office/profile", icon: <User className="h-5 w-5 flex-shrink-0" /> },
      ];
    case "ADMIN":
      return [
        { label: "Dashboard", href: "/dashboard/admin", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
        { label: "User Management", href: "/dashboard/admin/users", icon: <Users className="h-5 w-5 flex-shrink-0" /> },
        { label: "Assign Claims", href: "/dashboard/admin/assign-claims", icon: <ClipboardCheck className="h-5 w-5 flex-shrink-0" /> },
        { label: "All Projects", href: "/dashboard/admin/projects", icon: <FolderOpen className="h-5 w-5 flex-shrink-0" /> },
        { label: "All Claims", href: "/dashboard/admin/claims", icon: <AlertCircle className="h-5 w-5 flex-shrink-0" /> },
        { label: "Refund Records", href: "/dashboard/admin/refunds", icon: <Receipt className="h-5 w-5 flex-shrink-0" /> },
        { label: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: <ScrollText className="h-5 w-5 flex-shrink-0" /> },
        { label: "AI Configuration", href: "/dashboard/admin/ai-config", icon: <SlidersHorizontal className="h-5 w-5 flex-shrink-0" /> },
      ];
    default:
      return [];
  }
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState<{ fullName: string; role: string } | null>(null);

  useEffect(() => {
    const s = authService.getSession();
    if (s) setSession({ fullName: s.fullName, role: s.role });

    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const navItems = getNavItems(session?.role || "");
  const initial = session?.fullName?.charAt(0).toUpperCase() || "U";

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  return (
    <>
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setCollapsed(true)}
        />
      )}

      <motion.aside
        animate={{
          width: collapsed ? 64 : 256,
          x: isMobile && collapsed ? -256 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed md:relative z-40 flex flex-col h-screen overflow-hidden"
        style={{
          backgroundColor: "#1A1A1A",
          borderRight: "1px solid #2A2A2A",
          minWidth: collapsed ? 64 : 256,
        }}
      >
        <div
          className="flex items-center p-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #2A2A2A" }}
        >
          {!collapsed && (
            <span className="flex-1 text-white font-bold text-base tracking-tight">
              SSFRS
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="h-7 w-7 rounded flex items-center justify-center flex-shrink-0"
            style={{ color: "rgba(255,255,255,0.6)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.label}
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
                    style={{
                      backgroundColor: isActive ? "#3D3D3D" : "transparent",
                      color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "#2A2A2A";
                        e.currentTarget.style.color = "#ffffff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                      }
                    }}
                  >
                    <span className={collapsed ? "mx-auto" : "mr-3"}>
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

        <div
          className="flex-shrink-0 p-3"
          style={{ borderTop: "1px solid #2A2A2A" }}
        >
          {collapsed ? (
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[#4A4A4A]">
                <span className="text-white font-bold text-sm">{initial}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[#4A4A4A] flex-shrink-0">
                <span className="text-white font-bold text-sm">{initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.fullName || "User"}
                </p>
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {session?.role || ""}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex-shrink-0"
                style={{ color: "rgba(255,255,255,0.5)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}