"use client";

import React, { useEffect, useState } from "react";
import { Wrench, ShieldCheck, Clock, RefreshCw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function MaintenanceBanner() {
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const checkMaintenance = async () => {
    try {
      setChecking(true);
      const res = await fetch(`${API_URL}/admin/maintenance/status?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setMaintenance(data.data);
      }
    } catch {
      /* silent error handler */
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkMaintenance();
    // Check every 10 seconds so when admin turns off maintenance, site opens immediately
    const interval = setInterval(checkMaintenance, 10_000);
    return () => clearInterval(interval);
  }, []);

  if (!maintenance?.enabled) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center p-4 overflow-hidden font-sans text-white">
      {/* Background Red Noir glow circles */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ef233c]/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#ef233c]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(239,35,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(239,35,60,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Main Glassmorphic Popup Card */}
      <div className="relative z-10 w-full max-w-lg bg-zinc-950/90 border border-red-500/30 rounded-3xl p-8 sm:p-10 text-center backdrop-blur-2xl shadow-2xl shadow-red-950/40 space-y-6">
        
        {/* Animated Icon Header */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-2xl bg-[#ef233c]/20 blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-[#ef233c]/40 flex items-center justify-center text-[#ef233c] shadow-inner">
            <Wrench size={38} className="animate-bounce" />
          </div>
        </div>

        {/* Title & Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest">
            <Clock size={12} className="animate-spin" /> Scheduled Maintenance In Progress
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            System Under Upgrade
          </h2>
        </div>

        {/* Primary Message */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-zinc-300 leading-relaxed">
            {maintenance.message || "Don't worry! We are currently performing essential platform maintenance and system updates to optimize performance and security."}
          </p>
        </div>

        {/* Reassurance points */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400">Funds & Plans</p>
              <p className="text-[11px] font-bold text-zinc-200">100% Safe & Active</p>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 flex items-start gap-2.5">
            <Clock size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400">Daily Return</p>
              <p className="text-[11px] font-bold text-zinc-200">Processing Continuously</p>
            </div>
          </div>
        </div>

        {/* Footer Notice & Manual Refresh */}
        <div className="pt-2 border-t border-zinc-900 flex flex-col items-center gap-3">
          <p className="text-[11px] text-zinc-500 font-semibold">
            Thank you for your patience! We will be back live shortly.
          </p>
          <button
            onClick={checkMaintenance}
            disabled={checking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={checking ? "animate-spin text-[#ef233c]" : ""} />
            Check Live Status
          </button>
        </div>

      </div>
    </div>
  );
}
