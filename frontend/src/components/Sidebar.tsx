"use client";

import React from "react";
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
  X
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "Wallet History", path: "/dashboard/wallet", icon: Wallet },
    { name: "Packages", path: "/dashboard/deposit", icon: Package },
    { name: "Withdraw Money", path: "/dashboard/withdraw", icon: ArrowUpCircle },
    { name: "Refer & Earn", path: "/dashboard/team/direct", icon: Share2 },
    { name: "Level Downlines", path: "/dashboard/team/level", icon: Users },
    { name: "Genealogy Tree", path: "/dashboard/team/tree", icon: GitBranch },
    { name: "Profile & KYC", path: "/dashboard/profile", icon: UserCheck },
    { name: "Support Center", path: "/dashboard/support", icon: LifeBuoy }
  ];

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-slate-350 w-64 border-r border-zinc-900">
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-zinc-900">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#ef233c]/15 border border-[#ef233c]/20 flex items-center justify-center text-white font-black text-sm shadow-[0_0_12px_rgba(239,35,60,0.15)]">
            P
          </div>
          <span className="font-extrabold text-base text-white tracking-tight font-manrope">
            Pocket<span className="text-[#ef233c]">Money</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-white p-1">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="px-6 py-5 border-b border-zinc-900 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-300">
          <User size={18} />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-white truncate font-manrope">{user?.name}</p>
          <p className="text-xs text-zinc-400 font-mono font-semibold truncate">@{user?.username || user?.referralCode}</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#ef233c] text-white shadow-lg shadow-red-500/10"
                  : "hover:bg-zinc-900/60 hover:text-white text-zinc-300"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-zinc-400"} />
              {item.name}
            </Link>
          );
        })}

        {/* Logout Button directly below Support Center */}
        <div className="pt-2 border-t border-zinc-900/80 mt-2">
          <button
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-rose-950/25 hover:text-rose-400 transition-all text-zinc-400"
          >
            <LogOut size={18} className="text-zinc-400" />
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
};
