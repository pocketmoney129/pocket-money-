"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../../services/api";
import { Users, Loader2, Award, Calendar, Trophy, CheckCircle2, Lock, Gift, ArrowRight, Zap, Sparkles } from "lucide-react";

interface TeamMember {
  _id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  activePackage?: {
    name: string;
    price: number;
  } | null;
}

interface TeamStats {
  directCount: number;
  totalTeamCount: number;
  activeTeamCount: number;
  teamSummary: { level: number; count: number }[];
}

interface RankTier {
  id: string;
  name: string;
  requiredDirects: number;
  bonusAmount: number;
  color: string;
  badgeBg: string;
  description: string;
  isUnlocked: boolean;
  isClaimed: boolean;
  canClaim: boolean;
}

interface RankProgressData {
  activeDirects: number;
  totalDirects: number;
  currentRank: RankTier;
  nextRank: RankTier | null;
  directsNeeded: number;
  progressPercent: number;
  claimedBonuses: string[];
  tiers: RankTier[];
}

export default function LevelTeam() {
  const [level, setLevel] = useState(1);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [rankData, setRankData] = useState<RankProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchLevelTeam = async (lNum: number) => {
    try {
      setLoading(true);
      const [teamRes, rankRes] = await Promise.all([
        api.get(`/user/team?level=${lNum}`),
        api.get(`/user/rank-progress`)
      ]);

      if (teamRes.success) {
        setMembers(teamRes.data.members);
        setStats(teamRes.data.stats);
      }
      if (rankRes.success) {
        setRankData(rankRes.data);
      }
    } catch (err) {
      console.error("Error loading level team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevelTeam(level);
  }, [level]);

  const handleClaimBonus = async (rankId: string) => {
    try {
      setClaiming(rankId);
      setToastMsg(null);
      const res = await api.post("/user/claim-rank-bonus", { rankId });
      if (res.success) {
        setToastMsg({ text: res.message, type: "success" });
        fetchLevelTeam(level);
      } else {
        setToastMsg({ text: res.message || "Failed to claim bonus", type: "error" });
      }
    } catch (err: any) {
      setToastMsg({ text: err.message || "Bonus claim failed", type: "error" });
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="space-y-8 font-sans text-zinc-300 relative pb-12">
      {/* Page Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-manrope flex items-center gap-2">
          <Trophy className="text-[#ef233c]" size={24} /> Rank Progression & Level Downlines
        </h2>
        <p className="text-xs text-zinc-450 font-semibold mt-1">
          Unlock milestone ranks as your active referral network grows and earn instant cash bonuses!
        </p>
      </div>

      {toastMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xl ${
          toastMsg.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        }`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="text-zinc-400 hover:text-white font-mono ml-4">✕</button>
        </div>
      )}

      {/* RANK PROGRESS ROADMAP CARD */}
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-3xl p-6 border border-zinc-900 shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Current Position</span>
              <span className={`inline-flex px-3 py-0.5 rounded-full border text-xs font-black uppercase ${rankData?.currentRank?.badgeBg || "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                <Sparkles size={12} className="mr-1 inline" /> {rankData?.currentRank?.name || "Bronze Member"}
              </span>
            </div>
            <h3 className="text-2xl font-black text-white font-manrope">
              {rankData?.activeDirects || 0} <span className="text-sm font-semibold text-zinc-400">Active Direct Referrals</span>
            </h3>
            {rankData?.nextRank ? (
              <p className="text-xs text-zinc-400">
                Next Rank: <span className="text-white font-bold">{rankData.nextRank.name}</span> — Needs <span className="text-[#ef233c] font-black">{rankData.directsNeeded}</span> more active referral{rankData.directsNeeded !== 1 ? "s" : ""} to unlock <span className="text-emerald-400 font-bold">₹{rankData.nextRank.bonusAmount.toLocaleString()} Bonus</span>!
              </p>
            ) : (
              <p className="text-xs text-emerald-400 font-bold">🏆 Congratulations! You have achieved the highest Crown Legend Rank!</p>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-2xl min-w-[240px] space-y-2 text-right">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Milestone Progress</span>
            <div className="flex items-center justify-end gap-2 text-xl font-black text-white font-mono">
              <span>{rankData?.progressPercent || 0}%</span>
              <Zap size={18} className="text-[#ef233c]" />
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
              <div
                className="bg-gradient-to-r from-[#ef233c] to-amber-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${rankData?.progressPercent || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* VISUAL ROADMAP TIMELINE NODES */}
        <div className="pt-4 border-t border-zinc-900">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-4">Rank Achievement Roadmap</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(rankData?.tiers || []).map((t, idx) => (
              <div key={t.id} className={`p-3 rounded-2xl border transition-all relative ${
                t.isUnlocked 
                  ? "bg-zinc-900/80 border-emerald-500/30 text-white shadow-lg" 
                  : "bg-zinc-950/40 border-zinc-900 text-zinc-600 opacity-70"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono font-bold text-zinc-500">Tier {idx + 1}</span>
                  {t.isUnlocked ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : (
                    <Lock size={12} className="text-zinc-600" />
                  )}
                </div>
                <p className="text-xs font-black text-white truncate">{t.name}</p>
                <p className="text-[10px] font-bold text-[#ef233c] mt-0.5">{t.requiredDirects} Directs</p>
                {t.bonusAmount > 0 && (
                  <p className="text-[10px] font-semibold text-emerald-400 mt-1">₹{t.bonusAmount.toLocaleString()} Bonus</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RANK BONUS CLAIM TIERS GRID */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
          <Gift size={16} className="text-[#ef233c]" /> Rank Achievement Bonuses
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(rankData?.tiers || []).map((tier) => (
            <div key={tier.id} className={`rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-4 ${
              tier.canClaim
                ? "bg-gradient-to-b from-zinc-950 to-zinc-900 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.1)]"
                : tier.isClaimed
                ? "bg-zinc-950/90 border-emerald-500/20 opacity-90"
                : "bg-zinc-950 border-zinc-900"
            }`}>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase ${tier.badgeBg}`}>
                      {tier.name}
                    </span>
                    <h4 className="text-xl font-black text-white font-manrope mt-2">
                      ₹{tier.bonusAmount.toLocaleString()} <span className="text-xs font-semibold text-zinc-400">Cash Bonus</span>
                    </h4>
                  </div>
                  {tier.isClaimed ? (
                    <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={10} /> CLAIMED
                    </span>
                  ) : tier.isUnlocked ? (
                    <span className="text-[9px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full animate-pulse">
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[9px] font-black bg-zinc-900 text-zinc-550 border border-zinc-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Lock size={10} /> LOCKED
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-450 font-medium leading-relaxed">{tier.description}</p>
              </div>

              <div className="pt-3 border-t border-zinc-900">
                {tier.canClaim ? (
                  <button
                    onClick={() => handleClaimBonus(tier.id)}
                    disabled={claiming === tier.id}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-[#ef233c] hover:from-amber-600 hover:to-red-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    {claiming === tier.id ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <>
                        <Gift size={14} /> Claim ₹{tier.bonusAmount.toLocaleString()} Bonus
                      </>
                    )}
                  </button>
                ) : tier.isClaimed ? (
                  <div className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={14} /> Bonus Credited to Wallet
                  </div>
                ) : (
                  <div className="w-full py-2.5 bg-zinc-900 border border-zinc-850 text-zinc-500 font-semibold text-xs rounded-xl text-center">
                    Requires {tier.requiredDirects} Active Referrals
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-900 text-white">
          <p className="text-xs font-bold uppercase text-zinc-500 mb-1">Direct Referrals (Level 1)</p>
          <p className="text-2xl font-black text-white font-manrope">{stats?.directCount || 0}</p>
        </div>
        <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-900 text-white">
          <p className="text-xs font-bold uppercase text-zinc-500 mb-1">Active Team Size</p>
          <p className="text-2xl font-black text-emerald-450 font-manrope">{stats?.activeTeamCount || 0}</p>
        </div>
        <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-900 text-white">
          <p className="text-xs font-bold uppercase text-zinc-500 mb-1">Total Network Size (L1 - L10)</p>
          <p className="text-2xl font-black text-[#ef233c] font-manrope">{stats?.totalTeamCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
