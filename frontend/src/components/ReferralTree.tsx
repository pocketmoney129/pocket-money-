"use client";

import React from "react";
import { User, ShieldCheck, Award, Zap } from "lucide-react";

export interface TreeNode {
  id: string;
  name: string;
  username: string;
  referralCode?: string;
  email?: string;
  status: "active" | "inactive" | "suspended";
  packageName: string;
  createdAt?: string;
  childrenCount?: number;
  children?: TreeNode[];
}

interface ReferralTreeProps {
  node: TreeNode;
  isRoot?: boolean;
  onSelectNode: (node: TreeNode) => void;
}

export const ReferralTree: React.FC<ReferralTreeProps> = ({ node, isRoot = false, onSelectNode }) => {
  const isActive = node.status === "active";

  return (
    <div className="flex flex-col items-center select-none">
      {/* 3D AVATAR NODE CONTAINER */}
      <div
        onClick={() => onSelectNode(node)}
        className="flex flex-col items-center cursor-pointer group transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-105"
      >
        {/* 3D GLOWING AVATAR ORB */}
        <div className="relative mb-3">
          {/* Outer Ambient Glow Ring */}
          <div
            className={`absolute -inset-2 rounded-full blur-md opacity-60 transition-opacity group-hover:opacity-100 ${
              isRoot
                ? "bg-gradient-to-r from-amber-500 to-[#ef233c]"
                : isActive
                ? "bg-gradient-to-r from-emerald-400 to-teal-600"
                : "bg-zinc-800"
            }`}
          />

          {/* 3D Spherical Orb Badge */}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full relative flex items-center justify-center p-1 border-2 transition-all duration-300 ${
              isRoot
                ? "border-amber-400 bg-gradient-to-b from-amber-500/30 via-zinc-950 to-zinc-950 shadow-[0_10px_25px_rgba(245,158,11,0.3)]"
                : isActive
                ? "border-emerald-400 bg-gradient-to-b from-emerald-500/30 via-zinc-950 to-zinc-950 shadow-[0_10px_25px_rgba(16,185,129,0.3)]"
                : "border-zinc-800 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            }`}
          >
            {/* Inner Glassmorphic Circle */}
            <div
              className={`w-full h-full rounded-full flex items-center justify-center border shadow-inner ${
                isRoot
                  ? "bg-amber-500/10 border-amber-400/30 text-amber-400"
                  : isActive
                  ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-400"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-600"
              }`}
            >
              {isRoot ? (
                <ShieldCheck size={28} className="filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              ) : isActive ? (
                <User size={26} className="filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              ) : (
                <User size={24} />
              )}
            </div>

            {/* Live Status Indicator Dot */}
            <span
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-zinc-950 flex items-center justify-center ${
                isActive ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-zinc-700"
              }`}
            >
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
            </span>
          </div>
        </div>

        {/* NODE INFORMATION DETAILS (Below 3D Icon) */}
        <div
          className={`flex flex-col items-center px-4 py-2.5 rounded-2xl border backdrop-blur-md transition-all duration-300 min-w-[140px] max-w-[180px] text-center shadow-2xl ${
            isRoot
              ? "bg-amber-950/20 border-amber-500/30 group-hover:border-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.1)]"
              : isActive
              ? "bg-zinc-950/90 border-emerald-500/30 group-hover:border-emerald-400/60 shadow-[0_4px_20px_rgba(16,185,129,0.1)]"
              : "bg-zinc-950/80 border-zinc-900 group-hover:border-zinc-800"
          }`}
        >
          <p className="text-xs font-black text-white truncate max-w-full font-manrope tracking-tight">
            {node.name}
          </p>
          <p className="text-[10px] font-mono font-bold text-zinc-400 truncate max-w-full mt-0.5">
            @{node.username}
          </p>

          <span
            className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
              isRoot
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : isActive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-zinc-900 text-zinc-550 border-zinc-850"
            }`}
          >
            {node.packageName || "No Package"}
          </span>
        </div>
      </div>

      {/* 3D GLOWING CONNECTOR LINES & CHILDREN */}
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center w-full mt-6 relative">
          {/* Vertical Stem Line from parent */}
          <div className="w-0.5 h-6 bg-gradient-to-b from-[#ef233c] to-zinc-700 shadow-[0_0_8px_rgba(239,35,60,0.4)]" />

          {/* Horizontal Connector Bar connecting siblings */}
          {node.children.length > 1 && (
            <div
              className="h-0.5 bg-gradient-to-r from-[#ef233c] via-red-500 to-[#ef233c] shadow-[0_0_8px_rgba(239,35,60,0.4)]"
              style={{
                width: `calc(100% - ${100 / node.children.length}%)`
              }}
            />
          )}

          {/* Children columns container */}
          <div className="flex justify-around items-start w-full relative pt-2 gap-8 sm:gap-12 md:gap-16 px-4">
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center relative flex-1 px-3 sm:px-6">
                {/* Vertical stem line down to child node */}
                <div className="w-0.5 h-4 bg-gradient-to-b from-red-500 to-zinc-800" />
                <ReferralTree node={child} onSelectNode={onSelectNode} />
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};
