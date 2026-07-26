"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-sans">
        <Loader2 className="animate-spin text-[#ef233c]" size={36} />
      </div>
    );
  }


  if (!user) {
    return null; // Let the AuthContext redirect kick in
  }

  return (
    <div className="min-h-screen flex bg-black text-zinc-350 font-sans relative overflow-hidden">

      {/* Animated Red Glow Orbs — same as landing page */}
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-[#ef233c]/15 rounded-full blur-[150px] float-glow-1 pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#ef233c]/10 rounded-full blur-[130px] float-glow-2 pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 w-[700px] h-[700px] bg-[#ef233c]/8 rounded-full blur-[140px] pulse-glow pointer-events-none z-0" />

      {/* Flat top grid — subtle dot/line pattern on entire screen */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(239,35,60,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(239,35,60,0.06) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }}
      />

      {/* 3D Perspective Grid Floor */}
      <div className="dashboard-grid-floor" />

      {/* Desktop Sidebar (Permanent) */}
      <div className="hidden md:block shrink-0 relative z-10">
        <Sidebar />
      </div>

      {/* Mobile Sidebar (Drawer overlay) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 flex-grow max-w-xs">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
