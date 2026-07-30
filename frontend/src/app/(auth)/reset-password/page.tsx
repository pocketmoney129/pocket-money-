"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "../../../services/api";
import { Lock, ArrowLeft, Loader2, KeyRound } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams?.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/reset-password", {
        email,
        code,
        password
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950/90 backdrop-blur-2xl py-8 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-3xl sm:px-10 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-[#ef233c] to-transparent" />
      {success ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold text-center">
            Password reset successfully! Redirecting you to login...
          </div>
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-emerald-500" size={24} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-2.5 border border-transparent rounded-xl bg-zinc-900/80 text-white placeholder-zinc-500 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] focus:shadow-[0_0_12px_rgba(239,35,60,0.12)] focus:outline-none text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
              Verification Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
                <KeyRound size={16} />
              </div>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="block w-full pl-10 pr-4 py-2.5 border border-transparent rounded-xl bg-zinc-900/80 text-white placeholder-zinc-500 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] focus:shadow-[0_0_12px_rgba(239,35,60,0.12)] focus:outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
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

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-4 py-2.5 border border-transparent rounded-xl bg-zinc-900/80 text-white placeholder-zinc-500 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] focus:shadow-[0_0_12px_rgba(239,35,60,0.12)] focus:outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#ef233c] hover:bg-red-700 focus:outline-none disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Reset Password"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e0101] via-black to-[#0e0101] text-zinc-300 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Floating Ambient Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ef233c]/15 rounded-full blur-[150px] pointer-events-none float-glow-1" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-[#ef233c]/10 rounded-full blur-[140px] pointer-events-none float-glow-2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/forgot-password" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src="/logo-icon.png" alt="Pocket Money Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(239,35,60,0.3)]" />
          <span className="font-extrabold text-xl text-white font-manrope">
            Pocket<span className="text-[#ef233c]">Money</span>
          </span>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight font-manrope">
          Reset Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <Suspense fallback={
          <div className="bg-zinc-950/90 backdrop-blur-2xl py-8 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-transparent rounded-3xl flex justify-center items-center">
            <Loader2 className="animate-spin text-zinc-500" size={24} />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

