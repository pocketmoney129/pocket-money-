"use client";

import { useAdminAuth } from "../context/AdminAuthContext";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { loading } = useAdminAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col gap-4 font-sans text-slate-300">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <p className="text-sm font-semibold text-slate-400">Verifying administrator credentials...</p>
    </div>
  );
}
