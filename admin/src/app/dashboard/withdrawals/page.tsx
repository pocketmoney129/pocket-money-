"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { ArrowUpCircle, Eye, Loader2, Check, X, ChevronLeft, ChevronRight } from "lucide-react";

interface WithdrawRequest {
  _id: string; amount: number; charge: number; netAmount: number;
  bankDetails: { holderName: string; accountNumber?: string; bankName?: string; ifsc?: string; upiId?: string };
  status: "pending" | "approved" | "rejected";
  remarks?: string; createdAt: string;
  user: { name: string; username: string; email: string };
}

const statusStyle: Record<string, string> = {
  pending:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  rejected: "text-rose-400 bg-rose-500/10 border-rose-500/20"
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedWith, setSelectedWith] = useState<WithdrawRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchWithdrawals = async (p = page, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/withdrawals?page=${p}&limit=12&status=${status}`);
      if (res.success) { setWithdrawals(res.data.withdrawals); setPage(res.data.page); setPages(res.data.pages); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWithdrawals(page, statusFilter); }, [page, statusFilter]);

  const handleProcess = async (action: "approve" | "reject") => {
    if (!selectedWith) return;
    if (action === "reject" && !remarks.trim()) { setError("Write rejection remarks."); return; }
    setSubmitting(true); setError(null);
    try {
      const endpoint = action === "approve" ? "/admin/withdrawals/approve" : "/admin/withdrawals/reject";
      const payload = action === "approve" ? { withdrawalId: selectedWith._id } : { withdrawalId: selectedWith._id, remarks };
      const res = await api.post(endpoint, payload);
      if (res.success) {
        setSuccess(`Withdrawal ${action}d successfully.`);
        setSelectedWith(null); setRemarks(""); fetchWithdrawals();
      }
    } catch (e: any) { setError(e.message || "Action failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ArrowUpCircle size={18} className="text-rose-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Withdrawals Desk</h2>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Process payout requests</p>
          </div>
        </div>
        <div className="flex gap-2 text-[10px] font-black">
          {["", "pending", "approved", "rejected"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl border transition-all capitalize ${
                statusFilter === s ? "bg-[#ef233c] border-[#ef233c]/40 text-white" : "border-zinc-800 text-zinc-500 hover:text-white"
              }`}>{s || "All"}</button>
          ))}
        </div>
      </div>

      {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">{success}</div>}

      <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#ef233c]" size={26} /></div>
        ) : withdrawals.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-20 font-semibold">No withdrawal requests found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-900 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                    {["User", "Amount", "Net Payout", "Bank / UPI", "Status", "Date", "Action"].map(h => (
                      <th key={h} className={`px-4 py-3 ${h === "Action" ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {withdrawals.map(w => (
                    <tr key={w._id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-black text-white">{w.user?.name}</p>
                        <p className="text-[10px] text-zinc-500">@{w.user?.username}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-black text-white">₹{w.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-black text-emerald-400">₹{(w.netAmount || w.amount)?.toLocaleString()}</p>
                        {w.charge > 0 && <p className="text-[10px] text-zinc-600">Fee: ₹{w.charge}</p>}
                      </td>
                      <td className="px-4 py-3 text-[10px] text-zinc-400 font-semibold max-w-[150px]">
                        {w.bankDetails?.upiId || `${w.bankDetails?.bankName} ·${w.bankDetails?.accountNumber?.slice(-4)}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${statusStyle[w.status] || ""}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-zinc-600">{new Date(w.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setSelectedWith(w); setError(null); setSuccess(null); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 text-[#ef233c] text-[10px] font-bold hover:bg-[#ef233c]/20 transition-colors">
                          <Eye size={12} /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-900">
                <span className="text-[10px] text-zinc-600">Page {page} of {pages}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30"><ChevronLeft size={14} /></button>
                  <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      {selectedWith && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <ArrowUpCircle size={16} className="text-rose-400" /> Review Withdrawal
              </h3>
              <button onClick={() => setSelectedWith(null)} className="text-zinc-600 hover:text-white"><X size={18} /></button>
            </div>

            {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              {[
                ["User", `${selectedWith.user?.name} (@${selectedWith.user?.username})`],
                ["Requested", `₹${selectedWith.amount?.toLocaleString()}`],
                ["Net Payout", `₹${(selectedWith.netAmount || selectedWith.amount)?.toLocaleString()}`],
                ["Platform Fee", selectedWith.charge > 0 ? `₹${selectedWith.charge}` : "None"]
              ].map(([label, val]) => (
                <div key={label} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                  <span className="text-[9px] text-zinc-600 block uppercase font-bold tracking-wider">{label}</span>
                  <span className="text-xs text-white font-black mt-0.5 block">{val}</span>
                </div>
              ))}
              <div className="col-span-2 bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                <span className="text-[9px] text-zinc-600 block uppercase font-bold tracking-wider">Bank / UPI Details</span>
                <div className="text-xs text-white font-semibold mt-0.5 space-y-0.5">
                  {selectedWith.bankDetails?.upiId
                    ? <p>UPI: <span className="text-[#ef233c] font-black">{selectedWith.bankDetails.upiId}</span></p>
                    : <>
                        <p>Account: <span className="font-black">{selectedWith.bankDetails?.accountNumber}</span></p>
                        <p>Bank: {selectedWith.bankDetails?.bankName} | IFSC: {selectedWith.bankDetails?.ifsc}</p>
                      </>
                  }
                  <p className="text-zinc-500">Holder: {selectedWith.bankDetails?.holderName}</p>
                </div>
              </div>
            </div>

            {selectedWith.status === "pending" ? (
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Rejection Remarks</label>
                  <textarea rows={2} placeholder="Reason (required if rejecting)..."
                    value={remarks} onChange={e => setRemarks(e.target.value)}
                    className="w-full px-4 py-2.5 border border-zinc-800 rounded-xl bg-zinc-900 text-white text-xs focus:border-[#ef233c]/50 focus:outline-none transition-colors placeholder-zinc-600" />
                </div>
                <div className="flex gap-3 pt-2 border-t border-zinc-800">
                  <button onClick={() => setSelectedWith(null)} className="px-4 py-2.5 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl text-xs font-bold transition-colors">Cancel</button>
                  <button onClick={() => handleProcess("reject")} disabled={submitting}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
                    <X size={12} /> Reject
                  </button>
                  <button onClick={() => handleProcess("approve")} disabled={submitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg shadow-emerald-600/20">
                    {submitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve & Pay
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-3 border-t border-zinc-800 space-y-3">
                <div className={`p-3 rounded-xl border text-xs font-semibold ${statusStyle[selectedWith.status]}`}>
                  Status: <strong className="uppercase">{selectedWith.status}</strong>
                  {selectedWith.remarks && <p className="mt-1 text-zinc-400">{selectedWith.remarks}</p>}
                </div>
                <button onClick={() => setSelectedWith(null)} className="w-full py-2.5 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl text-xs font-bold transition-colors">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
