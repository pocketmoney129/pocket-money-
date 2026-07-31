"use client";

import React, { useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { User } from "lucide-react";

export default function ProfilePage() {
  const { user, syncProfile } = useAuth();

  useEffect(() => {
    syncProfile();
  }, []);

  return (
    <div className="space-y-8 font-sans text-zinc-300 relative w-full">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-manrope">Profile Information</h2>
        <p className="text-xs text-zinc-450 font-semibold mt-1">View your registered member profile and account details.</p>
      </div>

      <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl space-y-6 w-full">
        <h3 className="font-extrabold text-lg text-white flex items-center gap-2 border-b border-zinc-900 pb-4 font-manrope">
          <User className="text-[#ef233c]" /> Account Profile Info
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold text-zinc-350">
          <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-850">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Full Name</span>
            <span className="text-white text-sm font-black mt-1 block">{user?.name}</span>
          </div>
          <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-850">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Username</span>
            <span className="text-[#ef233c] text-sm font-black mt-1 block font-mono">@{user?.username}</span>
          </div>
          <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-850">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Email Address</span>
            <span className="text-white text-sm font-black mt-1 block">{user?.email}</span>
          </div>
          <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-850">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Phone Number</span>
            <span className="text-white text-sm font-black mt-1 block font-mono">{user?.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
