"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "emerald" | "amber" | "purple" | "rose";
  description?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color = "blue",
  description
}) => {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-600 icon-bg:bg-blue-100/50",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-600 icon-bg:bg-emerald-100/50",
    amber: "bg-amber-50 border-amber-200 text-amber-600 icon-bg:bg-amber-100/50",
    purple: "bg-purple-50 border-purple-200 text-purple-600 icon-bg:bg-purple-100/50",
    rose: "bg-rose-50 border-rose-200 text-rose-600 icon-bg:bg-rose-100/50"
  };

  return (
    <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-900 shadow-[0_0_15px_rgba(239,35,60,0.02)] hover:border-[#ef233c]/25 hover:shadow-[0_0_20px_rgba(239,35,60,0.08)] transition-all flex items-start justify-between relative overflow-hidden group">
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">{title}</p>
        <p className="text-2xl sm:text-3xl font-black text-white tracking-tight font-manrope">{value}</p>
        {description && <p className="text-[10px] text-zinc-450 font-medium leading-relaxed">{description}</p>}
      </div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-[#ef233c]/20 bg-[#ef233c]/10 text-[#ef233c] shadow-[0_0_12px_rgba(239,35,60,0.06)] group-hover:scale-105 transition-transform shrink-0">
        <Icon size={22} />
      </div>
    </div>
  );
};
