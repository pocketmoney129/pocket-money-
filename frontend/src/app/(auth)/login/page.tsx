"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { Lock, Mail, Loader2, ArrowLeft } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(usernameOrEmail, password);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
      setLoading(false);
    }
  };

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
          Sign In to Your Node
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Or{" "}
          <Link href="/register" className="font-semibold text-[#ef233c] hover:text-red-400 transition-colors">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-zinc-950/90 backdrop-blur-2xl py-8 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-3xl sm:px-10 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-[#ef233c] to-transparent" />

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase text-zinc-400 mb-2">
                User ID / Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="PM5001 or name@example.com"
                  className="block w-full pl-10 pr-4 py-3 border border-transparent rounded-xl bg-zinc-900/80 text-white placeholder-zinc-500 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] focus:shadow-[0_0_12px_rgba(239,35,60,0.12)] focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-bold uppercase text-zinc-400">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#ef233c] hover:text-red-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 border border-transparent rounded-xl bg-zinc-900/80 text-white placeholder-zinc-500 focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] focus:shadow-[0_0_12px_rgba(239,35,60,0.12)] focus:outline-none text-sm transition-all"
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
                  "Sign In"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

}
