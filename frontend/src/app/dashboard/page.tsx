"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { StatsCard } from "../../components/StatsCard";
import {
  Wallet,
  TrendingUp,
  Users,
  Copy,
  Check,
  Package,
  Calendar,
  Clock,
  Volume2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  Send,
  MessageSquare,
  HelpCircle,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  QrCode,
  Award,
  Shield,
  Loader2,
  ExternalLink,
  CheckCircle
} from "lucide-react";

interface SummaryStats {
  walletBalance: number;
  totalIncome: number;
  todayIncome: number;
  referralIncome: number;
  downlineIncome: number;
  totalWithdrawn?: number;
  directMembers: number;
  totalTeam: number;
  analytics?: {
    weekly: { label: string; income: number }[];
    monthly: { label: string; income: number }[];
  };
  breakdown: {
    directIncome: number;
    levelIncome: number;
  };
}


interface UserPlan {
  _id: string;
  packageName: string;
  purchasePrice: number;
  dailyRoi: number;
  totalReturn: number;
  expiryDays: number;
  roiDaysCompleted: number;
  activatedAt: string;
  status: "active" | "expired";
}

interface PackageItem {
  _id: string;
  name: string;
  price: number;
  directCommission: number;
  levelCommissions: number[];
  description: string;
}

interface TxItem {
  _id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function DashboardOverview() {
  const { user, syncProfile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [recentTxs, setRecentTxs] = useState<TxItem[]>([]);
  const [myPlans, setMyPlans] = useState<UserPlan[]>([]);
  const [copied, setCopied] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  
  // UI Interactive States
  const [showQrModal, setShowQrModal] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [chartPeriod, setChartPeriod] = useState<"weekly" | "monthly">("weekly");

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true);
      const [statsRes, pkgsRes, txsRes, plansRes] = await Promise.all([
        api.get("/transactions/summary"),
        api.get("/user/packages"),
        api.get("/transactions?limit=5"),
        api.get("/user/my-plans")
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (pkgsRes.success) setPackages(pkgsRes.data);
      if (txsRes.success) setRecentTxs(txsRes.data.transactions);
      if (plansRes.success) setMyPlans(plansRes.data.activePlans || []);
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const copyReferralLink = () => {
    if (typeof window !== "undefined" && user?.referralCode) {
      const link = `${window.location.origin}/register?ref=${user.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePurchasePackage = async (pkgId: string) => {
    router.push(`/dashboard/deposit?packageId=${pkgId}`);
  };

  // Derived rank calculation
  const getDerivedRank = () => {
    const directs = stats?.directMembers || 0;
    const team = stats?.totalTeam || 0;
    if (team >= 500) return { name: "Diamond Ambassador", color: "text-cyan-400" };
    if (team >= 100) return { name: "Platinum Director", color: "text-rose-400" };
    if (team >= 25) return { name: "Gold Executive", color: "text-amber-400" };
    if (directs >= 10) return { name: "Silver Leader", color: "text-zinc-300" };
    return { name: "Active Member", color: "text-zinc-400" };
  };

  // Maps package name to landing page ROI metadata
  const getPackageDetails = (name: string) => {
    const cleanName = name.toLowerCase();
    if (cleanName.includes("basic")) {
      return { daily: 32, total: 800, returnPercent: "60%", expiry: "25 Days", badge: "Starter" };
    } else if (cleanName.includes("medium")) {
      return { daily: 66, total: 1650, returnPercent: "65%", expiry: "25 Days", badge: "Standard" };
    } else if (cleanName.includes("advance")) {
      return { daily: 136, total: 3400, returnPercent: "70%", expiry: "25 Days", badge: "Popular" };
    } else if (cleanName.includes("bronze")) {
      return { daily: 288, total: 7200, returnPercent: "80%", expiry: "25 Days", badge: "Recommended" };
    } else if (cleanName.includes("silver")) {
      return { daily: 592, total: 14800, returnPercent: "85%", expiry: "25 Days", badge: "Premium" };
    } else if (cleanName.includes("gold")) {
      return { daily: 1140, total: 28500, returnPercent: "90%", expiry: "25 Days", badge: "VIP Elite" };
    } else if (cleanName.includes("diamond")) {
      return { daily: 2340, total: 58500, returnPercent: "95%", expiry: "25 Days", badge: "Top Tier" };
    } else if (cleanName.includes("platinum")) {
      return { daily: 4000, total: 100000, returnPercent: "100%", expiry: "25 Days", badge: "Ultimate VIP" };
    }
    return { daily: 0, total: 0, returnPercent: "0%", expiry: "25 Days", badge: "MLM Node" };
  };

  const currentRank = getDerivedRank();

  const getTxTypeBadge = (type: string) => {
    const badges: { [key: string]: string } = {
      deposit: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      withdrawal: "bg-rose-500/10 text-rose-450 border-rose-500/20",
      package_purchase: "bg-blue-500/10 text-blue-450 border-blue-500/20",
      direct_income: "bg-indigo-500/10 text-indigo-450 border-indigo-500/20",
      level_income: "bg-purple-500/10 text-purple-450 border-purple-500/20",
      manual_adjustment: "bg-zinc-900 border-zinc-800 text-zinc-350"
    };
    return badges[type] || "bg-zinc-900 text-zinc-400 border-zinc-850";
  };

  // Real Weekly / Monthly Chart Points from Database
  const weeklyData = (stats?.analytics?.weekly && stats.analytics.weekly.length > 0)
    ? stats.analytics.weekly
    : [
        { label: "Mon", income: 0 },
        { label: "Tue", income: 0 },
        { label: "Wed", income: 0 },
        { label: "Thu", income: 0 },
        { label: "Fri", income: 0 },
        { label: "Sat", income: 0 },
        { label: "Sun", income: 0 }
      ];

  const monthlyData = (stats?.analytics?.monthly && stats.analytics.monthly.length > 0)
    ? stats.analytics.monthly
    : [
        { label: "Week 1", income: 0 },
        { label: "Week 2", income: 0 },
        { label: "Week 3", income: 0 },
        { label: "Week 4", income: 0 }
      ];

  const activeChartData = chartPeriod === "weekly" ? weeklyData : monthlyData;
  const maxVal = Math.max(...activeChartData.map(d => d.income), 100);


  const faqs = [
    {
      q: "How does the referral bonus commission system work?",
      a: "When your direct invitee signs up and purchases an activation package, you immediately receive up to 15% sponsor income. Secondary downlines down to Level 6 credit up to 8% level commission automatically."
    },
    {
      q: "What is the minimum withdrawal request size?",
      a: "Withdrawals can be requested 24/7 with a minimum threshold of ₹120. A standard processing transaction fee of 10% is applied to support pool health."
    },
    {
      q: "How long does it take for deposit submissions to credit?",
      a: "UTR deposit logs are cross-checked by our verification admin desk. Typical reviews are completed within 1 to 2 hours of upload."
    }
  ];

  return (
    <div className="space-y-8 font-sans text-zinc-350 relative pb-12">
      {/* Floating Ambient background blur */}
      <div className="absolute top-12 left-10 w-[350px] h-[350px] bg-[#ef233c]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-40 right-20 w-[400px] h-[400px] bg-[#ef233c]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Greeting Banner */}
      <div className="bg-zinc-950/80 backdrop-blur-md rounded-3xl p-6 border border-zinc-900 text-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1.5 relative z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ef233c] bg-[#ef233c]/10 px-3 py-1 rounded-full border border-[#ef233c]/20">
            System Ledger Dashboard
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white font-manrope pt-1.5">Welcome back, {user?.name}!</h2>
          <p className="text-xs text-zinc-450 font-medium">Build your genealogy network, activate packages, and track earnings instantly.</p>
        </div>

        {/* User Badge Details */}
        <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto">
          <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-2xl flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-[9px] text-zinc-550 font-bold uppercase">Profile Security</p>
              <p className="text-xs text-white font-bold">{user?.kyc?.status === "approved" ? "KYC Approved" : "KYC Pending"}</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-2xl flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 text-[#ef233c] flex items-center justify-center">
              <Award size={18} />
            </div>
            <div>
              <p className="text-[9px] text-zinc-550 font-bold uppercase">Achieved Rank</p>
              <p className={`text-xs font-black ${currentRank.color}`}>{currentRank.name}</p>
            </div>
          </div>
        </div>
      </div>



      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-455 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check size={16} /> {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Volume2 size={16} /> {actionError}
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Withdrawable Balance"
          value={`₹${stats?.walletBalance?.toLocaleString() || "0"}`}
          icon={Wallet}
          color="blue"
          description={`Available 24/7 | Total Withdrawn: ₹${(stats?.totalWithdrawn || 0).toLocaleString()}`}
        />

        <StatsCard
          title="Total Earnings"
          value={`₹${stats?.totalIncome?.toLocaleString() || "0"}`}
          icon={TrendingUp}
          color="emerald"
          description="Lifetime total — ROI + referral + downline commissions"
        />
        <StatsCard
          title="Today's Income"
          value={`₹${stats?.todayIncome?.toLocaleString() || "0"}`}
          icon={DollarSign}
          color="purple"
          description="Daily ROI + referral commissions earned today"
        />
        <StatsCard
          title="Referral Income"
          value={`₹${stats?.referralIncome?.toLocaleString() || "0"}`}
          icon={Share2}
          color="amber"
          description="Total direct sponsor commissions earned ever"
        />
        <StatsCard
          title="Downline Income"
          value={`₹${stats?.downlineIncome?.toLocaleString() || "0"}`}
          icon={Users}
          color="blue"
          description="Level 2+ team commissions from your network"
        />
        <StatsCard
          title="Active Plans"
          value={`${myPlans.length} Plan${myPlans.length !== 1 ? "s" : ""}`}
          icon={Package}
          color="emerald"
          description={
            myPlans.length > 0
              ? `Total Daily ROI: ₹${myPlans.reduce((sum, p) => sum + (p.dailyRoi || getPackageDetails(p.packageName).daily), 0).toLocaleString()}/day`
              : "Buy a plan to start earning daily ROI"
          }
        />
        <StatsCard
          title="Direct Members"
          value={`${stats?.directMembers || 0} Members`}
          icon={Users}
          color="purple"
          description="Referral partners connected directly under you"
        />
        <StatsCard
          title="Total Team Size"
          value={`${stats?.totalTeam || 0} Downlines`}
          icon={Users}
          color="blue"
          description="Network width across Level 1 to Level 6"
        />
        <StatsCard
          title="Promotion Rank"
          value={currentRank.name}
          icon={Award}
          color="amber"
          description="Achieved milestones based on downlines"
        />
        <StatsCard
          title="KYC Status Badge"
          value={user?.kyc?.status === "approved" ? "Verified" : user?.kyc?.status === "pending" ? "Pending Approval" : "ID Required"}
          icon={Shield}
          color="blue"
          description="Submit government ID under Profile to verify"
        />
      </div>

      {/* Active Plans Section */}
      {myPlans.length > 0 && (
        <div className="bg-zinc-950/80 backdrop-blur-md rounded-3xl p-6 border border-zinc-900 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Package size={14} className="text-[#ef233c]" /> Active Plans — Daily ROI Running
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              ₹{myPlans.reduce((sum, p) => sum + (p.dailyRoi || getPackageDetails(p.packageName).daily), 0).toLocaleString()}/day total
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myPlans.map((plan) => {
              const planDailyRoi = plan.dailyRoi || getPackageDetails(plan.packageName).daily;
              const progress = Math.min(100, Math.round(((plan.roiDaysCompleted || 0) / (plan.expiryDays || 25)) * 100));
              const daysLeft = (plan.expiryDays || 25) - (plan.roiDaysCompleted || 0);
              const activatedDate = plan.activatedAt ? new Date(plan.activatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Active";
              return (
                <div key={plan._id} className="bg-zinc-900 border border-zinc-850 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-white">{plan.packageName}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Bought: {activatedDate}</p>
                    </div>
                    <span className="text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full whitespace-nowrap">ACTIVE</span>
                  </div>

                  <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                    <span>Daily ROI</span>
                    <span className="text-emerald-400 font-black">₹{planDailyRoi.toLocaleString()}/day</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-zinc-500 font-semibold">
                      <span>Day {plan.roiDaysCompleted || 0} of {plan.expiryDays || 25}</span>
                      <span>{daysLeft} days left</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ef233c] to-emerald-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] font-semibold pt-1 border-t border-zinc-800">
                    <span className="text-zinc-500">Total Return</span>
                    <span className="text-white font-black">₹{(planDailyRoi * (plan.expiryDays || 25)).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Main Flex-Grid Section */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Referral Sharing Center (Col-span 1) */}
        <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-900 shadow-xl space-y-6 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2 font-manrope">
              <Share2 className="text-[#ef233c]" size={18} /> Referral Center
            </h3>
            <p className="text-xs text-zinc-450 leading-relaxed font-light">
              Invite friends using your unique referral code. On successful plan activations, earn up to 10% instant commission plus 5 levels of downline splits.
            </p>

            <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-2xl space-y-2">
              <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider block">Your Referral Code</span>
              <div className="flex items-center justify-between gap-3">
                <span className="text-base text-white font-mono font-black tracking-widest">{user?.referralCode || "N/A"}</span>
                <button
                  onClick={copyReferralLink}
                  className="px-3 py-1.5 bg-[#ef233c] hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-900">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Quick Share Links</span>
            <div className="flex gap-2">
              <a
                href={`https://api.whatsapp.com/send?text=Register%20on%20Pocket%20Money%20using%20my%20link:%20${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/register?ref=${user?.referralCode}` : "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors block"
              >
                WhatsApp
              </a>
              <a
                href={`https://telegram.me/share/url?url=${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/register?ref=${user?.referralCode}` : "")}&text=Register%20on%20Pocket%20Money`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 text-center bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-colors block"
              >
                Telegram
              </a>
            </div>
            <button
              onClick={() => setShowQrModal(true)}
              className="w-full py-3 border border-zinc-850 hover:bg-zinc-900 text-zinc-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <QrCode size={14} /> View Invite QR Code
            </button>
          </div>
        </div>

        {/* Earning Analytics Line Chart (Col-span 2) */}
        <div className="lg:col-span-2 bg-zinc-950 rounded-3xl p-6 border border-zinc-900 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 font-manrope">
                <TrendingUp className="text-[#ef233c]" size={18} /> Earnings Growth Analytics
              </h3>
              <p className="text-xs text-zinc-450">Visual chart ledger of direct and level income streams</p>
            </div>
            
            <div className="flex bg-zinc-900 border border-zinc-850 p-1 rounded-xl">
              <button
                onClick={() => setChartPeriod("weekly")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chartPeriod === "weekly" ? "bg-[#ef233c] text-white" : "text-zinc-400 hover:text-white"}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setChartPeriod("monthly")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chartPeriod === "monthly" ? "bg-[#ef233c] text-white" : "text-zinc-400 hover:text-white"}`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Premium Animated SVG Chart */}
          <div className="h-64 relative bg-zinc-950/40 rounded-2xl border border-zinc-900/60 p-4 flex items-end justify-between overflow-hidden">
            {/* Chart grids background */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-[0.03]">
              <div className="w-full h-[1px] bg-white" />
              <div className="w-full h-[1px] bg-white" />
              <div className="w-full h-[1px] bg-white" />
              <div className="w-full h-[1px] bg-white" />
            </div>

            {/* Render bar graphic representation */}
            <div className="w-full h-full flex items-end justify-around gap-2 pt-8 z-10">
              {activeChartData.map((item, idx) => {
                const percent = (item.income / maxVal) * 80;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                    {/* Hover Info Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 bg-zinc-900 border border-zinc-800 text-[10px] text-white font-mono px-2 py-1 rounded-lg transition-opacity whitespace-nowrap mb-1 flex items-center gap-1 shadow-2xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef233c]" /> ₹{item.income.toLocaleString()}
                    </div>
                    {/* Glowing bar graph */}
                    <div 
                      className="w-full max-w-[28px] bg-gradient-to-t from-[#ef233c]/15 to-[#ef233c] rounded-t-lg transition-all duration-700 relative overflow-hidden border-t border-[#ef233c]/35 shadow-[0_0_15px_rgba(239,35,60,0.1)] group-hover:scale-105"
                      style={{ height: `${Math.max(percent, 8)}%` }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.1),transparent)]" />
                    </div>
                    {/* X-Axis label */}
                    <span className="text-[10px] text-zinc-550 font-bold group-hover:text-white transition-colors">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Ledgers & FAQ Accordions */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-900 shadow-xl flex flex-col">
          <h3 className="font-extrabold text-lg text-white mb-6 flex items-center gap-2 font-manrope">
            <Clock className="text-[#ef233c]" /> Recent Activity Ledgers
          </h3>

          <div className="overflow-x-auto flex-grow">
            {recentTxs.length === 0 ? (
              <p className="text-sm text-zinc-500 font-semibold py-8 text-center">No transaction records found.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-550 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-350">
                  {recentTxs.map((tx) => (
                    <tr key={tx._id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider uppercase ${getTxTypeBadge(tx.type)}`}>
                          {tx.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 text-xs font-semibold text-white">{tx.description}</td>
                      <td className={`py-3 font-bold text-xs ${tx.amount > 0 ? "text-emerald-400" : "text-rose-500"}`}>
                        {tx.amount > 0 ? `+₹${tx.amount.toLocaleString()}` : `-₹${Math.abs(tx.amount).toLocaleString()}`}
                      </td>
                      <td className="py-3 text-xs text-zinc-550 font-medium">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Support widget & FAQ accordions */}
        <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-900 shadow-xl flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2 font-manrope">
              <HelpCircle className="text-[#ef233c]" size={18} /> Support Center
            </h3>
            <p className="text-xs text-zinc-450 leading-relaxed font-light">
              Quickly resolve queries regarding network referrals, deposit reference checking, or payout processing timelines.
            </p>

            <div className="space-y-3 pt-2">
              {faqs.map((faq, idx) => {
                const isOpen = faqOpenIndex === idx;
                return (
                  <div key={idx} className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/30">
                    <button
                      onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left text-xs font-bold text-white flex justify-between items-center gap-3"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp size={14} className="text-[#ef233c]" /> : <ChevronDown size={14} className="text-zinc-555" />}
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 text-[11px] text-zinc-400 font-light border-t border-zinc-900/40 leading-relaxed bg-zinc-900/10">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <a
            href="/dashboard/support"
            className="w-full py-3.5 bg-zinc-900 border border-zinc-855 hover:bg-[#ef233c] hover:border-transparent text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            Create Help Desk Ticket <ExternalLink size={14} />
          </a>
        </div>

      </div>

      {/* Sharing Invite QR Code Modal Popup */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowQrModal(false)} />
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 max-w-sm w-full relative z-10 text-center space-y-6 shadow-2xl">
            <div className="space-y-1">
              <h4 className="font-extrabold text-white text-base font-manrope">Referral QR Invitation</h4>
              <p className="text-xs text-zinc-450">Scan code to register under your sponsor node</p>
            </div>

            {/* Glowing Mock QR Code Graphic */}
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-[0_0_20px_rgba(239,35,60,0.15)] flex items-center justify-center relative overflow-hidden group">
                {/* Visual Representation of QR Code using styling grid */}
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
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-xl">
                <span className="text-[10px] text-zinc-550 block font-bold uppercase tracking-wider">Referral Code</span>
                <span className="text-sm text-[#ef233c] font-black font-mono tracking-widest">{user?.referralCode}</span>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-3.5 bg-[#ef233c] hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
