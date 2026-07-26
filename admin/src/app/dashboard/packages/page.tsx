"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { PackagePlus, Plus, Loader2, Edit3, TrendingUp, X, Check, ToggleLeft, ToggleRight } from "lucide-react";

interface PackageItem {
  _id: string; name: string; price: number;
  directCommission: number; levelCommissions: number[];
  description: string; status: "active" | "inactive";
  dailyRoi?: number; totalReturn?: number; returnPercent?: string; expiryDays?: number;
}

const inputCls = "w-full px-3 py-2.5 border border-zinc-800 rounded-xl bg-zinc-900 text-white text-xs focus:border-[#ef233c]/50 focus:outline-none transition-colors placeholder-zinc-600";
const labelCls = "block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5";

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPkg, setEditingPkg] = useState<PackageItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // form fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [directCommission, setDirectCommission] = useState("10");
  const [levelCommissionsStr, setLevelCommissionsStr] = useState("5, 3, 2, 1, 1");
  const [description, setDescription] = useState("");
  const [dailyRoi, setDailyRoi] = useState("");
  const [totalReturn, setTotalReturn] = useState("");
  const [returnPercent, setReturnPercent] = useState("");
  const [expiryDays, setExpiryDays] = useState("25");

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/packages");
      if (res.success) setPackages(res.data.sort((a: PackageItem, b: PackageItem) => a.price - b.price));
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPackages(); }, []);

  const openCreate = () => {
    setEditingPkg(null); setName(""); setPrice(""); setDirectCommission("10");
    setLevelCommissionsStr("5, 3, 2, 1, 1"); setDescription(""); setDailyRoi("");
    setTotalReturn(""); setReturnPercent(""); setExpiryDays("25");
    setError(null); setSuccess(null); setShowModal(true);
  };

  const openEdit = (pkg: PackageItem) => {
    setEditingPkg(pkg); setName(pkg.name); setPrice(pkg.price.toString());
    setDirectCommission(pkg.directCommission.toString());
    setLevelCommissionsStr(pkg.levelCommissions.join(", "));
    setDescription(pkg.description); setDailyRoi(pkg.dailyRoi?.toString() || "");
    setTotalReturn(pkg.totalReturn?.toString() || ""); setReturnPercent(pkg.returnPercent || "");
    setExpiryDays(pkg.expiryDays?.toString() || "25");
    setError(null); setSuccess(null); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !directCommission) { setError("Fill all required fields."); return; }
    setSubmitting(true); setError(null);
    const payload = {
      name, price: parseFloat(price), directCommission: parseFloat(directCommission),
      levelCommissions: levelCommissionsStr.split(",").map(l => parseFloat(l.trim())).filter(l => !isNaN(l)),
      description, dailyRoi: dailyRoi ? parseFloat(dailyRoi) : undefined,
      totalReturn: totalReturn ? parseFloat(totalReturn) : undefined,
      returnPercent: returnPercent || undefined, expiryDays: parseInt(expiryDays) || 25
    };
    try {
      const res = editingPkg
        ? await api.put(`/admin/packages/${editingPkg._id}`, payload)
        : await api.post("/admin/packages", payload);
      if (res.success) { setSuccess(res.message || "Package saved."); setShowModal(false); fetchPackages(); }
    } catch (e: any) { setError(e.message || "Save failed"); }
    finally { setSubmitting(false); }
  };

  const handleToggleStatus = async (pkg: PackageItem) => {
    try {
      await api.put(`/admin/packages/${pkg._id}`, { status: pkg.status === "active" ? "inactive" : "active" });
      fetchPackages();
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center">
            <PackagePlus size={18} className="text-[#ef233c]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">MLM Packages</h2>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Configure tiers, ROI & commission splits</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#ef233c] hover:bg-[#d90429] text-white text-xs font-bold transition-all shadow-lg shadow-[#ef233c]/25">
          <Plus size={15} /> New Package
        </button>
      </div>

      {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">{success}</div>}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#ef233c]" size={26} /></div>
      ) : packages.length === 0 ? (
        <div className="text-center py-20">
          <PackagePlus size={40} className="text-zinc-800 mx-auto mb-3" />
          <p className="text-xs text-zinc-600 font-semibold">No packages configured yet.</p>
          <button onClick={openCreate} className="mt-4 px-5 py-2.5 bg-[#ef233c] text-white rounded-xl text-xs font-bold">Create First Package</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {packages.map(pkg => (
            <div key={pkg._id} className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 flex flex-col gap-4 hover:border-zinc-800 transition-all relative">
              {/* Status badge */}
              <span className={`absolute top-4 right-4 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                pkg.status === "active" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-zinc-600 bg-zinc-900 border-zinc-800"
              }`}>{pkg.status}</span>

              <div>
                <h3 className="font-black text-white text-sm">{pkg.name}</h3>
                <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">{pkg.description}</p>
              </div>

              <div>
                <span className="text-2xl font-black text-white">₹{pkg.price.toLocaleString()}</span>
                <span className="text-[10px] text-zinc-600 block mt-0.5">Purchase cost</span>
              </div>

              <div className="border-t border-zinc-900 pt-3 space-y-1.5 text-[10px] font-semibold text-zinc-500">
                {pkg.dailyRoi && pkg.dailyRoi > 0 && (
                  <p className="flex items-center gap-1.5 text-emerald-400">
                    <TrendingUp size={11} /> Daily ROI: <strong>₹{pkg.dailyRoi}/day</strong>
                  </p>
                )}
                {pkg.totalReturn && <p>Total Return: <strong className="text-white">₹{pkg.totalReturn.toLocaleString()}</strong></p>}
                {pkg.returnPercent && <p>ROI %: <strong className="text-white">{pkg.returnPercent}</strong> in <strong className="text-white">{pkg.expiryDays || 25} days</strong></p>}
                <p>Direct Sponsor: <strong className="text-[#ef233c]">{pkg.directCommission}%</strong></p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {pkg.levelCommissions.map((val, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[8px] font-black text-blue-400">
                      L{idx + 2}: {val}%
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                <button onClick={() => openEdit(pkg)}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors">
                  <Edit3 size={11} /> Edit
                </button>
                <button onClick={() => handleToggleStatus(pkg)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${
                    pkg.status === "active"
                      ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                  }`}>
                  {pkg.status === "active" ? <ToggleLeft size={11} /> : <ToggleRight size={11} />}
                  {pkg.status === "active" ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <PackagePlus size={16} className="text-[#ef233c]" />
                {editingPkg ? "Edit Package" : "Create New Package"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-600 hover:text-white"><X size={18} /></button>
            </div>

            {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Package Name *</label>
                <input required placeholder="e.g. Platinum VIP" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} placeholder="Brief description of this plan..." value={description} onChange={e => setDescription(e.target.value)}
                  className={inputCls + " resize-none"} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Price (₹) *</label>
                  <input required type="number" placeholder="999" value={price} onChange={e => setPrice(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Direct Sponsor % *</label>
                  <input required type="number" placeholder="10" value={directCommission} onChange={e => setDirectCommission(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* ROI block */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">ROI / Return Configuration</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Daily ROI (₹)</label>
                    <input type="number" placeholder="e.g. 66" value={dailyRoi} onChange={e => setDailyRoi(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Total Return (₹)</label>
                    <input type="number" placeholder="e.g. 1650" value={totalReturn} onChange={e => setTotalReturn(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Return % (display)</label>
                    <input type="text" placeholder="e.g. 65%" value={returnPercent} onChange={e => setReturnPercent(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Expiry (Days)</label>
                    <input type="number" placeholder="25" value={expiryDays} onChange={e => setExpiryDays(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Level Commissions (comma-separated, L2 to L6) *</label>
                <input required placeholder="5, 3, 2, 1, 1" value={levelCommissionsStr} onChange={e => setLevelCommissionsStr(e.target.value)} className={inputCls} />
                <p className="text-[9px] text-zinc-600 mt-1">Enter % for upline levels: L2, L3, L4, L5, L6</p>
              </div>

              <div className="flex gap-3 pt-3 border-t border-zinc-800">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl text-xs font-bold transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-[#ef233c] hover:bg-[#d90429] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-[#ef233c]/20">
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {editingPkg ? "Update Package" : "Create Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
