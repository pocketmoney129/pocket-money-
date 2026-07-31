"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { api } from "../../../../services/api";
import { Building2, Loader2 } from "lucide-react";

export default function BankDetailsPage() {
  const { user, syncProfile, updateBankDetails } = useAuth();

  const [holderName, setHolderName] = useState(user?.bankDetails?.holderName || "");
  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || "");
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || "");
  const [ifsc, setIfsc] = useState(user?.bankDetails?.ifsc || "");
  const [upiId, setUpiId] = useState(user?.bankDetails?.upiId || "");
  const [updatingBank, setUpdatingBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);

  useEffect(() => {
    syncProfile();
  }, []);

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
        setBankSuccess("Bank account details & UPI updated successfully.");
        updateBankDetails(res.data);
      }
    } catch (err: any) {
      setBankError(err.message || "Failed to update bank details");
    } finally {
      setUpdatingBank(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-zinc-300 relative w-full">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-manrope">Bank Account Details & UPI</h2>
        <p className="text-xs text-zinc-450 font-semibold mt-1">Configure your payout bank account credentials and UPI ID for withdrawals.</p>
      </div>

      <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl text-white w-full">
        <h3 className="font-extrabold text-lg text-white flex items-center gap-2 border-b border-zinc-900 pb-4 mb-6 font-manrope">
          <Building2 className="text-emerald-450" /> Bank Account Details & UPI
        </h3>

        {bankError && <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs font-semibold">{bankError}</div>}
        {bankSuccess && <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">{bankSuccess}</div>}

        <form onSubmit={handleBankSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
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
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
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
          </div>

          <div className="relative flex py-2 items-center">
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
  );
}
