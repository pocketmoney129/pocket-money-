"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { User, Mail, Lock, Phone, Link2, Loader2, ArrowLeft, CheckCircle, XCircle, ShieldCheck } from "lucide-react";

function RegisterForm() {
  const { register, verifyRegistrationOtp } = useAuth();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"signup" | "otp">("signup");
  const [otp, setOtp] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sponsor lookup state
  const [sponsorName, setSponsorName] = useState<string | null>(null);
  const [sponsorLookupLoading, setSponsorLookupLoading] = useState(false);
  const [sponsorError, setSponsorError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autofill referral code from query string e.g. /register?ref=PM5001
  useEffect(() => {
    const ref = searchParams?.get("ref");
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  // Live sponsor lookup — debounced 600ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSponsorName(null);
    setSponsorError(null);

    if (!referralCode || referralCode.trim().length < 2) return;

    debounceRef.current = setTimeout(async () => {
      setSponsorLookupLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/auth/lookup-sponsor?code=${encodeURIComponent(referralCode.trim())}`
        );
        const data = await res.json();
        if (data.success) {
          setSponsorName(data.data.name);
          setSponsorError(null);
        } else {
          setSponsorName(null);
          setSponsorError("Invalid sponsor referral code");
        }
      } catch {
        setSponsorName(null);
        setSponsorError("Unable to verify referral code");
      } finally {
        setSponsorLookupLoading(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [referralCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      setError("Please fill in all required fields");
      return;
    }
    if (!referralCode || !referralCode.trim()) {
      setError("Sponsor referral code is required");
      return;
    }
    if (!sponsorName) {
      setError("Please enter a valid sponsor referral code before continuing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await register({
        name,
        email,
        phone,
        password,
        referralCode: referralCode.trim()
      });
      
      if (res.success) {
        setSuccessMessage("Account setup successful! A 6-digit OTP verification code has been sent to your email.");
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyRegistrationOtp(email, otp);
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP code");
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <div className="bg-zinc-950/90 backdrop-blur-2xl py-8 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-3xl sm:px-10 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-[#ef233c] to-transparent" />
        {successMessage && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold leading-relaxed">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="text-center space-y-1">
            <p className="text-xs text-[#ef233c] font-black uppercase tracking-wider">Email Verification</p>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
              We sent a 6-digit OTP code to <strong className="text-white">{email}</strong>. Enter it below to activate your account and view your official User ID.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-2 text-center">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="block w-full px-4 py-3.5 border border-transparent rounded-2xl bg-zinc-900/80 text-center text-xl font-black tracking-[10px] text-[#ef233c] focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] focus:shadow-[0_0_15px_rgba(239,35,60,0.15)] focus:outline-none transition-all font-mono"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-[#ef233c] hover:bg-red-700 focus:outline-none disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Verify & Activate Account"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep("signup")}
              className="text-xs font-bold text-zinc-500 hover:text-white transition-colors"
            >
              ← Back to Registration Form
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950/90 backdrop-blur-2xl py-8 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-3xl sm:px-10 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-[#ef233c] to-transparent" />
      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <User size={16} />
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="block w-full pl-10 pr-4 py-2.5 border border-transparent rounded-xl bg-zinc-900/80 text-white placeholder-zinc-500 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] focus:shadow-[0_0_12px_rgba(239,35,60,0.12)] focus:outline-none text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Mail size={16} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="block w-full pl-10 pr-4 py-2.5 border border-transparent rounded-xl bg-zinc-900/80 text-white placeholder-zinc-500 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] focus:shadow-[0_0_12px_rgba(239,35,60,0.12)] focus:outline-none text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Phone size={16} />
            </div>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="1234567890"
              className="block w-full pl-10 pr-4 py-2.5 border border-transparent rounded-xl bg-zinc-900/80 text-white placeholder-zinc-500 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] focus:shadow-[0_0_12px_rgba(239,35,60,0.12)] focus:outline-none text-sm transition-all font-mono"
            />
          </div>
        </div>

        {/* Sponsor Referral Code — REQUIRED with live sponsor name lookup */}
        <div>
          <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
            Sponsor Referral Code <span className="text-[#ef233c] font-black">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Link2 size={16} />
            </div>
            <input
              type="text"
              required
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="e.g. PM8596"
              className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl bg-zinc-900/80 font-semibold placeholder-zinc-500 focus:outline-none text-sm transition-all font-mono ${
                sponsorName
                  ? "border-emerald-500 text-emerald-400 focus:border-emerald-400 focus:shadow-[0_0_12px_rgba(16,185,129,0.12)]"
                  : sponsorError
                  ? "border-rose-500 text-rose-400 focus:border-rose-500"
                  : "border-transparent text-[#ef233c] focus:border-[#ef233c] focus:shadow-[0_0_12px_rgba(239,35,60,0.12)]"
              }`}
            />
            {/* Status icon in input */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {sponsorLookupLoading && <Loader2 size={14} className="animate-spin text-zinc-400" />}
              {!sponsorLookupLoading && sponsorName && <CheckCircle size={14} className="text-emerald-400" />}
              {!sponsorLookupLoading && sponsorError && referralCode.length > 0 && <XCircle size={14} className="text-rose-400" />}
            </div>
          </div>

          {/* Live sponsor confirmation below field */}
          {sponsorName && (
            <p className="mt-1.5 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle size={12} /> Sponsor confirmed: <span className="text-white">{sponsorName}</span>
            </p>
          )}
          {sponsorError && referralCode.length > 0 && (
            <p className="mt-1.5 text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <XCircle size={12} /> {sponsorError}
            </p>
          )}
          {!sponsorName && !sponsorError && (
            <p className="text-[10px] text-zinc-500 mt-1 font-medium">
              Enter your sponsor's Referral Code / User ID.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Lock size={16} />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full pl-10 pr-4 py-2.5 border border-transparent rounded-xl bg-zinc-900/80 text-white placeholder-zinc-500 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] focus:shadow-[0_0_12px_rgba(239,35,60,0.12)] focus:outline-none text-sm transition-all"
            />
          </div>
        </div>

        

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !sponsorName}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#ef233c] hover:bg-red-700 focus:outline-none disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Create Account"
            )}
          </button>
          {!sponsorName && referralCode.length === 0 && (
            <p className="text-center text-[10px] text-zinc-600 mt-2 font-medium">Enter a valid sponsor code above to enable registration</p>
          )}
        </div>
      </form>
    </div>
  );
}

export default function Register() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e0101] via-black to-[#0e0101] text-zinc-300 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Floating Ambient Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ef233c]/15 rounded-full blur-[150px] pointer-events-none float-glow-1" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-[#ef233c]/10 rounded-full blur-[140px] pointer-events-none float-glow-2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src="/logo-icon.png" alt="Pocket Money Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(239,35,60,0.3)]" />
          <span className="font-extrabold text-xl text-white font-manrope">
            Pocket<span className="text-[#ef233c]">Money</span>
          </span>
        </div>

        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight font-manrope">
          Create a New Account
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-[#ef233c] hover:text-red-400 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <Suspense fallback={
          <div className="bg-zinc-950/90 backdrop-blur-2xl py-8 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-transparent rounded-3xl flex justify-center items-center">
            <Loader2 className="animate-spin text-zinc-500" size={24} />
          </div>
        }>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}

