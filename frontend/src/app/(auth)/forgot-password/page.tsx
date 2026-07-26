"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "../../../services/api";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError(null);
    setDevCode(null);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      if (res.success) {
        setSuccess(true);
        if (res.devResetCode) {
          setDevCode(res.devResetCode);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Floating Ambient Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#ef233c]/5 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[6s]" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-[#ef233c]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#ef233c]/15 border border-[#ef233c]/20 flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(239,35,60,0.15)]">
            P
          </div>
          <span className="font-extrabold text-xl text-white font-manrope">
            Pocket<span className="text-[#ef233c]">Money</span>
          </span>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight font-manrope">
          Recover Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-zinc-950/80 backdrop-blur-md py-8 px-6 shadow-[0_0_30px_rgba(239,35,60,0.05)] border border-zinc-900 rounded-3xl sm:px-10">
          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                Password recovery request processed. You can now reset your password.
              </div>
              {devCode && (
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs">
                  <p className="font-bold mb-1 text-white">Developer Testing Mode (Simulated Code):</p>
                  <p>Reset verification code: <strong className="font-mono text-sm text-[#ef233c]">{devCode}</strong></p>
                </div>
              )}
              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}`}
                className="block w-full text-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#ef233c] hover:bg-red-700 transition-colors"
              >
                Proceed to Reset Password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="block w-full pl-10 pr-4 py-3 border border-zinc-850 rounded-xl bg-zinc-900/50 text-white placeholder-zinc-600 focus:border-[#ef233c] focus:shadow-[0_0_12px_rgba(239,35,60,0.12)] focus:outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#ef233c] hover:bg-red-700 focus:outline-none disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
