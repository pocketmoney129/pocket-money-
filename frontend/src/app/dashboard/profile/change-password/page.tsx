"use client";

import React, { useState } from "react";
import { api } from "../../../../services/api";
import { KeyRound, Lock, Loader2 } from "lucide-react";

export default function UpdatePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setUpdatingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const res = await api.put("/user/change-password", {
        currentPassword,
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setPasswordSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-zinc-300 relative max-w-xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-manrope">Update Password</h2>
        <p className="text-xs text-zinc-450 font-semibold mt-1">Change your account security password.</p>
      </div>

      <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl text-white space-y-6">
        <h3 className="font-extrabold text-lg text-white flex items-center gap-2 border-b border-zinc-900 pb-4 font-manrope">
          <KeyRound className="text-[#ef233c]" /> Update Password
        </h3>

        {passwordError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">{passwordError}</div>}
        {passwordSuccess && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">{passwordSuccess}</div>}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Current Password <span className="text-[#ef233c]">*</span></label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">New Password <span className="text-[#ef233c]">*</span></label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Confirm Password <span className="text-[#ef233c]">*</span></label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updatingPassword}
            className="w-full py-3.5 bg-[#ef233c] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {updatingPassword ? <Loader2 className="animate-spin" size={16} /> : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
