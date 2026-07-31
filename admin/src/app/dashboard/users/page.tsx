"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../../services/api";
import {
  Users, Eye, Loader2, DollarSign, Ban, ShieldCheck,
  ChevronLeft, ChevronRight, Search, X, UserCheck, UserX, Plus, Minus, Trash2, AlertTriangle
} from "lucide-react";

interface UserItem {
  _id: string; name: string; username: string; email: string; phone: string;
  walletBalance: number; totalIncome: number; referralCode: string;
  plainPassword?: string; password?: string;
  status: "active" | "inactive" | "suspended";
  kyc: { status: "none" | "pending" | "approved" | "rejected" };
  activePackage?: { name: string; price: number } | null;
  sponsor?: { username: string; name: string } | null;
  createdAt: string;
}

const kycStyle: Record<string, string> = {
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pending:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
  rejected: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  none:     "text-zinc-500 bg-zinc-900 border-zinc-800"
};
const statusStyle: Record<string, string> = {
  active:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  inactive:  "text-zinc-400 bg-zinc-900 border-zinc-800",
  suspended: "text-rose-400 bg-rose-500/10 border-rose-500/20"
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [amount, setAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [submittingAdjust, setSubmittingAdjust] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = useCallback(async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${p}&limit=12&search=${q}`);
      if (res.success) { setUsers(res.data.users); setPage(res.data.page); setPages(res.data.pages); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(page, search); }, [page]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchUsers(1, search); };

  const handleQuickToggleStatus = async (user: UserItem) => {
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    try {
      const res = await api.post("/admin/users/toggle-status", { userId: user._id, status: newStatus });
      if (res.success) {
        setSuccess(`User ${newStatus === "suspended" ? "blocked" : "unblocked"} successfully.`);
        fetchUsers(page, search);
      }
    } catch (e: any) { setError(e.message || "Status update failed"); }
  };

  const handleDeleteUser = async (user: UserItem) => {
    setDeletingUserId(user._id);
    try {
      const res = await api.delete(`/admin/users/${user._id}`);
      if (res.success) {
        setSuccess(`User "${user.name}" deleted permanently.`);
        setConfirmDeleteUser(null);
        fetchUsers(page, search);
      }
    } catch (e: any) { setError(e.message || "Delete failed"); }
    finally { setDeletingUserId(null); }
  };

  const handleAdjustBalance = async () => {
    if (!selectedUser || !amount || isNaN(Number(amount))) { setError("Enter a valid amount."); return; }
    setSubmittingAdjust(true); setError(null); setSuccess(null);
    try {
      const res = await api.post("/admin/users/adjust-balance", {
        userId: selectedUser._id, amount: Number(amount), type: adjustType, description: adjustDesc || `Manual ${adjustType} by admin`
      });
      if (res.success) {
        setSuccess(`Balance ${adjustType}ed by ₹${amount} for ${selectedUser.name}`);
        setAmount(""); setAdjustDesc(""); fetchUsers(page, search);
        setSelectedUser(prev => prev ? { ...prev, walletBalance: prev.walletBalance + (adjustType === "credit" ? Number(amount) : -Number(amount)) } : null);
      }
    } catch (e: any) { setError(e.message || "Failed to adjust balance"); }
    finally { setSubmittingAdjust(false); }
  };

  const handleToggleStatus = async (newStatus: "active" | "suspended") => {
    if (!selectedUser) return;
    setSubmittingStatus(true); setError(null);
    try {
      const res = await api.post("/admin/users/toggle-status", { userId: selectedUser._id, status: newStatus });
      if (res.success) {
        setSuccess(`User ${newStatus === "suspended" ? "suspended" : "reactivated"} successfully.`);
        fetchUsers(page, search);
        setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (e: any) { setError(e.message || "Status update failed"); }
    finally { setSubmittingStatus(false); }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Users size={18} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">User Directory</h2>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Manage members & balances</p>
          </div>
        </div>
        <form onSubmit={handleSearch} className="relative flex gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              placeholder="Search name, email, username..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:border-[#ef233c]/50 focus:outline-none w-60 transition-colors"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-[#ef233c] hover:bg-[#d90429] text-white rounded-xl text-xs font-bold transition-colors">Search</button>
        </form>
      </div>

      {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">{success}</div>}

      {/* Table */}
      <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#ef233c]" size={26} /></div>
        ) : users.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-20 font-semibold">No users found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-900 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                    {["Member", "Referral Code", "Password", "Wallet", "Package", "KYC", "Status", "Joined", "Actions"].map(h => (
                      <th key={h} className={`px-4 py-3 ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-black text-white">{u.name}</p>
                        <p className="text-[10px] text-zinc-500">@{u.username} · {u.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-[#ef233c] font-bold">{u.referralCode || "—"}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-amber-400 font-bold tracking-wider">
                        {u.plainPassword && !u.plainPassword.startsWith("$2a$") ? u.plainPassword : "••••••••"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-black text-white">₹{(u.walletBalance || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-zinc-600">Income: ₹{(u.totalIncome || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-300 font-semibold">
                        {u.activePackage?.name || <span className="text-zinc-700">None</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${kycStyle[u.kyc?.status] || kycStyle.none}`}>
                          {u.kyc?.status || "none"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${statusStyle[u.status] || statusStyle.inactive}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-zinc-600 font-semibold">
                        {new Date(u.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end flex-wrap">
                          <button onClick={() => { setSelectedUser(u); setError(null); setSuccess(null); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 text-[#ef233c] text-[9px] font-bold hover:bg-[#ef233c]/20 transition-colors">
                            <Eye size={11} /> Manage
                          </button>
                          <button onClick={() => handleQuickToggleStatus(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-bold transition-colors border ${
                              u.status === "suspended"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                            }`}>
                            {u.status === "suspended" ? <><UserCheck size={11} /> Unblock</> : <><Ban size={11} /> Block</>}
                          </button>
                          <button onClick={() => setConfirmDeleteUser(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold hover:bg-rose-500/20 transition-colors">
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
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
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 transition-all"><ChevronLeft size={14} /></button>
                  <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 transition-all"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Manage User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl shadow-black">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Users size={16} className="text-[#ef233c]" /> {selectedUser.name}
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-zinc-600 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">{error}</div>}
            {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">{success}</div>}

            {/* User details grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Username", `@${selectedUser.username}`],
                ["Password", selectedUser.plainPassword && !selectedUser.plainPassword.startsWith("$2a$") ? selectedUser.plainPassword : "••••••••"],
                ["Email", selectedUser.email],
                ["Phone", selectedUser.phone || "—"],
                ["Referral Code", selectedUser.referralCode || "—"],
                ["Sponsor", selectedUser.sponsor ? `@${selectedUser.sponsor.username}` : "Direct"],
                ["Status", selectedUser.status.toUpperCase()],
                ["Wallet Balance", `₹${(selectedUser.walletBalance || 0).toLocaleString()}`],
                ["Total Income", `₹${(selectedUser.totalIncome || 0).toLocaleString()}`],
              ].map(([label, val]) => (
                <div key={label} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                  <span className="text-[9px] text-zinc-600 block uppercase font-bold tracking-wider">{label}</span>
                  <span className={`text-xs font-black mt-0.5 block truncate ${label === "Password" ? "text-amber-400 font-mono" : "text-white"}`}>{val}</span>
                </div>
              ))}
            </div>

            {/* Balance Adjustment */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5"><DollarSign size={11} /> Balance Adjustment</p>
              <div className="flex gap-2">
                {(["credit", "debit"] as const).map(t => (
                  <button key={t} onClick={() => setAdjustType(t)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all capitalize ${
                      adjustType === t
                        ? t === "credit" ? "bg-emerald-600 border-emerald-500 text-white" : "bg-rose-600 border-rose-500 text-white"
                        : "border-zinc-800 text-zinc-500 hover:text-white"
                    }`}>
                    {t === "credit" ? <Plus size={10} className="inline mr-1" /> : <Minus size={10} className="inline mr-1" />} {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="number" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:border-[#ef233c]/50 focus:outline-none transition-colors placeholder-zinc-600" />
                <input placeholder="Description (optional)" value={adjustDesc} onChange={e => setAdjustDesc(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:border-[#ef233c]/50 focus:outline-none transition-colors placeholder-zinc-600" />
              </div>
              <button onClick={handleAdjustBalance} disabled={submittingAdjust}
                className="w-full py-2.5 bg-[#ef233c] hover:bg-[#d90429] text-white rounded-xl text-xs font-black transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                {submittingAdjust ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                Apply Balance Adjustment
              </button>
            </div>

            {/* Status Toggle */}
            <div className="flex gap-3 pt-2 border-t border-zinc-800">
              {selectedUser.status !== "suspended" ? (
                <button onClick={() => handleToggleStatus("suspended")} disabled={submittingStatus}
                  className="flex-1 py-2.5 bg-rose-600/10 border border-rose-600/20 text-rose-400 hover:bg-rose-600/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <Ban size={12} /> Suspend Account
                </button>
              ) : (
                <button onClick={() => handleToggleStatus("active")} disabled={submittingStatus}
                  className="flex-1 py-2.5 bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 hover:bg-emerald-600/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <UserCheck size={12} /> Reactivate Account
                </button>
              )}
              <button onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl text-xs font-bold transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}\n
      {/* Delete Confirmation Modal */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-zinc-950 border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-2xl shadow-rose-900/20">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle size={24} />
              <h3 className="font-black text-base text-white">Delete User Account?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              You are about to permanently delete <strong className="text-white">{confirmDeleteUser.name}</strong> (@{confirmDeleteUser.username}).
              This will also remove all their plans and transaction history. <strong className="text-rose-400">This cannot be undone.</strong>
            </p>
            {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">{error}</div>}
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteUser(null)}
                className="flex-1 py-2.5 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl text-xs font-bold transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(confirmDeleteUser)}
                disabled={deletingUserId === confirmDeleteUser._id}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                {deletingUserId === confirmDeleteUser._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
