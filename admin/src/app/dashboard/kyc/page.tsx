"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { ShieldCheck, Eye, Loader2, Check, X, ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface UserKycItem {
  _id: string; name: string; username: string;
  kyc: {
    status: "pending" | "approved" | "rejected";
    documentType: string; documentNumber: string;
    documentFront: string; documentBack?: string; submittedAt: string;
  };
}

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5001";

export default function AdminKycPage() {
  const [users, setUsers] = useState<UserKycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserKycItem | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchKyc = async (p = page, status = filter) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?kycStatus=${status}&page=${p}&limit=12`);
      if (res.success) { setUsers(res.data.users); setPage(res.data.page); setPages(res.data.pages); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchKyc(page, filter); }, [page, filter]);

  const handleReview = async (action: "approve" | "reject") => {
    if (!selectedUser) return;
    if (action === "reject" && !remarks.trim()) { setError("Write rejection remarks."); return; }
    setSubmitting(true); setError(null);
    try {
      const status = action === "approve" ? "approved" : "rejected";
      const res = await api.post("/admin/kyc/review", { userId: selectedUser._id, status, action, remarks });
      if (res.success) {
        setSuccess(`KYC ${status} for ${selectedUser.name}.`);
        setSelectedUser(null); setRemarks(""); fetchKyc();
      }
    } catch (e: any) { setError(e.message || "Review failed"); }

    finally { setSubmitting(false); }
  };

  const kycStatusStyle: Record<string, string> = {
    pending:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
    approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    rejected: "text-rose-400 bg-rose-500/10 border-rose-500/20"
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <ShieldCheck size={18} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">KYC Verifications</h2>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Review & approve identity documents</p>
          </div>
        </div>
        <div className="flex gap-2 text-[10px] font-black">
          {["pending", "approved", "rejected"].map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl border transition-all capitalize ${
                filter === s ? "bg-[#ef233c] border-[#ef233c]/40 text-white" : "border-zinc-800 text-zinc-500 hover:text-white"
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">{success}</div>}

      <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#ef233c]" size={26} /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <ShieldCheck size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-xs text-zinc-600 font-semibold">No {filter} KYC submissions.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-900 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                    {["Member", "Document Type", "Doc Number", "Submitted", "Status", "Action"].map(h => (
                      <th key={h} className={`px-4 py-3 ${h === "Action" ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-black text-white">{u.name}</p>
                        <p className="text-[10px] text-zinc-500">@{u.username}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-300 font-semibold capitalize">{u.kyc?.documentType || "—"}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-zinc-400 font-semibold">{u.kyc?.documentNumber || "—"}</td>
                      <td className="px-4 py-3 text-[10px] text-zinc-600 font-semibold">
                        {u.kyc?.submittedAt ? new Date(u.kyc.submittedAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${kycStatusStyle[u.kyc?.status] || ""}`}>
                          {u.kyc?.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setSelectedUser(u); setError(null); setSuccess(null); }}
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
                <span className="text-[10px] text-zinc-600 font-semibold">Page {page} of {pages}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30"><ChevronLeft size={14} /></button>
                  <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* KYC Review Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <FileText size={16} className="text-purple-400" /> KYC Review — {selectedUser.name}
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-zinc-600 hover:text-white"><X size={18} /></button>
            </div>

            {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              {[
                ["User", `${selectedUser.name} (@${selectedUser.username})`],
                ["Doc Type", selectedUser.kyc?.documentType || "—"],
                ["Doc Number", selectedUser.kyc?.documentNumber || "—"],
                ["Status", selectedUser.kyc?.status?.toUpperCase()]
              ].map(([label, val]) => (
                <div key={label} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                  <span className="text-[9px] text-zinc-600 block uppercase font-bold tracking-wider">{label}</span>
                  <span className="text-xs text-white font-black mt-0.5 block">{val}</span>
                </div>
              ))}
            </div>

            {/* Document images */}
            <div className="grid grid-cols-2 gap-3">
              {["Front", "Back"].map((side, i) => {
                const imgPath = i === 0 ? selectedUser.kyc?.documentFront : selectedUser.kyc?.documentBack;
                return (
                  <div key={side}>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">{side}</p>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl h-36 flex items-center justify-center overflow-hidden">
                      {imgPath ? (
                        <img src={`${BACKEND}${imgPath}`} alt={`KYC ${side}`} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <p className="text-[10px] text-zinc-700 font-semibold">Not uploaded</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedUser.kyc?.status === "pending" ? (
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Rejection Remarks (if rejecting)</label>
                  <textarea rows={2} placeholder="Reason for rejection..."
                    value={remarks} onChange={e => setRemarks(e.target.value)}
                    className="w-full px-4 py-2.5 border border-zinc-800 rounded-xl bg-zinc-900 text-white text-xs focus:border-[#ef233c]/50 focus:outline-none transition-colors placeholder-zinc-600" />
                </div>
                <div className="flex gap-3 pt-2 border-t border-zinc-800">
                  <button onClick={() => setSelectedUser(null)} className="px-4 py-2.5 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl text-xs font-bold transition-colors">Cancel</button>
                  <button onClick={() => handleReview("reject")} disabled={submitting}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
                    <X size={12} /> Reject
                  </button>
                  <button onClick={() => handleReview("approve")} disabled={submitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                    {submitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve KYC
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-3 border-t border-zinc-800">
                <button onClick={() => setSelectedUser(null)} className="w-full py-2.5 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl text-xs font-bold transition-colors">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
