"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { 
  ArrowRight, 
  TrendingUp, 
  Users, 
  Wallet, 
  ShieldCheck, 
  CheckCircle, 
  MessageSquare, 
  ChevronDown, 
  Menu, 
  X,
  Award,
  CircleDollarSign,
  Server,
  Megaphone,
  Code,
  Gift,
  Sparkles,
  Search,
  Trophy,
  Zap,
  Star
} from "lucide-react";


// Client-side animated counter component for premium look
function AnimatedCounter({ target, prefix = "", suffix = "", duration = 1.5 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration]);

  return (
    <span className="font-extrabold tracking-tight">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

const renderLucideIcon = (iconName: string) => {
  const cleanName = iconName.replace("lucide:", "").toLowerCase();
  switch (cleanName) {
    case "wallet":
      return <Wallet size={18} />;
    case "shield-check":
      return <ShieldCheck size={18} />;
    case "server":
      return <Server size={18} />;
    case "megaphone":
      return <Megaphone size={18} />;
    case "code":
      return <Code size={18} />;
    case "gift":
      return <Gift size={18} />;
    case "sparkles":
      return <Sparkles size={18} />;
    default:
      return <TrendingUp size={18} />;
  }
};

export default function Home() {
  const { user } = useAuth();
  const [selectedPackIndex, setSelectedPackIndex] = useState(3); // Default to Bronze (₹3,999)
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [faqSearch, setFaqSearch] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [businessModel, setBusinessModel] = useState<any | null>(null);

  useEffect(() => {
    const fetchBusinessModel = async () => {
      try {
        const res = await api.get("/auth/business-model");
        if (res.success) {
          setBusinessModel(res.data);
        }
      } catch (err) {
        console.error("Error fetching business model:", err);
      }
    };
    fetchBusinessModel();
  }, []);

  const fallbackModel = {
    businessModelTitle: "How Pocket Money Generates Returns",
    businessModelDesc: "Pocket Money aims to generate sustainable business revenue through a diversified portfolio of active digital trade, affiliate operations, and liquidity channels, distributing rewards strictly according to the platform's reward plans.",
    businessModelAllocations: [
      {
        title: "Liquidity Provision Pools",
        percent: 30,
        desc: "Supplying liquidity to secure trading pairs and decentralized exchange pools to yield transaction fees.",
        icon: "lucide:server"
      },
      {
        title: "Affiliate Advertising",
        percent: 25,
        desc: "Funding bulk advertising campaigns and e-commerce channel promotions to generate direct commission rewards.",
        icon: "lucide:megaphone"
      },
      {
        title: "Micro-Lending Channels",
        percent: 20,
        desc: "Allocating micro-capital pools to verified peer networks for structured interest yields.",
        icon: "lucide:shield-check"
      },
      {
        title: "Venture Incubation",
        percent: 15,
        desc: "Investing in high-growth digital startups and early-stage utility applications.",
        icon: "lucide:code"
      },
      {
        title: "Milestone Incentive Pool",
        percent: 10,
        desc: "Reserving capital rewards and leader bonus payouts for active network expansion milestones.",
        icon: "lucide:gift"
      }
    ]
  };

  const model = businessModel || fallbackModel;

  const faqs = [
    {
      q: "What is Pocket Money?",
      a: "Pocket Money is a premium referral-based membership and earning platform designed on a Multi-Level Marketing model. Members can purchase packages to activate their accounts and earn commissions by referring others."
    },
    {
      q: "How does the Referral Income work?",
      a: "When you refer a new member directly using your unique link, and they purchase a package, you receive a direct commission (e.g. up to 15% of the package cost). Furthermore, you earn level commissions on referred members down to 6 levels deep."
    },
    {
      q: "Is KYC mandatory?",
      a: "Yes, to maintain security, compliance, and prevent double spending, KYC verification (uploading a valid government ID) is required before you can request withdrawals."
    },
    {
      q: "What are the withdrawal limits?",
      a: "The minimum withdrawal is $200 and the maximum is $50,000 per request. A flat processing fee of 5% is applied to all successful payouts."
    },
    {
      q: "How do I deposit funds?",
      a: "Simply navigate to the Deposit section on your dashboard, scan the admin UPI QR code or note the bank transfer details, make the transfer via your banking app, enter the transaction reference (UTR) ID, and upload a screenshot proof. The administrator will verify and credit your wallet."
    }
  ];

  const packages = [
    {
      name: "Basic",
      price: 499,
      daily: 32,
      total: 800,
      returnPercent: "60%",
      expiry: "25 Days",
      badge: "Starter",
      description: "Entry level membership to start earning daily.",
      popular: false
    },
    {
      name: "Medium",
      price: 999,
      daily: 66,
      total: 1650,
      returnPercent: "65%",
      expiry: "25 Days",
      badge: "Standard",
      description: "Stepping stone to boost your daily passive earnings.",
      popular: false
    },
    {
      name: "Advance",
      price: 1999,
      daily: 136,
      total: 3400,
      returnPercent: "70%",
      expiry: "25 Days",
      badge: "Popular",
      description: "Most popular tier for standard network members.",
      popular: false
    },
    {
      name: "Bronze",
      price: 3999,
      daily: 288,
      total: 7200,
      returnPercent: "80%",
      expiry: "25 Days",
      badge: "Recommended",
      description: "High returns package with solid profitability ratios.",
      popular: true
    },
    {
      name: "Silver",
      price: 7999,
      daily: 592,
      total: 14800,
      returnPercent: "85%",
      expiry: "25 Days",
      badge: "Premium",
      description: "Premium yield package for active network nodes.",
      popular: false
    },
    {
      name: "Gold",
      price: 14999,
      daily: 1140,
      total: 28500,
      returnPercent: "90%",
      expiry: "25 Days",
      badge: "VIP Elite",
      description: "VIP plan with massive daily return rates.",
      popular: false
    },
    {
      name: "Diamond",
      price: 29999,
      daily: 2340,
      total: 58500,
      returnPercent: "95%",
      expiry: "25 Days",
      badge: "Top Tier",
      description: "Ultimate package for major network team leaders.",
      popular: false
    },
    {
      name: "Platinum",
      price: 49999,
      daily: 4000,
      total: 100000,
      returnPercent: "100%",
      expiry: "25 Days",
      badge: "Ultimate VIP",
      description: "Highest passive income return tier available.",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#ef233c] selection:text-white relative overflow-x-hidden">
      
      {/* Global Background Particles & Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e0101] via-black to-[#0e0101]"></div>
        <div className="absolute top-0 left-0 bg-transparent stars-1"></div>
        <div className="absolute top-0 left-0 bg-transparent stars-2"></div>
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#ef233c]/15 rounded-full blur-[150px] float-glow-1"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#ef233c]/10 rounded-full blur-[130px] float-glow-2"></div>
        <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] bg-[#ef233c]/12 rounded-full blur-[140px] pulse-glow"></div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(circle_at_center,black_50%,transparent_95%)]"></div>
      </div>

      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-black/75 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/logo-icon.png" alt="Pocket Money Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(239,35,60,0.35)]" />
              <span className="font-bold text-xl tracking-tight text-white font-manrope">
                Pocket<span className="text-[#ef233c]">Money</span>
              </span>
            </Link>


            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 text-sm font-semibold text-zinc-400">
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#plan" className="hover:text-white transition-colors">Business Plan</a>
              <a href="#packages" className="hover:text-white transition-colors">Packages</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#ef233c] hover:bg-red-700 text-white shadow-lg shadow-red-600/15 transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white/5 px-6 py-2.5 transition-transform active:scale-95"
                  >
                    <span className="absolute inset-0 border border-white/10 rounded-full"></span>
                    <span className="absolute inset-[-100%] hover-spin-glow bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#ef233c_100%)] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    <span className="absolute inset-[1px] rounded-full bg-black"></span>
                    <span className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                      Get Started <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-zinc-300 p-2 focus:outline-none"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-950 border-b border-zinc-900 px-4 pt-2 pb-6 space-y-3 relative z-50">
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-350 hover:bg-zinc-900"
            >
              About
            </a>
            <a
              href="#plan"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-350 hover:bg-zinc-900"
            >
              Business Plan
            </a>
            <a
              href="#packages"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-350 hover:bg-zinc-900"
            >
              Packages
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-350 hover:bg-zinc-900"
            >
              FAQ
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-350 hover:bg-zinc-900"
            >
              Contact
            </a>
            <div className="pt-4 flex flex-col gap-2">
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-[#ef233c] text-white font-bold text-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-full border border-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-900"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-full bg-[#ef233c] text-white font-bold text-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        
        {/* Hero Section */}
        <section className="relative pt-20 pb-20 sm:pt-32 sm:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef233c]"></span>
                </span>
                <span className="text-xs font-bold text-red-100/90 tracking-wide font-manrope uppercase">
                  Refined Referral Earning System
                </span>
              </div>
              <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6 font-manrope">
                Grow Your Network. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/45">
                  Maximize Your{" "}
                  <span className="text-[#ef233c] inline-block relative">
                    Income
                    <svg className="absolute w-full h-3 -bottom-2 left-0 text-[#ef233c] opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  </span>
                </span>
              </h1>
              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed mb-10 max-w-2xl mx-auto font-light">
                A premium, secure fintech-inspired affiliate network. Secure deposits, immediate payouts, transparent genealogies, and multiple layers of passive referral commissions.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link
                  href="/register"
                  className="shiny-cta w-full sm:w-auto px-8 py-4 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/20"
                >
                  Join Now <ArrowRight size={16} />
                </Link>
                <a
                  href="#plan"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white text-zinc-300 transition-all flex items-center justify-center text-sm uppercase tracking-wider"
                >
                  Explore Business Plan
                </a>
              </div>
            </div>

            {/* Dynamic Mockup Card */}
            <div className="mt-20 max-w-4xl mx-auto rounded-3xl p-[1px] bg-gradient-to-b from-white/10 to-transparent shadow-[0_0_50px_rgba(239,35,60,0.06)]">
              <div className="bg-zinc-950/80 backdrop-blur-md rounded-[23px] p-6 sm:p-8 text-white border border-white/5">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[#ef233c] flex items-center justify-center font-bold text-xs">P</div>
                    <span className="font-extrabold text-xs tracking-wider text-zinc-400 uppercase font-manrope">POCKET MONEY USER PORTAL</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ef233c]/10 text-[#ef233c] text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef233c] animate-pulse" /> Active User
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-zinc-950/80 rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_35px_rgba(239,35,60,0.05)] hover:scale-[1.02] transition-all flex items-start justify-between group overflow-hidden">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Wallet Balance</p>
                      <p className="text-xl sm:text-2xl font-black text-white tracking-tight font-manrope">₹<AnimatedCounter target={1450} />.00</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#ef233c]/10 text-[#ef233c] shrink-0">
                      <Wallet size={16} />
                    </div>
                  </div>
                  <div className="bg-zinc-950/80 rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_35px_rgba(239,35,60,0.05)] hover:scale-[1.02] transition-all flex items-start justify-between group overflow-hidden">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Total Income</p>
                      <p className="text-xl sm:text-2xl font-black text-[#ef233c] tracking-tight font-manrope">₹<AnimatedCounter target={4820} />.00</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#ef233c]/10 text-[#ef233c] shrink-0">
                      <TrendingUp size={16} />
                    </div>
                  </div>
                  <div className="bg-zinc-950/80 rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_35px_rgba(239,35,60,0.05)] hover:scale-[1.02] transition-all flex items-start justify-between group overflow-hidden">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Direct Referrals</p>
                      <p className="text-xl sm:text-2xl font-black text-white tracking-tight font-manrope"><AnimatedCounter target={14} /></p>
                    </div>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#ef233c]/10 text-[#ef233c] shrink-0">
                      <Users size={16} />
                    </div>
                  </div>
                  <div className="bg-zinc-950/80 rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_35px_rgba(239,35,60,0.05)] hover:scale-[1.02] transition-all flex items-start justify-between group overflow-hidden">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Team Size (L1-L6)</p>
                      <p className="text-xl sm:text-2xl font-black text-zinc-300 tracking-tight font-manrope"><AnimatedCounter target={124} /></p>
                    </div>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#ef233c]/10 text-[#ef233c] shrink-0">
                      <Users size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Animated Statistics Counters Section */}
        <section className="py-12 bg-zinc-950/40 border-y border-zinc-900 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 text-center">
                       <div className="p-5 bg-zinc-950/80 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_30px_rgba(239,35,60,0.04)] hover:scale-[1.02] transition-all duration-300">
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight font-manrope"><AnimatedCounter target={24850} suffix="+" /></p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1.5 tracking-wider">Total Members</p>
              </div>

              <div className="p-5 bg-zinc-950/80 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_30px_rgba(239,35,60,0.04)] hover:scale-[1.02] transition-all duration-300">
                <p className="text-xl sm:text-2xl font-black text-[#ef233c] tracking-tight font-manrope"><AnimatedCounter target={18400} suffix="+" /></p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1.5 tracking-wider">Active Members</p>
              </div>

              <div className="p-5 bg-zinc-950/80 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_30px_rgba(239,35,60,0.04)] hover:scale-[1.02] transition-all duration-300">
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight font-manrope"><AnimatedCounter target={12400000} prefix="₹" suffix="+" duration={1.8} /></p>
                <p className="text-[10px] text-zinc-550 font-bold uppercase mt-1.5 tracking-wider">Total Payout</p>
              </div>

              <div className="p-5 bg-zinc-950/80 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_30px_rgba(239,35,60,0.04)] hover:scale-[1.02] transition-all duration-300">
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight font-manrope"><AnimatedCounter target={11850000} prefix="₹" suffix="+" duration={1.8} /></p>
                <p className="text-[10px] text-zinc-555 font-bold uppercase mt-1.5 tracking-wider">Total Withdrawals</p>
              </div>

              <div className="p-5 bg-zinc-950/80 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_30px_rgba(239,35,60,0.04)] hover:scale-[1.02] transition-all duration-300">
                <p className="text-xl sm:text-2xl font-black text-zinc-300 tracking-tight font-manrope"><AnimatedCounter target={28} suffix="+" /></p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1.5 tracking-wider">States Served</p>
              </div>

              <div className="p-5 bg-zinc-950/80 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_30px_rgba(239,35,60,0.04)] hover:scale-[1.02] transition-all duration-300">
                <p className="text-xl sm:text-2xl font-black text-zinc-300 tracking-tight font-manrope"><AnimatedCounter target={3} suffix="+" /></p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1.5 tracking-wider">Years of Service</p>
              </div>

            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 border-t border-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#ef233c] mb-3">About The Platform</h2>
              <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-manrope">
                A Trusted Ecosystem for Network Affiliate Growth
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-900 hover:border-[#ef233c]/20 hover:shadow-[0_0_30px_rgba(239,35,60,0.04)] transition-all group">
                <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-[#ef233c]/20 text-[#ef233c] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <TrendingUp size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Passive Level Income</h3>
                <p className="text-zinc-400 text-sm font-light leading-relaxed">
                  Earn structured referral splits down to 6 independent downline layers automatically on subscription purchase.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-900 hover:border-[#ef233c]/20 hover:shadow-[0_0_30px_rgba(239,35,60,0.04)] transition-all group">
                <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-[#ef233c]/20 text-[#ef233c] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Direct Commissions</h3>
                <p className="text-zinc-400 text-sm font-light leading-relaxed">
                  Get up to 15% upfront direct cash bonus immediately added to your wallet the moment your referral activates.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-900 hover:border-[#ef233c]/20 hover:shadow-[0_0_30px_rgba(239,35,60,0.04)] transition-all group">
                <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-[#ef233c]/20 text-[#ef233c] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Wallet size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Secured Swift Payouts</h3>
                <p className="text-zinc-400 text-sm font-light leading-relaxed">
                  Wallet funds are debited instantly for payout requests, processed and transferred directly to your bank account or UPI.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-900 hover:border-[#ef233c]/20 hover:shadow-[0_0_30px_rgba(239,35,60,0.04)] transition-all group">
                <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-[#ef233c]/20 text-[#ef233c] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Strict Security & KYC</h3>
                <p className="text-zinc-400 text-sm font-light leading-relaxed">
                  Mandatory document checks, transaction reference uniqueness, and double-spend protection keep the pool secure.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Business Plan Section */}
        <section id="plan" className="py-24 bg-zinc-950/30 border-t border-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
              
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#ef233c] mb-3">The Earning Plan</h2>
                <h3 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 font-manrope">
                  Transparent Multi-Level Commission Structure
                </h3>
                <p className="text-zinc-450 mb-8 leading-relaxed font-light">
                  Our model rewards network nodes recursively. Unlike traditional networks, there are no mandatory binary balancing cycles or complex calculations. You receive immediate credits based on the tier price purchased by your direct referrals and downlines.
                </p>
                
                <ul className="space-y-4">
                  {[
                    "Direct referrals activation yields direct commission (10% - 15%)",
                    "Level 2 downline activations yield 5% - 8% depending on package",
                    "Level 3 downline activations yield 3% - 5%",
                    "Level 4 to 6 downline activations yield 1% - 2%",
                    "No caps on the width of direct referrals"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="text-[#ef233c] shrink-0 mt-0.5" size={18} />
                      <span className="text-sm text-zinc-300 font-light">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-12 lg:mt-0 bg-zinc-950 p-6 sm:p-8 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_50px_rgba(239,35,60,0.03)] hover:scale-[1.01] transition-all">
                <h4 className="font-extrabold text-lg text-white mb-8 flex items-center gap-2 font-manrope">
                  <CircleDollarSign className="text-[#ef233c]" /> Commission Flow Example
                </h4>
                <div className="space-y-6 relative">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-zinc-900" />

                  {[
                    { title: "You (Root Admin / Node)", desc: "Earns levels commission downstream", badge: "upline" },
                    { title: "Direct Referral (Level 1)", desc: "Purchases a Gold Tier package. You receive 15% ($150) direct commission.", badge: "direct" },
                    { title: "Level 2 Sub-referral", desc: "Purchases a Gold Tier package. You receive 8% ($80) level commission.", badge: "downline" },
                    { title: "Level 3 Sub-referral", desc: "Purchases a Gold Tier package. You receive 5% ($50) level commission.", badge: "downline" }
                  ].map((step, idx) => (
                    <div key={idx} className="relative pl-10">
                      <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 bg-[#ef233c] ring-4 ring-[#ef233c]/10" />
                      <h5 className="font-bold text-sm text-white flex justify-between items-center">
                        {step.title}
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#ef233c]/10 border border-[#ef233c]/20 text-[#ef233c] font-bold uppercase tracking-wider">{step.badge}</span>
                      </h5>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-light">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Packages Section */}
        <section id="packages" className="py-24 border-t border-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#ef233c] mb-3">Account Activation</h2>
              <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-manrope">
                Flexible Package Tiers Crafted to Scale Your Yields
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
              {packages.map((pack, idx) => (
                <div 
                  key={idx} 
                  className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all ${
                    pack.popular 
                      ? "border border-[#ef233c] bg-zinc-900/40 shadow-[0_15px_40px_rgba(239,35,60,0.12)] scale-105 z-10" 
                      : "bg-zinc-950/80 hover:bg-zinc-900/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_35px_rgba(239,35,60,0.03)] hover:scale-[1.02]"
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#ef233c] text-white text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-lg">
                      Recommended
                    </span>
                  )}
                  
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-extrabold text-lg text-white font-manrope">{pack.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/20 border border-[#ef233c]/15 text-[#ef233c] font-semibold">{pack.badge}</span>
                    </div>
                    <p className="text-[11px] mt-2 leading-relaxed text-zinc-400 font-light">{pack.description}</p>
                    
                    <div className="my-6">
                      <span className="text-3xl font-black font-manrope tracking-tight">₹{pack.price.toLocaleString()}</span>
                      <span className="text-[10px] block mt-1 text-zinc-500 font-medium">One-time activation fee</span>
                    </div>

                    <div className={`border-t my-4 ${pack.popular ? "border-zinc-800/80" : "border-zinc-900"}`} />

                    <ul className="space-y-2.5 text-xs mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="text-[#ef233c] shrink-0" size={14} />
                        <span className="text-zinc-300 font-light">Daily return: <strong className="text-white font-semibold">₹{pack.daily}</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="text-[#ef233c] shrink-0" size={14} />
                        <span className="text-zinc-300 font-light">Total return: <strong className="text-white font-semibold">₹{pack.total}</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="text-[#ef233c] shrink-0" size={14} />
                        <span className="text-zinc-300 font-light">ROI Percent: <strong className="text-white font-semibold">{pack.returnPercent}</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="text-[#ef233c] shrink-0" size={14} />
                        <span className="text-zinc-300 font-light">Expiry: <strong className="text-white font-semibold">{pack.expiry}</strong></span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    href="/register"
                    className={`w-full text-center py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                      pack.popular 
                        ? "bg-[#ef233c] hover:bg-red-750 text-white shadow-md shadow-red-600/20" 
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    }`}
                  >
                    Activate Tier
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Interactive Income Simulator */}
        <section id="simulator" className="py-24 border-t border-zinc-900 bg-zinc-950/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-zinc-950 p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-[#ef233c] to-transparent"></div>
              <h3 className="font-extrabold text-2xl text-white mb-3 font-manrope text-center">Interactive Income Simulator</h3>
              <p className="text-zinc-550 text-xs font-light text-center mb-8 max-w-md mx-auto">
                Select a package to simulate daily passive returns and total maturity payouts.
              </p>

              <div className="space-y-6">
                {/* Package Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-2.5">Select Joining Package</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {packages.map((pkg, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPackIndex(idx)}
                        className={`py-3 px-2 text-xs font-bold rounded-xl transition-all ${
                          selectedPackIndex === idx 
                            ? "bg-[#ef233c]/15 border border-[#ef233c] text-white shadow-[0_4px_15px_rgba(239,35,60,0.15)]" 
                            : "bg-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.3)] text-zinc-400 hover:bg-zinc-850"
                        }`}
                      >
                        ₹{pkg.price.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulation Output */}
                <div className="p-5 rounded-2xl bg-zinc-900/40 shadow-[0_10px_25px_rgba(0,0,0,0.5)] space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 font-medium">Selected Package</span>
                    <span className="text-white font-bold">{packages[selectedPackIndex]?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 font-medium">One-Time Investment</span>
                    <span className="text-white font-bold">₹{packages[selectedPackIndex]?.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 font-medium">Daily Income (ROI)</span>
                    <span className="text-emerald-400 font-bold">₹{packages[selectedPackIndex]?.daily.toLocaleString()} / day</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 font-medium">Return Percentage</span>
                    <span className="text-white font-semibold">{packages[selectedPackIndex]?.returnPercent}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 font-medium">Package Expiry Period</span>
                    <span className="text-zinc-300 font-semibold">{packages[selectedPackIndex]?.expiry}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 font-medium">Net Profit Amount</span>
                    <span className="text-emerald-400 font-bold">₹{((packages[selectedPackIndex]?.total || 0) - (packages[selectedPackIndex]?.price || 0)).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-zinc-800 pt-4 flex justify-between items-center">
                    <span className="text-sm text-zinc-350 font-bold uppercase tracking-wider">Total Maturity Income</span>
                    <span className="text-2xl font-black text-[#ef233c] font-manrope">₹{packages[selectedPackIndex]?.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Milestone Rewards Section */}
        <section id="rewards" className="py-24 border-t border-zinc-900 bg-zinc-950/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#ef233c] mb-3">Milestone Incentives</h2>
              <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-manrope">
                Milestone Rewards & Cash Bonuses
              </p>
              <p className="text-zinc-550 text-sm font-light mt-3 max-w-xl mx-auto">
                Reach structured network milestones with your team and unlock guaranteed premium cash rewards.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { rank: "Silver Leader", requirement: "10 Direct Referrals", reward: "₹1,000 Cash Bonus", icon: Award },
                { rank: "Gold Executive", requirement: "25 Team Members", reward: "₹3,000 Cash Bonus", icon: Trophy },
                { rank: "Platinum Director", requirement: "100 Team Members", reward: "₹10,000 Cash Bonus", icon: Zap },
                { rank: "Diamond Ambassador", requirement: "500 Team Members", reward: "₹50,000 Cash Bonus + Trip", icon: Sparkles }
              ].map((milestone, idx) => {
                const IconComponent = milestone.icon;
                return (
                  <div key={idx} className="p-6 rounded-2xl bg-zinc-950/80 shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_30px_rgba(239,35,60,0.04)] hover:scale-[1.02] transition-all group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-[#ef233c]/15 text-[#ef233c] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                      <IconComponent size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#ef233c] transition-colors">{milestone.rank}</h3>
                    <p className="text-xs text-zinc-500 mb-4 font-light">{milestone.requirement}</p>
                    <p className="text-sm font-black text-emerald-400 font-manrope">{milestone.reward}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Live Leaderboard Section */}
        <section id="leaderboard" className="py-24 border-t border-zinc-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#ef233c] mb-3">Top Earners</h2>
              <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-manrope">
                Live Platform Leaderboard
              </p>
            </div>

            <div className="bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-[#ef233c] to-transparent"></div>
              <div className="space-y-4">
                {[
                  { name: "utsav***", rank: 1, earning: 235400, badge: "Diamond" },
                  { name: "aman_ra***", rank: 2, earning: 184200, badge: "Diamond" },
                  { name: "rohit_s***", rank: 3, earning: 145900, badge: "Platinum" },
                  { name: "prakash_***", rank: 4, earning: 98400, badge: "Gold" },
                  { name: "vip_ear***", rank: 5, earning: 74200, badge: "Silver" }
                ].map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 shadow-[0_4px_15px_rgba(0,0,0,0.35)] hover:shadow-[0_8px_20px_rgba(239,35,60,0.04)] hover:scale-[1.01] hover:bg-zinc-900/60 transition-all">
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                        idx === 0 ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                        idx === 1 ? "bg-slate-350/20 text-slate-350 border border-slate-350/30" :
                        idx === 2 ? "bg-amber-700/20 text-amber-700 border border-amber-700/30" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>{user.rank}</span>
                      <div>
                        <h4 className="font-bold text-sm text-white">{user.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/20 border border-[#ef233c]/15 text-[#ef233c] font-semibold">{user.badge}</span>
                      </div>
                    </div>
                    <span className="font-black text-base text-emerald-400 font-manrope">₹{user.earning.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 border-t border-zinc-900 bg-zinc-950/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#ef233c] mb-3">Testimonials</h2>
              <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-manrope">
                What Our Members Say
              </p>
            </div>

            <div className="bg-zinc-950 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-[#ef233c] to-transparent"></div>
              
              {/* Star Rating */}
              <div className="flex gap-1.5 justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="fill-[#ef233c] text-[#ef233c]" />
                ))}
              </div>

              {/* Feedback text */}
              <p className="text-center text-zinc-350 text-base sm:text-lg italic font-light leading-relaxed mb-8">
                "${[
                  "Pocket Money completely changed my income streams! The ₹3999 Bronze package gave me ₹288 daily, and my team referrals brought in massive level commissions. Payouts are incredibly fast!",
                  "Started with the ₹499 Basic package and upgraded within 2 weeks. The interface is premium, support is available 24/7, and my withdrawal of ₹500 got credited in under 10 minutes.",
                  "This is the most transparent referral model I've seen. No complex binary pairing rules. Just direct 10% and instant one-time level commission. Highly recommend the ₹49999 Platinum package."
                ][testimonialIndex]}"
              </p>

              {/* Author Info */}
              <div className="text-center">
                <h4 className="font-extrabold text-sm text-white">
                  {["Rahul Verma", "Sneha Patel", "Vikram Singh"][testimonialIndex]}
                </h4>
                <p className="text-xs text-[#ef233c] mt-0.5">
                  {["Digital Marketer", "Student", "Network Entrepreneur"][testimonialIndex]}
                </p>
              </div>

              {/* Carousel Dot Indicators */}
              <div className="flex justify-center gap-2 mt-8">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setTestimonialIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      testimonialIndex === idx ? "bg-[#ef233c] w-6" : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* 4.5 How Pocket Money Generates Returns */}
        <section id="transparency" className="py-24 border-t border-zinc-900 bg-zinc-950/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Main Title Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#ef233c] mb-3">Investment & Yield Model</h2>
              <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-manrope">
                How Your Money Works
              </p>
              <p className="text-zinc-500 text-sm font-light mt-3 max-w-2xl mx-auto">
                Discover the complete business cycle showing how package capital generates yield through active platform trades, affiliate operations, and reward distributions.
              </p>
            </div>

            {/* 7-Step Investment Flow Diagram */}
            <div className="mb-20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-8 text-center sm:text-left">The Complete Revenue Generation Cycle</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-stretch relative">
                
                {[
                  {
                    step: "01",
                    title: "Node Activation",
                    desc: "User activates an active earning package node.",
                    icon: "lucide:wallet"
                  },
                  {
                    step: "02",
                    title: "Capital Control",
                    desc: "Funds are pooled securely under our financial system.",
                    icon: "lucide:shield-check"
                  },
                  {
                    step: "03",
                    title: "Asset Allocation",
                    desc: "Capital is distributed into active business channels.",
                    icon: "lucide:server"
                  },
                  {
                    step: "04",
                    title: "Revenue Yield",
                    desc: "Active trades and affiliate channels yield returns.",
                    icon: "lucide:megaphone"
                  },
                  {
                    step: "05",
                    title: "Profit Capture",
                    desc: "Corporate trade profits are accrued back to the system.",
                    icon: "lucide:code"
                  },
                  {
                    step: "06",
                    title: "Distribution",
                    desc: "Profits are split according to the active reward plan.",
                    icon: "lucide:gift"
                  },
                  {
                    step: "07",
                    title: "Withdrawal",
                    desc: "Members withdraw payouts instantly to UPI/Bank.",
                    icon: "lucide:sparkles"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="relative flex flex-col justify-between p-5 rounded-2xl bg-zinc-950 shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_30px_rgba(239,35,60,0.04)] hover:scale-[1.02] transition-all group">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-black text-zinc-800 group-hover:text-[#ef233c]/35 transition-colors font-manrope">{item.step}</span>
                        <div className="w-8 h-8 rounded-lg bg-red-950/20 border border-[#ef233c]/10 text-[#ef233c] flex items-center justify-center text-xs">
                          {renderLucideIcon(item.icon)}
                        </div>
                      </div>
                      <h4 className="font-bold text-white text-xs mb-1.5 uppercase tracking-wide group-hover:text-[#ef233c] transition-colors">{item.title}</h4>
                      <p className="text-zinc-500 text-[10px] leading-relaxed font-light">{item.desc}</p>
                    </div>
                    {/* Next step connector visual line/arrow for xl sizes */}
                    {idx < 6 && (
                      <div className="hidden xl:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gradient-to-r from-red-500/20 to-transparent z-10 translate-y-[-50%]" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Configurable Investment Opportunities Grid */}
            <div className="border-t border-zinc-900 pt-16">
              <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Fund Utilization & Opportunities</h3>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white font-manrope">Active Investment Allocation</p>
                </div>
                <p className="text-zinc-500 text-xs font-light max-w-md leading-relaxed">
                  Below is the real-time capital allocation breakdown showing where platform packages backing assets are distributed to drive company returns.
                </p>
              </div>

              <div className="grid md:grid-cols-12 gap-8 items-stretch">
                
                {/* Left Visual Allocation Gauge */}
                <div className="md:col-span-5 flex flex-col justify-between bg-zinc-950/70 p-6 sm:p-8 rounded-3xl border border-zinc-900 shadow-[0_0_15px_rgba(239,35,60,0.02)] relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ef233c] via-red-500 to-transparent" />
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-400 mb-6 uppercase tracking-wider">Allocation Ratios</h4>
                    <p className="text-zinc-400 text-xs font-light leading-relaxed mb-8">
                      Our system distributes package capital dynamically across active revenue channels. This visual represents current allocation percentages configured under platform governance settings.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {model.businessModelAllocations.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-zinc-350">{item.title}</span>
                          <span className="text-[#ef233c] font-bold">{item.percent}%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#ef233c] rounded-full transition-all duration-1000"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Allocation Cards Grid */}
                <div className="md:col-span-7 grid sm:grid-cols-2 gap-6">
                  {model.businessModelAllocations.map((item: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-900 hover:border-[#ef233c]/20 hover:shadow-[0_0_20px_rgba(239,35,60,0.04)] transition-all flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <div className="w-10 h-10 rounded-lg bg-red-950/30 border border-[#ef233c]/15 text-[#ef233c] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                            {renderLucideIcon(item.icon)}
                          </div>
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#ef233c]/10 text-[#ef233c] border border-[#ef233c]/20 shadow-[0_0_12px_rgba(239,35,60,0.05)]">
                            {item.percent}% Allocation
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm mb-1.5">{item.title}</h4>
                        <p className="text-zinc-550 text-[11px] font-light leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Bottom Transparency Notice Callout */}
            <div className="mt-16 bg-zinc-950 border border-zinc-900 p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-4 max-w-4xl mx-auto shadow-md">
              <div className="w-12 h-12 rounded-full bg-red-950/20 text-[#ef233c] flex items-center justify-center shrink-0 border border-[#ef233c]/25">
                <ShieldCheck size={22} />
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compliance & Transparency Statement</h4>
                <p className="text-zinc-500 text-[11px] leading-relaxed font-light">
                  Pocket Money aims to generate sustainable business revenue through its diversified trade and affiliate investments. All rewards and income incentives are distributed strictly in accordance with platform rules and activated tier rates. Membership activations support platform expansion, operations, and capital liquidity pools.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-zinc-950/20 border-t border-zinc-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#ef233c] mb-3">FAQ</h2>
              <p className="text-3xl sm:text-5xl font-extrabold text-white font-manrope">
                Frequently Asked Questions
              </p>
            </div>

            {/* FAQ Search Filter */}
            <div className="max-w-md mx-auto mb-10 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search frequently asked questions..."
                className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-900 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#ef233c] transition-colors"
              />
            </div>

            <div className="space-y-4">
              {faqs
                .filter(faq => faq.q.toLowerCase().includes(faqSearch.toLowerCase()) || faq.a.toLowerCase().includes(faqSearch.toLowerCase()))
                .map((faq, idx) => (
                  <div key={idx} className="bg-zinc-950/60 rounded-2xl overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_30px_rgba(239,35,60,0.03)] hover:bg-zinc-950/80 transition-all">
                    <button
                      onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                      className="w-full flex justify-between items-center p-6 text-left font-bold text-white focus:outline-none"
                    >
                      <span className="pr-4">{faq.q}</span>
                      <ChevronDown 
                        size={18} 
                        className={`text-zinc-500 shrink-0 transition-transform ${faqOpen === idx ? "rotate-180 text-[#ef233c]" : ""}`} 
                      />
                    </button>
                    {faqOpen === idx && (
                      <div className="px-6 pb-6 text-sm text-zinc-400 leading-relaxed pt-4 font-light">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 border-t border-zinc-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#ef233c] mb-3">Get In Touch</h2>
              <p className="text-3xl sm:text-5xl font-extrabold text-white font-manrope">
                Have Questions? Contact Us
              </p>
            </div>

            <div className="bg-zinc-950 p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              <form onSubmit={(e) => { e.preventDefault(); alert("Message sent successfully!"); }} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Enter your name" 
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ef233c] focus:outline-none text-white text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="Enter your email" 
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ef233c] focus:outline-none text-white text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Subject</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="How can we help?" 
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ef233c] focus:outline-none text-white text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Message</label>
                  <textarea 
                    rows={4} 
                    required 
                    placeholder="Enter details..." 
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ef233c] focus:outline-none text-white text-sm transition-all"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-4 bg-[#ef233c] hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  Send Message <MessageSquare size={16} />
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Professional Footer */}
      <footer className="bg-black border-t border-zinc-900 pt-24 pb-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <img src="/logo-icon.png" alt="Pocket Money Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(239,35,60,0.3)]" />
                <span className="font-bold text-xl tracking-tight text-white font-manrope">Pocket<span className="text-[#ef233c]">Money</span></span>
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed max-w-xs font-light">
                A premium, secure affiliate network platform with dynamic multi-level commissions mapping.
              </p>
            </div>

            <div>
              <span className="font-bold text-xs uppercase text-[#ef233c] tracking-widest block mb-4">Navigation</span>
              <ul className="space-y-3 text-xs text-zinc-400">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#plan" className="hover:text-white transition-colors">Business Plan</a></li>
                <li><a href="#packages" className="hover:text-white transition-colors">Packages</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-xs uppercase text-[#ef233c] tracking-widest block mb-4">Platform Info</span>
              <ul className="space-y-3 text-xs text-zinc-400">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-xs uppercase text-[#ef233c] tracking-widest block mb-4">Legal</span>
              <ul className="space-y-3 text-xs text-zinc-400">
                <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Outline Title */}
          <div className="flex justify-center items-center py-8 opacity-20 pointer-events-none">
            <h1 className="text-[12vw] leading-none font-extrabold font-manrope tracking-tighter text-stroke select-none">POCKETMONEY</h1>
          </div>

          <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-zinc-600 uppercase tracking-widest">
            <p>&copy; {new Date().getFullYear()} Pocket Money Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Service</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
