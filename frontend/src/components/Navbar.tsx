"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { Menu, Wallet, Shield } from "lucide-react";

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-900 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-zinc-400 hover:text-white p-2 focus:outline-none"
        >
          <Menu size={24} />
        </button>
        <span className="font-extrabold text-lg text-white hidden sm:inline-block font-manrope">
          Dashboard Shell
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Wallet Balance Display */}
        <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-850 rounded-xl px-4 py-2 text-zinc-300">
          <Wallet size={16} className="text-[#ef233c]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-550">Balance:</span>
          <span className="text-sm font-black text-white font-mono">₹{user?.walletBalance?.toLocaleString() || "0"}</span>
        </div>

        {/* Account Status Badge */}
        <div className="flex items-center">
          {user?.status === "active" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.06)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Node
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-450 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-550" /> Inactive Node
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
