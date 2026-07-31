"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Wallet,
  Package,
  ArrowUpCircle,
  Share2,
  Users,
  GitBranch,
  UserCheck,
  LifeBuoy,
  LogOut,
  User,
  X,
  ShieldCheck,
  Award,
  ChevronDown,
  ChevronUp,
  CreditCard,
  UserCircle,
  HelpCircle,
  Gauge,
  Lock,
  Building2
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface NavGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);
    }
    const handleHash = () => setCurrentHash(window.location.hash);
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const navGroups: NavGroup[] = [
    {
      id: "overview",
      title: "OVERVIEW",
      icon: Gauge,
      items: [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }
      ]
    },
    {
      id: "profile",
      title: "PROFILE",
      icon: UserCircle,
      items: [
        { name: "Profile", path: "/dashboard/profile", icon: UserCheck },
        { name: "Bank Details & UPI", path: "/dashboard/profile/bank", icon: Building2 },
        { name: "Update Password", path: "/dashboard/profile/change-password", icon: Lock }
      ]
    },
    {
      id: "activation",
      title: "ACTIVATION",
      icon: Package,
      items: [
        { name: "Packages", path: "/dashboard/deposit", icon: Package }
      ]
    },
    {
      id: "wallet",
      title: "WALLET",
      icon: CreditCard,
      items: [
        { name: "Withdraw Money", path: "/dashboard/withdraw", icon: ArrowUpCircle },
        { name: "Wallet History", path: "/dashboard/wallet", icon: Wallet }
      ]
    },
    {
      id: "team",
      title: "MY TEAM",
      icon: Users,
      items: [
        { name: "Direct Referrals", path: "/dashboard/team/direct", icon: Share2 },
        { name: "Level Downlines", path: "/dashboard/team/level", icon: Users },
        { name: "Genealogy Tree", path: "/dashboard/team/tree", icon: GitBranch }
      ]
    },
    {
      id: "support",
      title: "SUPPORT",
      icon: HelpCircle,
      items: [
        { name: "Support Center", path: "/dashboard/support", icon: LifeBuoy }
      ]
    }
  ];

  // Accordion state - default open all groups or auto-expand active group
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    profile: true,
    activation: true,
    wallet: true,
    team: true,
    support: true
  });

  // Auto-expand group containing active route
  useEffect(() => {
    navGroups.forEach((group) => {
      if (group.items.some((item) => item.path === pathname)) {
        setOpenSections((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-300 w-64 border-r border-transparent font-sans select-none overflow-hidden">
      {/* Header / Brand */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-transparent shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img src="/logo-icon.png" alt="Pocket Money Logo" className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(239,35,60,0.4)]" />
          <span className="font-extrabold text-lg text-white tracking-tight font-manrope">
            Pocket<span className="text-[#ef233c]">Money</span>
          </span>
        </Link>

        {onClose && (
          <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-white p-1">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User Info Card with Badges */}
      <div className="px-4 py-3.5 flex items-center gap-3 bg-zinc-900/50 rounded-2xl mx-3 my-1 shrink-0">
        <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-[#ef233c] shrink-0 border border-[#ef233c]/20">
          <User size={18} />
        </div>
        <div className="overflow-hidden space-y-0.5 min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate font-manrope">{user?.name || "User"}</p>
          <p className="text-[11px] text-zinc-400 font-mono font-semibold truncate">@{user?.username || user?.referralCode || "PM5001"}</p>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded ${
                user?.status === "active"
                  ? "bg-[#ef233c]/10 text-[#ef233c]"
                  : "bg-zinc-900 text-zinc-500"
              }`}
            >
              <Award size={9} className="shrink-0" />
              <span>{user?.status === "active" ? "Active" : "Inactive"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Accordion List */}
      <nav className="flex-1 px-3 py-3 space-y-2 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => {
          const isOpen = !!openSections[group.id];
          const hasActiveChild = group.items.some((item) => item.path === pathname);
          const GroupIcon = group.icon;

          return (
            <div key={group.id} className="space-y-1">
              {/* Category Group Header Bar */}
              <button
                onClick={() => toggleSection(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-0 text-xs font-black uppercase tracking-wider transition-all ${
                  hasActiveChild
                    ? "bg-[#ef233c]/10 text-[#ef233c]"
                    : "bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <GroupIcon size={15} className={hasActiveChild ? "text-[#ef233c]" : "text-zinc-500"} />
                  <span>{group.title}</span>
                </div>
                {isOpen ? (
                  <ChevronUp size={14} className={hasActiveChild ? "text-[#ef233c]" : "text-zinc-500"} />
                ) : (
                  <ChevronDown size={14} className={hasActiveChild ? "text-[#ef233c]" : "text-zinc-500"} />
                )}
              </button>

              {/* Sub-Items Tree */}
              {isOpen && (
                <div className="border-l border-zinc-850/80 ml-3.5 pl-3 py-1 space-y-1 transition-all">
                  {group.items.map((item) => {
                    const isActive = pathname === item.path;
                    const ItemIcon = item.icon;

                    return (
                      <Link
                        key={item.name}
                        href={item.path}
                        onClick={onClose}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? "bg-[#ef233c] text-white shadow-[0_0_20px_rgba(239,35,60,0.45)] font-black"
                            : "text-zinc-300 hover:text-white hover:bg-zinc-900/50"
                        }`}
                      >
                        <ItemIcon size={15} className={isActive ? "text-white" : "text-zinc-400"} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Logout Section */}
        <div className="pt-3 border-t border-transparent mt-3">
          <button
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all"
          >
            <LogOut size={16} className="text-zinc-500" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
