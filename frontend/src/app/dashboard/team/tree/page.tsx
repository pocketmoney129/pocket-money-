"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../../services/api";
import { ReferralTree, TreeNode } from "../../../../components/ReferralTree";
import { Loader2, User, ShieldCheck, Award, X, Calendar, Mail, Users, CheckCircle2, Copy, Check } from "lucide-react";

export default function GenealogyPage() {
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TreeNode | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTree = async () => {
    try {
      setLoading(true);
      const res = await api.get("/user/genealogy");
      if (res.success) {
        setTreeData(res.data);
      }
    } catch (err) {
      console.error("Error loading genealogy tree:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const handleCopyCode = (code: string) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 font-sans text-zinc-300 relative pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-manrope flex items-center gap-2">
          <ShieldCheck className="text-[#ef233c]" size={24} /> 3D Network Genealogy Tree
        </h2>
        <p className="text-xs text-zinc-450 font-semibold mt-1">
          Explore your direct referrals and 3D downline tree nodes. Click any 3D node icon to view detailed member insights!
        </p>
      </div>

      {/* 3D TREE CONTAINER CANVAS */}
      <div className="overflow-auto min-h-[500px] flex items-center justify-center relative py-4">
        {loading ? (
          <div className="flex items-center justify-center relative z-10 py-16">
            <Loader2 className="animate-spin text-[#ef233c]" size={36} />
          </div>
        ) : !treeData ? (

          <p className="text-sm text-zinc-500 font-semibold relative z-10">Failed to load genealogy structure.</p>
        ) : (
          <div className="py-12 px-8 min-w-max relative z-10">
            <ReferralTree node={treeData} isRoot={true} onSelectNode={(node) => setSelectedMember(node)} />
          </div>
        )}
      </div>

      {/* MEMBER DETAIL POPUP MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-[0_0_50px_rgba(239,35,60,0.15)] relative overflow-hidden">
            {/* Header / Close */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center">
                  <User size={16} className="text-[#ef233c]" />
                </div>
                <h3 className="font-black text-sm text-white font-manrope">Referral Member Details</h3>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Member Profile Card */}
            <div className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-2xl flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                selectedMember.status === "active"
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500"
              }`}>
                <User size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-black text-white truncate font-manrope">{selectedMember.name}</h4>
                <p className="text-xs font-mono font-semibold text-zinc-400">@{selectedMember.username}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                    selectedMember.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-zinc-900 text-zinc-500 border-zinc-800"
                  }`}>
                    {selectedMember.status === "active" ? "ACTIVE USER" : "INACTIVE"}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold">
                    {selectedMember.packageName || "No Package"}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid Information Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Referral ID</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-xs">{selectedMember.referralCode || `@${selectedMember.username}`}</span>
                  {selectedMember.referralCode && (
                    <button onClick={() => handleCopyCode(selectedMember.referralCode!)} className="text-[#ef233c] hover:text-white">
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Direct Team</span>
                <span className="font-mono font-bold text-emerald-400 text-xs flex items-center gap-1">
                  <Users size={12} /> {selectedMember.childrenCount || selectedMember.children?.length || 0} Directs
                </span>
              </div>

              <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Active Package</span>
                <span className="font-bold text-white text-xs flex items-center gap-1">
                  <Award size={12} className="text-[#ef233c]" /> {selectedMember.packageName || "No Active Plan"}
                </span>
              </div>

              <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-2xl space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Join Date</span>
                <span className="font-mono text-zinc-300 text-xs flex items-center gap-1">
                  <Calendar size={12} /> {selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString("en-IN") : "Member"}
                </span>
              </div>
            </div>

            {/* Email info if present */}
            {selectedMember.email && (
              <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-2xl flex items-center gap-2 text-xs">
                <Mail size={14} className="text-zinc-500" />
                <span className="text-zinc-300 truncate font-semibold">{selectedMember.email}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedMember(null)}
                className="w-full py-3 bg-[#ef233c] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
              >
                Close Member Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
