"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { api } from "../../services/api";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  Settings as SettingsIcon,
  PackagePlus,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  Loader2,
  ChevronRight,
  TrendingUp,
  Trophy
} from "lucide-react";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerRoiLoading, setHeaderRoiLoading] = useState(false);
  const pathname = usePathname();

  const handleHeaderRoi = async () => {
    setHeaderRoiLoading(true);
    try {
      const res = await api.post("/admin/distribute-roi", {});
      if (res.success) {
        alert(`✅ ${res.message || "Daily ROI distributed successfully."}`);
      }
    } catch (e: any) {
      alert(`❌ Failed: ${e.message || "ROI distribution error"}`);
    } finally {
      setHeaderRoiLoading(false);
    }
  };

  const menuItems = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "User Directory", path: "/dashboard/users", icon: Users },
    { name: "Rank Progression", path: "/dashboard/ranks", icon: Trophy },
    { name: "Deposit Approvals", path: "/dashboard/deposits", icon: ArrowDownCircle },
    { name: "Withdrawals Desk", path: "/dashboard/withdrawals", icon: ArrowUpCircle },
    { name: "MLM Packages", path: "/dashboard/packages", icon: PackagePlus },
    { name: "Support Desk", path: "/dashboard/support", icon: LifeBuoy },
    { name: "System Settings", path: "/dashboard/settings", icon: SettingsIcon }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-sans">
        <Loader2 className="animate-spin text-[#ef233c] relative z-10" size={36} />
      </div>
    );
  }


  if (!admin) return null;

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-zinc-950/95 backdrop-blur-2xl text-zinc-300 w-64 border-r border-zinc-900 font-sans relative z-10">
      {/* Brand */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-zinc-900">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src="/logo-icon.png" alt="Pocket Money Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(239,35,60,0.3)]" />
          <div>
            <span className="font-black text-sm text-white tracking-tight">Pocket<span className="text-[#ef233c]">Money</span></span>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Admin Console</p>
          </div>
        </Link>

        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-zinc-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Admin meta card */}
      <div className="px-4 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ef233c]/20 to-[#ef233c]/5 border border-[#ef233c]/20 flex items-center justify-center font-black text-sm text-[#ef233c]">
            {admin.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black text-white truncate">{admin.name}</p>
            <p className="text-[9px] text-[#ef233c] font-bold uppercase tracking-wider">Super Administrator</p>
          </div>
          <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 px-3 pb-2">Navigation</p>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? "bg-[#ef233c]/10 border border-[#ef233c]/20 text-white shadow-lg shadow-[#ef233c]/5"
                  : "hover:bg-zinc-900 hover:text-white text-zinc-500"
              }`}
            >
              <Icon size={16} className={isActive ? "text-[#ef233c]" : "text-zinc-600 group-hover:text-zinc-400 transition-colors"} />
              <span className="flex-1">{item.name}</span>
              {isActive && <ChevronRight size={12} className="text-[#ef233c]" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer logout */}
      <div className="p-3 border-t border-zinc-900">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 border border-transparent transition-all text-zinc-500"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-black font-sans text-zinc-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-[#ef233c]/12 rounded-full blur-[150px] float-glow-1 pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#ef233c]/8 rounded-full blur-[130px] float-glow-2 pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 w-[700px] h-[700px] bg-[#ef233c]/6 rounded-full blur-[140px] pulse-glow pointer-events-none z-0" />
      <div className="admin-grid-flat" />
      <div className="admin-grid-floor" />

      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0 h-screen sticky top-0 z-20">
        <SidebarContent />
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 flex-grow max-w-xs h-full">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-grow flex flex-col min-w-0 relative z-10">
        {/* Topbar */}
        <header className="h-16 border-b border-zinc-900/80 flex items-center justify-between px-4 sm:px-6 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-zinc-500 hover:text-white transition-colors focus:outline-none"
            >
              <Menu size={22} />
            </button>
            <div>
              <span className="font-black text-sm text-white">Admin Control Panel</span>
              <p className="text-[10px] text-zinc-600 font-semibold hidden sm:block">PocketMoney Financial Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleHeaderRoi}
              disabled={headerRoiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-[#ef233c] to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-[10px] font-black shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {headerRoiLoading ? <Loader2 size={12} className="animate-spin" /> : <TrendingUp size={12} />}
              <span>⚡ Run Daily ROI Now</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-zinc-500 bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              System Online
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-[#ef233c]/10 border border-[#ef233c]/20 rounded-xl px-3 py-1.5">
              <div className="w-5 h-5 rounded-lg bg-[#ef233c]/20 flex items-center justify-center font-black text-[10px] text-[#ef233c]">
                {admin.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-[10px] font-bold text-zinc-300">{admin.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
