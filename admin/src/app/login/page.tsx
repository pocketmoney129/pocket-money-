"use client";

import React, { useState } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { Lock, Mail, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError(null);
    try {
      await login(usernameOrEmail, password);
    } catch (err: any) {
      setError(err.message || "Invalid admin credentials");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans overflow-hidden relative">
      {/* Animated orbs */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ef233c]/15 rounded-full blur-[140px] float-glow-1 pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#ef233c]/10 rounded-full blur-[120px] float-glow-2 pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 w-[600px] h-[600px] bg-[#ef233c]/5 rounded-full blur-[130px] pulse-glow pointer-events-none" />

      {/* Grid floor */}
      <div className="admin-grid-flat" />
      <div className="admin-grid-floor" />

      <div className="w-full max-w-sm relative z-10 space-y-8">
        {/* Brand */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ef233c] to-[#d90429] flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-[#ef233c]/40">
              P
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              Pocket<span className="text-[#ef233c]">Money</span>
            </h1>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Admin Control Panel</p>
          </div>
          <div className="flex items-center justify-center gap-2 bg-[#ef233c]/10 border border-[#ef233c]/20 rounded-full px-4 py-1.5 w-fit mx-auto">
            <ShieldCheck size={12} className="text-[#ef233c]" />
            <span className="text-[10px] font-black text-zinc-400">Restricted Access — Authorized Only</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800 rounded-2xl p-7 shadow-2xl shadow-black space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                <input type="text" required value={usernameOrEmail} onChange={e => setUsernameOrEmail(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-9 pr-4 py-3 border border-zinc-800 rounded-xl bg-zinc-900 text-white placeholder-zinc-600 focus:border-[#ef233c]/50 focus:outline-none text-xs transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-3 border border-zinc-800 rounded-xl bg-zinc-900 text-white placeholder-zinc-600 focus:border-[#ef233c]/50 focus:outline-none text-xs transition-colors"
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#ef233c] hover:bg-[#d90429] text-white text-xs font-black transition-all disabled:opacity-50 shadow-lg shadow-[#ef233c]/30 flex items-center justify-center gap-2 mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Authenticate & Enter"}
            </button>
          </form>
        </div>

        <p className="text-center text-[9px] text-zinc-700 font-semibold">
          © 2025 PocketMoney Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
