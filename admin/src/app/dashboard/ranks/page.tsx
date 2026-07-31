"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../../services/api";
import {
  Trophy, Award, Loader2, Sparkles, Gift, Check, Search, ShieldCheck, UserCheck, AlertCircle, RefreshCw, X
} from "lucide-react";

interface RankUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "suspended";
  walletBalance: number;
  totalDirects: number;
  activePaidDirects: number;
  currentRank: {
    id: string;
    name: string;
    requiredDirects: number;
    bonusAmount: number;
  };
  claimedBonuses: string[];
  eligibleRanks: {
    id: string;
    name: string;
    requiredDirects: number;
    bonusAmount: number;
  }[];
  userBonusTotal: number;
  activePackage: string;
}

const rankBadges: Record<string, string> = {
  bronze: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  silver: "bg-zinc-400/10 text-zinc-300 border-zinc-400/20",
  gold: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  platinum: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  diamond: "bg-[#ef233c]/10 text-[#ef233c] border-[#ef233c]/20",
  crown: "bg-purple-500/10 text-purple-400 border-purple-500/20"
};

export default function AdminRanksPage() {
  const [users, setUsers] = useState<RankUser[]>([]);
  const [totalAchievers, setTotalAchievers] = useState(0);
  const [totalDistributed, setTotalDistributed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [distributingKey, setDistributingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchRanks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/ranks");
      if (res.success) {
        setUsers(res.data.rankUsers);
        setTotalAchievers(res.data.totalAchieversCount);
        setTotalDistributed(res.data.totalBonusesDistributed);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load rank data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanks();
  }, [fetchRanks]);

  const handleDistribute = async (userId: string, rankId: string, rankName: string, bonusAmount: number) => {
    const key = `${userId}-${rankId}`;
    setDistributingKey(key);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post("/admin/ranks/distribute", { userId, rankId });
      if (res.success) {
        setSuccess(`🎉 Approved & Credited ₹${bonusAmount.toLocaleString()} ${rankName} Bonus! User has been notified.`);
        fetchRanks();
      }
    } catch (e: any) {
      setError(e.message || "Distribution failed");
    } finally {
      setDistributingKey(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 font-sans">
        <Loader2 className="animate-spin text-[#ef233c]" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-zinc-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-manrope flex items-center gap-2">
            <Trophy className="text-[#ef233c]" size={24} /> Rank Progression & Bonus Management
          </h2>
          <p className="text-xs text-zinc-450 font-semibold mt-1">
            Track user active referral counts, rank achievements, and distribute milestone bonuses.
          </p>
        </div>

        <button
          onClick={fetchRanks}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl text-xs font-bold border border-zinc-800 transition-all"
        >
          <RefreshCw size={14} /> Refresh Ranks
        </button>
      </div>

      {error && <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">{error}</div>}
      {success && <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">{success}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-zinc-950/80 rounded-3xl p-6 border border-zinc-900 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            <Trophy size={22} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Rank Achievers</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5 block">{totalAchievers} Users</span>
          </div>
        </div>

        <div className="bg-zinc-950/80 rounded-3xl p-6 border border-zinc-900 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 flex items-center justify-center font-black">
            <Gift size={22} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Bonuses Paid</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5 block">₹{totalDistributed.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-zinc-950/80 rounded-3xl p-6 border border-zinc-900 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ef233c]/10 border border-[#ef233c]/20 text-[#ef233c] flex items-center justify-center font-black">
            <UserCheck size={22} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Qualification Rule</span>
            <span className="text-xs font-bold text-zinc-300 mt-0.5 block">Active Paid Direct Referrals</span>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-900 flex items-center gap-3">
        <Search size={16} className="text-zinc-500" />
        <input
          type="text"
          placeholder="Search member name, username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-white placeholder-zinc-600 w-full"
        />
        {search && <button onClick={() => setSearch("")} className="text-zinc-500 hover:text-white"><X size={14} /></button>}
      </div>

      {/* Ranks Directory Table */}
      <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-4">Member Info</th>
                <th className="pb-4">Plan Status</th>
                <th className="pb-4 text-center">Total Invites</th>
                <th className="pb-4 text-center">Active Paid Directs</th>
                <th className="pb-4">Achieved Rank</th>
                <th className="pb-4">Rank Bonus Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-600 font-semibold">No member rank records match your search.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-4">
                      <p className="font-bold text-white text-sm">{u.name}</p>
                      <p className="text-xs text-[#ef233c] font-mono">@{u.username}</p>
                      <p className="text-[10px] text-zinc-500">{u.email}</p>
                    </td>

                    <td className="py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${
                        u.activePackage === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                      }`}>
                        {u.activePackage}
                      </span>
                    </td>

                    <td className="py-4 text-center font-bold text-zinc-400 font-mono">
                      {u.totalDirects}
                    </td>

                    <td className="py-4 text-center">
                      <span className="inline-flex items-center gap-1 font-mono font-black text-sm text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                        <UserCheck size={14} /> {u.activePaidDirects} Paid
                      </span>
                    </td>

                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-black uppercase ${rankBadges[u.currentRank.id] || "bg-zinc-900 text-zinc-400 border-zinc-800"}`}>
                        <Sparkles size={13} />
                        {u.currentRank.name}
                      </span>
                    </td>

                    <td className="py-4">
                      <div className="space-y-2">
                        {u.eligibleRanks.length > 0 ? (
                          u.eligibleRanks.map(t => {
                            const isDistributing = distributingKey === `${u._id}-${t.id}`;
                            return (
                              <button
                                key={t.id}
                                disabled={isDistributing}
                                onClick={() => handleDistribute(u._id, t.id, t.name, t.bonusAmount)}
                                className="w-full px-3 py-1.5 rounded-xl bg-[#ef233c] hover:bg-red-700 text-white font-bold text-[10px] shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                {isDistributing ? <Loader2 size={12} className="animate-spin" /> : <Gift size={12} />}
                                Credit ₹{t.bonusAmount.toLocaleString()} ({t.name})
                              </button>
                            );
                          })
                        ) : u.claimedBonuses.length > 0 ? (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <Check size={14} /> Bonus Credited (₹{u.userBonusTotal.toLocaleString()})
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-600 font-semibold italic">Requires 5+ Active Paid Directs</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
