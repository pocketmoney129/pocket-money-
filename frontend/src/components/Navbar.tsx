"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Menu, Wallet, Bell, Sparkles } from "lucide-react";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  type?: string;
  createdAt: string;
}

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const res = await api.get("/user/notifications");
      if (res.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = async () => {
    const nextState = !showDropdown;
    setShowDropdown(nextState);
    if (nextState && unreadCount > 0) {
      try {
        await api.post("/user/notifications/mark-read", {});
        setUnreadCount(0);
      } catch {
        /* silent */
      }
    }
  };

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

        {/* Real-time Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="relative p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all focus:outline-none"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ef233c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-950 animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-zinc-950 border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
              <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#ef233c]" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Notifications</h4>
                </div>
                <span className="text-[10px] font-bold text-zinc-500">{notifications.length} recent</span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-900">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-zinc-600 text-xs font-semibold">
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-4 transition-colors ${!n.read ? "bg-[#ef233c]/5" : "hover:bg-zinc-900/30"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-xs font-bold text-white leading-tight">{n.title}</h5>
                        <span className="text-[9px] text-zinc-500 font-mono shrink-0">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
