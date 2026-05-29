"use client";

import { useState, useEffect } from "react";
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
  Wallet,
  ClipboardCheck,
  RefreshCw,
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
      ];
    case "EVALUATOR":
      return [
        { label: "Dashboard", href: "/dashboard/evaluator", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Profile", href: "/dashboard/evaluator/profile", icon: <User className="h-5 w-5 flex-shrink-0" /> },
        { label: "Submitted Claims", href: "/dashboard/evaluator/claims", icon: <ClipboardCheck className="h-5 w-5 flex-shrink-0" /> },
      ];
    case "REFUND_OFFICE":
      return [
        { label: "Dashboard", href: "/dashboard/refund-office", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
        { label: "My Profile", href: "/dashboard/refund-office/profile", icon: <User className="h-5 w-5 flex-shrink-0" /> },
        { label: "Refund Claims", href: "/dashboard/refund-office/claims", icon: <RefreshCw className="h-5 w-5 flex-shrink-0" /> },
      ];
    case "ADMIN":
      return [
        { label: "Dashboard", href: "/dashboard/admin", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
        { label: "User Management", href: "/dashboard/admin/users", icon: <Users className="h-5 w-5 flex-shrink-0" /> },
        { label: "Projects", href: "/dashboard/admin/projects", icon: <Briefcase className="h-5 w-5 flex-shrink-0" /> },
        { label: "System Alumni", href: "/dashboard/admin/alumni", icon: <Award className="h-5 w-5 flex-shrink-0" /> },
        { label: "Contract Validation", href: "/dashboard/admin/contracts", icon: <ShieldCheck className="h-5 w-5 flex-shrink-0" /> },
        { label: "Messaging", href: "/dashboard/admin/messaging", icon: <MessageSquare className="h-5 w-5 flex-shrink-0" /> },
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
        setSession({
          fullName: s.fullName,
          role: s.role,
          profileImageUrl: s.profileImageUrl ?? null,
        });
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
              const isActive = pathname === item.href || (item.href !== "/dashboard/worker" && item.href !== "/dashboard/provider" && item.href !== "/dashboard/admin" && pathname.startsWith(item.href));
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
              <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-[#4A4A4A]">
                {session?.profileImageUrl && !sidebarImgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.profileImageUrl} alt="" className="h-full w-full object-cover" onError={() => setSidebarImgError(true)} />
                ) : (
                  <span className="text-white font-bold text-sm select-none">{initial}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-[#4A4A4A] flex-shrink-0">
                {session?.profileImageUrl && !sidebarImgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.profileImageUrl} alt="" className="h-full w-full object-cover" onError={() => setSidebarImgError(true)} />
                ) : (
                  <span className="text-white font-bold text-sm select-none">{initial}</span>
                )}
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
