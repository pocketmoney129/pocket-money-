"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Settings, Loader2, Save, Upload, Plus, X, SettingsIcon } from "lucide-react";

interface AdminSettings {
  siteName: string; siteEmail: string; sitePhone: string;
  minDeposit: number; maxDeposit: number; minWithdraw: number; maxWithdraw: number;
  withdrawalFeePercent: number; upiId: string; qrCodeImage?: string;
  bankTransferDetails: { bankName: string; accountNumber: string; ifsc: string; holderName: string };
  allowMultipleActivePackages: boolean;
  businessModelTitle?: string; businessModelDesc?: string;
  businessModelAllocations?: { title: string; percent: number; desc: string; icon: string }[];
}

const inputCls = "w-full px-3 py-2.5 border border-zinc-800 rounded-xl bg-zinc-900 text-white text-xs focus:border-[#ef233c]/50 focus:outline-none transition-colors placeholder-zinc-600";
const labelCls = "block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5";

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5001";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [siteName, setSiteName] = useState("");
  const [siteEmail, setSiteEmail] = useState("");
  const [sitePhone, setSitePhone] = useState("");
  const [minDeposit, setMinDeposit] = useState("");
  const [maxDeposit, setMaxDeposit] = useState("");
  const [minWithdraw, setMinWithdraw] = useState("");
  const [maxWithdraw, setMaxWithdraw] = useState("");
  const [withdrawalFeePercent, setWithdrawalFeePercent] = useState("");
  const [upiId, setUpiId] = useState("");
  const [qrCodeImageFile, setQrCodeImageFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
  const [allowMultiple, setAllowMultiple] = useState(true);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holderName, setHolderName] = useState("");
  const [businessModelTitle, setBusinessModelTitle] = useState("");
  const [businessModelDesc, setBusinessModelDesc] = useState("");
  const [allocations, setAllocations] = useState<{ title: string; percent: number; desc: string; icon: string }[]>([]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/settings");
      if (res.success) {
        const s = res.data as AdminSettings;
        setSiteName(s.siteName); setSiteEmail(s.siteEmail); setSitePhone(s.sitePhone);
        setMinDeposit(s.minDeposit?.toString()); setMaxDeposit(s.maxDeposit?.toString());
        setMinWithdraw(s.minWithdraw?.toString()); setMaxWithdraw(s.maxWithdraw?.toString());
        setWithdrawalFeePercent(s.withdrawalFeePercent?.toString());
        setUpiId(s.upiId); setAllowMultiple(s.allowMultipleActivePackages);
        setBankName(s.bankTransferDetails?.bankName); setAccountNumber(s.bankTransferDetails?.accountNumber);
        setIfsc(s.bankTransferDetails?.ifsc); setHolderName(s.bankTransferDetails?.holderName);
        setBusinessModelTitle(s.businessModelTitle || "");
        setBusinessModelDesc(s.businessModelDesc || "");
        setAllocations(s.businessModelAllocations || []);
        if (s.qrCodeImage) setQrCodePreview(`${BACKEND}${s.qrCodeImage}`);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(null);
    const formData = new FormData();
    const fields: Record<string, string> = {
      siteName, siteEmail, sitePhone, minDeposit, maxDeposit, minWithdraw, maxWithdraw,
      withdrawalFeePercent, upiId, bankName, accountNumber, ifsc, holderName,
      allowMultipleActivePackages: allowMultiple.toString(),
      businessModelTitle, businessModelDesc,
      businessModelAllocations: JSON.stringify(allocations)
    };
    Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
    if (qrCodeImageFile) formData.append("qrCodeImage", qrCodeImageFile);
    try {
      const res = await api.put("/admin/settings", formData);
      if (res.success) { setSuccess("Settings saved successfully."); fetchSettings(); }
    } catch (e: any) { setError(e.message || "Save failed"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-24"><Loader2 className="animate-spin text-[#ef233c]" size={28} /></div>
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <SettingsIcon size={18} className="text-zinc-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">System Settings</h2>
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Configure platform rules & payment credentials</p>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">{error}</div>}
      {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Left: Site Info + Wallet Rules */}
          <div className="space-y-5">
            {/* Site Info */}
            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-3">Website Info</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className={labelCls}>Platform Name</label><input required value={siteName} onChange={e => setSiteName(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Support Phone</label><input required value={sitePhone} onChange={e => setSitePhone(e.target.value)} className={inputCls} /></div>
                <div className="sm:col-span-2"><label className={labelCls}>Support Email</label><input required type="email" value={siteEmail} onChange={e => setSiteEmail(e.target.value)} className={inputCls} /></div>
              </div>
            </div>

            {/* Wallet Rules */}
            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-3">Wallet Rules</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Min Deposit (₹)</label><input required type="number" value={minDeposit} onChange={e => setMinDeposit(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Max Deposit (₹)</label><input required type="number" value={maxDeposit} onChange={e => setMaxDeposit(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Min Withdraw (₹)</label><input required type="number" value={minWithdraw} onChange={e => setMinWithdraw(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Max Withdraw (₹)</label><input required type="number" value={maxWithdraw} onChange={e => setMaxWithdraw(e.target.value)} className={inputCls} /></div>
                <div className="col-span-2"><label className={labelCls}>Withdrawal Fee (%)</label><input required type="number" value={withdrawalFeePercent} onChange={e => setWithdrawalFeePercent(e.target.value)} className={inputCls} /></div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setAllowMultiple(!allowMultiple)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${allowMultiple ? "bg-emerald-600" : "bg-zinc-700"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowMultiple ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-xs text-zinc-400 font-semibold">Allow multiple active plans per user</span>
              </label>
            </div>
          </div>

          {/* Right: Payment + QR */}
          <div className="space-y-5">
            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-3">Payment Credentials</h3>
              <div>
                <label className={labelCls}>UPI ID</label>
                <input required value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="e.g. yourname@upi" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className={labelCls}>Account Holder Name</label><input required value={holderName} onChange={e => setHolderName(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Bank Name</label><input required value={bankName} onChange={e => setBankName(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>IFSC Code</label><input required value={ifsc} onChange={e => setIfsc(e.target.value)} className={inputCls} /></div>
                <div className="col-span-2"><label className={labelCls}>Account Number</label><input required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className={inputCls} /></div>
              </div>
            </div>

            {/* QR Upload */}
            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-3">UPI QR Code</h3>
              <div className="grid grid-cols-2 gap-3 items-center">
                <label className="border-2 border-dashed border-zinc-800 hover:border-[#ef233c]/40 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                  <input type="file" accept="image/*" onChange={e => {
                    if (e.target.files?.[0]) {
                      setQrCodeImageFile(e.target.files[0]);
                      setQrCodePreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload size={20} className="text-zinc-600 mb-1" />
                  <p className="text-[10px] font-bold text-zinc-600">Upload QR Image</p>
                </label>
                <div className="border border-zinc-800 rounded-xl h-32 bg-zinc-900 flex items-center justify-center overflow-hidden">
                  {qrCodePreview
                    ? <img src={qrCodePreview} alt="QR Preview" className="max-h-full max-w-full object-contain" />
                    : <p className="text-[10px] text-zinc-700 font-semibold">No QR Set</p>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Model */}
        <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-3">Business Model & Fund Allocation</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className={labelCls}>Section Title</label><input value={businessModelTitle} onChange={e => setBusinessModelTitle(e.target.value)} className={inputCls} placeholder="How Pocket Money Works" /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Section Description</label>
              <textarea rows={2} value={businessModelDesc} onChange={e => setBusinessModelDesc(e.target.value)} className={inputCls + " resize-none"} placeholder="Transparency statement..." />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Fund Allocations</p>
              <button type="button" onClick={() => setAllocations([...allocations, { title: "", percent: 0, desc: "", icon: "circle" }])}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#ef233c]/10 border border-[#ef233c]/20 text-[#ef233c] rounded-xl text-[10px] font-bold hover:bg-[#ef233c]/20 transition-colors">
                <Plus size={11} /> Add
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {allocations.map((alloc, idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2 relative">
                  <button type="button" onClick={() => setAllocations(allocations.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 text-zinc-600 hover:text-rose-400 transition-colors"><X size={13} /></button>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[8px] font-black uppercase text-zinc-600 block mb-1">Title</label>
                      <input value={alloc.title} onChange={e => { const c=[...allocations]; c[idx].title=e.target.value; setAllocations(c); }}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] text-white focus:outline-none focus:border-[#ef233c]/40" />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-zinc-600 block mb-1">%</label>
                      <input type="number" value={alloc.percent} onChange={e => { const c=[...allocations]; c[idx].percent=parseInt(e.target.value)||0; setAllocations(c); }}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] text-white focus:outline-none focus:border-[#ef233c]/40" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[8px] font-black uppercase text-zinc-600 block mb-1">Description</label>
                      <input value={alloc.desc} onChange={e => { const c=[...allocations]; c[idx].desc=e.target.value; setAllocations(c); }}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] text-white focus:outline-none focus:border-[#ef233c]/40" />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-zinc-600 block mb-1">Icon</label>
                      <input value={alloc.icon} onChange={e => { const c=[...allocations]; c[idx].icon=e.target.value; setAllocations(c); }}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] text-white focus:outline-none focus:border-[#ef233c]/40" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-[#ef233c] hover:bg-[#d90429] text-white rounded-xl text-xs font-black transition-all disabled:opacity-50 shadow-lg shadow-[#ef233c]/25">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}
