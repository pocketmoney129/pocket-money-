"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { 
  User, 
  Building2, 
  Loader2, 
  Lock,
  KeyRound
} from "lucide-react";

export default function ProfilePage() {
  const { user, syncProfile, updateBankDetails } = useAuth();
  
  // Bank details form states
  const [holderName, setHolderName] = useState(user?.bankDetails?.holderName || "");
  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || "");
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || "");
  const [ifsc, setIfsc] = useState(user?.bankDetails?.ifsc || "");
  const [upiId, setUpiId] = useState(user?.bankDetails?.upiId || "");
  const [updatingBank, setUpdatingBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);

  // Change Password form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Sync profile details on load
  useEffect(() => {
    syncProfile();
  }, []);

  // Update bank forms when user context loads
  useEffect(() => {
    if (user?.bankDetails) {
      setHolderName(user.bankDetails.holderName || "");
      setAccountNumber(user.bankDetails.accountNumber || "");
      setBankName(user.bankDetails.bankName || "");
      setIfsc(user.bankDetails.ifsc || "");
      setUpiId(user.bankDetails.upiId || "");
    }
  }, [user]);

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingBank(true);
    setBankError(null);
    setBankSuccess(null);

    try {
      const res = await api.put("/user/bank-details", {
        holderName,
        accountNumber,
        bankName,
        ifsc,
        upiId
      });

      if (res.success) {
        setBankSuccess("Bank credentials updated successfully.");
        updateBankDetails(res.data);
      }
    } catch (err: any) {
      setBankError(err.message || "Failed to update bank details");
    } finally {
      setUpdatingBank(false);
    }
  };

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
        setPasswordSuccess("Password changed successfully! Your new password is now active.");
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
    <div className="space-y-8 font-sans text-zinc-300 relative">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-manrope">Profile Settings</h2>
        <p className="text-xs text-zinc-450 font-semibold mt-1">Manage your account details, payout destination, and password security.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Column 1: Account Profile Info & Bank Account Details */}
        <div className="space-y-8">
          {/* Card 1: Account Profile Info */}
          <div id="profile-info" className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl space-y-6">
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2 border-b border-zinc-900 pb-4 font-manrope">
              <User className="text-[#ef233c]" /> Account Profile Info
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 text-xs font-semibold text-zinc-350">
              <div className="bg-zinc-900/80 p-3.5 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Full Name</span>
                <span className="text-white text-sm font-black mt-1 block">{user?.name}</span>
              </div>
              <div className="bg-zinc-900/80 p-3.5 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Username</span>
                <span className="text-[#ef233c] text-sm font-black mt-1 block font-mono">@{user?.username}</span>
              </div>
              <div className="bg-zinc-900/80 p-3.5 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Email Address</span>
                <span className="text-white text-sm font-black mt-1 block">{user?.email}</span>
              </div>
              <div className="bg-zinc-900/80 p-3.5 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Phone Number</span>
                <span className="text-white text-sm font-black mt-1 block font-mono">{user?.phone}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Bank Account Details & UPI */}
          <div id="bank-details" className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl text-white">
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2 border-b border-zinc-900 pb-4 mb-6 font-manrope">
              <Building2 className="text-emerald-450" /> Bank Account Details & UPI
            </h3>

            {bankError && <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs font-semibold">{bankError}</div>}
            {bankSuccess && <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">{bankSuccess}</div>}

            <form onSubmit={handleBankSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Account Holder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm transition-all"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm font-semibold tracking-wider font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Bank Account Number</label>
                <input
                  type="text"
                  placeholder="Enter Bank Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm font-semibold font-mono transition-all"
                />
              </div>

              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-zinc-900" />
                <span className="flex-shrink mx-4 text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono">Or UPI Option</span>
                <div className="flex-grow border-t border-zinc-900" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">UPI ID</label>
                <input
                  type="text"
                  placeholder="e.g. name@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm font-semibold text-emerald-400 font-mono transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={updatingBank}
                className="w-full py-3.5 bg-[#ef233c] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatingBank ? <Loader2 className="animate-spin" size={16} /> : "Update Details"}
              </button>
            </form>
          </div>
        </div>

        {/* Column 2: Update Password */}
        <div>
          {/* Card 3: Update Password */}
          <div id="change-password" className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl text-white space-y-6">
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

      </div>
    </div>
  );
}
