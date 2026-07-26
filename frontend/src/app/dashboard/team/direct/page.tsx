"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import { 
  Users, 
  Loader2, 
  Award, 
  Mail, 
  Phone, 
  Calendar, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Send, 
  MessageSquare, 
  TrendingUp 
} from "lucide-react";

interface DirectMember {
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

export default function ReferAndEarn() {
  const { user } = useAuth();
  const [members, setMembers] = useState<DirectMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Copy and Share states
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchDirectTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get("/user/team?level=1");
      if (res.success) {
        setMembers(res.data.members);
      }
    } catch (err) {
      console.error("Error loading direct team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectTeam();
  }, []);

  const getReferralLink = () => {
    if (typeof window !== "undefined" && user?.referralCode) {
      return `${window.location.origin}/register?ref=${user.referralCode}`;
    }
    return "";
  };

  const copyReferralLink = () => {
    const link = getReferralLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const shareToWhatsapp = () => {
    const link = getReferralLink();
    if (link) {
      const text = `Join Pocket Money and start earning passive income returns! Register using my sponsor link: ${link}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const shareToTelegram = () => {
    const link = getReferralLink();
    if (link) {
      const text = `Join Pocket Money and start earning passive income returns! Register using my sponsor link: ${link}`;
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const getStatusClass = (status: string) => {
    const styles = {
      active: "bg-emerald-500/10 text-emerald-450 border-emerald-500/20",
      inactive: "bg-zinc-900 border-zinc-850 text-zinc-450",
      suspended: "bg-rose-500/10 text-rose-455 border-rose-500/20"
    };
    return styles[status as keyof typeof styles] || "bg-zinc-900 border-zinc-850 text-zinc-400";
  };

  return (
    <div className="space-y-8 font-sans text-zinc-300 relative">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-manrope">Refer & Earn Dashboard</h2>
        <p className="text-xs text-zinc-450 font-semibold mt-1">Share your unique sponsor credentials to earn direct commission and multi-level split commissions.</p>
      </div>

      {/* Refer & Gateway Control desk */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Referral Card */}
        <div className="lg:col-span-2 bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6">
          <h3 className="font-extrabold text-base text-white flex items-center gap-2 border-b border-zinc-900 pb-4 font-manrope">
            <Share2 className="text-[#ef233c]" size={18} /> Invite Your Friends
          </h3>

          <div className="space-y-4">
            {/* Referral Link */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Your Sponsor Referral Link</label>
              <div className="bg-zinc-900/60 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
                <p className="text-sm font-semibold text-white truncate font-mono select-all">{getReferralLink() || "Loading..."}</p>
                <button
                  onClick={copyReferralLink}
                  className="p-2.5 bg-zinc-800 border border-zinc-850 rounded-xl hover:bg-zinc-750 text-white transition-colors shrink-0"
                >
                  {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-zinc-400" />}
                </button>
              </div>
            </div>

            {/* Sponsor Code & Share */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sponsor Code</label>
                <div className="bg-zinc-900/60 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
                  <p className="text-sm font-black text-[#ef233c] tracking-widest font-mono select-all">{user?.referralCode || "..."}</p>
                  <button
                    onClick={copyReferralCode}
                    className="p-2.5 bg-zinc-800 border border-zinc-850 rounded-xl hover:bg-zinc-750 text-white transition-colors shrink-0"
                  >
                    {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-zinc-400" />}
                  </button>
                </div>
              </div>

              {/* Social Channels share */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Social Quick Share</label>
                <div className="grid grid-cols-2 gap-2 h-[52px]">
                  <button
                    onClick={shareToWhatsapp}
                    className="h-full flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/25 rounded-2xl text-[#25D366] text-xs font-bold transition-all shadow-sm"
                  >
                    <MessageSquare size={16} /> WhatsApp
                  </button>
                  <button
                    onClick={shareToTelegram}
                    className="h-full flex items-center justify-center gap-2 bg-[#0088cc]/10 border border-[#0088cc]/20 hover:bg-[#0088cc]/25 rounded-2xl text-[#0088cc] text-xs font-bold transition-all shadow-sm"
                  >
                    <Send size={16} /> Telegram
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Invite Card */}
        <div className="bg-zinc-950 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between items-center text-center space-y-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-white text-sm flex items-center justify-center gap-1.5 font-manrope">
              <QrCode size={16} className="text-cyan-400" /> Sponsor QR Code
            </h3>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase">Scan to sign up directly</p>
          </div>

          <div className="p-3 bg-white rounded-2xl shadow-lg border border-zinc-100 flex items-center justify-center w-36 h-36">
            <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-90">
              <div className="bg-black rounded-sm border-2 border-black"></div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-zinc-100 rounded-sm"></div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-black rounded-sm border-2 border-black"></div>
              <div className="bg-zinc-100 rounded-sm"></div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-zinc-100 rounded-sm"></div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-zinc-100 rounded-sm"></div>
              <div className="bg-[#ef233c] rounded-md flex items-center justify-center text-white font-black text-[9px] shadow-sm">P</div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-zinc-100 rounded-sm"></div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-zinc-100 rounded-sm"></div>
              <div className="bg-black rounded-sm border-2 border-black"></div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-zinc-100 rounded-sm"></div>
              <div className="bg-black rounded-sm"></div>
              <div className="bg-black rounded-sm border-2 border-black"></div>
            </div>
          </div>

          <span className="text-[10px] text-zinc-550 font-bold font-mono">CODE: {user?.referralCode}</span>
        </div>
      </div>

      {/* Rewards Commission Matrix */}
      <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6">
        <h3 className="font-extrabold text-base text-white flex items-center gap-2 border-b border-zinc-900 pb-4 font-manrope">
          <TrendingUp className="text-[#ef233c]" size={18} /> MLM Level Earnings Split Model
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { level: "Direct Referral (L1)", commission: "10%", desc: "Direct sponsor bonus payout" },
            { level: "Level 2 Downline", commission: "5%", desc: "Indirect referral tier bonus" },
            { level: "Level 3 Downline", commission: "3%", desc: "Network generation yield" },
            { level: "Level 4 Downline", commission: "2%", desc: "Network expansion split" },
            { level: "Level 5 Downline", commission: "1%", desc: "Deep levels network split" },
            { level: "Level 6 Downline", commission: "1%", desc: "Deep levels network split" }
          ].map((item, index) => (
            <div key={index} className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-900/60 shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:border-zinc-800 transition-all flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-zinc-550 uppercase font-black block tracking-wider">{item.level}</span>
                <span className="text-2xl font-black text-white mt-3 block">{item.commission}</span>
              </div>
              <p className="text-[10px] text-zinc-450 font-medium leading-relaxed mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Referrals List */}
      <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <h3 className="font-extrabold text-lg text-white mb-6 font-manrope flex items-center gap-2">
          <Users className="text-[#ef233c]" /> Direct Referrals List (Level 1)
        </h3>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-[#ef233c]" size={28} />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Users className="text-zinc-700 mx-auto" size={40} />
            <p className="text-sm text-zinc-400 font-semibold">You have not referred any direct members yet.</p>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">Use the sponsor tools above to invite partners and build your downlines team.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Username</th>
                  <th className="pb-3">Contact Details</th>
                  <th className="pb-3">Active Plan</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-350">
                {members.map((member) => (
                  <tr key={member._id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 font-bold text-white text-xs">{member.name}</td>
                    <td className="py-4 text-xs font-semibold text-[#ef233c]">@{member.username}</td>
                    <td className="py-4 space-y-1 text-xs">
                      <p className="text-zinc-400 flex items-center gap-1.5 font-medium"><Mail size={12} className="text-zinc-550" /> {member.email}</p>
                      <p className="text-zinc-400 flex items-center gap-1.5 font-medium"><Phone size={12} className="text-zinc-550" /> {member.phone}</p>
                    </td>
                    <td className="py-4">
                      {member.activePackage ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/20 text-[#ef233c] text-[9px] font-bold">
                          <Award size={12} /> {member.activePackage.name}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-550 font-semibold italic">No Active Plan</span>
                      )}
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider uppercase ${getStatusClass(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-zinc-500 font-semibold">
                      <span className="flex items-center gap-1.5 mt-0.5"><Calendar size={12} /> {new Date(member.createdAt).toLocaleDateString()}</span>
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
