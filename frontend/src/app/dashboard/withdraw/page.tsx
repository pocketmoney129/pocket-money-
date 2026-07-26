"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { 
  ArrowUpCircle, 
  Wallet, 
  HelpCircle, 
  Loader2, 
  UserCheck, 
  AlertCircle
} from "lucide-react";

interface SystemSettings {
  minWithdraw: number;
  maxWithdraw: number;
  withdrawalFeePercent: number;
}

interface WithdrawItem {
  _id: string;
  amount: number;
  charge: number;
  netAmount: number;
  bankDetails: {
    holderName: string;
    accountNumber?: string;
    bankName?: string;
    upiId?: string;
  };
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  createdAt: string;
}

export default function WithdrawPage() {
  const { user, syncProfile } = useAuth();
  const [sysSettings, setSysSettings] = useState<SystemSettings | null>(null);
  const [history, setHistory] = useState<WithdrawItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, historyRes] = await Promise.all([
        api.get("/user/payment-settings"), 
        api.get("/transactions/withdrawals")
      ]);
      
      if (settingsRes.success) {
        setSysSettings({
          minWithdraw: 200, 
          maxWithdraw: 50000,
          withdrawalFeePercent: 5
        });
      }
      if (historyRes.success) setHistory(historyRes.data);
    } catch (err) {
      console.error("Error loading withdrawal stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const numAmount = parseFloat(amount) || 0;
  const chargePercent = sysSettings?.withdrawalFeePercent || 5;
  const computedCharge = parseFloat(((chargePercent * numAmount) / 100).toFixed(2));
  const computedNet = parseFloat((numAmount - computedCharge).toFixed(2));

  // Check if bank details are set
  const bd = user?.bankDetails;
  const hasBankDetails = bd && bd.holderName && ((bd.accountNumber && bd.bankName && bd.ifsc) || bd.upiId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      setError("Please specify the withdrawal amount");
      return;
    }

    if (user?.status !== "active") {
      setError("Only active accounts can request withdrawals");
      return;
    }

    if (user?.kyc?.status !== "approved") {
      setError("KYC verification must be approved before withdrawing funds.");
      return;
    }

    if (!hasBankDetails) {
      setError("Please save bank details or UPI ID in your Profile first.");
      return;
    }

    if (numAmount < (sysSettings?.minWithdraw || 200) || numAmount > (sysSettings?.maxWithdraw || 50000)) {
      setError(`Amount must be between ₹${(sysSettings?.minWithdraw || 200).toLocaleString()} and ₹${(sysSettings?.maxWithdraw || 50000).toLocaleString()}`);
      return;
    }

    if ((user?.walletBalance || 0) < numAmount) {
      setError("Insufficient wallet balance.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post("/transactions/withdraw", { amount: numAmount });
      if (res.success) {
        setSuccess("Withdrawal request submitted successfully. Wallet balance updated.");
        setAmount("");
        await syncProfile();
        fetchData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit withdrawal request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    const styles = {
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      approved: "bg-emerald-500/10 text-emerald-450 border-emerald-500/20",
      rejected: "bg-rose-500/10 text-rose-455 border-rose-500/20"
    };
    return styles[status as keyof typeof styles] || "bg-zinc-900 border-zinc-850 text-zinc-400";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 font-sans">
        <Loader2 className="animate-spin text-[#ef233c]" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-zinc-300 relative">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-manrope">Request Payout (Withdrawal)</h2>
        <p className="text-xs text-zinc-450 font-semibold mt-1">Submit a withdrawal request. Funds will be sent directly to your saved bank account.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

          
          {/* Form Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl text-white">
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2 border-b border-zinc-900 pb-4 mb-6 font-manrope">
                <ArrowUpCircle className="text-[#ef233c]" /> New Payout Request
              </h3>

              {/* Guard alerts */}
              {user?.status !== "active" && (
                <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-850 text-xs font-semibold text-zinc-400">
                  ⚠️ Your node is Inactive. You must purchase an activation package on the dashboard before payouts are unlocked.
                </div>
              )}

              {user?.kyc?.status !== "approved" && (
                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
                  ⚠️ KYC is not approved (Current: {user?.kyc?.status || "None"}). Please submit your identity proof under <strong>Profile & KYC</strong> and wait for admin approval.
                </div>
              )}

              {!hasBankDetails && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 flex justify-between items-center">
                  <span>⚠️ No Bank Transfer/UPI details found on your profile.</span>
                  <Link href="/dashboard/profile" className="underline text-[#ef233c] font-bold hover:text-red-400">Configure now</Link>
                </div>
              )}

              {error && <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">{error}</div>}
              {success && <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">{success}</div>}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Withdrawal Amount (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 500"
                      disabled={user?.status !== "active" || user?.kyc?.status !== "approved" || !hasBankDetails}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#ef233c] text-sm transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Calculations Preview */}
                  <div className="bg-zinc-900/80 rounded-2xl p-4 flex flex-col justify-center space-y-2">
                    <div className="flex justify-between text-xs text-zinc-400 font-semibold">
                      <span>Withdrawal Fee ({chargePercent}%):</span>
                      <span>₹{computedCharge.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-white border-t border-zinc-800/80 pt-2">
                      <span>Net Payout Amount:</span>
                      <span className="text-emerald-400">₹{numAmount > 0 ? computedNet.toLocaleString() : "0"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Receiving Destination details</label>
                  {hasBankDetails ? (
                    <div className="bg-zinc-900/80 rounded-2xl p-4 text-xs text-zinc-350 font-semibold space-y-1">
                      <p>Holder Name: <strong className="text-white">{bd?.holderName}</strong></p>
                      {bd?.upiId ? (
                        <p>UPI ID: <strong className="text-[#ef233c] font-mono">{bd.upiId}</strong></p>
                      ) : (
                        <p>Account: <strong className="text-[#ef233c] font-mono">{bd?.accountNumber}</strong> ({bd?.bankName})</p>
                      )}
                    </div>

                  ) : (
                    <p className="text-xs text-zinc-550 font-semibold italic">Configure bank details in profile to view here.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || user?.status !== "active" || user?.kyc?.status !== "approved" || !hasBankDetails}
                  className="w-full py-3.5 bg-[#ef233c] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : "Submit Payout Request"}
                </button>
              </form>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="space-y-6">
            <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-900 shadow-xl flex items-start gap-4 text-white">
              <div className="w-10 h-10 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 text-[#ef233c] flex items-center justify-center shrink-0">
                <Wallet size={18} />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Wallet Balance</span>
                <span className="text-2xl font-black text-white block mt-0.5 font-mono">₹{user?.walletBalance?.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-xs text-blue-400 font-semibold leading-relaxed">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p>Withdrawal Guidelines:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-blue-450 font-medium">
                  <li>Minimum withdrawal: ₹200</li>
                  <li>Maximum withdrawal: ₹50,000</li>
                  <li>Processing charge: {chargePercent}% flat fee</li>
                  <li>KYC document verification is mandatory</li>
                </ul>
              </div>
            </div>
          </div>

        </div>


      {/* History log */}
      <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl">
        <h3 className="font-extrabold text-lg text-white mb-6 font-manrope">Withdrawal Payout Logs</h3>

        {history.length === 0 ? (
          <p className="text-sm text-zinc-555 font-semibold py-8 text-center">No withdrawal records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3">Request ID</th>
                  <th className="pb-3">Gross Amount</th>
                  <th className="pb-3">Charge ({chargePercent}%)</th>
                  <th className="pb-3">Net payout</th>
                  <th className="pb-3">Receiving Destination</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Admin Remarks</th>
                  <th className="pb-3">Date Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-350">
                {history.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 text-xs font-mono text-zinc-500">#{item._id.slice(-8)}</td>
                    <td className="py-4 text-xs font-bold text-white">₹{item.amount.toLocaleString()}</td>
                    <td className="py-4 text-xs text-rose-500 font-semibold">₹{item.charge.toLocaleString()}</td>
                    <td className="py-4 text-xs font-bold text-emerald-450">₹{item.netAmount.toLocaleString()}</td>
                    <td className="py-4 text-xs text-zinc-450 font-semibold">
                      {item.bankDetails.upiId ? (
                        <span>UPI: {item.bankDetails.upiId}</span>
                      ) : (
                        <span>A/C: {item.bankDetails.accountNumber} ({item.bankDetails.bankName})</span>
                      )}
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider uppercase ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-semibold text-rose-500 max-w-[150px] truncate">
                      {item.remarks || <span className="text-zinc-650">-</span>}
                    </td>
                    <td className="py-4 text-xs text-zinc-550 font-semibold">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
