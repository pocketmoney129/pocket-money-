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
  Gauge
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

interface NavGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  items: {
    name: string;
    path: string;
    icon: React.ElementType;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
        { name: "Profile & KYC", path: "/dashboard/profile", icon: UserCheck }
      ]
    },
    {
      id: "activation",
      title: "ACTIVATION",
      icon: Package,
      items: [
        { name: "Packages & Activate", path: "/dashboard/deposit", icon: Package }
      ]
    },
    {
      id: "wallet",
      title: "BUY FUND & WALLET",
      icon: CreditCard,
      items: [
        { name: "Wallet History", path: "/dashboard/wallet", icon: Wallet },
        { name: "Withdraw Money", path: "/dashboard/withdraw", icon: ArrowUpCircle }
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

  // Accordion state - default open all groups or open group of active page
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
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-300 w-64 border-r border-zinc-900 font-sans select-none overflow-hidden">
      {/* Header / Brand */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-zinc-900 shrink-0">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-[#ef233c] flex items-center justify-center text-zinc-950 font-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.35)] shrink-0">
            P
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight font-manrope">
            Pocket<span className="text-amber-400">Money</span>
          </span>
        </Link>

        {onClose && (
          <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-white p-1">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User Info Card with Badges */}
      <div className="px-4 py-3.5 border-b border-zinc-900 flex items-center gap-3 bg-zinc-900/40 shrink-0">
        <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
          <User size={18} />
        </div>
        <div className="overflow-hidden space-y-0.5 min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate font-manrope">{user?.name || "User"}</p>
          <p className="text-[11px] text-zinc-400 font-mono font-semibold truncate">@{user?.username || user?.referralCode || "PM5001"}</p>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded ${
                user?.kyc?.status === "approved"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              }`}
            >
              <ShieldCheck size={9} className="shrink-0" />
              <span>{user?.kyc?.status === "approved" ? "KYC Approved" : "KYC Pending"}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded ${
                user?.status === "active"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "bg-zinc-900 text-zinc-500 border border-zinc-800"
              }`}
            >
              <Award size={9} className="shrink-0" />
              <span>{user?.status === "active" ? "Active" : "Inactive"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Accordion List */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => {
          const isOpen = !!openSections[group.id];
          const hasActiveChild = group.items.some((item) => item.path === pathname);
          const GroupIcon = group.icon;

          return (
            <div key={group.id} className="space-y-1">
              {/* Category Group Header Bar */}
              <button
                onClick={() => toggleSection(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                  hasActiveChild
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "bg-zinc-900/80 border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <GroupIcon size={15} className={hasActiveChild ? "text-amber-400" : "text-amber-500/90"} />
                  <span>{group.title}</span>
                </div>
                {isOpen ? (
                  <ChevronUp size={14} className={hasActiveChild ? "text-amber-400" : "text-zinc-500"} />
                ) : (
                  <ChevronDown size={14} className={hasActiveChild ? "text-amber-400" : "text-zinc-500"} />
                )}
              </button>

              {/* Sub-Items Tree */}
              {isOpen && (
                <div className="border-l-2 border-zinc-800/80 ml-3.5 pl-3 py-1 space-y-1 transition-all">
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
                            ? "bg-gradient-to-r from-amber-500 via-amber-400 to-[#ef233c] text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] font-black"
                            : "text-zinc-300 hover:text-white hover:bg-zinc-900/60"
                        }`}
                      >
                        <ItemIcon size={15} className={isActive ? "text-zinc-950" : "text-zinc-400"} />
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
        <div className="pt-3 border-t border-zinc-900 mt-3">
          <button
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-all"
          >
            <LogOut size={16} className="text-zinc-500" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
