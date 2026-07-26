"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { Menu, Wallet } from "lucide-react";

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 sm:h-20 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-900 px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-zinc-400 hover:text-white p-1.5 focus:outline-none rounded-lg hover:bg-zinc-900 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className="font-extrabold text-sm sm:text-lg text-white font-manrope tracking-tight">
          Dashboard Shell
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Wallet Balance Display */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-zinc-300 shadow-sm">
          <Wallet size={15} className="text-[#ef233c] shrink-0" />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">Balance:</span>
          <span className="text-xs sm:text-sm font-black text-white font-mono">₹{user?.walletBalance?.toLocaleString() || "0"}</span>
        </div>
      </div>
    </header>
  );
};
