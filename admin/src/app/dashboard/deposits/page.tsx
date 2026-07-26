"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { ArrowDownCircle, Eye, Loader2, Check, X, ChevronLeft, ChevronRight, Search, Ban } from "lucide-react";

interface DepositRequest {
  _id: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  screenshot: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  remarks?: string;
  packageId?: string;
  packageName?: string;
  createdAt: string;
  user: { name: string; username: string; email: string };
}

const statusStyle: Record<string, string> = {
  pending:   "bg-amber-500/10 border-amber-500/20 text-amber-400",
  approved:  "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  rejected:  "bg-rose-500/10 border-rose-500/20 text-rose-400",
  cancelled: "bg-zinc-800 border-zinc-700 text-zinc-500"
};

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5001";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedDep, setSelectedDep] = useState<DepositRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchDeposits = async (p = page, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/deposits?page=${p}&limit=12&status=${status}`);
      if (res.success) { setDeposits(res.data.deposits); setPages(res.data.pages); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDeposits(page, statusFilter); }, [page, statusFilter]);

  const handleProcess = async (action: "approve" | "reject") => {
    if (!selectedDep) return;
    if (action === "reject" && !remarks.trim()) { setError("Write rejection remarks first."); return; }
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      const endpoint = action === "approve" ? "/admin/deposits/approve" : "/admin/deposits/reject";
      const payload = action === "approve" ? { depositId: selectedDep._id } : { depositId: selectedDep._id, remarks };
      const res = await api.post(endpoint, payload);
      if (res.success) {
        setSuccess(`Deposit ${action === "approve" ? "approved & plan activated" : "rejected"} successfully.`);
        setSelectedDep(null); setRemarks(""); fetchDeposits();
      }
    } catch (e: any) { setError(e.message || "Action failed"); }
    finally { setSubmitting(false); }
  };

  const handleCancelPlan = async () => {
    if (!selectedDep) return;
    setSubmitting(true); setError(null);
    try {
      const res = await api.post("/admin/deposits/cancel", { depositId: selectedDep._id });
      if (res.success) {
        setSuccess("Deposit cancelled and plan deactivated successfully.");
        setSelectedDep(null); fetchDeposits();
      }
    } catch (e: any) { setError(e.message || "Cancel failed"); }
    finally { setSubmitting(false); }
  };

  const visible = deposits.filter(d =>
    !search || d.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
    d.transactionReference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ArrowDownCircle size={18} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Deposits Desk</h2>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Verify payments & activate plans</p>
          </div>
        </div>
        {/* Filters */}
        <div className="flex gap-2 text-[10px] font-black">
          {["", "pending", "approved", "rejected"].map(s => (
            <button key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl border transition-all capitalize ${
                statusFilter === s
                  ? "bg-[#ef233c] border-[#ef233c]/40 text-white shadow-lg shadow-[#ef233c]/20"
                  : "border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700"
              }`}
            >{s || "All"}</button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          placeholder="Search user or UTR..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:border-[#ef233c]/50 focus:outline-none transition-colors"
        />
      </div>

      {/* Success/Error */}
      {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">{success}</div>}
      {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">{error}</div>}

      {/* Table */}
      <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-[#ef233c]" size={26} /></div>
        ) : visible.length === 0 ? (
          <p className="text-xs text-zinc-600 font-semibold py-20 text-center">No deposit requests found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-900 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                    {["User", "UTR / Reference", "Plan", "Amount", "Status", "Date", "Action"].map(h => (
                      <th key={h} className={`px-4 py-3 ${h === "Action" ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {visible.map(dep => (
                    <tr key={dep._id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-black text-white">{dep.user?.name}</p>
                        <p className="text-[10px] text-zinc-500 font-semibold">@{dep.user?.username}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-zinc-400 font-semibold">{dep.transactionReference || "—"}</td>
                      <td className="px-4 py-3 text-xs text-zinc-300 font-semibold">{dep.packageName || `₹${dep.amount?.toLocaleString()}`}</td>
                      <td className="px-4 py-3 text-xs font-black text-white">₹{dep.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-black tracking-wider uppercase ${statusStyle[dep.status] || "bg-zinc-800 text-zinc-400"}`}>
                          {dep.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-zinc-600 font-semibold">
                        {new Date(dep.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setSelectedDep(dep); setError(null); setSuccess(null); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 text-[#ef233c] text-[10px] font-bold hover:bg-[#ef233c]/20 transition-colors"
                        >
                          <Eye size={12} /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-900">
                <span className="text-[10px] text-zinc-600 font-semibold">Page {page} of {pages}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="p-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-white disabled:opacity-30 transition-all">
                    <ChevronLeft size={14} />
                  </button>
                  <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                    className="p-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-white disabled:opacity-30 transition-all">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      {selectedDep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl shadow-black">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <ArrowDownCircle size={18} className="text-emerald-400" /> Review Deposit
              </h3>
              <button onClick={() => setSelectedDep(null)} className="text-zinc-600 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              {[
                ["User", `${selectedDep.user?.name} (@${selectedDep.user?.username})`],
                ["Amount", `₹${selectedDep.amount?.toLocaleString()}`],
                ["Plan", selectedDep.packageName || "General Deposit"],
                ["Status", selectedDep.status.toUpperCase()]
              ].map(([label, val]) => (
                <div key={label} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                  <span className="text-[9px] text-zinc-600 block uppercase tracking-wider font-bold">{label}</span>
                  <span className="text-xs text-white font-black mt-0.5 block">{val}</span>
                </div>
              ))}
              <div className="col-span-2 bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                <span className="text-[9px] text-zinc-600 block uppercase tracking-wider font-bold">Transaction Reference / UTR</span>
                <span className="text-xs font-mono text-[#ef233c] font-bold mt-0.5 block">{selectedDep.transactionReference || "Not provided"}</span>
              </div>
            </div>

            {/* Screenshot */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Payment Screenshot</p>
              <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900 h-56 flex items-center justify-center">
                {selectedDep.screenshot ? (
                  <img
                    src={`${BACKEND}${selectedDep.screenshot}`}
                    alt="Payment proof"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="text-xs text-zinc-600 font-semibold">No screenshot uploaded</p>
                )}
              </div>
            </div>

            {selectedDep.status === "pending" ? (
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">
                    Rejection Remarks <span className="text-zinc-700">(required if rejecting)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. UTR doesn't match, screenshot unclear..."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    className="w-full px-4 py-2.5 border border-zinc-800 rounded-xl bg-zinc-900 text-white text-xs focus:border-[#ef233c]/50 focus:outline-none transition-colors placeholder-zinc-600"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setSelectedDep(null)}
                    className="flex-1 py-2.5 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white text-xs font-bold transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => handleProcess("reject")} disabled={submitting}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5">
                    <X size={12} /> Reject
                  </button>
                  <button onClick={() => handleProcess("approve")} disabled={submitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20">
                    {submitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve & Activate
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <div className={`p-3 rounded-xl border text-xs font-semibold ${statusStyle[selectedDep.status] || ""}`}>
                  <p>Status: <strong className="uppercase">{selectedDep.status}</strong></p>
                  {selectedDep.remarks && <p className="mt-1 text-zinc-400">Remarks: {selectedDep.remarks}</p>}
                </div>
                {/* Cancel Plan — only for approved deposits */}
                {selectedDep.status === "approved" && (
                  <button onClick={handleCancelPlan} disabled={submitting}
                    className="w-full py-2.5 bg-amber-600/10 border border-amber-500/30 text-amber-400 hover:bg-amber-600/20 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {submitting ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                    Cancel Plan & Revoke Approval
                  </button>
                )}
                <button onClick={() => setSelectedDep(null)}
                  className="w-full py-2.5 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white text-xs font-bold transition-colors">
                  Close
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
