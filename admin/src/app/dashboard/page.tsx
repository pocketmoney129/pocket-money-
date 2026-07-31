"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
  Users, ShieldAlert, ArrowDownCircle, ArrowUpCircle,
  TrendingUp, Ticket, Loader2, PlayCircle, CheckCircle,
  XCircle, LayoutDashboard, WrenchIcon, AlertTriangle, Wifi, WifiOff, DollarSign, Calendar
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  approvedDeposits: number;
  pendingDeposits: number;
  approvedWithdrawals: number;
  pendingWithdrawals: number;
  pendingKYC: number;
  pendingTickets: number;
  platformEarnings: number;
  todayEarning: number;
  todayDeposits: number;
  todayWithdrawals: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}

function StatCard({ title, value, icon: Icon, color, sub }: StatCardProps) {
  return (
    <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 flex items-start justify-between hover:border-zinc-800 transition-all group">
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</p>
        <p className="text-2xl font-black text-white">{value}</p>
        {sub && <p className="text-[10px] text-zinc-600 font-semibold">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={18} />
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [roiLoading, setRoiLoading] = useState(false);
  const [roiResult, setRoiResult] = useState<string | null>(null);
  const [roiError, setRoiError] = useState<string | null>(null);

  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("🔧 Our site is currently undergoing scheduled maintenance. We'll be back online very soon. Thank you for your patience!");
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceResult, setMaintenanceResult] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/stats");
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenance = async () => {
    try {
      const res = await api.get("/admin/maintenance/status");
      if (res.success) {
        setMaintenanceEnabled(res.data.enabled);
        if (res.data.message) setMaintenanceMsg(res.data.message);
      }
    } catch { /* silent */ }
  };

  useEffect(() => { fetchStats(); fetchMaintenance(); }, []);

  const handleToggleMaintenance = async () => {
    setMaintenanceLoading(true); setMaintenanceResult(null);
    try {
      const res = await api.post("/admin/maintenance", { enabled: !maintenanceEnabled, message: maintenanceMsg });
      if (res.success) {
        setMaintenanceEnabled(!maintenanceEnabled);
        setMaintenanceResult(res.message);
      }
    } catch (e: any) { setMaintenanceResult("Error: " + e.message); }
    finally { setMaintenanceLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="animate-spin text-[#ef233c]" size={28} />
      </div>
    );
  }

  const handleTriggerRoi = async () => {
    setRoiLoading(true);
    setRoiResult(null);
    setRoiError(null);
    try {
      const res = await api.post("/admin/distribute-roi", {});
      if (res.success) {
        setRoiResult(res.message || `Daily ROI distributed. Credited: ${res.data?.credited || 0}, Skipped: ${res.data?.skipped || 0}`);
        fetchStats();
      }
    } catch (e: any) {
      setRoiError(e.message || "Failed to distribute daily ROI");
    } finally {
      setRoiLoading(false);
    }
  };

  const statCards = [
    { title: "Today's Earning", value: `₹${(stats?.todayEarning || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", sub: "Deposits collected today" },
    { title: "Total Members", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-400 bg-blue-400/10 border-blue-400/20", sub: "All registered accounts" },
    { title: "Active Members", value: stats?.activeUsers || 0, icon: Users, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", sub: "Users with active plans" },
    { title: "Suspended Accounts", value: stats?.suspendedUsers || 0, icon: ShieldAlert, color: "text-rose-400 bg-rose-400/10 border-rose-400/20", sub: "Restricted access" },
    { title: "Approved Deposits", value: `₹${(stats?.approvedDeposits || 0).toLocaleString()}`, icon: ArrowDownCircle, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", sub: "Total funds received" },
    { title: "Approved Withdrawals", value: `₹${(stats?.approvedWithdrawals || 0).toLocaleString()}`, icon: ArrowUpCircle, color: "text-rose-400 bg-rose-400/10 border-rose-400/20", sub: "Total paid out" },
    { title: "Platform Revenue", value: `₹${(stats?.platformEarnings || 0).toLocaleString()}`, icon: TrendingUp, color: "text-[#ef233c] bg-[#ef233c]/10 border-[#ef233c]/20", sub: "Withdrawal processing fees" },
    { title: "Pending KYC", value: stats?.pendingKYC || 0, icon: ShieldAlert, color: "text-amber-400 bg-amber-400/10 border-amber-400/20", sub: "Awaiting verification" },
    { title: "Open Tickets", value: stats?.pendingTickets || 0, icon: Ticket, color: "text-purple-400 bg-purple-400/10 border-purple-400/20", sub: "Support queue size" },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center">
          <LayoutDashboard size={18} className="text-[#ef233c]" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">System Overview</h2>
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Real-time platform metrics</p>
        </div>
        <button
          onClick={fetchStats}
          className="ml-auto text-[10px] font-bold text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-1.5 transition-all"
        >
          Refresh
        </button>
      </div>

      {/* ── Daily ROI Manual Execution Control ───────────────────────── */}
      <div className="bg-zinc-950/80 backdrop-blur-md border border-[#ef233c]/30 rounded-2xl p-6 space-y-3 shadow-xl shadow-[#ef233c]/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                Daily ROI Distribution Engine
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                  AUTO-CRON ACTIVE
                </span>
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Distributes daily plan returns to all active members. Runs automatically on user login & 12:01 AM IST.
              </p>
              {roiResult && (
                <p className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
                  <CheckCircle size={12} /> {roiResult}
                </p>
              )}
              {roiError && (
                <p className="text-xs font-bold text-rose-400 mt-2 flex items-center gap-1.5">
                  <XCircle size={12} /> {roiError}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleTriggerRoi}
            disabled={roiLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-amber-500 via-[#ef233c] to-rose-600 hover:from-amber-600 hover:to-rose-700 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {roiLoading ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
            {roiLoading ? "Processing Daily ROI..." : "⚡ Run Daily ROI Now"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <StatCard key={idx} title={card.title} value={card.value} icon={card.icon} color={card.color} sub={card.sub} />
        ))}
      </div>

      {/* Pending Alerts Row */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Pending Deposits", val: stats?.pendingDeposits || 0, color: "text-amber-400", ring: "border-amber-500/20 bg-amber-500/5" },
          { label: "Pending Withdrawals", val: stats?.pendingWithdrawals || 0, color: "text-rose-400", ring: "border-rose-500/20 bg-rose-500/5" },
          { label: "KYC Verifications", val: stats?.pendingKYC || 0, color: "text-blue-400", ring: "border-blue-500/20 bg-blue-500/5" }
        ].map((item, i) => (
          <div key={i} className={`bg-zinc-950/80 border ${item.ring} rounded-2xl p-5 flex justify-between items-center backdrop-blur-md`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Requires attention</p>
            </div>
            <span className={`text-3xl font-black ${item.color}`}>{item.val}</span>
          </div>
        ))}
      </div>


      {/* ── Maintenance Mode Control ─────────────────────────────────── */}
      <div className={`bg-zinc-950/80 backdrop-blur-md border rounded-2xl p-6 space-y-4 transition-all ${
        maintenanceEnabled ? "border-amber-500/40 shadow-lg shadow-amber-900/20" : "border-zinc-900"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              maintenanceEnabled ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-zinc-500 bg-zinc-900 border-zinc-800"
            }`}>
              <WrenchIcon size={18} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                Site Maintenance Mode
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${
                  maintenanceEnabled
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                }`}>
                  {maintenanceEnabled ? <WifiOff size={9} /> : <Wifi size={9} />}
                  {maintenanceEnabled ? "MAINTENANCE ACTIVE" : "SITE LIVE"}
                </span>
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                {maintenanceEnabled
                  ? "⚠️ Users are currently seeing the maintenance notice. Disable when work is done."
                  : "Enable to put the site into maintenance mode. Users will see a notice but no data is lost."}
              </p>
              {maintenanceResult && (
                <p className={`text-xs font-bold mt-2 flex items-center gap-1.5 ${maintenanceEnabled ? "text-amber-400" : "text-emerald-400"}`}>
                  <CheckCircle size={11} /> {maintenanceResult}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleMaintenance}
            disabled={maintenanceLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap ${
              maintenanceEnabled
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                : "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
            }`}
          >
            {maintenanceLoading ? <Loader2 size={14} className="animate-spin" /> : maintenanceEnabled ? <Wifi size={14} /> : <WifiOff size={14} />}
            {maintenanceEnabled ? "Bring Site Live" : "Enable Maintenance"}
          </button>
        </div>

        {/* Message editor */}
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Maintenance Notice Message (shown to users)</label>
          <textarea
            rows={2}
            value={maintenanceMsg}
            onChange={e => setMaintenanceMsg(e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-800 rounded-xl bg-zinc-900 text-xs text-white focus:border-amber-500/50 focus:outline-none transition-colors placeholder-zinc-600 resize-none"
          />
          <p className="text-[9px] text-zinc-700 mt-1">Changes apply immediately when you toggle maintenance. You can also update the message while maintenance is active.</p>
        </div>
      </div>
    </div>
  );
}

